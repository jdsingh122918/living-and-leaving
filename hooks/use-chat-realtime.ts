"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth/client-auth";
import { Message } from "@/lib/types";
import { getPusherClient, getConversationChannel } from "@/lib/pusher/client";
import type { PresenceChannel, Members } from "pusher-js";

// Debug logging - enable via localStorage: localStorage.setItem('DEBUG_CHAT', 'true')
const DEBUG_CHAT = typeof window !== "undefined" && localStorage.getItem("DEBUG_CHAT") === "true";

interface PresenceMember {
  id: string;
  info: {
    name: string;
    email: string;
  };
}

interface ChatRealtimeState {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  typingUsers: { userId: string; userName: string }[];
  onlineUsers: string[];
}

interface UseChatRealtimeOptions {
  conversationId: string;
  autoConnect?: boolean;
  onNewMessage?: (message: Message) => void;
  onMessageUpdated?: (message: Message) => void;
  onMessageDeleted?: (messageId: string) => void;
  onTypingUpdate?: (userId: string, isTyping: boolean, userName?: string) => void;
  onReactionAdded?: (messageId: string, emoji: string, userId: string, userName: string) => void;
  onReactionRemoved?: (messageId: string, emoji: string, userId: string, userName: string) => void;
  onPresenceUpdate?: (userId: string, isOnline: boolean, onlineUsers: string[]) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useChatRealtime(options: UseChatRealtimeOptions) {
  const {
    conversationId,
    autoConnect = true,
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onTypingUpdate,
    onReactionAdded,
    onReactionRemoved,
    onPresenceUpdate,
    onConnectionChange,
  } = options;

  const { isSignedIn } = useAuth();
  const [state, setState] = useState<ChatRealtimeState>({
    isConnected: false,
    isLoading: false,
    error: null,
    typingUsers: [],
    onlineUsers: [],
  });

  const channelRef = useRef<PresenceChannel | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentUserRef = useRef<{ id: string; name: string } | null>(null);

  // Use refs to store latest callback functions to prevent re-render loops
  const callbacksRef = useRef({
    onNewMessage,
    onMessageUpdated,
    onMessageDeleted,
    onTypingUpdate,
    onReactionAdded,
    onReactionRemoved,
    onPresenceUpdate,
    onConnectionChange,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onNewMessage,
      onMessageUpdated,
      onMessageDeleted,
      onTypingUpdate,
      onReactionAdded,
      onReactionRemoved,
      onPresenceUpdate,
      onConnectionChange,
    };
  }, [onNewMessage, onMessageUpdated, onMessageDeleted, onTypingUpdate, onReactionAdded, onReactionRemoved, onPresenceUpdate, onConnectionChange]);

