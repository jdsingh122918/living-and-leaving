"use client";

import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserListItem } from "./user-list-item";
import { Search, Users, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface UsersPanelProps {
  users: ChatAccessibleUser[];
  onlineUserIds: string[];
  onUserClick: (user: ChatAccessibleUser) => void;
  loading?: boolean;
  loadingUserId?: string | null;
}

function groupUsersByCategory(users: ChatAccessibleUser[]): Map<string, ChatAccessibleUser[]> {
  const groups = new Map<string, ChatAccessibleUser[]>();
  const categoryOrder = ["admin", "volunteer", "family", "assigned_family", "member", "other"];

  // Initialize groups in order
  for (const cat of categoryOrder) {
    groups.set(cat, []);
  }

  // Group users
  for (const user of users) {
    const category = user.category || "other";
    const group = groups.get(category);
    if (group) {
      group.push(user);
    } else {
      const otherGroup = groups.get("other");
      if (otherGroup) {
        otherGroup.push(user);
      }
    }
  }

  // Remove empty groups
  for (const [key, value] of groups) {
    if (value.length === 0) {
      groups.delete(key);
    }
  }

  return groups;
}

function getCategoryDisplayName(category: string): string {
  switch (category) {
    case "admin":
      return "Administrators";
    case "volunteer":
      return "Volunteers";
    case "family":
      return "Family Members";
    case "assigned_family":
      return "Assigned Families";
    case "member":
      return "Members";
    default:
      return "Others";
  }
}

export function UsersPanel({
  users,
  onlineUserIds,
  onUserClick,
  loading = false,
  loadingUserId = null,
}: UsersPanelProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter((user) => {
      return (
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    });
  }, [users, searchQuery]);

  // Sort users: online first, then alphabetically
  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      const aOnline = onlineUserIds.includes(a.id);
      const bOnline = onlineUserIds.includes(b.id);

      // Online users first
      if (aOnline && !bOnline) return -1;
      if (!aOnline && bOnline) return 1;

      // Then alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [filteredUsers, onlineUserIds]);

  // Group users by category
  const groupedUsers = useMemo(() => {
    return groupUsersByCategory(sortedUsers);
  }, [sortedUsers]);

  const onlineCount = users.filter((u) => onlineUserIds.includes(u.id)).length;

  return (
    <div className="flex flex-col border rounded-lg bg-card h-full overflow-hidden">
      {/* Header - flex-shrink-0 prevents compression */}
      <div className="p-4 border-b space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-semibold">Users</h2>
          </div>
          <span className="text-xs text-muted-foreground">
            {onlineCount} online • {users.length} total
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* User List */}
      <ScrollArea className="flex-1 min-h-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Users className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? "No users found" : "No users available"}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-4">
            {Array.from(groupedUsers.entries()).map(([category, categoryUsers]) => (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-accent/50 rounded-md transition-colors"
                >
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {getCategoryDisplayName(category)} ({categoryUsers.length})
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    collapsedCategories.has(category) && "-rotate-90"
                  )} />
                </button>
                {!collapsedCategories.has(category) && (
                  <div className="space-y-1">
                    {categoryUsers.map((user) => (
                      <UserListItem
                        key={user.id}
                        user={user}
                        isOnline={onlineUserIds.includes(user.id)}
                        onClick={() => onUserClick(user)}
                        isLoading={loadingUserId === user.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
