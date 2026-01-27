/**
 * Notification Templates
 *
 * Code-defined templates for rich notifications with variable interpolation.
 * Each template type has default content that can be customized with variables.
 */

export { messageTemplate, getMessageNotification } from "./message-template";
export {
  careUpdateTemplate,
  getCareUpdateNotification,
} from "./care-update-template";
export {
  emergencyAlertTemplate,
  getEmergencyAlertNotification,
} from "./emergency-alert-template";
export {
  systemAnnouncementTemplate,
  getSystemAnnouncementNotification,
} from "./system-announcement-template";
export {
  familyActivityTemplate,
  getFamilyActivityNotification,
} from "./family-activity-template";

// Re-export template engine utilities
export {
  interpolate,
  processTemplate,
  formatNotificationDate,
  truncateText,
  getDisplayName,
  type TemplateVariables,
  type ProcessedTemplate,
  type NotificationTemplate,
} from "../template-engine";
