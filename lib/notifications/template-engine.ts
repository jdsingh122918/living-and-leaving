/**
 * Notification Template Engine
 *
 * Provides variable interpolation and template processing for rich notifications.
 * Supports {{variable}} syntax for dynamic content replacement.
 */

import { NotificationType } from "@/lib/types";

/**
 * Variables that can be interpolated into notification templates
 */
export interface TemplateVariables {
  recipientName: string;
  recipientFirstName?: string;
  senderName?: string;
  senderFirstName?: string;
  familyName?: string;
  actionUrl?: string;
  entityName?: string;
  entityType?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Processed template result ready for notification creation
 */
export interface ProcessedTemplate {
  title: string;
  message: string;
  richMessage?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
}

/**
 * Raw template definition
 */
export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  richMessage?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
}

/**
 * Interpolate template variables into a string
 * Replaces {{variableName}} with the corresponding value
 *
 * @param template - String containing {{variable}} placeholders
 * @param variables - Object containing variable values
 * @returns String with all placeholders replaced
 */
export function interpolate(
  template: string,
  variables: TemplateVariables
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = variables[key];
    if (value === undefined || value === null) {
      // Keep the placeholder if no value is provided
      return "";
    }
    return String(value);
  });
}

/**
 * Process a notification template with variables
 *
 * @param template - The notification template to process
 * @param variables - Variables to interpolate
 * @returns Processed template with all variables replaced
 */
export function processTemplate(
  template: NotificationTemplate,
  variables: TemplateVariables
): ProcessedTemplate {
  return {
    title: interpolate(template.title, variables),
    message: interpolate(template.message, variables),
    richMessage: template.richMessage
      ? interpolate(template.richMessage, variables)
      : undefined,
    imageUrl: template.imageUrl
      ? interpolate(template.imageUrl, variables)
      : undefined,
    thumbnailUrl: template.thumbnailUrl
      ? interpolate(template.thumbnailUrl, variables)
      : undefined,
    ctaLabel: template.ctaLabel
      ? interpolate(template.ctaLabel, variables)
      : undefined,
    ctaUrl: template.ctaUrl
      ? interpolate(template.ctaUrl, variables)
      : undefined,
    secondaryLabel: template.secondaryLabel
      ? interpolate(template.secondaryLabel, variables)
      : undefined,
    secondaryUrl: template.secondaryUrl
      ? interpolate(template.secondaryUrl, variables)
      : undefined,
  };
}

/**
 * Format a date for display in notifications
 */
export function formatNotificationDate(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return "just now";
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins === 1 ? "" : "s"} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Get a display name from first/last name or email
 */
export function getDisplayName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email?: string
): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  if (firstName) {
    return firstName;
  }
  if (lastName) {
    return lastName;
  }
  if (email) {
    return email.split("@")[0];
  }
  return "Unknown";
}
