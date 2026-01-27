/**
 * Page Object Models - Centralized exports
 * Import page objects from this file for cleaner test code
 */

// Base
export { BasePage } from './base.page';

// Auth
export { SignInPage } from './auth/sign-in.page';

// Admin
export { AdminDashboardPage } from './admin/dashboard.page';
export { AdminUsersPage } from './admin/users.page';
export { AdminFamiliesPage } from './admin/families.page';
export { AdminResourcesPage } from './admin/resources.page';

// Volunteer
export { VolunteerDashboardPage } from './volunteer/dashboard.page';
export { VolunteerFamiliesPage } from './volunteer/families.page';

// Member
export { MemberDashboardPage } from './member/dashboard.page';
export { MemberResourcesPage } from './member/resources.page';

// Shared
export { ChatPage } from './shared/chat.page';
export { ForumsPage } from './shared/forums.page';
export { SettingsPage } from './shared/settings.page';
