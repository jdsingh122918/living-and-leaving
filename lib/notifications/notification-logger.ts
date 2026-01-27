/**
 * Structured logging for notification pipeline
 * Provides in-memory log buffer for debug dashboard and console output
 */

export enum NotificationLogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

export interface NotificationLogEntry {
  timestamp: Date;
  level: NotificationLogLevel;
  event: string;
  notificationId?: string;
  userId?: string;
  connectionId?: string;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

class NotificationLoggerClass {
  private logs: NotificationLogEntry[] = [];
  private maxInMemoryLogs = 500;

  /**
   * Log a notification pipeline event
   */
  log(entry: Omit<NotificationLogEntry, "timestamp">) {
    const fullEntry = { ...entry, timestamp: new Date() };

    // In-memory buffer for recent logs
    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxInMemoryLogs) {
      this.logs.pop();
    }

    // Console output with structured format
    const prefix = `[NOTIF:${entry.level}]`;
    const context = [
      entry.notificationId && `notif=${entry.notificationId.slice(-8)}`,
      entry.userId && `user=${entry.userId.slice(-8)}`,
      entry.connectionId && `conn=${entry.connectionId.slice(-8)}`,
      entry.latencyMs !== undefined && `latency=${entry.latencyMs}ms`,
    ]
      .filter(Boolean)
      .join(" ");

    const message = `${prefix} ${entry.event}${context ? ` | ${context}` : ""}`;

    if (entry.level === NotificationLogLevel.ERROR) {
      console.error(message, entry.metadata || "", entry.error || "");
    } else if (entry.level === NotificationLogLevel.WARN) {
      console.warn(message, entry.metadata || "");
    } else if (entry.level === NotificationLogLevel.DEBUG) {
      // Only log debug in development
      if (process.env.NODE_ENV === "development") {
        console.log(message, entry.metadata || "");
      }
    } else {
      console.log(message, entry.metadata || "");
    }
  }

  /**
   * Get recent logs for debug dashboard
   */
  getRecentLogs(limit = 100): NotificationLogEntry[] {
    return this.logs.slice(0, limit);
  }

  /**
   * Get logs for a specific notification
   */
  getLogsByNotification(notificationId: string): NotificationLogEntry[] {
    return this.logs.filter((l) => l.notificationId === notificationId);
  }

  /**
   * Get logs for a specific user
   */
  getLogsByUser(userId: string): NotificationLogEntry[] {
    return this.logs.filter((l) => l.userId === userId);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: NotificationLogLevel): NotificationLogEntry[] {
    return this.logs.filter((l) => l.level === level);
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs() {
    this.logs = [];
  }

  // ============================================
  // Helper methods for common events
  // ============================================

  notificationCreated(
    notificationId: string,
    userId: string,
    type: string
  ) {
    this.log({
      level: NotificationLogLevel.INFO,
      event: "NOTIFICATION_CREATED",
      notificationId,
      userId,
      metadata: { type },
    });
  }

  dispatchAttempted(notificationId: string, userId: string) {
    this.log({
      level: NotificationLogLevel.INFO,
      event: "DISPATCH_ATTEMPTED",
      notificationId,
      userId,
    });
  }

  dispatchSuccess(
    notificationId: string,
    userId: string,
    latencyMs: number
  ) {
    this.log({
      level: NotificationLogLevel.INFO,
      event: "DISPATCH_SUCCESS",
      notificationId,
      userId,
      latencyMs,
    });
  }

  dispatchFailed(notificationId: string, userId: string, error: string) {
    this.log({
      level: NotificationLogLevel.ERROR,
      event: "DISPATCH_FAILED",
      notificationId,
      userId,
      error,
    });
  }

  clientAcknowledged(
    notificationId: string,
    userId: string,
    latencyMs: number
  ) {
    this.log({
      level: NotificationLogLevel.INFO,
      event: "CLIENT_ACKNOWLEDGED",
      notificationId,
      userId,
      latencyMs,
    });
  }

  deliveryTracked(
    notificationId: string,
    userId: string,
    deliveryLogId: string,
    status: string
  ) {
    this.log({
      level: NotificationLogLevel.DEBUG,
      event: "DELIVERY_TRACKED",
      notificationId,
      userId,
      metadata: { deliveryLogId, status },
    });
  }
}

// Export singleton instance
export const NotificationLogger = new NotificationLoggerClass();
