import winston from 'winston';
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

// Define format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define transports
const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs/error.log'),
    level: 'error',
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    )
  }),
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs/all.log'),
    format: winston.format.combine(
      winston.format.uncolorize(),
      winston.format.json()
    )
  }),
];

// Create logger instance
const winstonLogger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
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
      winstonLogger.error(`${message} - ${error.message}`, { stack: error.stack });
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

