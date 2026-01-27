/**
 * Message Notification Template
 *
 * Used for new message notifications in conversations.
 */

import { NotificationType } from "@/lib/types";
import {
  NotificationTemplate,
  ProcessedTemplate,
  TemplateVariables,
  processTemplate,
  truncateText,
} from "../template-engine";

/**
 * Default message notification template
 */
export const messageTemplate: NotificationTemplate = {
  type: NotificationType.MESSAGE,
  title: "New message from {{senderName}}",
  message: "{{messagePreview}}",
  richMessage: "**{{senderName}}** sent you a message:\n\n> {{messagePreview}}",
  ctaLabel: "Reply",
  ctaUrl: "{{actionUrl}}",
  secondaryLabel: "View Conversation",
  secondaryUrl: "{{actionUrl}}",
};

/**
 * Variables specific to message notifications
 */
export interface MessageTemplateVariables extends TemplateVariables {
  senderName: string;
  senderFirstName?: string;
  messagePreview: string;
  conversationTitle?: string;
  familyName?: string;
  messageCount?: number;
  senderAvatarUrl?: string;
}

/**
 * Generate a processed message notification
 *
 * @param variables - Message-specific variables
 * @param customTemplate - Optional custom template override
 * @returns Processed notification ready for creation
 */
export function getMessageNotification(
  variables: MessageTemplateVariables,
  customTemplate?: Partial<NotificationTemplate>
): ProcessedTemplate {
  // Truncate message preview for notification display
  const truncatedPreview = truncateText(variables.messagePreview, 100);

  const mergedVariables: TemplateVariables = {
    ...variables,
    messagePreview: truncatedPreview,
  };

  const template = {
    ...messageTemplate,
    ...customTemplate,
  };

  const processed = processTemplate(template, mergedVariables);

  // Add sender avatar as thumbnail if available
  if (variables.senderAvatarUrl) {
    processed.thumbnailUrl = variables.senderAvatarUrl;
  }

  return processed;
}
