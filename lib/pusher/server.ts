import Pusher from "pusher";

// Validate required environment variables
const requiredEnvVars = [
  "PUSHER_APP_ID",
  "PUSHER_KEY",
  "PUSHER_SECRET",
  "PUSHER_CLUSTER",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.warn(`⚠️ Missing Pusher environment variable: ${envVar}`);
  }
}

// Singleton Pusher server instance
export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID || "",
  key: process.env.PUSHER_KEY || "",
  secret: process.env.PUSHER_SECRET || "",
  cluster: process.env.PUSHER_CLUSTER || "us2",
  useTLS: true,
});

// Channel naming conventions
export function getConversationChannel(conversationId: string): string {
  return `presence-conversation-${conversationId}`;
}

export function getGlobalPresenceChannel(): string {
  return "presence-global";
}

export function getUserChannel(userId: string): string {
  return `private-user-${userId}`;
}

export function getForumChannel(forumId: string): string {
  return `private-forum-${forumId}`;
}

export function getPostChannel(postId: string): string {
  return `private-post-${postId}`;
}

// Extract IDs from channel names
export function parseChannelName(channelName: string): {
  type: "conversation" | "user" | "forum" | "post" | "global" | "unknown";
  id: string;
} {
  if (channelName === "presence-global") {
    return { type: "global", id: "global" };
  }
  if (channelName.startsWith("presence-conversation-")) {
    return { type: "conversation", id: channelName.replace("presence-conversation-", "") };
  }
  if (channelName.startsWith("private-user-")) {
    return { type: "user", id: channelName.replace("private-user-", "") };
  }
  if (channelName.startsWith("private-forum-")) {
    return { type: "forum", id: channelName.replace("private-forum-", "") };
  }
  if (channelName.startsWith("private-post-")) {
    return { type: "post", id: channelName.replace("private-post-", "") };
  }
  return { type: "unknown", id: "" };
}
