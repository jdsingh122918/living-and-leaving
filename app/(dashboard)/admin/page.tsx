import Link from 'next/link'
import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Users,
  UserPlus,
  Building,
  Calendar,
  MessageSquare,
  MessagesSquare,
  Activity,
  TrendingUp,
  FileImage,
  ClipboardCheck,
  QrCode,
  ArrowRight
} from 'lucide-react'
import { UserRepository } from '@/lib/db/repositories/user.repository'
import { FamilyRepository } from '@/lib/db/repositories/family.repository'
import { ForumRepository } from '@/lib/db/repositories/forum.repository'
import { DocumentRepository } from '@/lib/db/repositories/document.repository'
import { TemplateAssignmentRepository } from '@/lib/db/repositories/template-assignment.repository'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@/lib/auth/roles'
import { ResourcesSharedSection } from '@/components/dashboard/resources-shared-section'

export default async function AdminDashboard() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const userRole = (sessionClaims?.metadata as { role?: string })?.role

  console.log('🔍 Admin dashboard access check:', {
    userRole,
    userRoleType: typeof userRole,
    expected: UserRole.ADMIN,
    matches: userRole === UserRole.ADMIN
  });

  // Only admins can access this page
  if (userRole !== UserRole.ADMIN) {
    console.log('❌ Admin access denied, redirecting to sign-in');
    redirect('/sign-in')
  }

  // Fetch dashboard statistics
  const userRepository = new UserRepository()
  const familyRepository = new FamilyRepository()
  const forumRepository = new ForumRepository()
  const documentRepository = new DocumentRepository()
  const templateAssignmentRepository = new TemplateAssignmentRepository()

  // Get admin user from database
  const adminUser = await userRepository.getUserByClerkId(userId)

  const [userStats, familyStats, forumStats, documentStats, sharedResources, readyToFinalizeCount, finalizedCount] = await Promise.all([
    userRepository.getUserStats(),
    familyRepository.getFamilyStats(),
    forumRepository.getForumStats(),
    documentRepository.getDocumentStats(),
    adminUser ? templateAssignmentRepository.getAssignmentsByAssigner(adminUser.id, { limit: 5 }) : Promise.resolve([]),
    prisma.templateAssignment.count({ where: { status: "completed" } }),
    prisma.templateAssignment.count({ where: { status: "finalized" } })
  ])

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Manage users, families, and platform settings
        </p>
      </div>

      {/* User & Family Metrics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <h3 className="text-lg font-medium">User & Family Management</h3>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          <Card className="p-3 border-l-4 border-l-[var(--healthcare-basic)] bg-[hsl(var(--healthcare-basic)/0.05)] hover:bg-[hsl(var(--healthcare-basic)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-[hsl(var(--healthcare-basic))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{userStats.total}</div>
              <p className="text-xs text-muted-foreground">
                All platform users
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-basic)] bg-[hsl(var(--healthcare-basic)/0.05)] hover:bg-[hsl(var(--healthcare-basic)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Volunteers</CardTitle>
              <UserPlus className="h-4 w-4 text-[hsl(var(--healthcare-basic))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{userStats.volunteers}</div>
              <p className="text-xs text-muted-foreground">
                Active volunteers
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-medical)] bg-[hsl(var(--healthcare-medical)/0.05)] hover:bg-[hsl(var(--healthcare-medical)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Families</CardTitle>
              <Building className="h-4 w-4 text-[hsl(var(--healthcare-medical))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{familyStats.total}</div>
              <p className="text-xs text-muted-foreground">
                Families being served
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-basic)] bg-[hsl(var(--healthcare-basic)/0.05)] hover:bg-[hsl(var(--healthcare-basic)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
              <Calendar className="h-4 w-4 text-[hsl(var(--healthcare-basic))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{userStats.members}</div>
              <p className="text-xs text-muted-foreground">
                Community members
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-home)] bg-[hsl(var(--healthcare-home)/0.05)] hover:bg-[hsl(var(--healthcare-home)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileImage className="h-4 w-4 text-[hsl(var(--healthcare-home))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{documentStats.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Uploaded files
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Community Engagement Metrics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <h3 className="text-lg font-medium">Community Engagement</h3>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-3 border-l-4 border-l-[var(--healthcare-mental)] bg-[hsl(var(--healthcare-mental)/0.05)] hover:bg-[hsl(var(--healthcare-mental)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Forums</CardTitle>
              <MessagesSquare className="h-4 w-4 text-[hsl(var(--healthcare-mental))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{forumStats.totalForums}</div>
              <p className="text-xs text-muted-foreground">
                Discussion spaces
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-mental)] bg-[hsl(var(--healthcare-mental)/0.05)] hover:bg-[hsl(var(--healthcare-mental)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Posts</CardTitle>
              <MessageSquare className="h-4 w-4 text-[hsl(var(--healthcare-mental))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{forumStats.totalPosts}</div>
              <p className="text-xs text-muted-foreground">
                Discussion topics
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-mental)] bg-[hsl(var(--healthcare-mental)/0.05)] hover:bg-[hsl(var(--healthcare-mental)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Replies</CardTitle>
              <Activity className="h-4 w-4 text-[hsl(var(--healthcare-mental))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{forumStats.totalReplies}</div>
              <p className="text-xs text-muted-foreground">
                Community responses
              </p>
            </CardContent>
          </Card>

          <Card className="p-3 border-l-4 border-l-[var(--healthcare-mental)] bg-[hsl(var(--healthcare-mental)/0.05)] hover:bg-[hsl(var(--healthcare-mental)/0.08)] transition-colors">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--healthcare-mental))]" />
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="text-2xl font-bold">{forumStats.postsThisMonth}</div>
              <p className="text-xs text-muted-foreground">
                Posts this month
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Advance Directives */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4" />
            <h3 className="text-lg font-medium">Advance Directives</h3>
          </div>
          <Link
            href="/admin/advance-directives"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            Open dashboard
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Link href="/admin/advance-directives" className="block">
            <Card className="p-3 border-l-4 border-l-amber-500 bg-amber-100/70 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ready to Finalize</CardTitle>
                <ClipboardCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{readyToFinalizeCount}</div>
                <p className="text-xs text-muted-foreground">
                  Members waiting for signed PDF and QR packaging
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/advance-directives" className="block">
            <Card className="p-3 border-l-4 border-l-green-600 bg-green-100/70 dark:bg-green-950/40 hover:bg-green-100 dark:hover:bg-green-950/60 transition-colors h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Finalized</CardTitle>
                <QrCode className="h-4 w-4 text-green-600 dark:text-green-400" />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold">{finalizedCount}</div>
                <p className="text-xs text-muted-foreground">
                  Active QR shares
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {/* Resources Shared */}
      <ResourcesSharedSection assignments={sharedResources} role="admin" />
    </div>
  )
}