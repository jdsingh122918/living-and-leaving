import { NotificationRepository } from "@/lib/db/repositories/notification.repository";
import { NotificationDeliveryRepository } from "@/lib/db/repositories/notification-delivery.repository";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { NotificationType, Notification } from "@/lib/types";
import { sendNotificationEmail, NotificationEmailHelpers } from "@/lib/email";
import { NotificationLogger } from "./notification-logger";
import {
  broadcastNotification,
  broadcastUnreadCount,
  broadcastAllRead,
} from "@/lib/pusher/notifications";

export class NotificationDispatcher {
  private notificationRepository: NotificationRepository;
  private deliveryRepository: NotificationDeliveryRepository;
  private userRepository: UserRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
    this.deliveryRepository = new NotificationDeliveryRepository();
    this.userRepository = new UserRepository();
  }

  /**
   * Create and dispatch a notification (both in-app and email if preferences allow)
   */
  async dispatchNotification(
    recipientUserId: string,
    type: NotificationType,
    data: {
      title: string;
      message: string;
      data?: Record<string, unknown> | null;
      isActionable?: boolean;
      actionUrl?: string;
      expiresAt?: Date;
      // Rich notification media support
      imageUrl?: string;
      thumbnailUrl?: string;
      richMessage?: string;
      // Enhanced CTA support
      ctaLabel?: string;
      secondaryUrl?: string;
      secondaryLabel?: string;
    },
    emailData?: {
      recipientName: string;
      senderName?: string;
      conversationTitle?: string;
      familyName?: string;
      messageCount?: number;
      updateAuthor?: string;
      contactInfo?: string;
      severity?: string;
      authorName?: string;
      priority?: string;
      participants?: string[];
      [key: string]: unknown;
    },
  ): Promise<{
    inAppNotification?: Notification;
    emailSent: boolean;
    delivered: boolean;
    deliveryLogId?: string;
    success: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    let inAppNotification: Notification | undefined;
    let emailSent = false;
    let delivered = false;
    let deliveryLogId: string | undefined;

    try {
      // Always create in-app notification first
      inAppNotification = await this.notificationRepository.createNotification({
        userId: recipientUserId,
        type,
        title: data.title,
        message: data.message,
        data: data.data,
        isActionable: data.isActionable,
        actionUrl: data.actionUrl,
        expiresAt: data.expiresAt,
        // Rich notification media support
        imageUrl: data.imageUrl,
        thumbnailUrl: data.thumbnailUrl,
        richMessage: data.richMessage,
        // Enhanced CTA support
        ctaLabel: data.ctaLabel,
        secondaryUrl: data.secondaryUrl,
        secondaryLabel: data.secondaryLabel,
      });

      // Log notification creation
      NotificationLogger.notificationCreated(
        inAppNotification.id,
        recipientUserId,
        type,
      );

      // Create delivery tracking log
      const deliveryLog = await this.deliveryRepository.createDeliveryLog({
        notificationId: inAppNotification.id,
        userId: recipientUserId,
        wasConnected: true, // Pusher handles connection state
      });
      deliveryLogId = deliveryLog.id;

      // Log dispatch attempt
      NotificationLogger.dispatchAttempted(
        inAppNotification.id,
        recipientUserId,
      );

      // Broadcast the notification via Pusher
      const broadcastResult = await broadcastNotification(recipientUserId, {
        id: inAppNotification.id,
        type: inAppNotification.type,
        title: inAppNotification.title,
        message: inAppNotification.message,
        data: inAppNotification.data as Record<string, unknown> | null,
        isActionable: inAppNotification.isActionable,
        actionUrl: inAppNotification.actionUrl,
        createdAt: inAppNotification.createdAt,
        // Rich notification media support
        imageUrl: inAppNotification.imageUrl,
        thumbnailUrl: inAppNotification.thumbnailUrl,
        richMessage: inAppNotification.richMessage,
        // Enhanced CTA support
        ctaLabel: inAppNotification.ctaLabel,
        secondaryUrl: inAppNotification.secondaryUrl,
        secondaryLabel: inAppNotification.secondaryLabel,
      });

      // Update delivery log based on result
      if (broadcastResult.success) {
        const latencyMs = Date.now() - inAppNotification.createdAt.getTime();
        await this.deliveryRepository.markAsDelivered(
          deliveryLog.id,
          latencyMs,
        );
        delivered = true;
        NotificationLogger.dispatchSuccess(
          inAppNotification.id,
          recipientUserId,
          latencyMs,
        );
      } else {
        await this.deliveryRepository.markAsFailed(
          deliveryLog.id,
          broadcastResult.error || "Unknown error",
        );
        NotificationLogger.dispatchFailed(
          inAppNotification.id,
          recipientUserId,
          broadcastResult.error || "Unknown error",
        );
      }

      // Update unread count via Pusher
      const unreadCount =
        await this.notificationRepository.getUnreadCount(recipientUserId);
      await broadcastUnreadCount(recipientUserId, unreadCount);

      // Send email notification if email data is provided and preferences allow
      if (emailData) {
        try {
          // Check if user wants email notifications
          const shouldSendEmail =
            await this.notificationRepository.shouldSendNotification(
              recipientUserId,
              type,
              "email",
            );

          if (shouldSendEmail) {
            // Check quiet hours (emergency alerts always go through)
            const isWithinQuietHours =
              await this.notificationRepository.isWithinQuietHours(
                recipientUserId,
              );

            if (
              !isWithinQuietHours ||
              type === NotificationType.EMERGENCY_ALERT
            ) {
              // Create proper email notification data based on type
              let emailNotificationData;

              switch (type) {
                case NotificationType.MESSAGE:
                  emailNotificationData =
                    NotificationEmailHelpers.createMessageNotification({
                      recipientName: emailData.recipientName,
                      senderName: (emailData.senderName as string) || "Unknown",
                      messagePreview: data.message,
                      conversationUrl: data.actionUrl || "#",
                      conversationTitle: emailData.conversationTitle as
                        | string
                        | undefined,
                      familyName: emailData.familyName as string | undefined,
                      messageCount: emailData.messageCount as
                        | number
                        | undefined,
                    });
                  break;

                case NotificationType.CARE_UPDATE:
                  emailNotificationData =
                    NotificationEmailHelpers.createCareUpdateNotification({
                      recipientName: emailData.recipientName,
                      familyName: (emailData.familyName as string) || "",
                      updateTitle: data.title,
                      updateContent: data.message,
                      updateUrl: data.actionUrl || "#",
                      updateAuthor:
                        (emailData.updateAuthor as string) || "System",
                      updateDate: new Date().toISOString(),
                    });
                  break;

                case NotificationType.EMERGENCY_ALERT:
                  emailNotificationData =
                    NotificationEmailHelpers.createEmergencyAlertNotification({
                      recipientName: emailData.recipientName,
                      alertTitle: data.title,
                      alertContent: data.message,
                      alertUrl: data.actionUrl || "#",
                      familyName: (emailData.familyName as string) || "",
                      contactInfo: (emailData.contactInfo as string) || "",
                      issueDate: new Date().toISOString(),
                      severity:
                        (emailData.severity as
                          | "low"
                          | "medium"
                          | "high"
                          | "critical") || "medium",
                    });
                  break;

                case NotificationType.SYSTEM_ANNOUNCEMENT:
                  emailNotificationData =
                    NotificationEmailHelpers.createAnnouncementNotification({
                      recipientName: emailData.recipientName,
                      announcementTitle: data.title,
                      announcementContent: data.message,
                      announcementUrl: data.actionUrl || "#",
                      authorName:
                        (emailData.authorName as string) || "Living & Leaving Team",
                      publishDate: new Date().toISOString(),
                      priority:
                        (emailData.priority as
                          | "low"
                          | "normal"
                          | "high"
                          | "urgent") || "normal",
                    });
                  break;

                case NotificationType.FAMILY_ACTIVITY:
                  emailNotificationData =
                    NotificationEmailHelpers.createFamilyActivityNotification({
                      recipientName: emailData.recipientName,
                      familyName: (emailData.familyName as string) || "",
                      activityTitle: data.title,
                      activityDescription: data.message,
                      activityUrl: data.actionUrl || "#",
                      activityDate: new Date().toISOString(),
                      participants: (emailData.participants as string[]) || [],
                    });
                  break;

                default:
                  // For unknown types, create a generic announcement
                  emailNotificationData =
                    NotificationEmailHelpers.createAnnouncementNotification({
                      recipientName: emailData.recipientName,
                      announcementTitle: data.title,
                      announcementContent: data.message,
                      announcementUrl: data.actionUrl || "#",
                      authorName: "Living & Leaving",
                      publishDate: new Date().toISOString(),
                    });
              }

              const emailResult = await sendNotificationEmail(
                recipientUserId,
                type,
                emailNotificationData,
              );

              if (emailResult.success) {
                emailSent = true;
                console.log(
                  "✅ Email notification sent:",
                  emailResult.messageId,
                );
              } else {
                errors.push(`Email failed: ${emailResult.error}`);
              }
            } else {
              console.log(
                "🔕 Email notification skipped due to quiet hours:",
                recipientUserId,
              );
            }
          } else {
            console.log(
              "🔕 Email notification disabled by user preferences:",
              recipientUserId,
            );
          }
        } catch (emailError) {
          console.error("❌ Email notification error:", emailError);
          errors.push(
            `Email error: ${
              emailError instanceof Error ? emailError.message : "Unknown"
            }`,
          );
        }
      }

      return {
        inAppNotification,
        emailSent,
        delivered,
        deliveryLogId,
        success: true,
        errors,
      };
    } catch (error) {
      console.error("❌ Notification dispatch error:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push(`Dispatch error: ${errorMessage}`);

      return {
        inAppNotification,
        emailSent,
        delivered,
        deliveryLogId,
        success: false,
        errors,
      };
    }
  }

  /**
   * Dispatch notification to multiple users (bulk)
   */
  async dispatchBulkNotifications(
    recipients: Array<{
      userId: string;
      emailData?: {
        recipientName: string;
        [key: string]: unknown;
      };
    }>,
    type: NotificationType,
    notificationData: {
      title: string;
      message: string;
      data?: Record<string, unknown> | null;
      isActionable?: boolean;
      actionUrl?: string;
      expiresAt?: Date;
    },
  ): Promise<{
    successCount: number;
    failureCount: number;
    deliveredCount: number;
    results: Array<{
      userId: string;
      success: boolean;
      inAppNotification?: Notification;
      emailSent: boolean;
      delivered: boolean;
      errors: string[];
    }>;
  }> {
    const results = await Promise.allSettled(
      recipients.map((recipient) =>
        this.dispatchNotification(
          recipient.userId,
          type,
          notificationData,
          recipient.emailData,
        ).then((result) => ({
          userId: recipient.userId,
          ...result,
        })),
      ),
    );

    const finalResults = results.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          userId: recipients[index].userId,
          success: false,
          emailSent: false,
          delivered: false,
          errors: [`Failed to dispatch: ${result.reason}`],
        };
      }
    });

    const successCount = finalResults.filter((r) => r.success).length;
    const failureCount = finalResults.length - successCount;
    const deliveredCount = finalResults.filter((r) => r.delivered).length;

    console.log("🔔 Bulk notification dispatch complete:", {
      total: recipients.length,
      success: successCount,
      failed: failureCount,
      delivered: deliveredCount,
    });

    return {
      successCount,
      failureCount,
      deliveredCount,
      results: finalResults,
    };
  }

  /**
   * Send notification to all family members
   */
  async dispatchFamilyNotification(
    familyId: string,
    type: NotificationType,
    notificationData: {
      title: string;
      message: string;
      data?: Record<string, unknown> | null;
      isActionable?: boolean;
      actionUrl?: string;
      expiresAt?: Date;
    },
    emailData: {
      [key: string]: unknown;
    },
    options: {
      excludeUserIds?: string[];
    } = {},
  ): Promise<{
    successCount: number;
    failureCount: number;
    deliveredCount: number;
    results: Array<{
      userId: string;
      success: boolean;
      inAppNotification?: Notification;
      emailSent: boolean;
      delivered: boolean;
      errors: string[];
    }>;
  }> {
    try {
      // Get family members
      const { FamilyRepository } =
        await import("@/lib/db/repositories/family.repository");
      const familyRepo = new FamilyRepository();

      const family = await familyRepo.getFamilyById(familyId);
      if (!family || !family.members) {
        throw new Error("Family not found or has no members");
      }

      // Filter out excluded users
      let recipients = family.members;
      if (options.excludeUserIds) {
        recipients = recipients.filter(
          (member) => !options.excludeUserIds!.includes(member.id),
        );
      }

      // Prepare recipients with email data
      const recipientsWithEmailData = recipients
        .filter((member) => member.email) // Only members with email addresses
        .map((member) => ({
          userId: member.id,
          emailData: {
            ...emailData,
            recipientName:
              `${member.firstName} ${member.lastName}`.trim() || member.email,
            familyName: family.name,
          },
        }));

      return await this.dispatchBulkNotifications(
        recipientsWithEmailData,
        type,
        notificationData,
      );
    } catch (error) {
      console.error("❌ Family notification dispatch error:", error);
      return {
        successCount: 0,
        failureCount: 1,
        deliveredCount: 0,
        results: [
          {
            userId: "family",
            success: false,
            emailSent: false,
            delivered: false,
            errors: [error instanceof Error ? error.message : "Unknown error"],
          },
        ],
      };
    }
  }

  /**
   * Mark notification as read and update real-time counters
   */
  async markNotificationAsRead(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    try {
      await this.notificationRepository.markAsRead(notificationId);

      // Update unread count in real-time via Pusher
      const unreadCount =
        await this.notificationRepository.getUnreadCount(userId);
      await broadcastUnreadCount(userId, unreadCount);

      console.log("🔔 Notification marked as read:", {
        notificationId,
        userId,
        newUnreadCount: unreadCount,
      });
    } catch (error) {
      console.error("❌ Failed to mark notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read and update real-time counters
   */
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.markAllAsRead(userId);

      // Broadcast all-read event and update unread count via Pusher
      await broadcastAllRead(userId);

      console.log("🔔 All notifications marked as read for user:", userId);
    } catch (error) {
      console.error("❌ Failed to mark all notifications as read:", error);
      throw error;
    }
  }
}

// Export singleton instance
export const notificationDispatcher = new NotificationDispatcher();
