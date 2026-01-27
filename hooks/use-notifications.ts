"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/client-auth";
import { Notification, NotificationType } from "@/lib/types";
import { getPusherClient, getUserChannel } from "@/lib/pusher/client";
import type { Channel } from "pusher-js";

// Connection state machine
export type ConnectionState = "connected" | "reconnecting" | "disconnected";

interface NotificationHookState {
  notifications: Notification[];
  unreadCount: number;
  connectionState: ConnectionState;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastRefreshedAt: Date | null;
}

interface UseNotificationsOptions {
  limit?: number;
  autoConnect?: boolean;
  onNewNotification?: (notification: Notification) => void;
  onUnreadCountChange?: (count: number) => void;
  onConnectionChange?: (state: ConnectionState) => void;
}

// Pusher notification events (must match server-side NOTIFICATION_EVENTS)
const NOTIFICATION_EVENTS = {
  NEW_NOTIFICATION: "notification",
  UNREAD_COUNT: "unread-count",
  NOTIFICATION_READ: "notification-read",
  ALL_READ: "all-read",
} as const;

export function useNotifications(options: UseNotificationsOptions = {}) {
  const {
    limit = 20,
    autoConnect = true,
    onNewNotification,
    onUnreadCountChange,
    onConnectionChange,
  } = options;

  const { isSignedIn, getToken } = useAuth();
  const [state, setState] = useState<NotificationHookState>({
    notifications: [],
    unreadCount: 0,
    connectionState: "disconnected",
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefreshedAt: null,
  });

  // Track user ID for channel subscription
  const [userId, setUserId] = useState<string | null>(null);
  const channelRef = useRef<Channel | null>(null);

  // Use refs for callbacks to avoid stale closures in event handlers
  const onNewNotificationRef = useRef(onNewNotification);
  const onUnreadCountChangeRef = useRef(onUnreadCountChange);
  const onConnectionChangeRef = useRef(onConnectionChange);

  // Keep callback refs up to date
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
    onUnreadCountChangeRef.current = onUnreadCountChange;
    onConnectionChangeRef.current = onConnectionChange;
  }, [onNewNotification, onUnreadCountChange, onConnectionChange]);

  // Update connection state and trigger callback
  const setConnectionState = useCallback(
    (newState: ConnectionState) => {
      setState((prev) => {
        if (prev.connectionState !== newState) {
          onConnectionChangeRef.current?.(newState);
          return { ...prev, connectionState: newState };
        }
        return prev;
      });
    },
    [] // No deps needed - uses ref
  );

  // Fetch user ID from API (needed for channel name)
  useEffect(() => {
    async function fetchUserId() {
      console.log("🔔 useNotifications: Fetching userId, isSignedIn:", isSignedIn);
      if (!isSignedIn) {
        setUserId(null);
        return;
      }

      try {
        const token = await getToken();
        const response = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          // API returns { success: true, user: { id: ... } }
          const userId = data.user?.id || data.data?.id;
          if (data.success && userId) {
            console.log("🔔 useNotifications: Got userId:", userId.slice(-8));
            setUserId(userId);
          } else {
            console.warn("🔔 useNotifications: API ok but no userId in response", data);
          }
        } else {
          console.error("🔔 useNotifications: Failed to fetch userId, status:", response.status);
        }
      } catch (error) {
        console.error("❌ Failed to fetch user ID:", error);
      }
    }

    fetchUserId();
  }, [isSignedIn, getToken]);

  // Fetch notifications from API
  const fetchNotifications = useCallback(
    async (
      fetchOptions: {
        isRead?: boolean;
        type?: NotificationType;
        page?: number;
        silent?: boolean;
      } = {}
    ) => {
      if (!isSignedIn) return;

      const { silent = false, ...queryOptions } = fetchOptions;

      if (!silent) {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));
      }

      try {
        const token = await getToken();
        const searchParams = new URLSearchParams();

        if (queryOptions.isRead !== undefined) {
          searchParams.append("isRead", queryOptions.isRead.toString());
        }
        if (queryOptions.type) {
          searchParams.append("type", queryOptions.type);
        }
        searchParams.append("page", (queryOptions.page || 1).toString());
        searchParams.append("limit", limit.toString());

        const response = await fetch(`/api/notifications?${searchParams}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 404) {
            console.log("🔔 User not found in database yet");
            setState((prev) => ({
              ...prev,
              notifications: [],
              unreadCount: 0,
              isLoading: false,
              lastRefreshedAt: new Date(),
              error: null,
            }));
            return;
          }
          throw new Error(
            `Failed to fetch notifications: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          setState((prev) => ({
            ...prev,
            notifications: data.data.items,
            isLoading: false,
            lastRefreshedAt: new Date(),
          }));
        } else {
          throw new Error(data.error || "Failed to fetch notifications");
        }
      } catch (error) {
        console.error("❌ Failed to fetch notifications:", error);
        setState((prev) => ({
          ...prev,
          error:
            error instanceof Error
              ? error.message
              : "Failed to fetch notifications",
          isLoading: false,
        }));
      }
    },
    [isSignedIn, getToken, limit]
  );

  // Manual refresh function
  const refreshNotifications = useCallback(async () => {
    if (!isSignedIn) return;

    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      const token = await getToken();

      const [notificationsResponse, countResponse] = await Promise.all([
        fetch(`/api/notifications?limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`/api/notifications/count`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      if (!notificationsResponse.ok) {
        if (notificationsResponse.status === 404) {
          console.log("🔔 User not found in database yet");
          setState((prev) => ({
            ...prev,
            notifications: [],
            unreadCount: 0,
            isRefreshing: false,
            lastRefreshedAt: new Date(),
          }));
          return;
        }
        throw new Error("Failed to refresh notifications");
      }

      const notificationsData = await notificationsResponse.json();
      let unreadCount = state.unreadCount;

      if (countResponse?.ok) {
        const countData = await countResponse.json();
        if (countData.success) {
          unreadCount = countData.data.count;
          onUnreadCountChangeRef.current?.(unreadCount);
        }
      }

      if (notificationsData.success) {
        setState((prev) => ({
          ...prev,
          notifications: notificationsData.data.items,
          unreadCount,
          isRefreshing: false,
          lastRefreshedAt: new Date(),
          error: null,
        }));
        console.log("🔔 Notifications refreshed");
      }
    } catch (error) {
      console.error("❌ Failed to refresh notifications:", error);
      setState((prev) => ({
        ...prev,
        isRefreshing: false,
        error: error instanceof Error ? error.message : "Refresh failed",
      }));
    }
  }, [isSignedIn, getToken, limit, state.unreadCount]);

  // Connect to Pusher notifications channel
  const connectToChannel = useCallback(() => {
    console.log("🔔 useNotifications: connectToChannel called, userId:", userId?.slice(-8), "hasChannel:", !!channelRef.current);
    if (!userId || channelRef.current) return;

    try {
      const pusher = getPusherClient();
      const channelName = getUserChannel(userId);

      console.log("🔔 Subscribing to notification channel:", channelName);
      const channel = pusher.subscribe(channelName);
      channelRef.current = channel;

      // Handle subscription success
      channel.bind("pusher:subscription_succeeded", () => {
        console.log("🔔 Notification channel connected");
        setConnectionState("connected");
        setState((prev) => ({ ...prev, error: null }));
      });

      // Handle subscription error
      channel.bind("pusher:subscription_error", (error: unknown) => {
        console.error("❌ Notification channel subscription error:", error);
        setConnectionState("disconnected");
        setState((prev) => ({
          ...prev,
          error: "Failed to connect to notifications",
        }));
      });

      // Handle new notification
      channel.bind(
        NOTIFICATION_EVENTS.NEW_NOTIFICATION,
        (notification: Notification) => {
          console.log("🔔 New notification received:", notification);

          setState((prev) => {
            const newUnreadCount = prev.unreadCount + 1;
            // Use refs to get the latest callbacks
            onNewNotificationRef.current?.(notification);
            onUnreadCountChangeRef.current?.(newUnreadCount);
            return {
              ...prev,
              notifications: [notification, ...prev.notifications.slice(0, limit - 1)],
              unreadCount: newUnreadCount,
              lastRefreshedAt: new Date(),
            };
          });
        }
      );

      // Handle unread count update
      channel.bind(
        NOTIFICATION_EVENTS.UNREAD_COUNT,
        (data: { count: number }) => {
          console.log("🔔 Unread count updated:", data.count);
          setState((prev) => ({ ...prev, unreadCount: data.count }));
          onUnreadCountChangeRef.current?.(data.count);
        }
      );

      // Handle single notification marked as read
      channel.bind(
        NOTIFICATION_EVENTS.NOTIFICATION_READ,
        (data: { notificationId: string }) => {
          console.log("🔔 Notification marked as read:", data.notificationId);
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.id === data.notificationId
                ? { ...n, isRead: true, readAt: new Date() }
                : n
            ),
          }));
        }
      );

      // Handle all notifications marked as read
      channel.bind(NOTIFICATION_EVENTS.ALL_READ, () => {
        console.log("🔔 All notifications marked as read");
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({
            ...n,
            isRead: true,
            readAt: n.readAt || new Date(),
          })),
          unreadCount: 0,
        }));
        onUnreadCountChangeRef.current?.(0);
      });

      // Monitor Pusher connection state
      pusher.connection.bind("state_change", (states: { current: string }) => {
        switch (states.current) {
          case "connected":
            setConnectionState("connected");
            break;
          case "connecting":
          case "unavailable":
            setConnectionState("reconnecting");
            break;
          case "disconnected":
          case "failed":
            setConnectionState("disconnected");
            break;
        }
      });
    } catch (error) {
      console.error("❌ Failed to connect to notification channel:", error);
      setConnectionState("disconnected");
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error
            ? error.message
            : "Failed to connect to notifications",
      }));
    }
  }, [
    userId,
    limit,
    setConnectionState,
  ]);

  // Disconnect from channel
  const disconnect = useCallback(() => {
    if (channelRef.current && userId) {
      const pusher = getPusherClient();
      const channelName = getUserChannel(userId);
      pusher.unsubscribe(channelName);
      channelRef.current = null;
      console.log("🔔 Disconnected from notification channel");
    }
    setConnectionState("disconnected");
  }, [userId, setConnectionState]);

  // Manual reconnect function
  const reconnect = useCallback(() => {
    console.log("🔔 Manual reconnect requested");
    disconnect();
    if (userId) {
      connectToChannel();
    }
  }, [disconnect, userId, connectToChannel]);

  // Mark notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to mark notification as read: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          // Optimistic update - Pusher will also sync
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((notification) =>
              notification.id === notificationId
                ? { ...notification, isRead: true, readAt: new Date() }
                : notification
            ),
          }));
          console.log("🔔 Notification marked as read:", notificationId);
        } else {
          throw new Error(data.error || "Failed to mark notification as read");
        }
      } catch (error) {
        console.error("❌ Failed to mark notification as read:", error);
        throw error;
      }
    },
    [isSignedIn, getToken]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!isSignedIn) return;

    try {
      const token = await getToken();
      const response = await fetch("/api/notifications", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to mark all notifications as read: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.success) {
        // Optimistic update - Pusher will also sync
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((notification) => ({
            ...notification,
            isRead: true,
            readAt: new Date(),
          })),
          unreadCount: 0,
        }));
        onUnreadCountChangeRef.current?.(0);
        console.log("🔔 All notifications marked as read");
      } else {
        throw new Error(
          data.error || "Failed to mark all notifications as read"
        );
      }
    } catch (error) {
      console.error("❌ Failed to mark all notifications as read:", error);
      throw error;
    }
  }, [isSignedIn, getToken]);

  // Delete notification
  const deleteNotification = useCallback(
    async (notificationId: string) => {
      if (!isSignedIn) return;

      try {
        const token = await getToken();
        const response = await fetch(`/api/notifications/${notificationId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Failed to delete notification: ${response.statusText}`
          );
        }

        const data = await response.json();

        if (data.success) {
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.filter(
              (notification) => notification.id !== notificationId
            ),
          }));
          console.log("🔔 Notification deleted:", notificationId);
        } else {
          throw new Error(data.error || "Failed to delete notification");
        }
      } catch (error) {
        console.error("❌ Failed to delete notification:", error);
        throw error;
      }
    },
    [isSignedIn, getToken]
  );

  // Initialize and cleanup
  useEffect(() => {
    if (isSignedIn && autoConnect && userId) {
      // Fetch initial notifications
      fetchNotifications();

      // Connect to Pusher channel
      connectToChannel();
    }

    return () => {
      disconnect();
    };
  }, [isSignedIn, autoConnect, userId, fetchNotifications, connectToChannel, disconnect]);

  // Legacy compatibility: isConnected maps to connectionState === 'connected'
  const isConnected = state.connectionState === "connected";

  return {
    // State
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    connectionState: state.connectionState,
    isConnected,
    isLoading: state.isLoading,
    isRefreshing: state.isRefreshing,
    error: state.error,
    lastRefreshedAt: state.lastRefreshedAt,

    // Actions
    fetchNotifications,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    connectToStream: connectToChannel, // Backward compatibility alias
    disconnect,
    reconnect,

    // Utilities
    getUnreadNotifications: () => state.notifications.filter((n) => !n.isRead),
    getNotificationsByType: (type: NotificationType) =>
      state.notifications.filter((n) => n.type === type),
  };
}
