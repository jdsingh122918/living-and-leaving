"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
      {...props}
    />
  )
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full object-cover", className)}
      {...props}
    />
  )
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className
      )}
      {...props}
    />
  )
}

interface AvatarWithPresenceProps extends React.ComponentProps<typeof AvatarPrimitive.Root> {
  isOnline?: boolean;
  showIndicator?: boolean;
  indicatorSize?: "sm" | "md" | "lg";
  children?: React.ReactNode;
}

function AvatarWithPresence({
  isOnline,
  showIndicator = true,
  indicatorSize = "md",
  className,
  children,
  ...props
}: AvatarWithPresenceProps) {
  const sizeClasses = {
    sm: "h-3 w-3",
    md: "h-3.5 w-3.5",
    lg: "h-4 w-4",
  };

  return (
    <div className="relative inline-block">
      <Avatar className={className} {...props}>
        {children}
      </Avatar>
      {showIndicator && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-2 border-background",
            sizeClasses[indicatorSize],
            isOnline
              ? "bg-green-500 ring-2 ring-green-500/30 animate-pulse"
              : "bg-gray-400"
          )}
          aria-label={isOnline ? "Online" : "Offline"}
        />
      )}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarWithPresence }
