import fs from 'fs';
import path from 'path';

// 日志级别枚举
enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private logLevel: LogLevel;
  private logFile: string;

  constructor() {
    this.logLevel = this.getLogLevel();
    this.logFile = process.env.LOG_FILE || 'logs/app.log';
    this.ensureLogDirectory();
  }

  /**
   * 获取日志级别
   */
  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toLowerCase() || 'info';
    switch (level) {
      case 'error':
        return LogLevel.ERROR;
      case 'warn':
        return LogLevel.WARN;
      case 'info':
        return LogLevel.INFO;
      case 'debug':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  /**
   * 确保日志目录存在
   */
  private ensureLogDirectory(): void {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  /**
   * 格式化日志消息
   */
  private formatMessage(level: string, message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  }

  /**
   * 写入日志文件
   */
  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFile, message + '\n');
    } catch (error) {
      console.error('写入日志文件失败:', error);
    }
  }

  /**
   * 记录错误日志
   */
  error(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.ERROR) {
      const formattedMessage = this.formatMessage('error', message, meta);
      console.error(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * 记录警告日志
   */
  warn(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.WARN) {
      const formattedMessage = this.formatMessage('warn', message, meta);
      console.warn(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * 记录信息日志
   */
  info(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.INFO) {
      const formattedMessage = this.formatMessage('info', message, meta);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }

  /**
   * 记录调试日志
   */
  debug(message: string, meta?: any): void {
    if (this.logLevel >= LogLevel.DEBUG) {
      const formattedMessage = this.formatMessage('debug', message, meta);
      console.log(formattedMessage);
      this.writeToFile(formattedMessage);
    }
  }
}

export const logger = new Logger();