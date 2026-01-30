/**
 * System Announcement Notification Template
 *
 * Used for platform-wide announcements, updates, and news.
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
 * Default system announcement notification template
 */
export const systemAnnouncementTemplate: NotificationTemplate = {
  type: NotificationType.SYSTEM_ANNOUNCEMENT,
  title: "{{announcementTitle}}",
  message: "{{announcementContent}}",
  richMessage:
    "## {{announcementTitle}}\n\n{{announcementContent}}\n\n*From the Living & Leaving Team*",
  ctaLabel: "Learn More",
  ctaUrl: "{{actionUrl}}",
};

/**
 * Priority levels for system announcements
 */
export type AnnouncementPriority = "low" | "normal" | "high" | "urgent";

/**
 * Variables specific to system announcement notifications
 */
export interface SystemAnnouncementTemplateVariables extends TemplateVariables {
  announcementTitle: string;
  announcementContent: string;
  authorName?: string;
  publishDate?: string;
  priority?: AnnouncementPriority;
  category?: "update" | "maintenance" | "feature" | "news" | "general";
  bannerImageUrl?: string;
}

/**
 * Get announcement category icon/image
 */
function getCategoryConfig(category?: string): {
  imageUrl?: string;
  ctaLabel: string;
} {
  switch (category) {
    case "update":
      return {
        ctaLabel: "See What's New",
      };
    case "maintenance":
      return {
        ctaLabel: "View Details",
      };
    case "feature":
      return {
        ctaLabel: "Try It Now",
      };
    case "news":
      return {
        ctaLabel: "Read More",
      };
    default:
      return {
        ctaLabel: "Learn More",
      };
  }
}

/**
 * Generate a processed system announcement notification
 *
 * @param variables - System announcement-specific variables
 * @param customTemplate - Optional custom template override
 * @returns Processed notification ready for creation
 */
export function getSystemAnnouncementNotification(
  variables: SystemAnnouncementTemplateVariables,
  customTemplate?: Partial<NotificationTemplate>
): ProcessedTemplate {
  const categoryConfig = getCategoryConfig(variables.category);

  // Truncate content for preview
  const truncatedContent = truncateText(variables.announcementContent, 150);

  const mergedVariables: TemplateVariables = {
    ...variables,
    announcementContent: truncatedContent,
  };

  const modifiedTemplate: NotificationTemplate = {
    ...systemAnnouncementTemplate,
    ctaLabel: categoryConfig.ctaLabel,
    ...customTemplate,
  };

  const processed = processTemplate(modifiedTemplate, mergedVariables);

  // Use banner image if provided
  if (variables.bannerImageUrl) {
    processed.imageUrl = variables.bannerImageUrl;
  } else if (categoryConfig.imageUrl) {
    processed.imageUrl = categoryConfig.imageUrl;
  }

  return processed;
}
