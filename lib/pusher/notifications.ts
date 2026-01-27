/**
 * Pusher Notification Broadcasting Utilities
 *
 * Server-side utilities for broadcasting real-time notifications via Pusher.
 * Replaces the previous SSE-based notification delivery system.
 */

import { pusherServer, getUserChannel } from "./server";
import { NotificationType } from "@/lib/types";

// Notification payload for broadcasting
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown> | null;
  isActionable: boolean;
  actionUrl: string | null;
  createdAt: Date;
  // Rich notification media support
  imageUrl?: string | null;
  thumbnailUrl?: string | null;
  richMessage?: string | null;
  // Enhanced CTA support
  ctaLabel?: string | null;
  secondaryUrl?: string | null;
  secondaryLabel?: string | null;
}

// Event names for notification channel
export const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: "notification",
  UNREAD_COUNT: "unread-count",
  NOTIFICATION_READ: "notification-read",
  ALL_READ: "all-read",
} as const;

/**
 * Broadcast a new notification to a user's private channel
 */
export async function broadcastNotification(
  userId: string,
  notification: NotificationPayload
): Promise<{ success: boolean; error?: string }> {
  try {
    const channel = getUserChannel(userId);

    await pusherServer.trigger(channel, NOTIFICATION_EVENTS.NEW_NOTIFICATION, {
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    });

    console.log("🔔 Pusher: Notification broadcast to user:", {
      userId: userId.slice(-8),
      notificationId: notification.id.slice(-8),
      type: notification.type,
    });

    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Pusher: Failed to broadcast notification:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Broadcast updated unread count to a user
 */
export async function broadcastUnreadCount(
  userId: string,
  count: number
): Promise<void> {
  try {
    const channel = getUserChannel(userId);

    await pusherServer.trigger(channel, NOTIFICATION_EVENTS.UNREAD_COUNT, {
      count,
    });

    console.log("🔔 Pusher: Unread count broadcast:", {
      userId: userId.slice(-8),
      count,
    });
  } catch (error) {
    console.error("❌ Pusher: Failed to broadcast unread count:", error);
  }
}

/**
 * Broadcast that a notification was marked as read
 */
export async function broadcastNotificationRead(
  userId: string,
  notificationId: string
): Promise<void> {
  try {
    const channel = getUserChannel(userId);

    await pusherServer.trigger(channel, NOTIFICATION_EVENTS.NOTIFICATION_READ, {
      notificationId,
    });

    console.log("🔔 Pusher: Notification read broadcast:", {
      userId: userId.slice(-8),
      notificationId: notificationId.slice(-8),
    });
  } catch (error) {
    console.error("❌ Pusher: Failed to broadcast notification read:", error);
  }
}

/**
 * Broadcast that all notifications were marked as read
 */
export async function broadcastAllRead(userId: string): Promise<void> {
  try {
    const channel = getUserChannel(userId);

    await pusherServer.trigger(channel, NOTIFICATION_EVENTS.ALL_READ, {
      timestamp: new Date().toISOString(),
    });

    console.log("🔔 Pusher: All-read broadcast:", {
      userId: userId.slice(-8),
    });
  } catch (error) {
    console.error("❌ Pusher: Failed to broadcast all-read:", error);
  }
}
