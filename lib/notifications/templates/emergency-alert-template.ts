/**
 * Emergency Alert Notification Template
 *
 * Used for urgent alerts that require immediate attention.
 * Always bypasses quiet hours and gets highest priority delivery.
 */

import { NotificationType } from "@/lib/types";
import {
  NotificationTemplate,
  ProcessedTemplate,
  TemplateVariables,
  processTemplate,
} from "../template-engine";

/**
 * Default emergency alert notification template
 */
export const emergencyAlertTemplate: NotificationTemplate = {
  type: NotificationType.EMERGENCY_ALERT,
  title: "URGENT: {{alertTitle}}",
  message: "{{alertContent}}",
  richMessage:
    "## Emergency Alert\n\n**{{alertTitle}}**\n\n{{alertContent}}\n\n---\n\n*Contact: {{contactInfo}}*",
  ctaLabel: "View Details",
  ctaUrl: "{{actionUrl}}",
  secondaryLabel: "Call Emergency Contact",
  secondaryUrl: "tel:{{emergencyPhone}}",
};

/**
 * Severity levels for emergency alerts
 */
export type AlertSeverity = "low" | "medium" | "high" | "critical";

/**
 * Variables specific to emergency alert notifications
 */
export interface EmergencyAlertTemplateVariables extends TemplateVariables {
  alertTitle: string;
  alertContent: string;
  familyName: string;
  contactInfo?: string;
  emergencyPhone?: string;
  severity: AlertSeverity;
  issueDate?: string;
  expiresAt?: string;
}

/**
 * Get severity-appropriate styling/image for alerts
 */
function getSeverityConfig(severity: AlertSeverity): {
  imageUrl?: string;
  titlePrefix: string;
} {
  switch (severity) {
    case "critical":
      return {
        titlePrefix: "CRITICAL",
      };
    case "high":
      return {
        titlePrefix: "URGENT",
      };
    case "medium":
      return {
        titlePrefix: "ALERT",
      };
    case "low":
    default:
      return {
        titlePrefix: "Notice",
      };
  }
}

/**
 * Generate a processed emergency alert notification
 *
 * @param variables - Emergency alert-specific variables
 * @param customTemplate - Optional custom template override
 * @returns Processed notification ready for creation
 */
export function getEmergencyAlertNotification(
  variables: EmergencyAlertTemplateVariables,
  customTemplate?: Partial<NotificationTemplate>
): ProcessedTemplate {
  const severityConfig = getSeverityConfig(variables.severity);

  // Build the template with severity-appropriate prefix
  const modifiedTemplate: NotificationTemplate = {
    ...emergencyAlertTemplate,
    title: `${severityConfig.titlePrefix}: {{alertTitle}}`,
    ...customTemplate,
  };

  const processed = processTemplate(modifiedTemplate, variables);

  // Add severity image if available
  if (severityConfig.imageUrl) {
    processed.imageUrl = severityConfig.imageUrl;
  }

  return processed;
}
