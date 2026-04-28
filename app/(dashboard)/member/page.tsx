import { auth } from '@/lib/auth/server-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Heart,
  MessageCircle,
  Calendar,
  Users,
  Mail,
  FileText,
  ArrowRight,
} from 'lucide-react'
import { UserRepository } from '@/lib/db/repositories/user.repository'
import { ConversationRepository } from '@/lib/db/repositories/conversation.repository'
import { NotificationRepository } from '@/lib/db/repositories/notification.repository'
import { MessageRepository } from '@/lib/db/repositories/message.repository'
import { TemplateAssignmentRepository } from '@/lib/db/repositories/template-assignment.repository'
import { AddFamilyMemberButton } from '@/components/families/add-family-member-button'
import { ChatButton } from '@/components/families/chat-button'
import { MemberActionsDropdown } from '@/components/families/member-actions-dropdown'

const userRepository = new UserRepository()
const conversationRepository = new ConversationRepository()
const notificationRepository = new NotificationRepository()
const messageRepository = new MessageRepository()
const templateAssignmentRepository = new TemplateAssignmentRepository()

// Friendly status labels + pill colors for the dashboard HCD tile.
type AssignmentStatus = 'pending' | 'started' | 'completed' | 'finalized'
const STATUS_LABEL: Record<AssignmentStatus, string> = {
  pending: 'Not started',
  started: 'In progress',
  completed: 'Completed',
  finalized: 'Finalized',
}
const STATUS_TONE: Record<AssignmentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  started: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  completed: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
  finalized: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100',
}

export default async function MemberDashboard() {
  const { userId, sessionClaims } = await auth()

  if (!userId) {
    redirect('/sign-in')
  }

  const userRole = (sessionClaims?.metadata as { role?: string })?.role

  console.log('🔍 Member dashboard access check:', {
    userRole,
    userRoleType: typeof userRole,
    note: 'All authenticated users can access member dashboard'
  });

  // Get user data including family information
  const user = await userRepository.getUserByClerkId(userId)
  let familyMembers: Array<{ id: string; firstName: string | null; lastName?: string | null; role: string; email: string }> = []
  let userStats = {
    conversations: 0,
    unreadMessages: 0,
    unreadNotifications: 0,
  }
  let assignments: Array<{
    id: string
    resourceId: string
    resourceTitle: string
    status: AssignmentStatus
  }> = []

  if (user) {
    try {
      // Get family members if user has a family
      if (user?.family) {
        familyMembers = await userRepository.getAllUsers({
          familyId: user.family.id
        })
        console.log('👨‍👩‍👧‍👦 Member dashboard - family data:', {
          userId: user.id,
          familyName: user.family.name,
          memberCount: familyMembers.length
        })
      }

      // Fetch user-specific data
      const [conversations, unreadMessages, notifications, userAssignments] = await Promise.allSettled([
        conversationRepository.getConversationsForUser(user.id),
        messageRepository.getTotalUnreadForUser(user.id),
        notificationRepository.getUnreadCount(user.id),
        templateAssignmentRepository.getAssignmentsForUser(user.id),
      ])

      userStats = {
        conversations: conversations.status === 'fulfilled' ? conversations.value.total : 0,
        unreadMessages: unreadMessages.status === 'fulfilled' ? unreadMessages.value : 0,
        unreadNotifications: notifications.status === 'fulfilled' ? notifications.value : 0,
      }

      if (userAssignments.status === 'fulfilled') {
        assignments = userAssignments.value.map((a) => ({
          id: a.id,
          resourceId: a.resourceId,
          resourceTitle: a.resource?.title || 'Form',
          status: a.status as AssignmentStatus,
        }))
      }

      console.log('📊 Member dashboard stats:', userStats)
    } catch (error) {
      console.error('❌ Error fetching member dashboard data:', error)
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ''}
        </h2>
        <p className="text-muted-foreground">
          Your family support and care resources
        </p>
      </div>

      {/* Quick Info Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Chat Card - Inbox/Unread */}
        <Link href="/member/chat">
          <Card className="border-l-4 border-l-[var(--healthcare-mental)] bg-[hsl(var(--healthcare-mental)/0.05)] hover:bg-[hsl(var(--healthcare-mental)/0.08)] transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Chat</CardTitle>
              <MessageCircle className="h-4 w-4 text-[hsl(var(--healthcare-mental))]" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Chat with your care team, volunteers, or other community members
              </p>
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-2xl font-bold">{userStats.conversations}</div>
                  <p className="text-xs text-muted-foreground">Inbox</p>
                </div>
                <div>
                  <div className="text-2xl font-bold">{userStats.unreadMessages}</div>
                  <p className="text-xs text-muted-foreground">Unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Notifications Card */}
        <Link href="/member/notifications">
          <Card className="border-l-4 border-l-[var(--healthcare-financial)] bg-[hsl(var(--healthcare-financial)/0.05)] hover:bg-[hsl(var(--healthcare-financial)/0.08)] transition-colors cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Notifications</CardTitle>
              <Calendar className="h-4 w-4 text-[hsl(var(--healthcare-financial))]" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                Access important updates, messages and events details
              </p>
              <div>
                <div className="text-2xl font-bold">{userStats.unreadNotifications}</div>
                <p className="text-xs text-muted-foreground">Unread notifications</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {assignments.length > 0 && (
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <span>My Forms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {assignments.map((a) => (
                <Link
                  key={a.id}
                  href={`/member/resources/${a.resourceId}/complete`}
                  className="flex items-center justify-between gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors min-h-[64px]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{a.resourceTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.status === 'completed' || a.status === 'finalized'
                        ? 'Open to review or download'
                        : 'Open to pick up where you left off'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={`${STATUS_TONE[a.status]} text-xs font-medium`}>
                      {STATUS_LABEL[a.status]}
                    </Badge>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div>
        {/* My Family Section */}
        <Card className="border-l-4 border-l-[var(--healthcare-home)] bg-[hsl(var(--healthcare-home)/0.05)] hover:bg-[hsl(var(--healthcare-home)/0.08)] transition-colors">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <Heart className="h-5 w-5 text-[hsl(var(--healthcare-home))]" />
                <span>My Family</span>
              </CardTitle>
              {user?.family && (
                <AddFamilyMemberButton
                  familyId={user.family.id}
                  familyName={user.family.name}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            {user?.family ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">{user.family.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Include those close to you in your profile
                  </p>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-3">Family Members</h4>
                  <div className="space-y-2">
                    {familyMembers.map((member) => (
                      <div key={member.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {member.firstName ?
                              `${member.firstName[0]}${member.lastName?.[0] || ''}` :
                              member.email[0].toUpperCase()
                            }
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">
                            {member.firstName ?
                              `${member.firstName} ${member.lastName || ''}`.trim() :
                              member.email
                            }
                            {member.id === user?.id && (
                              <span className="text-xs text-muted-foreground ml-2">(You)</span>
                            )}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            <span className="truncate">{member.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {member.id !== user?.id && (
                            <ChatButton
                              targetUserId={member.id}
                              targetUserName={member.firstName || member.email}
                            />
                          )}
                          <MemberActionsDropdown
                            memberId={member.id}
                            memberName={member.firstName || member.email}
                            familyId={user.family!.id}
                            isCurrentUser={member.id === user?.id}
                          />
                          <Badge variant={member.role === 'VOLUNTEER' ? 'default' : 'secondary'} className="text-xs">
                            {member.role}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No family assigned</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  You haven&apos;t been assigned to a family group yet. Contact your volunteer coordinator for assistance.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
