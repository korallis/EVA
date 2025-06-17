/**
 * EVA Desktop Logging System
 * 
 * Comprehensive logging using Winston with proper formatting and file rotation.
 * Replaces all console.log/console.error calls with structured logging.
 * 
 * @author EVA Development Team
 */

import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

// Get user data path for logs
const userDataPath = app.getPath('userData');
const logsDir = path.join(userDataPath, 'logs');

/**
 * Custom log format for EVA Desktop
 * Shows timestamp, log level, service context, and message
 */
const evaLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
    const serviceTag = service ? `[${service}]` : '[EVA]';
    const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
    return `${timestamp} ${level} ${serviceTag} ${message}${metaString}`;
  })
);

/**
 * File log format (no colors)
 */
const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Main EVA logger instance
 * Logs to both console (in development) and files
 */
export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: fileLogFormat,
  defaultMeta: { service: 'eva-desktop' },
  transports: [
    // Error log file - only errors
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    }),
    
    // Combined log file - all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 3,
      tailable: true
    }),
    
    // Development console logging
    ...(process.env.NODE_ENV === 'development' ? [
      new winston.transports.Console({
        format: evaLogFormat,
        level: 'debug'
      })
    ] : [])
  ],
  
  // Handle unhandled exceptions
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      maxsize: 5242880,
      maxFiles: 2
    })
  ],
  
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      maxsize: 5242880,
      maxFiles: 2
    })
  ]
});

/**
 * Service-specific loggers for different EVA components
 * Each service gets its own logger with proper tagging
 */

// Authentication service logger
export const authLogger = logger.child({ 
  service: 'auth',
  component: 'authentication' 
});

// ESI API service logger
export const esiLogger = logger.child({ 
  service: 'esi',
  component: 'api-client' 
});

// Static Data Export service logger
export const sdeLogger = logger.child({ 
  service: 'sde',
  component: 'static-data' 
});

// Ship fitting service logger
export const fittingLogger = logger.child({ 
  service: 'fitting',
  component: 'ship-fitting' 
});

// Recommendation engine logger
export const recommendationLogger = logger.child({ 
  service: 'recommendations',
  component: 'ai-engine' 
});

// Character service logger
export const characterLogger = logger.child({ 
  service: 'character',
  component: 'character-data' 
});

// Cache service logger
export const cacheLogger = logger.child({ 
  service: 'cache',
  component: 'data-cache' 
});

// Database service logger
export const databaseLogger = logger.child({ 
  service: 'database',
  component: 'sqlite' 
});

// Startup/SDE manager logger
export const startupLogger = logger.child({ 
  service: 'startup',
  component: 'initialization' 
});

// Main process logger
export const mainLogger = logger.child({ 
  service: 'main',
  component: 'electron-main' 
});

// Renderer process logger
export const rendererLogger = logger.child({ 
  service: 'renderer',
  component: 'electron-renderer' 
});

/**
 * Convenience methods for common logging patterns used in EVA
 */
export class EVALogger {
  /**
   * Get a service-specific logger instance
   * @param serviceName Name of the service requesting the logger
   * @returns Winston logger instance with service context
   */
  static getLogger(serviceName: string): winston.Logger {
    return logger.child({ 
      service: serviceName.toLowerCase().replace(/([A-Z])/g, '-$1').replace(/^-/, ''),
      component: serviceName 
    });
  }

  /**
   * Log successful operations with checkmark emoji
   */
  static success(service: string, message: string, meta?: any): void {
    logger.info(`✅ ${message}`, { service, ...meta });
  }

  /**
   * Log errors with X emoji
   */
  static error(service: string, message: string, error?: Error, meta?: any): void {
    logger.error(`❌ ${message}`, { 
      service, 
      error: error?.message, 
      stack: error?.stack,
      ...meta 
    });
  }

  /**
   * Log warnings with warning emoji
   */
  static warning(service: string, message: string, meta?: any): void {
    logger.warn(`⚠️ ${message}`, { service, ...meta });
  }

  /**
   * Log info messages with info emoji
   */
  static info(service: string, message: string, meta?: any): void {
    logger.info(`ℹ️ ${message}`, { service, ...meta });
  }

  /**
   * Log debug messages for development
   */
  static debug(service: string, message: string, meta?: any): void {
    logger.debug(`🔍 ${message}`, { service, ...meta });
  }

  /**
   * Log startup/initialization messages with rocket emoji
   */
  static startup(service: string, message: string, meta?: any): void {
    logger.info(`🚀 ${message}`, { service, ...meta });
  }

  /**
   * Log data processing messages with gear emoji
   */
  static processing(service: string, message: string, meta?: any): void {
    logger.info(`⚙️ ${message}`, { service, ...meta });
  }

  /**
   * Log network/API messages with globe emoji
   */
  static network(service: string, message: string, meta?: any): void {
    logger.info(`🌐 ${message}`, { service, ...meta });
  }

  /**
   * Log database operations with database emoji
   */
  static database(service: string, message: string, meta?: any): void {
    logger.info(`🗄️ ${message}`, { service, ...meta });
  }

  /**
   * Log security-related operations with lock emoji
   */
  static security(service: string, message: string, meta?: any): void {
    logger.info(`🔐 ${message}`, { service, ...meta });
  }

  /**
   * Log performance metrics with stopwatch emoji
   */
  static performance(service: string, message: string, durationMs?: number, meta?: any): void {
    logger.info(`⏱️ ${message}`, { 
      service, 
      duration: durationMs ? `${durationMs}ms` : undefined,
      ...meta 
    });
  }

  /**
   * Log user actions with user emoji
   */
  static userAction(service: string, action: string, meta?: any): void {
    logger.info(`👤 User action: ${action}`, { service, ...meta });
  }

  /**
   * Log API calls with specific formatting
   */
  static apiCall(service: string, method: string, endpoint: string, statusCode?: number, meta?: any): void {
    const status = statusCode ? ` (${statusCode})` : '';
    logger.info(`📡 API ${method} ${endpoint}${status}`, { 
      service, 
      method, 
      endpoint, 
      statusCode,
      ...meta 
    });
  }
}

/**
 * Initialize logging directory
 */
export function initializeLogging(): void {
  try {

    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    EVALogger.startup('logger', 'Logging system initialized', {
      logsDirectory: logsDir,
      logLevel: logger.level,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Failed to initialize logging system:', error);
  }
}

// Initialize logging when module is imported
initializeLogging(); 