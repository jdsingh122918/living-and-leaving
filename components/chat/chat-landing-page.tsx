"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { MessageCircle, Plus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ConversationList } from "./conversation-list";
import { UsersPanel } from "./users-panel";
import { NewConversationForm } from "./new-conversation-form";
import { useGlobalPresence } from "@/hooks/use-global-presence";

interface ChatAccessibleUser {
  id: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  familyRole: string | null;
  category: string;
  existingConversationId: string | null;
}

interface Conversation {
  id: string;
  title?: string;
  type: string;
  familyId?: string;
  family?: {
    id: string;
    name: string;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  participantCount: number;
  participants?: {
    userId: string;
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: string;
    };
  }[];
  lastMessage?: {
    id: string;
    content: string;
    senderId: string;
    sender: {
      id: string;
      firstName?: string;
      lastName?: string;
      email: string;
      imageUrl?: string;
    };
    createdAt: string;
  };
  unreadCount: number;
}

interface ChatLandingPageProps {
  userRole: UserRole;
  userId: string;
}

export function ChatLandingPage({ userRole, userId }: ChatLandingPageProps) {
  const router = useRouter();

  // State
  const [users, setUsers] = useState<ChatAccessibleUser[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showConversationForm, setShowConversationForm] = useState(false);
  const [conversationSearchQuery, setConversationSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<string>("users");

  // Global presence
  const { onlineUserIds, isConnected } = useGlobalPresence();

  // Calculate online count for accessible users only (not all online users globally)
  const relevantOnlineCount = useMemo(() => {
    return users.filter(u => onlineUserIds.includes(u.id)).length;
  }, [users, onlineUserIds]);

  // Fetch accessible users
  const fetchUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const response = await fetch("/api/users/chat-accessible");
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users");
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const params = new URLSearchParams({
        limit: "50",
        ...(conversationSearchQuery && { search: conversationSearchQuery }),
      });

      const response = await fetch(`/api/conversations?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch conversations");
      }

      const data = await response.json();
      if (data.success && data.data?.conversations) {
        setConversations(data.data.conversations || []);
      } else if (data.conversations) {
        setConversations(data.conversations || []);
      } else {
        setConversations([]);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
      setError("Failed to load conversations");
    } finally {
      setLoadingConversations(false);
    }
  }, [conversationSearchQuery]);

  // Initial data fetch
  useEffect(() => {
    fetchUsers();
    fetchConversations();
  }, [fetchUsers, fetchConversations]);

  // Handle user click - navigate to existing DM or create new one
  const handleUserClick = useCallback(
    async (user: ChatAccessibleUser) => {
      // Guard against undefined user (can happen during fast re-renders)
      if (!user?.id) {
        console.error("handleUserClick called with invalid user:", user);
        return;
      }

      // If there's an existing conversation, navigate to it
      if (user.existingConversationId) {
        router.push(`/${userRole.toLowerCase()}/chat/${user.existingConversationId}`);
        return;
      }

      // Create a new direct conversation
      setLoadingUserId(user.id);
      try {
        const response = await fetch("/api/conversations/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: user.id }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to create conversation");
        }

        const data = await response.json();
        // API returns { success, data: { conversation, conversationId } }
        const conversationId = data.data?.conversationId || data.data?.conversation?.id;
        if (!conversationId) {
          throw new Error("No conversation ID returned from server");
        }
        router.push(`/${userRole.toLowerCase()}/chat/${conversationId}`);
      } catch (error) {
        console.error("Error creating conversation:", error);
        alert(error instanceof Error ? error.message : "Failed to create conversation");
      } finally {
        setLoadingUserId(null);
      }
    },
    [router, userRole]
  );

  // Conversations panel content
  const ConversationsPanel = () => (
    <div className="flex flex-col h-full border rounded-lg bg-card">
      {/* Header */}
      <div className="p-4 border-b space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Conversations</h2>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowConversationForm(true)}
            className="h-8"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations..."
            value={conversationSearchQuery}
            onChange={(e) => setConversationSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        {loadingConversations ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground p-4">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm text-center">
              {conversationSearchQuery ? "No conversations found" : "No conversations yet"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConversationForm(true)}
              className="mt-2"
            >
              Start a conversation
            </Button>
          </div>
        ) : (
          <div className="p-2">
            <ConversationList
              conversations={conversations}
              userRole={userRole}
              currentUserId={userId}
              onConversationUpdate={fetchConversations}
            />
          </div>
        )}
      </ScrollArea>
    </div>
  );

  // If showing the new conversation form, display it instead
  if (showConversationForm) {
    return (
      <div className="space-y-4">
        <NewConversationForm
          userRole={userRole}
          userId={userId}
          context="all"
          onConversationCreated={() => {
            setShowConversationForm(false);
            fetchConversations();
          }}
          onCancel={() => setShowConversationForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-xl font-semibold">Chat</h1>
            <p className="text-sm text-muted-foreground">
              {isConnected ? (
                <span className="text-green-600">Connected</span>
              ) : (
                "Connecting..."
              )}
              {" • "}
              {relevantOnlineCount} online
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Card className="p-4">
          <div className="text-center text-destructive">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                fetchUsers();
                fetchConversations();
              }}
              className="mt-2"
            >
              Try Again
            </Button>
          </div>
        </Card>
      )}

      {/* Desktop: Two-column layout */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4 md:items-start md:max-h-[calc(100vh-200px)]">
        <UsersPanel
          users={users}
          onlineUserIds={onlineUserIds}
          onUserClick={handleUserClick}
          loading={loadingUsers}
          loadingUserId={loadingUserId}
        />
        <ConversationsPanel />
      </div>

      {/* Mobile: Tabs layout */}
      <div className="md:hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-full p-1.5">
            <TabsTrigger value="users" className="flex-1">
              Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="conversations" className="flex-1">
              Conversations ({conversations.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="users" className="mt-2">
            <div className="h-[calc(100vh-220px)]">
              <UsersPanel
                users={users}
                onlineUserIds={onlineUserIds}
                onUserClick={handleUserClick}
                loading={loadingUsers}
                loadingUserId={loadingUserId}
              />
            </div>
          </TabsContent>
          <TabsContent value="conversations" className="mt-2">
            <div className="h-[calc(100vh-220px)]">
              <ConversationsPanel />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
