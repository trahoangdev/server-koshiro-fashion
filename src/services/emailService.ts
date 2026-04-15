import nodemailer from 'nodemailer';
import PQueue from 'p-queue';
import { env } from '../config/env';
import { logger } from '../lib/logger';

// Interface for Email Options
interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

class EmailService {
    private transporter: nodemailer.Transporter;
    private queue: PQueue;
    private configured: boolean;

    constructor() {
        this.configured = Boolean(env.EMAIL_USER && env.EMAIL_PASS);

        // Initialize Nodemailer Transporter
        // Recommendation: Use environment variables for service configuration
        this.transporter = this.configured
            ? nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: env.EMAIL_USER,
                    pass: env.EMAIL_PASS,
                },
            })
            : nodemailer.createTransport({ jsonTransport: true });

        // Initialize Queue with concurrency limit of 5 (adjust as needed)
        this.queue = new PQueue({ concurrency: 5 });

        if (this.configured) {
            this.verifyConnection();
        } else {
            logger.warn('Email service is disabled because EMAIL_USER or EMAIL_PASS is missing');
        }
    }

    // Verify connection configuration
    private async verifyConnection() {
        try {
            await this.transporter.verify();
            logger.info('Email service ready');
        } catch (error) {
            logger.warn('Email service configuration error', error);
        }
    }

    /**
     * Add email to queue for background sending
     */
    public async sendEmail(options: EmailOptions): Promise<void> {
        if (!this.configured) {
            logger.warn(`Email skipped because service is not configured: ${options.subject} -> ${options.to}`);
            return;
        }

        // Add job to queue
        await this.queue.add(async () => {
            try {
                logger.debug(`Sending email to ${options.to}`);
                const info = await this.transporter.sendMail({
                    from: `"Koshiro Fashion" <${env.EMAIL_USER}>`,
                    to: options.to,
                    subject: options.subject,
                    text: options.text,
                    html: options.html,
                });
                logger.info(`Email sent: ${info.messageId}`);
            } catch (error) {
                logger.error(`Error sending email to ${options.to}`, error);
                // Note: In production with a real queue (BullMQ), we would retry. 
                // With p-queue, we just log the error to avoid blocking.
            }
        });
    }

    /**
     * Send Welcome Email
     */
    public async sendWelcomeEmail(to: string, name: string): Promise<void> {
        const subject = 'Welcome to Koshiro Fashion!';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome, ${name}!</h2>
        <p>Thank you for joining Koshiro Fashion. We are excited to have you on board.</p>
        <p>Explore our latest collection of authentic Japanese fashion.</p>
        <a href="${env.FRONTEND_URL}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Start Shopping</a>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create this account, please ignore this email.</p>
      </div>
    `;
        await this.sendEmail({ to, subject, html });
    }

    /**
     * Send Password Reset Email
     */
    public async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
        if (!this.configured) {
            throw new Error('Email service is not configured. Cannot send password reset email.');
        }

        const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        const subject = 'Reset Your Password - Koshiro Fashion';
        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>You requested to reset your password. Click the button below to proceed:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #000; color: #fff; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>Or copy this link: ${resetUrl}</p>
        <p>This link will expire in 10 minutes.</p>
        <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't request a password reset, please ignore this email.</p>
      </div>
    `;
        await this.sendEmail({ to, subject, html });
    }
}

export const emailService = new EmailService();
