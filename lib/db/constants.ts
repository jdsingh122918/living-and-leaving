/**
 * Sentinel clerkId used by the "placeholder" user that owns content
 * whose original author has been permanently deleted. The real Clerk
 * user ID space is prefixed with "user_", so this sentinel cannot
 * collide with a real Clerk user.
 */
export const ANONYMOUS_USER_CLERK_ID = "system:anonymous";

/**
 * Email used by the anonymous placeholder user. Hidden from UI filters.
 */
export const ANONYMOUS_USER_EMAIL = "anonymous@system.local";

/**
 * Soft-delete grace period before permanent purge.
 * During this window a deleted user can be restored.
 */
export const SOFT_DELETE_GRACE_DAYS = 30;
