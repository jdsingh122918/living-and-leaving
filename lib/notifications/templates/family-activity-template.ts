/**
 * Family Activity Notification Template
 *
 * Used for family-related events and activities.
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
 * Default family activity notification template
 */
export const familyActivityTemplate: NotificationTemplate = {
  type: NotificationType.FAMILY_ACTIVITY,
  title: "{{activityTitle}}",
  message: "{{activityDescription}}",
  richMessage:
    "## {{activityTitle}}\n\n{{activityDescription}}\n\n*{{familyName}} Family*",
  ctaLabel: "View Activity",
  ctaUrl: "{{actionUrl}}",
};

/**
 * Types of family activities
 */
export type FamilyActivityType =
  | "member_joined"
  | "member_left"
  | "resource_shared"
  | "event_created"
  | "document_uploaded"
  | "task_completed"
  | "general";

/**
 * Variables specific to family activity notifications
 */
export interface FamilyActivityTemplateVariables extends TemplateVariables {
  activityTitle: string;
  activityDescription: string;
  familyName: string;
  activityType?: FamilyActivityType;
  actorName?: string;
  activityDate?: string;
  participants?: string[];
  thumbnailUrl?: string;
}

/**
 * Get activity type configuration
 */
function getActivityTypeConfig(activityType?: FamilyActivityType): {
  ctaLabel: string;
  icon?: string;
} {
  switch (activityType) {
    case "member_joined":
      return {
        ctaLabel: "Welcome Them",
      };
    case "member_left":
      return {
        ctaLabel: "View Family",
      };
    case "resource_shared":
      return {
        ctaLabel: "View Resource",
      };
    case "event_created":
      return {
        ctaLabel: "View Event",
      };
    case "document_uploaded":
      return {
        ctaLabel: "View Document",
      };
    case "task_completed":
      return {
        ctaLabel: "View Task",
      };
    default:
      return {
        ctaLabel: "View Activity",
      };
  }
}

/**
 * Format participants list for display
 */
function formatParticipants(participants?: string[]): string {
  if (!participants || participants.length === 0) {
    return "";
  }

  if (participants.length === 1) {
    return participants[0];
  }

  if (participants.length === 2) {
    return `${participants[0]} and ${participants[1]}`;
  }

  const lastParticipant = participants[participants.length - 1];
  const othersCount = participants.length - 1;
  return `${participants[0]} and ${othersCount} others`;
}

/**
 * Generate a processed family activity notification
 *
 * @param variables - Family activity-specific variables
 * @param customTemplate - Optional custom template override
 * @returns Processed notification ready for creation
 */
export function getFamilyActivityNotification(
  variables: FamilyActivityTemplateVariables,
  customTemplate?: Partial<NotificationTemplate>
): ProcessedTemplate {
  const activityConfig = getActivityTypeConfig(variables.activityType);

  // Truncate description for preview
  const truncatedDescription = truncateText(variables.activityDescription, 150);

  // Format participants if present
  const participantsText = formatParticipants(variables.participants);

  const mergedVariables: TemplateVariables = {
    ...variables,
    activityDescription: truncatedDescription,
    participantsText,
  };

  const modifiedTemplate: NotificationTemplate = {
    ...familyActivityTemplate,
    ctaLabel: activityConfig.ctaLabel,
    ...customTemplate,
  };

  const processed = processTemplate(modifiedTemplate, mergedVariables);

  // Use provided thumbnail
  if (variables.thumbnailUrl) {
    processed.thumbnailUrl = variables.thumbnailUrl;
  }

  return processed;
}
