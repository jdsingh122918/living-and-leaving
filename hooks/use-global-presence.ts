"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/client-auth";
import { getPusherClient, getGlobalPresenceChannel } from "@/lib/pusher/client";
import type { PresenceChannel, Members } from "pusher-js";

interface PresenceMember {
  id: string;
  info: {
    name: string;
    email: string;
  };
}

interface GlobalPresenceState {
  onlineUserIds: string[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
}

interface UseGlobalPresenceOptions {
  autoConnect?: boolean;
  onPresenceUpdate?: (userId: string, isOnline: boolean, onlineUserIds: string[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useGlobalPresence(options: UseGlobalPresenceOptions = {}) {
  const { autoConnect = true, onPresenceUpdate, onConnectionChange } = options;

  const { isSignedIn } = useAuth();
  const [state, setState] = useState<GlobalPresenceState>({
    onlineUserIds: [],
    isConnected: false,
    isLoading: false,
    error: null,
  });

  const channelRef = useRef<PresenceChannel | null>(null);

  // Use refs to store latest callback functions to prevent re-render loops
  const callbacksRef = useRef({
    onPresenceUpdate,
    onConnectionChange,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onPresenceUpdate,
      onConnectionChange,
    };
  }, [onPresenceUpdate, onConnectionChange]);

  // Connect to global presence channel
  const connect = useCallback(() => {
    if (!isSignedIn) {
      return;
    }

    if (channelRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pusher = getPusherClient();
      const channelName = getGlobalPresenceChannel();
      const channel = pusher.subscribe(channelName) as PresenceChannel;

      // Subscription succeeded
      channel.bind("pusher:subscription_succeeded", (members: Members) => {
        const onlineUserIds: string[] = [];
        members.each((member: PresenceMember) => {
          onlineUserIds.push(member.id);
        });

        console.log("🌐 Global presence connected:", {
          onlineUsers: onlineUserIds.length,
        });

        setState({
          onlineUserIds,
          isConnected: true,
          isLoading: false,
          error: null,
        });
        callbacksRef.current.onConnectionChange?.(true);
      });

      // Subscription error
      channel.bind("pusher:subscription_error", (error: Error) => {
        console.error("❌ Global presence subscription error:", error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: "Failed to connect to presence",
        }));
        callbacksRef.current.onConnectionChange?.(false);
      });

      // Member joined
      channel.bind("pusher:member_added", (member: PresenceMember) => {
        setState(prev => {
          const newOnlineUserIds = [...prev.onlineUserIds, member.id];
          callbacksRef.current.onPresenceUpdate?.(member.id, true, newOnlineUserIds);
          return { ...prev, onlineUserIds: newOnlineUserIds };
        });
      });

      // Member left
      channel.bind("pusher:member_removed", (member: PresenceMember) => {
        setState(prev => {
          const newOnlineUserIds = prev.onlineUserIds.filter(id => id !== member.id);
          callbacksRef.current.onPresenceUpdate?.(member.id, false, newOnlineUserIds);
          return { ...prev, onlineUserIds: newOnlineUserIds };
        });
      });

      channelRef.current = channel;
    } catch (error) {
      console.error("❌ Failed to connect to global presence:", error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
      callbacksRef.current.onConnectionChange?.(false);
    }
  }, [isSignedIn]);

  // Disconnect from global presence channel
  const disconnect = useCallback(() => {
    if (channelRef.current) {
      const pusher = getPusherClient();
      pusher.unsubscribe(getGlobalPresenceChannel());
      channelRef.current = null;
    }

    setState({
      onlineUserIds: [],
      isConnected: false,
      isLoading: false,
      error: null,
    });
    callbacksRef.current.onConnectionChange?.(false);
  }, []);

  // Auto-connect when conditions are met
  useEffect(() => {
    if (autoConnect && isSignedIn && !channelRef.current) {
      connect();
    }
  }, [autoConnect, isSignedIn, connect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Helper to check if a specific user is online
  const isUserOnline = useCallback(
    (userId: string) => state.onlineUserIds.includes(userId),
    [state.onlineUserIds]
  );

  return {
    ...state,
    connect,
    disconnect,
    isUserOnline,
  };
}