  // Connect to Pusher channel
  const connect = useCallback(() => {
    if (!isSignedIn || !conversationId) {
      if (DEBUG_CHAT) console.log("💬 Pusher connection skipped:", { isSignedIn, conversationId });
      return;
    }

    if (channelRef.current) {
      if (DEBUG_CHAT) console.log("💬 Pusher already connected");
      return;
    }

    if (DEBUG_CHAT) console.log("💬 Connecting to Pusher channel:", conversationId);

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const pusher = getPusherClient();
      const channelName = getConversationChannel(conversationId);
      const channel = pusher.subscribe(channelName) as PresenceChannel;

      // Subscription succeeded
      channel.bind("pusher:subscription_succeeded", (members: Members) => {
        // Store current user info for client-side events
        const me = members.me;
        if (me) {
          currentUserRef.current = {
            id: me.id,
            name: me.info?.name || "Unknown",
          };
        }

        const onlineUserIds: string[] = [];
        members.each((member: PresenceMember) => {
          onlineUserIds.push(member.id);
        });

        // Always log connection success (useful for monitoring)
        console.log("🟢 Pusher connected:", {
          channel: channelName,
          userId: me?.id,
          onlineUsers: onlineUserIds.length,
        });

        if (DEBUG_CHAT) {
          console.log("🟢 Pusher connection details:", {
            members: onlineUserIds,
            currentUser: currentUserRef.current,
          });
        }

        setState(prev => ({
          ...prev,
          isConnected: true,
          isLoading: false,
          error: null,
          onlineUsers: onlineUserIds,
        }));
        callbacksRef.current.onConnectionChange?.(true);
      });

      // Subscription error
      channel.bind("pusher:subscription_error", (error: Error) => {
        console.error("❌ Pusher subscription error:", error);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isLoading: false,
          error: "Failed to connect to chat",
        }));
        callbacksRef.current.onConnectionChange?.(false);
      });

      // Member joined (presence)
      channel.bind("pusher:member_added", (member: PresenceMember) => {
        if (DEBUG_CHAT) console.log("👤 Member joined:", member);
        setState(prev => {
          const newOnlineUsers = [...prev.onlineUsers, member.id];
          callbacksRef.current.onPresenceUpdate?.(member.id, true, newOnlineUsers);
          return { ...prev, onlineUsers: newOnlineUsers };
        });
      });

      // Member left (presence)
      channel.bind("pusher:member_removed", (member: PresenceMember) => {
        if (DEBUG_CHAT) console.log("👤 Member left:", member);
        setState(prev => {
          const newOnlineUsers = prev.onlineUsers.filter(id => id !== member.id);
          // Also remove from typing users
          const newTypingUsers = prev.typingUsers.filter(u => u.userId !== member.id);
          callbacksRef.current.onPresenceUpdate?.(member.id, false, newOnlineUsers);
          return { ...prev, onlineUsers: newOnlineUsers, typingUsers: newTypingUsers };
        });
      });

      // New message
      channel.bind("new_message", (data: { message: Message; conversationId: string }) => {
        if (DEBUG_CHAT) console.log("💬 New message received:", data.message);
        if (data.message?.senderId) {
          callbacksRef.current.onNewMessage?.(data.message);
        }
      });

      // Message updated
      channel.bind("message_updated", (data: { message: Message }) => {
        if (DEBUG_CHAT) console.log("💬 Message updated:", data.message);
        if (data.message?.senderId) {
          callbacksRef.current.onMessageUpdated?.(data.message);
        }
      });

      // Message deleted
      channel.bind("message_deleted", (data: { messageId: string }) => {
        if (DEBUG_CHAT) console.log("💬 Message deleted:", data.messageId);
        callbacksRef.current.onMessageDeleted?.(data.messageId);
      });

      // Typing update - listen to both server events and client events
      const handleTypingUpdate = (data: { userId: string; userName: string; isTyping: boolean }) => {
        if (DEBUG_CHAT) console.log("⌨️ Typing update:", data);
        const { userId, userName, isTyping } = data;
        callbacksRef.current.onTypingUpdate?.(userId, isTyping, userName);

        setState(prev => {
          const typingUsers = prev.typingUsers.filter(u => u.userId !== userId);
          if (isTyping) {
            typingUsers.push({ userId, userName: userName || "Unknown" });
          }
          return { ...prev, typingUsers };
        });
      };

      // Server-side typing events (fallback)
      channel.bind("typing_update", handleTypingUpdate);
      // Client-side typing events (optimized - no server round-trip)
      channel.bind("client-typing", handleTypingUpdate);

      // Reaction added
      channel.bind("message_reaction_added", (data: { messageId: string; emoji: string; userId: string; userName: string }) => {
        if (DEBUG_CHAT) console.log("😀 Reaction added:", data);
        callbacksRef.current.onReactionAdded?.(data.messageId, data.emoji, data.userId, data.userName);
      });

      // Reaction removed
      channel.bind("message_reaction_removed", (data: { messageId: string; emoji: string; userId: string; userName: string }) => {
        if (DEBUG_CHAT) console.log("😞 Reaction removed:", data);
        callbacksRef.current.onReactionRemoved?.(data.messageId, data.emoji, data.userId, data.userName);
      });

      channelRef.current = channel;
    } catch (error) {
      console.error("❌ Failed to connect to Pusher:", error);
      setState(prev => ({
        ...prev,
        isConnected: false,
        isLoading: false,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
      callbacksRef.current.onConnectionChange?.(false);
    }
  }, [isSignedIn, conversationId]);

  // Disconnect from Pusher channel
  const disconnect = useCallback(() => {
    if (DEBUG_CHAT) console.log("💬 Disconnecting from Pusher");

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (channelRef.current) {
      const pusher = getPusherClient();
      pusher.unsubscribe(getConversationChannel(conversationId));
      channelRef.current = null;
    }

    setState({
      isConnected: false,
      isLoading: false,
      error: null,
      typingUsers: [],
      onlineUsers: [],
    });
    callbacksRef.current.onConnectionChange?.(false);
  }, [conversationId]);

  // Auto-connect when conditions are met
  useEffect(() => {
    if (autoConnect && isSignedIn && conversationId && !channelRef.current) {
      connect();
    }
  }, [autoConnect, isSignedIn, conversationId, connect]);

  // Cleanup on unmount or conversationId change
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Send typing indicator via client-side event (no server round-trip)
  const sendTypingIndicator = useCallback((isTyping: boolean) => {
    if (!isSignedIn || !conversationId || !channelRef.current || !currentUserRef.current) {
      return;
    }

    try {
      // Use client-side event for instant feedback (no server round-trip)
      channelRef.current.trigger("client-typing", {
        userId: currentUserRef.current.id,
        userName: currentUserRef.current.name,
        isTyping,
      });
    } catch (error) {
      console.error("❌ Failed to send typing indicator:", error);
    }
  }, [isSignedIn, conversationId]);

  return {
    ...state,
    connect,
    disconnect,
    sendTypingIndicator,
  };
}
