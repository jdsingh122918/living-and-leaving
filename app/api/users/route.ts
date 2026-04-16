import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@/lib/auth/server-auth";
import { z } from "zod";
import { UserRole } from "@prisma/client";
import { UserRole as AppUserRole } from "@/lib/auth/roles";
import { UserRepository } from "@/lib/db/repositories/user.repository";
import { FamilyRepository } from "@/lib/db/repositories/family.repository";
import type { UserFilters, ClerkError } from "@/lib/types/api";
import brandConfig from "@/brand.config";

const userRepository = new UserRepository();
const familyRepository = new FamilyRepository();

// Validation schema for creating a user
const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .optional(),
  lastName: z
    .string()
    .max(50, "Last name must be less than 50 characters")
    .optional(),
  role: z.enum(["ADMIN", "VOLUNTEER", "MEMBER"], {
    message: "Role must be ADMIN, VOLUNTEER, or MEMBER",
  }),
  familyId: z.string().optional(),
});

// GET /api/users - List users with filtering
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to check role
    const user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only ADMIN and VOLUNTEER can view users
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.VOLUNTEER) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    console.log("👥 GET /api/users - User:", {
      role: user.role,
      email: user.email,
    });

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const familyId = searchParams.get("familyId");
    const search = searchParams.get("search");
    const withoutFamily = searchParams.get("withoutFamily") === "true";

    // Build filters object
    const filters: UserFilters = {};

    if (role && ["ADMIN", "VOLUNTEER", "MEMBER"].includes(role)) {
      filters.role = role as UserRole;
    }

    if (familyId) {
      filters.familyId = familyId;
    }

    // Note: withoutFamily flag will be handled after fetching users

    // If volunteer, only show users they can manage
    if (user.role === UserRole.VOLUNTEER) {
      // Volunteers can only see MEMBER users and their own profile
      if (!role || role === "MEMBER") {
        filters.role = UserRole.MEMBER;
      } else if (role === "VOLUNTEER" || role === "ADMIN") {
        // Volunteers can't see other volunteers or admins (except in some contexts)
        // For now, allow but could be restricted
      }
    }

    console.log("🔍 User filters applied:", { filters, search });

    // Convert filters to use AppUserRole
    const repoFilters = {
      ...filters,
      role: filters.role as AppUserRole | undefined,
    };

    // Get users from database
    let users = await userRepository.getAllUsers(repoFilters);

    // VOLUNTEER family-scoped filtering: only show users from families they're assigned to
    if (user.role === UserRole.VOLUNTEER) {
      // Get families that this volunteer is assigned to (supports multiple assignments)
      const volunteerFamilies = await familyRepository.getFamiliesByVolunteer(user.id);
      const accessibleFamilyIds = volunteerFamilies.map(f => f.id);

      console.log("🔒 VOLUNTEER family filtering:", {
        volunteerId: user.id,
        accessibleFamilyIds,
        totalUsersBeforeFilter: users.length
      });

      // Filter users to only include those from accessible families
      users = users.filter((u) => {
        if (!u.familyId) return false; // Volunteers can't see users without families
        return accessibleFamilyIds.includes(u.familyId);
      });

      console.log("🔒 VOLUNTEER family filtering applied:", {
        usersAfterFilter: users.length
      });
    }

    // Filter users without family if requested
    if (withoutFamily) {
      users = users.filter((u) => !u.familyId);
    }

    // Apply search filter if provided
    if (search && users.length > 0) {
      const searchLower = search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(searchLower) ||
          (u.firstName && u.firstName.toLowerCase().includes(searchLower)) ||
          (u.lastName && u.lastName.toLowerCase().includes(searchLower)),
      );
    }

    console.log("✅ Users retrieved:", { count: users.length, filters });

    // For volunteers without a direct familyId, look up their family assignments
    const volunteerIds = users
      .filter((u) => u.role === "VOLUNTEER" && !u.familyId)
      .map((u) => u.id);

    const volunteerFamilyMap = new Map<string, { id: string; name: string }>();
    if (volunteerIds.length > 0) {
      for (const vid of volunteerIds) {
        const families = await familyRepository.getFamiliesByVolunteer(vid);
        if (families.length > 0) {
          volunteerFamilyMap.set(vid, {
            id: families[0].id,
            name: families[0].name,
          });
        }
      }
    }

    // Format response
    const formattedUsers = users.map((u) => {
      // Use direct family relation, or fall back to volunteer assignment
      const family = u.family
        ? { id: u.family.id, name: u.family.name }
        : volunteerFamilyMap.get(u.id) || null;

      return {
        id: u.id,
        clerkId: u.clerkId,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        name: u.firstName
          ? `${u.firstName} ${u.lastName || ""}`.trim()
          : u.email,
        role: u.role,
        familyId: u.familyId,
        family,
        phoneNumber: u.phoneNumber,
        phoneVerified: u.phoneVerified,
        emailVerified: u.emailVerified,
        createdAt: u.createdAt,
        createdBy: u.createdBy
          ? {
              id: u.createdBy.id,
              name: u.createdBy.firstName
                ? `${u.createdBy.firstName} ${u.createdBy.lastName || ""}`.trim()
                : u.createdBy.email,
            }
          : null,
      };
    });

    return NextResponse.json({
      users: formattedUsers,
      total: formattedUsers.length,
      filters: {
        role: role || null,
        familyId: familyId || null,
        search: search || null,
        withoutFamily,
      },
    });
  } catch (error) {
    console.error("❌ Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

// POST /api/users - Create new user with Clerk invitation
export async function POST(request: NextRequest) {
  // Declare variables at function scope for access in catch block (auto-recovery)
  let validatedData: z.infer<typeof createUserSchema> | null = null;
  let user: Awaited<ReturnType<typeof userRepository.getUserByClerkId>> = null;

  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user from database to check role
    user = await userRepository.getUserByClerkId(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permissions based on role
    const body = await request.json();
    validatedData = createUserSchema.parse(body);

    // Role-based creation permissions
    if (user.role === UserRole.VOLUNTEER) {
      // Volunteers can only create MEMBER users
      if (validatedData.role !== "MEMBER") {
        return NextResponse.json(
          {
            error: "Volunteers can only create MEMBER users",
          },
          { status: 403 },
        );
      }
    } else if (user.role !== UserRole.ADMIN) {
      // Only ADMIN and VOLUNTEER can create users
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 },
      );
    }

    console.log("👤 Creating user:", {
      email: validatedData.email,
      role: validatedData.role,
      createdBy: user.email,
    });

    // Check if email already exists in our database
    const existingUser = await userRepository.getUserByEmail(
      validatedData.email,
    );
    if (existingUser) {
      return NextResponse.json(
        {
          error: "User with this email already exists",
        },
        { status: 400 },
      );
    }

    // Create a Clerk invitation. Clerk emails a sign-up link to the address
    // automatically. When the invite is accepted, the user.created webhook
    // fires — and updateClerkIdByEmail will rebind the placeholder row below
    // to the real Clerk user id.
    const client = await clerkClient();
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL || `https://${brandConfig.domain}`;
    const invitation = await client.invitations.createInvitation({
      emailAddress: validatedData.email,
      publicMetadata: {
        role: validatedData.role,
      },
      redirectUrl: `${appUrl}/sign-up`,
      notify: true,
      ignoreExisting: false,
    });

    console.log("✅ Clerk invitation sent:", {
      invitationId: invitation.id,
      email: invitation.emailAddress,
    });

    // Create user in our database with the invitation id as a placeholder
    // clerkId. The webhook rebinds this on invite acceptance.
    const dbUser = await userRepository.createUser({
      clerkId: invitation.id,
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      role: validatedData.role as AppUserRole,
      familyId: validatedData.familyId,
      createdById: user.id,
    });

    console.log("✅ User created in database:", { userId: dbUser.id });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: dbUser.id,
          clerkId: dbUser.clerkId,
          email: dbUser.email,
          firstName: dbUser.firstName,
          lastName: dbUser.lastName,
          name: dbUser.firstName
            ? `${dbUser.firstName} ${dbUser.lastName || ""}`.trim()
            : dbUser.email,
          role: dbUser.role,
          familyId: dbUser.familyId,
          createdAt: dbUser.createdAt,
        },
        message:
          "Invitation sent. They will receive an email with a link to set up their account.",
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("❌ Error creating user:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.issues.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        },
        { status: 400 },
      );
    }

    // Handle Clerk-specific errors with auto-recovery
    if (error && typeof error === "object" && "errors" in error) {
      const clerkError = error as ClerkError;
      if (clerkError.errors?.[0]?.code === "form_identifier_exists" && validatedData && user) {
        // AUTO-RECOVERY: Sync existing Clerk user to database
        console.log("🔄 User exists in Clerk, attempting auto-sync...");

        try {
          // Fetch existing user from Clerk by email
          const client = await clerkClient();
          const clerkUsers = await client.users.getUserList({
            emailAddress: [validatedData.email],
          });

          if (clerkUsers.data.length > 0) {
            const existingClerkUser = clerkUsers.data[0];

            // Check if already in database by clerkId
            const existingDbUser = await userRepository.getUserByClerkId(
              existingClerkUser.id,
            );
            if (existingDbUser) {
              return NextResponse.json(
                { error: "User already exists in the system" },
                { status: 400 },
              );
            }

            // Create database record from Clerk data
            const dbUser = await userRepository.createUser({
              clerkId: existingClerkUser.id,
              email: validatedData.email,
              firstName: validatedData.firstName || existingClerkUser.firstName || undefined,
              lastName: validatedData.lastName || existingClerkUser.lastName || undefined,
              role: validatedData.role as AppUserRole,
              familyId: validatedData.familyId,
              createdById: user.id,
            });

            console.log("✅ User synced from Clerk to database:", {
              userId: dbUser.id,
            });

            return NextResponse.json(
              {
                success: true,
                synced: true,
                user: {
                  id: dbUser.id,
                  clerkId: dbUser.clerkId,
                  email: dbUser.email,
                  firstName: dbUser.firstName,
                  lastName: dbUser.lastName,
                  name: dbUser.firstName
                    ? `${dbUser.firstName} ${dbUser.lastName || ""}`.trim()
                    : dbUser.email,
                  role: dbUser.role,
                  familyId: dbUser.familyId,
                  createdAt: dbUser.createdAt,
                },
                message:
                  "Existing Clerk user synced to database successfully.",
              },
              { status: 201 },
            );
          }
        } catch (syncError) {
          console.error("❌ Auto-sync failed:", syncError);
        }

        // Fallback to original error if sync fails
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 },
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
