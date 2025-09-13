/**
 * Logging Utility for Upload System
 * 
 * Provides structured logging with different levels and output options
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { dirname } from 'path';
import chalk from 'chalk';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

export class Logger {
  private logLevel: LogLevel;
  private logToFile: boolean;
  private logFilePath: string;
  private maxLogSize: number;

  constructor(
    level: LogLevel = 'info',
    logToFile: boolean = false,
    logFilePath: string = '',
    maxLogSize: number = 5 * 1024 * 1024
  ) {
    this.logLevel = level;
    this.logToFile = logToFile;
    this.logFilePath = logFilePath;
    this.maxLogSize = maxLogSize;

    if (this.logToFile && this.logFilePath) {
      this.ensureLogDirectory();
    }
  }

  private ensureLogDirectory(): void {
    const logDir = dirname(this.logFilePath);
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const levelStr = level.toUpperCase().padEnd(5);
    
    let formattedMessage = `[${timestamp}] ${levelStr} ${message}`;
    
    if (data !== undefined) {
      formattedMessage += ` ${JSON.stringify(data)}`;
    }
    
    return formattedMessage;
  }

  private getColoredMessage(level: LogLevel, message: string): string {
    const timestamp = chalk.gray(new Date().toISOString());
    const levelStr = level.toUpperCase().padEnd(5);
    
    let coloredLevel: string;
    switch (level) {
      case 'debug':
        coloredLevel = chalk.cyan(levelStr);
        break;
      case 'info':
        coloredLevel = chalk.blue(levelStr);
        break;
      case 'warn':
        coloredLevel = chalk.yellow(levelStr);
        break;
      case 'error':
        coloredLevel = chalk.red(levelStr);
        break;
    }
    
    return `[${timestamp}] ${coloredLevel} ${message}`;
  }

  private writeToFile(formattedMessage: string): void {
    if (!this.logToFile || !this.logFilePath) return;

    try {
      // Check if log file exists and its size
      if (existsSync(this.logFilePath)) {
        const stats = statSync(this.logFilePath);
        if (stats.size > this.maxLogSize) {
          // Rotate log file
          const rotatedPath = `${this.logFilePath}.old`;
          writeFileSync(rotatedPath, '');
          writeFileSync(this.logFilePath, '');
        }
      }

      appendFileSync(this.logFilePath, formattedMessage + '\n');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  public debug(message: string, data?: any): void {
    if (!this.shouldLog('debug')) return;
    
    const formattedMessage = this.formatMessage('debug', message, data);
    console.log(this.getColoredMessage('debug', message));
    this.writeToFile(formattedMessage);
  }

  public info(message: string, data?: any): void {
    if (!this.shouldLog('info')) return;
    
    const formattedMessage = this.formatMessage('info', message, data);
    console.log(this.getColoredMessage('info', message));
    this.writeToFile(formattedMessage);
  }

  public warn(message: string, data?: any): void {
    if (!this.shouldLog('warn')) return;
    
    const formattedMessage = this.formatMessage('warn', message, data);
    console.warn(this.getColoredMessage('warn', message));
    this.writeToFile(formattedMessage);
  }

  public error(message: string, data?: any): void {
    if (!this.shouldLog('error')) return;
    
    const formattedMessage = this.formatMessage('error', message, data);
    console.error(this.getColoredMessage('error', message));
    this.writeToFile(formattedMessage);
  }

  public success(message: string, data?: any): void {
    const coloredMessage = chalk.green(`✓ ${message}`);
    console.log(coloredMessage);
    
    const formattedMessage = this.formatMessage('info', `SUCCESS: ${message}`, data);
    this.writeToFile(formattedMessage);
  }

  public progress(message: string): void {
    const coloredMessage = chalk.blue(`⏳ ${message}`);
    console.log(coloredMessage);
    
    const formattedMessage = this.formatMessage('info', `PROGRESS: ${message}`);
    this.writeToFile(formattedMessage);
  }

  public setLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setLogToFile(enabled: boolean, filePath?: string): void {
    this.logToFile = enabled;
    if (filePath) {
      this.logFilePath = filePath;
      this.ensureLogDirectory();
    }
  }
}

// Create default logger instance
export const logger = new Logger();
