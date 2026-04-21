import { prisma } from "@/lib/db/prisma";
import { User, CreateUserInput, Family, FamilyRole } from "@/lib/types";
import { UserRole } from "@/lib/auth/roles";
import { Prisma } from "@prisma/client";
import {
  ANONYMOUS_USER_CLERK_ID,
  ANONYMOUS_USER_EMAIL,
  SOFT_DELETE_GRACE_DAYS,
} from "@/lib/db/constants";

export class UserRepository {
  /**
   * Create a new user in the database
   */
  async createUser(data: CreateUserInput): Promise<User> {
    const user = await prisma.user.create({
      data: {
        clerkId: data.clerkId,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role,
        familyId: data.familyId || null,
        createdById: data.createdById || null,
        phoneNumber: data.phoneNumber || null,
        emailVerified: true, // Since they verified email to sign up
      },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.transformPrismaUser(user);
  }

  /**
   * Rebind an existing DB user (matched by email) to a new clerkId.
   *
   * Used when a user was invited (DB row holds the invitation id as a
   * placeholder clerkId), and the real Clerk user has now been created —
   * or when a Clerk user is deleted and recreated with the same email.
   *
   * Transactional: re-verifies the match inside the transaction to avoid
   * racing with a concurrent webhook creating a second row.
   */
  async updateClerkIdByEmail(
    email: string,
    newClerkId: string,
  ): Promise<User | null> {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({ where: { email } });
      if (!existing) return null;
      if (existing.clerkId === newClerkId) {
        return this.transformPrismaUser(existing);
      }
      const updated = await tx.user.update({
        where: { id: existing.id },
        data: { clerkId: newClerkId, emailVerified: true },
        include: {
          family: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });
      return this.transformPrismaUser(updated);
    });
  }

  /**
   * Create or update a user by clerkId (atomic operation to prevent race conditions)
   * This is the preferred method for user sync operations.
   */
  async upsertUser(data: CreateUserInput): Promise<{ user: User; created: boolean }> {
    // First check if user exists to determine if this is a create or update
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: data.clerkId },
    });

    const user = await prisma.user.upsert({
      where: { clerkId: data.clerkId },
      update: {
        // Only update fields that should be synced from Clerk
        email: data.email,
        firstName: data.firstName || undefined,
        lastName: data.lastName || undefined,
        // Note: We don't update role, familyId, etc. as those are managed locally
      },
      create: {
        clerkId: data.clerkId,
        email: data.email,
        firstName: data.firstName || null,
        lastName: data.lastName || null,
        role: data.role,
        familyId: data.familyId || null,
        createdById: data.createdById || null,
        phoneNumber: data.phoneNumber || null,
        emailVerified: true,
      },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return {
      user: this.transformPrismaUser(user),
      created: !existingUser,
    };
  }

  /**
   * Find user by Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { clerkId },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return user ? this.transformPrismaUser(user) : null;
  }

  /**
   * Find user by database ID
   */
  async getUserById(id: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return user ? this.transformPrismaUser(user) : null;
  }

  /**
   * Find multiple users by their database IDs (batch query)
   */
  async getUsersByIds(ids: string[]): Promise<Map<string, User>> {
    try {
      if (ids.length === 0) {
        return new Map();
      }

      // Single query to get all users
      const users = await prisma.user.findMany({
        where: { id: { in: ids } },
        include: {
          family: true,
          createdBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
      });

      // Convert to Map for O(1) lookup
      const userMap = new Map<string, User>();
      for (const user of users) {
        userMap.set(user.id, this.transformPrismaUser(user));
      }

      return userMap;
    } catch (error) {
      console.error("Error fetching users by IDs:", error);
      return new Map();
    }
  }

  /**
   * Get users by IDs as an array (maintaining order)
   */
  async getUsersByIdsArray(ids: string[]): Promise<(User | null)[]> {
    const userMap = await this.getUsersByIds(ids);
    return ids.map((id) => userMap.get(id) || null);
  }

  /**
   * Find user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return user ? this.transformPrismaUser(user) : null;
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: UserRole): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { role },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.transformPrismaUser(user);
  }

  /**
   * Update user
   */
  async updateUser(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phoneNumber?: string | null;
      role?: UserRole;
      familyId?: string | null;
      familyRole?: string | null;
    }
  ): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName || null }),
        ...(data.lastName !== undefined && { lastName: data.lastName || null }),
        ...(data.phoneNumber !== undefined && { phoneNumber: data.phoneNumber || null }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.familyId !== undefined && { familyId: data.familyId || null }),
        ...(data.familyRole !== undefined && { familyRole: data.familyRole || null }),
      } as Prisma.UserUpdateInput,
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.transformPrismaUser(user);
  }

  /**
   * Get users by role
   */
  async getUsersByRole(role: UserRole): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { role },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map(this.transformPrismaUser);
  }

  /**
   * Assign family to user
   */
  async assignFamily(userId: string, familyId: string): Promise<User> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { familyId },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.transformPrismaUser(user);
  }

  /**
   * Get all users with optional filters.
   *
   * Excludes soft-deleted users and the anonymous content-placeholder by
   * default. Pass `includeDeleted: true` to include soft-deleted rows.
   */
  async getAllUsers(filters?: {
    role?: UserRole;
    familyId?: string;
    createdById?: string;
    includeDeleted?: boolean;
  }): Promise<User[]> {
    const where: Record<string, unknown> = {
      clerkId: { not: ANONYMOUS_USER_CLERK_ID },
    };

    if (!filters?.includeDeleted) {
      // Mongo: match docs missing `deletedAt` (pre-PR2) and restored docs (null)
      where.OR = [{ deletedAt: null }, { deletedAt: { isSet: false } }];
    }

    if (filters?.role) {
      where.role = filters.role;
    }

    if (filters?.familyId) {
      where.familyId = filters.familyId;
    }

    if (filters?.createdById) {
      where.createdById = filters.createdById;
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map(this.transformPrismaUser);
  }

  /**
   * List soft-deleted users with their deletion metadata.
   * Used by the admin "Deleted" tab.
   */
  async getSoftDeletedUsers(): Promise<
    Array<
      User & {
        deletedAt: Date;
        deletionReason: string | null;
        scheduledPermanentDeletionAt: Date | null;
      }
    >
  > {
    const users = await prisma.user.findMany({
      where: {
        deletedAt: { not: null },
        clerkId: { not: ANONYMOUS_USER_CLERK_ID },
      },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    return users.map((u) => ({
      ...this.transformPrismaUser(u),
      deletedAt: u.deletedAt!,
      deletionReason: u.deletionReason,
      scheduledPermanentDeletionAt: u.scheduledPermanentDeletionAt,
    }));
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    total: number;
    admins: number;
    volunteers: number;
    members: number;
  }> {
    const [total, admins, volunteers, members] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: UserRole.ADMIN } }),
      prisma.user.count({ where: { role: UserRole.VOLUNTEER } }),
      prisma.user.count({ where: { role: UserRole.MEMBER } }),
    ]);

    return { total, admins, volunteers, members };
  }

  /**
   * Soft-delete a user. Content they created is preserved; they can be
   * restored any time before `scheduledPermanentDeletionAt`.
   */
  async softDeleteUser(
    userId: string,
    options: { deletedByUserId: string; reason?: string } = {
      deletedByUserId: "",
    },
  ): Promise<User> {
    const graceEnd = new Date();
    graceEnd.setDate(graceEnd.getDate() + SOFT_DELETE_GRACE_DAYS);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        deletionReason: options.reason || null,
        scheduledPermanentDeletionAt: graceEnd,
        deletedByUserId: options.deletedByUserId || null,
      },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });

    return this.transformPrismaUser(updated);
  }

  /**
   * Restore a soft-deleted user. Clears the deletion metadata.
   */
  async restoreUser(userId: string): Promise<User> {
    const restored = await prisma.user.update({
      where: { id: userId },
      data: {
        deletedAt: null,
        deletionReason: null,
        scheduledPermanentDeletionAt: null,
        deletedByUserId: null,
      },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
    return this.transformPrismaUser(restored);
  }

  /**
   * Find or create the anonymous placeholder user. Content belonging to
   * permanently-deleted users is reassigned to this placeholder so FK
   * constraints don't block deletion.
   */
  async getOrCreateDeletedUserPlaceholder(): Promise<User> {
    const existing = await prisma.user.findUnique({
      where: { clerkId: ANONYMOUS_USER_CLERK_ID },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
    if (existing) return this.transformPrismaUser(existing);

    const created = await prisma.user.create({
      data: {
        clerkId: ANONYMOUS_USER_CLERK_ID,
        email: ANONYMOUS_USER_EMAIL,
        firstName: "Former",
        lastName: "Member",
        role: UserRole.MEMBER,
        emailVerified: true,
      },
      include: {
        family: true,
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
          },
        },
      },
    });
    return this.transformPrismaUser(created);
  }

  /**
   * Hard-delete a user row after the grace window.
   * Callers are responsible for reassigning any owned content to the
   * anonymous placeholder before invoking this.
   */
  async permanentlyDeleteUser(userId: string): Promise<void> {
    await prisma.user.delete({ where: { id: userId } });
  }

  /**
   * Legacy hard-delete method kept for backwards compatibility with the
   * Clerk user.deleted webhook. New admin-initiated deletes go through
   * softDeleteUser instead.
   */
  async deleteUser(userId: string): Promise<void> {
    await prisma.user.delete({
      where: { id: userId },
    });
  }

  /**
   * Transform Prisma user object to application User type
   */
  private transformPrismaUser(prismaUser: {
    id: string;
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    familyId: string | null;
    familyRole: string | null;
    createdById: string | null;
    phoneNumber: string | null;
    phoneVerified: boolean;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date | null;
    deletionReason?: string | null;
    scheduledPermanentDeletionAt?: Date | null;
    deletedByUserId?: string | null;
    family?: {
      id: string;
      name: string;
      description: string | null;
      createdById: string;
      primaryContactId: string | null;
      createdAt: Date;
      updatedAt: Date;
    } | null;
    createdBy?: {
      id: string;
      email: string;
      firstName: string | null;
      lastName: string | null;
      role: string;
    } | null;
  }): User {
    return {
      id: prismaUser.id,
      clerkId: prismaUser.clerkId,
      email: prismaUser.email,
      firstName: prismaUser.firstName,
      lastName: prismaUser.lastName,
      role: prismaUser.role as UserRole,
      familyId: prismaUser.familyId,
      familyRole: (prismaUser.familyRole as FamilyRole) || null,
      createdById: prismaUser.createdById,
      phoneNumber: prismaUser.phoneNumber,
      phoneVerified: prismaUser.phoneVerified,
      emailVerified: prismaUser.emailVerified,
      createdAt: prismaUser.createdAt,
      updatedAt: prismaUser.updatedAt,
      deletedAt: prismaUser.deletedAt ?? null,
      deletionReason: prismaUser.deletionReason ?? null,
      scheduledPermanentDeletionAt: prismaUser.scheduledPermanentDeletionAt ?? null,
      deletedByUserId: prismaUser.deletedByUserId ?? null,
      family: prismaUser.family
        ? ({
            id: prismaUser.family.id,
            name: prismaUser.family.name,
            description: prismaUser.family.description,
            createdById: prismaUser.family.createdById,
            primaryContactId: prismaUser.family.primaryContactId,
            createdAt: prismaUser.family.createdAt,
            updatedAt: prismaUser.family.updatedAt,
          } as Family)
        : null,
      createdBy: prismaUser.createdBy
        ? ({
            id: prismaUser.createdBy.id,
            clerkId: "", // Not included in selection for privacy
            email: prismaUser.createdBy.email,
            firstName: prismaUser.createdBy.firstName,
            lastName: prismaUser.createdBy.lastName,
            role: prismaUser.createdBy.role as UserRole,
            familyId: null,
            familyRole: null,
            createdById: null,
            phoneNumber: null,
            phoneVerified: false,
            emailVerified: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        : null,
    };
  }
}
