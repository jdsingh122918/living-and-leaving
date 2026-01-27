// Core notification services
export {
  NotificationDispatcher,
  notificationDispatcher,
} from "./notification-dispatcher.service";

// Helper functions for easy notification dispatching
export {
  notifyMessage,
  notifyCareUpdate,
  notifyEmergencyAlert,
  notifySystemAnnouncement,
  notifyFamilyActivity,
  notifyFamily,
  notifySimple,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  NotificationHelpers,
} from "./notification-helpers";

// Template engine and templates for rich notifications
export {
  interpolate,
  processTemplate,
  formatNotificationDate,
  truncateText,
  getDisplayName,
  type TemplateVariables,
  type ProcessedTemplate,
  type NotificationTemplate,
} from "./template-engine";

export {
  messageTemplate,
  getMessageNotification,
  careUpdateTemplate,
  getCareUpdateNotification,
  emergencyAlertTemplate,
  getEmergencyAlertNotification,
  systemAnnouncementTemplate,
  getSystemAnnouncementNotification,
  familyActivityTemplate,
  getFamilyActivityNotification,
} from "./templates";

// Export default for convenience
export { default as NotificationService } from "./notification-helpers";
