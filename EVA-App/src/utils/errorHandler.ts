/**
 * EVA Desktop Error Handler
 * 
 * Provides standardized error handling and logging across the application.
 * Replaces inconsistent console.error patterns with structured error management.
 * 
 * @author EVA Development Team
 */

import { EVALogger } from './logger';

/**
 * Standard error categories used throughout EVA
 */
export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  API = 'api',
  DATABASE = 'database',
  NETWORK = 'network',
  VALIDATION = 'validation',
  FILESYSTEM = 'filesystem',
  SECURITY = 'security',
  BUSINESS_LOGIC = 'business_logic',
  STARTUP = 'startup',
  IPC = 'ipc',
  CALCULATION = 'calculation',
  INITIALIZATION = 'initialization',
  UNKNOWN = 'unknown'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Enhanced error interface for EVA errors
 */
export interface EVAError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  context?: string;
  service?: string;
  metadata?: Record<string, any>;
  userFriendly?: string;
  recoverable?: boolean;
}

/**
 * Centralized error handling utility for EVA Desktop
 */
export class ErrorHandler {
  /**
   * Create a standardized EVA error
   */
  static createError(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    options: {
      context?: string;
      service?: string;
      cause?: Error;
      metadata?: Record<string, any>;
      userFriendly?: string;
      recoverable?: boolean;
    } = {}
  ): EVAError {
    const error = new Error(message) as EVAError;
    error.category = category;
    error.severity = severity;
    error.context = options.context;
    error.service = options.service;
    error.metadata = options.metadata;
    error.userFriendly = options.userFriendly;
    error.recoverable = options.recoverable ?? true;
    
    if (options.cause) {
      error.stack = options.cause.stack;
    }
    
    return error;
  }

  /**
   * Log and throw an error with proper formatting
   */
  static logAndThrow(
    service: string,
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata?: Record<string, any>
  ): never {
    const error = this.createError(message, category, severity, {
      service,
      metadata
    });
    
    EVALogger.error(service, message, error, metadata);
    throw error;
  }

  /**
   * Log an error without throwing
   */
  static logError(
    service: string,
    message: string,
    error?: Error,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    metadata?: Record<string, any>
  ): void {
    EVALogger.error(service, message, error, {
      category,
      ...metadata
    });
  }

  /**
   * Log a warning
   */
  static logWarning(
    service: string,
    message: string,
    metadata?: Record<string, any>
  ): void {
    EVALogger.warning(service, message, metadata);
  }

