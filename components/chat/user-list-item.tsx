"use client";

import { AvatarWithPresence, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send } from "lucide-react";
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

interface UserListItemProps {
  user: ChatAccessibleUser;
  isOnline: boolean;
  onClick: () => void;
  isLoading?: boolean;
}

function getInitials(name: string, email: string): string {
  if (name && name !== email) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

function getRoleBadgeVariant(role: string): "default" | "secondary" | "outline" {
  switch (role) {
    case "ADMIN":
      return "default";
    case "VOLUNTEER":
      return "secondary";
    default:
      return "outline";
  }
}

function getCategoryLabel(category: string): string {
  switch (category) {
    case "admin":
      return "Admin";
    case "volunteer":
      return "Volunteer";
    case "family":
      return "Family";
    case "assigned_family":
      return "Assigned Family";
    case "member":
      return "Member";
    default:
      return "";
  }
}

export function UserListItem({
  user,
  isOnline,
  onClick,
  isLoading = false,
}: UserListItemProps) {
  const initials = getInitials(user.name, user.email);
  const hasExistingConversation = !!user.existingConversationId;

  return (
    <div
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border border-transparent",
        "hover:bg-accent hover:border-border transition-colors",
        "cursor-pointer min-h-[60px]"
      )}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <AvatarWithPresence
          isOnline={isOnline}
          showIndicator={true}
          indicatorSize="md"
          className="h-10 w-10"
        >
          <AvatarFallback className="text-sm font-medium bg-primary/10 text-primary">
            {initials}
          </AvatarFallback>
        </AvatarWithPresence>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{user.name}</span>
            {user.role !== "MEMBER" && (
              <Badge variant={getRoleBadgeVariant(user.role)} className="text-xs py-0 h-5">
                {user.role}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={cn(isOnline ? "text-green-600" : "text-muted-foreground")}>
              {isOnline ? "Online" : "Offline"}
            </span>
            {user.category && user.category !== "other" && (
              <>
                <span>•</span>
                <span>{getCategoryLabel(user.category)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <Button
        variant={hasExistingConversation ? "ghost" : "outline"}
        size="sm"
        className="ml-2 shrink-0 min-w-[44px]"
        disabled={isLoading}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        title={hasExistingConversation ? "Message" : "Start Chat"}
      >
        {hasExistingConversation ? (
          <>
            <MessageCircle className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Message</span>
          </>
        ) : (
          <>
            <Send className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">Start</span>
          </>
        )}
      </Button>
    </div>
  );
}
