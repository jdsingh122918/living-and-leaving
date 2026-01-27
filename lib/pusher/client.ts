"use client";

import PusherClient from "pusher-js";

// Singleton Pusher client instance
let pusherClient: PusherClient | null = null;

export function getPusherClient(): PusherClient {
  if (!pusherClient) {
    const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
    const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!key || !cluster) {
      console.warn("⚠️ Missing Pusher client environment variables");
    }

    pusherClient = new PusherClient(key || "", {
      cluster: cluster || "us2",
      authEndpoint: "/api/pusher/auth",
    });

    // Enable logging in development
    if (process.env.NODE_ENV === "development") {
      PusherClient.logToConsole = false; // Set to true for debugging
    }
  }
  return pusherClient;
}

export function disconnectPusher(): void {
  if (pusherClient) {
    pusherClient.disconnect();
    pusherClient = null;
  }
}

// Re-export channel naming helpers for client use
export function getConversationChannel(conversationId: string): string {
  return `presence-conversation-${conversationId}`;
}

export function getUserChannel(userId: string): string {
  return `private-user-${userId}`;
}

export function getGlobalPresenceChannel(): string {
  return "presence-global";
}