  /**
   * Handle API errors with specific formatting
   */
  static handleApiError(
    service: string,
    endpoint: string,
    error: Error,
    statusCode?: number,
    responseData?: any
  ): EVAError {
    const message = `API call failed: ${endpoint}`;
    const evaError = this.createError(
      message,
      ErrorCategory.API,
      statusCode && statusCode >= 500 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM,
      {
        service,
        context: `API endpoint: ${endpoint}`,
        cause: error,
        metadata: {
          statusCode,
          responseData,
          originalError: error.message
        },
        userFriendly: 'Network request failed. Please check your connection and try again.',
        recoverable: statusCode !== 401 // Not recoverable if unauthorized
      }
    );

    EVALogger.network(service, message, {
      endpoint,
      statusCode,
      error: error.message
    });

    return evaError;
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(
    service: string,
    operation: string,
    error: Error,
    query?: string
  ): EVAError {
    const message = `Database operation failed: ${operation}`;
    const evaError = this.createError(
      message,
      ErrorCategory.DATABASE,
      ErrorSeverity.HIGH,
      {
        service,
        context: `Database operation: ${operation}`,
        cause: error,
        metadata: {
          operation,
          query,
          originalError: error.message
        },
        userFriendly: 'Database error occurred. Please restart the application.',
        recoverable: false
      }
    );

    EVALogger.database(service, message, {
      operation,
      query,
      error: error.message
    });

    return evaError;
  }

  /**
   * Handle authentication errors
   */
  static handleAuthError(
    service: string,
    operation: string,
    error: Error,
    isTokenExpired = false
  ): EVAError {
    const message = `Authentication failed: ${operation}`;
    const evaError = this.createError(
      message,
      ErrorCategory.AUTHENTICATION,
      ErrorSeverity.HIGH,
      {
        service,
        context: `Auth operation: ${operation}`,
        cause: error,
        metadata: {
          operation,
          isTokenExpired,
          originalError: error.message
        },
        userFriendly: isTokenExpired 
          ? 'Your session has expired. Please log in again.'
          : 'Authentication failed. Please try logging in again.',
        recoverable: true
      }
    );

    EVALogger.security(service, message, {
      operation,
      isTokenExpired,
      error: error.message
    });

    return evaError;
  }

  /**
   * Handle startup/initialization errors
   */
  static handleStartupError(
    service: string,
    component: string,
    error: Error,
    critical = false
  ): EVAError {
    const message = `Startup failed: ${component}`;
    const evaError = this.createError(
      message,
      ErrorCategory.STARTUP,
      critical ? ErrorSeverity.CRITICAL : ErrorSeverity.HIGH,
      {
        service,
        context: `Startup component: ${component}`,
        cause: error,
        metadata: {
          component,
          critical,
          originalError: error.message
        },
        userFriendly: critical 
          ? 'Critical startup error. Please restart the application.'
          : 'Some features may not work properly. Please restart the application.',
        recoverable: !critical
      }
    );

    EVALogger.startup(service, message, {
      component,
      critical,
      error: error.message
    });

    return evaError;
  }

  /**
   * Generic error handler that logs and optionally throws errors
   * @param service Service name where error occurred
   * @param message Error message
   * @param category Error category
   * @param severity Error severity
   * @param error Original error object
   * @param metadata Additional metadata
   * @param shouldThrow Whether to throw the error after logging
   * @returns EVAError instance
   */
  static handleError(
    service: string,
    message: string,
    category: ErrorCategory,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    error?: Error,
    metadata?: Record<string, any>,
    shouldThrow = false
  ): EVAError {
    const evaError = this.createError(
      message,
      category,
      severity,
      {
        service,
        cause: error,
        metadata,
        recoverable: severity !== ErrorSeverity.CRITICAL
      }
    );

    // Log the error using appropriate method based on category
    switch (category) {
      case ErrorCategory.API:
        EVALogger.network(service, message, { error: error?.message, ...metadata });
        break;
      case ErrorCategory.DATABASE:
        EVALogger.database(service, message, { error: error?.message, ...metadata });
        break;
      case ErrorCategory.STARTUP:
      case ErrorCategory.INITIALIZATION:
        EVALogger.startup(service, message, { error: error?.message, ...metadata });
        break;
      case ErrorCategory.SECURITY:
        EVALogger.security(service, message, { error: error?.message, ...metadata });
        break;
      default:
        EVALogger.error(service, message, error, metadata);
    }

    if (shouldThrow) {
      throw evaError;
    }

    return evaError;
  }

  /**
   * Safely execute an async operation with error handling
   */
  static async safeExecute<T>(
    service: string,
    operation: string,
    fn: () => Promise<T>,
    fallback?: T,
    category: ErrorCategory = ErrorCategory.UNKNOWN
  ): Promise<T | undefined> {
    try {
      return await fn();
    } catch (error) {
      this.logError(
        service,
        `Safe execution failed: ${operation}`,
        error as Error,
        category
      );
      return fallback;
    }
  }

  /**
   * Create a user-friendly error message from an EVA error
   */
  static getUserFriendlyMessage(error: any): string {
    if (error?.userFriendly) {
      return error.userFriendly;
    }

    if (error?.category) {
      switch (error.category) {
        case ErrorCategory.NETWORK:
        case ErrorCategory.API:
          return 'Network connection issue. Please check your internet connection.';
        case ErrorCategory.AUTHENTICATION:
          return 'Authentication failed. Please log in again.';
        case ErrorCategory.DATABASE:
          return 'Data storage issue. Please restart the application.';
        case ErrorCategory.STARTUP:
          return 'Application startup issue. Please restart EVA.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }

    return error?.message || 'An unknown error occurred.';
  }

  /**
   * Check if an error is recoverable
   */
  static isRecoverable(error: any): boolean {
    return error?.recoverable ?? true;
  }

  /**
   * Format error for display in UI
   */
  static formatForUI(error: any): {
    title: string;
    message: string;
    severity: ErrorSeverity;
    recoverable: boolean;
  } {
    return {
      title: error?.category ? `${error.category.toUpperCase()} Error` : 'Error',
      message: this.getUserFriendlyMessage(error),
      severity: error?.severity || ErrorSeverity.MEDIUM,
      recoverable: this.isRecoverable(error)
    };
  }
}

/**
 * Convenience functions for common error patterns
 */

export function logError(service: string, message: string, error?: Error): void {
  ErrorHandler.logError(service, message, error);
}

export function logWarning(service: string, message: string): void {
  ErrorHandler.logWarning(service, message);
}

export function createError(
  message: string,
  category: ErrorCategory,
  service?: string
): EVAError {
  return ErrorHandler.createError(message, category, ErrorSeverity.MEDIUM, {
    service
  });
} 