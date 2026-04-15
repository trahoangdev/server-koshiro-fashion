import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define levels and colors
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// Define formats
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }), // Include stack trace
  winston.format.uncolorize(),
  winston.format.json()
);

// Define transports
const transports = [
  // Console transport
  new winston.transports.Console({
    format: consoleFormat,
  }),

  // Rotating File transport for errors
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs/error-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    level: 'error',
    format: fileFormat,
  }),

  // Rotating File transport for all logs
  new DailyRotateFile({
    filename: path.join(process.cwd(), 'logs/all-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d', // Keep logs for 14 days
    format: fileFormat,
  }),
];

// Create logger instance
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  transports,
});

class LoggerWrapper {
  public log(message: string, ...args: any[]): void {
    winstonLogger.info(message, ...args);
  }

  public info(message: string, ...args: any[]): void {
    winstonLogger.info(message, ...args);
  }

  public warn(message: string, ...args: any[]): void {
    winstonLogger.warn(message, ...args);
  }

  public error(message: string, error?: unknown): void {
    if (error instanceof Error) {
      // Pass error object as metadata so 'errors' format can capture stack
      winstonLogger.error(message, { error, stack: error.stack });
    } else {
      winstonLogger.error(message, { error });
    }
  }

  public debug(message: string, ...args: any[]): void {
    winstonLogger.debug(message, ...args);
  }

  public http(message: string, ...args: any[]): void {
    winstonLogger.http(message, ...args);
  }

  // Stub legacy methods
  public time(label: string): void { }
  public timeEnd(label: string): void { }
  public group(label: string, callback: () => void): void { callback(); }
}

export const logger = new LoggerWrapper();
export default LoggerWrapper;

