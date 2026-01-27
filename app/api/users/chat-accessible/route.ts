import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server-auth";
import { UserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { FamilyRepository } from "@/lib/db/repositories/family.repository";
import { ConversationRepository } from "@/lib/db/repositories/conversation.repository";

const userRepository = new UserRepository();
const familyRepository = new FamilyRepository();
const conversationRepository = new ConversationRepository();

// GET /api/users/chat-accessible - Get users that the current member can start conversations with
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user from database
    const currentUser = await userRepository.getUserByClerkId(userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("🔍 Chat-accessible users request:", {
      requestedBy: currentUser.email,
      role: currentUser.role,
      familyId: currentUser.familyId,
    });

    interface UserWithCategory {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
      role: UserRole;
      familyRole?: string;
      phoneNumber?: string;
      emailVerified?: boolean;
      familyId?: string;
      createdAt?: Date;
      category?: string;
    }

    let accessibleUsers: UserWithCategory[] = [];

    if (currentUser.role === UserRole.MEMBER) {
      // For MEMBERS: Can chat with admins, volunteers, and their family members

      // Get admins and volunteers separately (getUserAll expects single role)
      const [adminUsers, volunteerUsers] = await Promise.all([
        userRepository.getAllUsers({ role: UserRole.ADMIN }),
        userRepository.getAllUsers({ role: UserRole.VOLUNTEER })
      ]);

      // Get family members if user is in a family
      let familyMembers: UserWithCategory[] = [];
      if (currentUser.familyId) {
        const family = await familyRepository.getFamilyById(currentUser.familyId);
        if (family?.members) {
          familyMembers = (family.members as unknown as Array<Record<string, unknown>>)
            .filter((member: Record<string, unknown>) => member.id !== currentUser.id)
            .map((member: Record<string, unknown>) => ({
              id: member.id as string,
              email: member.email as string,
              firstName: member.firstName as string | undefined,
              lastName: member.lastName as string | undefined,
              role: member.role as UserRole,
              familyRole: member.familyRole as string | undefined,
              phoneNumber: member.phoneNumber as string | undefined,
              emailVerified: member.emailVerified as boolean | undefined,
              familyId: member.familyId as string | undefined,
              createdAt: member.createdAt as Date | undefined,
              category: 'family',
            }));
        }
      }

      // Combine all accessible users
      accessibleUsers = [
        ...(adminUsers as unknown as Array<Record<string, unknown>>).map((user: Record<string, unknown>) => ({
          id: user.id as string,
          email: user.email as string,
          firstName: user.firstName as string | undefined,
          lastName: user.lastName as string | undefined,
          role: user.role as UserRole,
          familyRole: user.familyRole as string | undefined,
          phoneNumber: user.phoneNumber as string | undefined,
          emailVerified: user.emailVerified as boolean | undefined,
          familyId: user.familyId as string | undefined,
          createdAt: user.createdAt as Date | undefined,
          category: 'admin',
        })),
        ...(volunteerUsers as unknown as Array<Record<string, unknown>>).map((user: Record<string, unknown>) => ({
          id: user.id as string,
          email: user.email as string,
          firstName: user.firstName as string | undefined,
          lastName: user.lastName as string | undefined,
          role: user.role as UserRole,
          familyRole: user.familyRole as string | undefined,
          phoneNumber: user.phoneNumber as string | undefined,
          emailVerified: user.emailVerified as boolean | undefined,
          familyId: user.familyId as string | undefined,
          createdAt: user.createdAt as Date | undefined,
          category: 'volunteer',
        })),
        ...familyMembers
      ];

    } else if (currentUser.role === UserRole.VOLUNTEER) {
      // For VOLUNTEERS: Can chat with users from assigned families + all volunteers + all admins

      // Get families assigned to this volunteer
      const assignedFamilies = await familyRepository.getFamiliesByVolunteer(currentUser.id);

      // Get all members from assigned families
      const familyMembers: UserWithCategory[] = [];
      for (const family of assignedFamilies) {
        if (family.members) {
          for (const member of (family.members as unknown as Array<Record<string, unknown>>)) {
            if (member.id !== currentUser.id) {
              familyMembers.push({
                id: member.id as string,
                email: member.email as string,
                firstName: member.firstName as string | undefined,
                lastName: member.lastName as string | undefined,
                role: member.role as UserRole,
                familyRole: member.familyRole as string | undefined,
                phoneNumber: member.phoneNumber as string | undefined,
                emailVerified: member.emailVerified as boolean | undefined,
                familyId: member.familyId as string | undefined,
                createdAt: member.createdAt as Date | undefined,
                category: 'assigned_family',
              });
            }
          }
        }
      }

      // Get all volunteers and admins
      const [volunteers, admins] = await Promise.all([
        userRepository.getAllUsers({ role: UserRole.VOLUNTEER }),
        userRepository.getAllUsers({ role: UserRole.ADMIN }),
      ]);

      // Combine all accessible users (excluding self)
      const combinedUsers = [
        ...(admins as unknown as Array<Record<string, unknown>>).map((user: Record<string, unknown>) => ({
          id: user.id as string,
          email: user.email as string,
          firstName: user.firstName as string | undefined,
          lastName: user.lastName as string | undefined,
          role: user.role as UserRole,
          familyRole: user.familyRole as string | undefined,
          phoneNumber: user.phoneNumber as string | undefined,
          emailVerified: user.emailVerified as boolean | undefined,
          familyId: user.familyId as string | undefined,
          createdAt: user.createdAt as Date | undefined,
          category: 'admin',
        })),
        ...(volunteers as unknown as Array<Record<string, unknown>>)
          .filter((user: Record<string, unknown>) => user.id !== currentUser.id)
          .map((user: Record<string, unknown>) => ({
            id: user.id as string,
            email: user.email as string,
            firstName: user.firstName as string | undefined,
            lastName: user.lastName as string | undefined,
            role: user.role as UserRole,
            familyRole: user.familyRole as string | undefined,
            phoneNumber: user.phoneNumber as string | undefined,
            emailVerified: user.emailVerified as boolean | undefined,
            familyId: user.familyId as string | undefined,
            createdAt: user.createdAt as Date | undefined,
            category: 'volunteer',
          })),
        ...familyMembers,
      ];

      // Deduplicate by user ID (keep first occurrence)
      const seenIds = new Set<string>();
      accessibleUsers = combinedUsers.filter((user: UserWithCategory) => {
        if (seenIds.has(user.id)) return false;
        seenIds.add(user.id);
        return true;
      });

    } else if (currentUser.role === UserRole.ADMIN) {
      // For ADMINS: Can chat with everyone
      const allUsers = await userRepository.getAllUsers({});
      accessibleUsers = (allUsers as unknown as Array<Record<string, unknown>>)
        .filter((user: Record<string, unknown>) => user.id !== currentUser.id)
        .map((user: Record<string, unknown>) => {
          const userRole = user.role as UserRole;
          return {
            id: user.id as string,
            email: user.email as string,
            firstName: user.firstName as string | undefined,
            lastName: user.lastName as string | undefined,
            role: userRole,
            familyRole: user.familyRole as string | undefined,
            phoneNumber: user.phoneNumber as string | undefined,
            emailVerified: user.emailVerified as boolean | undefined,
            familyId: user.familyId as string | undefined,
            createdAt: user.createdAt as Date | undefined,
            category: userRole === UserRole.ADMIN ? 'admin' : userRole === UserRole.VOLUNTEER ? 'volunteer' : 'member',
          };
        });
    }

    // Get existing DM conversations for this user
    const existingDMs = await conversationRepository.findDirectConversationsForUser(currentUser.id);

    // Format users for chat interface
    const formattedUsers = accessibleUsers.map((user: UserWithCategory) => ({
      id: user.id,
      email: user.email,
      name: user.firstName
        ? `${user.firstName} ${user.lastName || ""}`.trim()
        : user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      familyRole: user.familyRole,
      phoneNumber: user.phoneNumber,
      emailVerified: user.emailVerified,
      familyId: user.familyId,
      category: user.category || 'other', // For UI grouping
      createdAt: user.createdAt,
      existingConversationId: existingDMs.get(user.id) || null, // DM conversation ID if exists
    }));

    console.log("✅ Chat-accessible users retrieved:", {
      totalUsers: formattedUsers.length,
      breakdown: {
        admins: formattedUsers.filter(u => u.category === 'admin').length,
        volunteers: formattedUsers.filter(u => u.category === 'volunteer').length,
        family: formattedUsers.filter(u => u.category === 'family').length,
        assigned_family: formattedUsers.filter(u => u.category === 'assigned_family').length,
        members: formattedUsers.filter(u => u.category === 'member').length,
        others: formattedUsers.filter(u => u.category === 'other').length,
      },
      sampleUsers: formattedUsers.slice(0, 3).map(u => ({
        name: u.name,
        email: u.email,
        role: u.role,
        category: u.category
      }))
    });

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      total: formattedUsers.length,
      currentUserRole: currentUser.role,
      message: `Found ${formattedUsers.length} users you can chat with`,
    });

  } catch (error) {
    console.error("❌ Error fetching chat-accessible users:", error);

    return NextResponse.json(
      { error: "Failed to fetch chat-accessible users" },
      { status: 500 }
    );
  }
}
