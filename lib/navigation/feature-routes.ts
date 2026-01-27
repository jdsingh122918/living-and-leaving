import { UserRole } from '@prisma/client'
import { Inbox, MessageSquare, StickyNote, BookOpen, MessageCircle, FolderOpen, MessageSquarePlus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { getBrandConfig } from '../brand'
import type { FeatureFlags } from '../brand/types'

/**
 * Feature route definition for navigation menu items
 * This abstraction allows easy addition of new communication features
 * like forums, unified content (notes + resources), assignments, and real-time chat
 */
export interface FeatureRoute {
  /** Unique identifier for the feature */
  key: string
  /** Display title in the navigation menu */
  title: string
  /** Generate role-specific route URL */
  href: (role: UserRole) => string
  /** Lucide icon component */
  icon: LucideIcon
  /** User roles that can access this feature */
  roles: UserRole[]
  /** Optional badge configuration for showing counts/status */
  badge?: {
    /** Function to determine if badge should be shown */
    shouldShow: (state: { unreadCount: number; isConnected: boolean }) => boolean
    /** Function to get badge content (number or string) */
    getContent: (state: { unreadCount: number; isConnected: boolean }) => string | number
  }
}

/**
 * Feature routes configuration
 * Add new communication features here to automatically appear in navigation
 */
export const FEATURE_ROUTES: FeatureRoute[] = [
  {
    key: 'notifications',
    title: 'Notifications',
    href: (role: UserRole) => `/${role.toLowerCase()}/notifications`,
    icon: Inbox,
    roles: [UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.MEMBER],
    badge: {
      shouldShow: (state) => state.unreadCount > 0,
      getContent: (state) => state.unreadCount > 99 ? '99+' : state.unreadCount
    }
  },
  {
    key: 'forums',
    title: 'Forums',
    href: (role: UserRole) => `/${role.toLowerCase()}/forums`,
    icon: MessageSquare,
    roles: [UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.MEMBER]
    // Badge functionality can be added later for real-time updates
  },
  {
    key: 'resources',
    title: 'Resources',
    href: (role: UserRole) => `/${role.toLowerCase()}/resources`,
    icon: FolderOpen,
    roles: [UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.MEMBER]
    // Badge functionality can be added later for resource counts
  },
  {
    key: 'chat',
    title: 'Chat',
    href: (role: UserRole) => `/${role.toLowerCase()}/chat`,
    icon: MessageCircle,
    roles: [UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.MEMBER],
    badge: {
      shouldShow: (state) => state.unreadCount > 0,
      getContent: (state) => state.unreadCount > 99 ? '99+' : state.unreadCount
    }
  },
  {
    key: 'feedback',
    title: 'Feedback',
    href: (role: UserRole) => `/${role.toLowerCase()}/feedback`,
    icon: MessageSquarePlus,
    roles: [UserRole.ADMIN, UserRole.VOLUNTEER, UserRole.MEMBER]
  }
  // Future features can be added here:
]

/**
 * Map route keys to feature flags for filtering
 */
const ROUTE_FEATURE_MAP: Record<string, keyof FeatureFlags> = {
  'notifications': 'notifications',
  'forums': 'forums',
  'resources': 'resources',
  'chat': 'chat',
}

/**
 * Get feature routes accessible by a specific user role
 * Filtered by both role permissions and feature flags
 */
export function getFeatureRoutesForRole(userRole: UserRole): FeatureRoute[] {
  const { features } = getBrandConfig()

  return FEATURE_ROUTES.filter(route => {
    // Check role permission
    if (!route.roles.includes(userRole)) return false

    // Check feature flag (if mapped)
    const featureKey = ROUTE_FEATURE_MAP[route.key]
    if (featureKey && features[featureKey] === false) return false

    return true
  })
}

/**
 * Get a specific feature route by key
 */
export function getFeatureRoute(key: string): FeatureRoute | undefined {
  return FEATURE_ROUTES.find(route => route.key === key)
}

/**
 * Generate notification route URLs for role permission configuration
 */
export function getNotificationRoutesForRoles(): string[] {
  const notificationRoute = getFeatureRoute('notifications')
  if (!notificationRoute) return []

  return [
    notificationRoute.href(UserRole.ADMIN),
    notificationRoute.href(UserRole.VOLUNTEER),
    notificationRoute.href(UserRole.MEMBER)
  ]
}