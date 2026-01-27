/**
 * Care Update Notification Template
 *
 * Used for care plan updates, health status changes, and care coordination.
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
 * Default care update notification template
 */
export const careUpdateTemplate: NotificationTemplate = {
  type: NotificationType.CARE_UPDATE,
  title: "Care Update: {{updateTitle}}",
  message: "{{updateAuthor}} posted an update for {{familyName}}",
  richMessage:
    "## {{updateTitle}}\n\n{{updateContent}}\n\n*Posted by {{updateAuthor}}*",
  ctaLabel: "View Update",
  ctaUrl: "{{actionUrl}}",
  secondaryLabel: "View All Updates",
  secondaryUrl: "{{familyUrl}}",
};

/**
 * Variables specific to care update notifications
 */
export interface CareUpdateTemplateVariables extends TemplateVariables {
  updateTitle: string;
  updateContent: string;
  updateAuthor: string;
  familyName: string;
  familyUrl?: string;
  updateType?: "health" | "medication" | "appointment" | "general";
  priority?: "low" | "normal" | "high" | "urgent";
  imageUrl?: string;
}

/**
 * Get priority-based image URL for care updates
 */
function getPriorityImage(priority?: string): string | undefined {
  // Could return different icons/images based on priority
  // For now, return undefined to use default styling
  return undefined;
}

/**
 * Generate a processed care update notification
 *
 * @param variables - Care update-specific variables
 * @param customTemplate - Optional custom template override
 * @returns Processed notification ready for creation
 */
export function getCareUpdateNotification(
  variables: CareUpdateTemplateVariables,
  customTemplate?: Partial<NotificationTemplate>
): ProcessedTemplate {
  // Truncate content for notification preview
  const truncatedContent = truncateText(variables.updateContent, 200);

  const mergedVariables: TemplateVariables = {
    ...variables,
    updateContent: truncatedContent,
  };

  const template = {
    ...careUpdateTemplate,
    ...customTemplate,
  };

  const processed = processTemplate(template, mergedVariables);

  // Add priority-based image if no custom image provided
  if (!processed.imageUrl && !variables.imageUrl) {
    processed.imageUrl = getPriorityImage(variables.priority);
  } else if (variables.imageUrl) {
    processed.imageUrl = variables.imageUrl;
  }

  return processed;
}
