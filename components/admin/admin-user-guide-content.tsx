/* eslint-disable react/no-unescaped-entities */
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Home,
  Users,
  UsersRound,
  FolderOpen,
  MessageCircle,
  Bell,
  Settings,
  BookOpen,
  FileText,
  Shield,
  HelpCircle,
  CheckCircle2,
  MessageSquarePlus,
  ClipboardList,
  Download,
  LifeBuoy,
} from 'lucide-react'
import {
  GuideSection,
  NavigationButtons,
  WorkflowStep,
  TipBox,
  NoteBox,
  createDownloadHandler,
} from '@/components/shared/user-guide-helpers'

const handleDownloadGuide = createDownloadHandler(
  '/api/admin/guide/download',
  'Living_and_Leaving_Administrator_Guide.pdf'
)

export function AdminUserGuideContent(): React.ReactNode {
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Home,
      description: 'Sign in and admin basics',
      content: <GettingStartedSection />,
    },
    {
      id: 'dashboard',
      title: 'Admin Dashboard',
      icon: Home,
      description: 'Your home page at a glance',
      content: <DashboardSection />,
    },
    {
      id: 'users',
      title: 'Managing Users',
      icon: Users,
      description: 'Invite, edit, soft-delete, and restore',
      content: <UsersSection />,
    },
    {
      id: 'families',
      title: 'Families',
      icon: UsersRound,
      description: 'Group members into family records',
      content: <FamiliesSection />,
    },
    {
      id: 'resources',
      title: 'Resources & Templates',
      icon: FolderOpen,
      description: 'Curate documents and assign forms',
      content: <ResourcesSection />,
    },
    {
      id: 'template-assignments',
      title: 'Template Assignments',
      icon: ClipboardList,
      description: 'Assign forms to members and track progress',
      content: <TemplateAssignmentsSection />,
    },
    {
      id: 'helping-members',
      title: 'Helping a Member',
      icon: LifeBuoy,
      description: "Review, download, and email a member's HCD",
      content: <HelpingMembersSection />,
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: MessageCircle,
      description: 'Message members and family groups',
      content: <ChatSection />,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Activity alerts and badges',
      content: <NotificationsSection />,
    },
    {
      id: 'feedback',
      title: 'Reviewing Feedback',
      icon: MessageSquarePlus,
      description: 'Read and triage member feedback',
      content: <FeedbackSection />,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      description: 'Profile and notification preferences',
      content: <SettingsSection />,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'How member data is protected',
      content: <PrivacySection />,
    },
    {
      id: 'support',
      title: 'Getting Help',
      icon: HelpCircle,
      description: 'Reach the platform team',
      content: <SupportSection />,
    },
  ]

  const currentSection = guideSections.find(s => s.id === activeSection) || guideSections[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Administrator Guide</h1>
          <p className="text-muted-foreground">
            Everything you need to administer Living &amp; Leaving for your members
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleDownloadGuide}>
          <Download className="h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit lg:sticky lg:top-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Contents
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-300px)] lg:h-auto">
              <nav className="space-y-1 p-3 pt-0">
                {guideSections.map((section) => {
                  const Icon = section.icon
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-sm transition-colors min-h-[44px] ${
                        activeSection === section.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{section.title}</span>
                    </button>
                  )
                })}
              </nav>
            </ScrollArea>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <currentSection.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl">{currentSection.title}</CardTitle>
                  <CardDescription>{currentSection.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {currentSection.content}
            </CardContent>
          </Card>

          <NavigationButtons
            sections={guideSections}
            activeSection={activeSection}
            onNavigate={setActiveSection}
          />
        </div>
      </div>
    </div>
  )
}

function GettingStartedSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        As an administrator on Living &amp; Leaving you set up members, manage their families, assign documents to complete, and review feedback. This guide walks through every feature you'll use day to day.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Your First Day</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Sign In" description="Sign in with your email. We send a 6-digit verification code — no password needed." />
          <WorkflowStep number={2} title="Review Existing Users" description="Open Users in the sidebar to see everyone who has access to your instance." />
          <WorkflowStep number={3} title="Create Family Records" description="Group related members into a family so they can share documents and chat together." />
          <WorkflowStep number={4} title="Invite Members" description="Send invitations to the people you want to onboard. They'll receive an email with sign-in instructions." />
          <WorkflowStep number={5} title="Assign Templates" description="Send healthcare directive forms to specific members and track their progress." />
        </div>
      </div>

      <TipBox>Verification codes expire after a few minutes. If you sign in from a new device, you may need to request a fresh code.</TipBox>
    </div>
  )
}

function DashboardSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Your admin dashboard surfaces what needs your attention: pending assignments, unread messages, and recent activity across your members.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Sections of the Dashboard</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="welcome">
            <AccordionTrigger>Welcome Header</AccordionTrigger>
            <AccordionContent>Confirms you're signed in as an administrator.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="counters">
            <AccordionTrigger>Activity Counters</AccordionTrigger>
            <AccordionContent>Quick counts of unread messages and notifications, with click-through to the full list.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="recent">
            <AccordionTrigger>Recent Activity</AccordionTrigger>
            <AccordionContent>A feed of the most recent member activity — completed forms, new messages, etc.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

function UsersSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        The Users page is where you invite new people, change roles, soft-delete inactive accounts, and restore deleted users within the grace period.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Inviting a New User</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Users from the sidebar" description="The people-icon link." />
          <WorkflowStep number={2} title="Click Invite User" description="A form appears asking for email, name, and role." />
          <WorkflowStep number={3} title="Choose a role" description="Member is the default. Use Volunteer or Administrator only when intentional." />
          <WorkflowStep number={4} title="Optionally assign a family" description="If they're joining an existing family group, assign it now to skip a step later." />
          <WorkflowStep number={5} title="Send the invitation" description="They receive an email with a link to sign in. The link is single-use." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Soft-Delete and Restore</h3>
        <p className="text-sm text-muted-foreground">When you delete a user, they don't disappear instantly. Their record is hidden from member-facing lists but stays recoverable for 30 days.</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click the menu next to a user and choose <strong>Delete</strong>. You'll be asked for an optional reason.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>To see deleted users, switch to the <strong>Deleted</strong> tab.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click <strong>Restore</strong> to bring a deleted user back. Their content (chat history, completed forms) is preserved.</span></li>
        </ul>
      </div>

      <NoteBox>Content created by a deleted user — chat messages, form responses — is preserved even after permanent deletion. It's reattributed to a placeholder account so historical context stays intact.</NoteBox>
    </div>
  )
}

function FamiliesSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Families let you group related members so they can share documents, see each other in conversations, and coordinate on healthcare decisions.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Creating a Family</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Families from the sidebar" description="The group-of-people icon." />
          <WorkflowStep number={2} title="Click Create Family" description="Give the family a name (usually the surname)." />
          <WorkflowStep number={3} title="Add members" description="Search and select existing users, or invite new ones directly into the family." />
          <WorkflowStep number={4} title="Designate a Family Admin" description="One member can be marked as Family Admin — they can manage other members of their family." />
        </div>
      </div>

      <TipBox>If a family member needs help completing their healthcare directive, you can complete it on their behalf from the Resources page.</TipBox>
    </div>
  )
}

function ResourcesSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Resources is your library of documents, templates, and forms — the content you make available to members.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Resource Types</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Templates</strong> are fillable forms members can complete (the Healthcare Directive is the most-used template).</span></li>
          <li className="flex items-start gap-2"><FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Documents</strong> are static files — PDFs, guides, references — that members can read.</span></li>
        </ul>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Managing Resources</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click any resource to see who's been assigned it and their completion status.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Use the <strong>Assigned Members</strong> view to see progress at a glance and follow up with members who haven't started.</span></li>
        </ul>
      </div>
    </div>
  )
}

function TemplateAssignmentsSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Template assignments let you formally hand a form to a specific member, then track their progress until it's complete.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Assigning a Template</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open the resource" description="From Resources, click the template you want to assign." />
          <WorkflowStep number={2} title="Click Assign Members" description="A picker appears showing all eligible members." />
          <WorkflowStep number={3} title="Select one or more members" description="You can search by name, email, or family." />
          <WorkflowStep number={4} title="Confirm" description="Each member receives an email notification that they have a new form to complete." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Tracking Progress</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><Badge variant="outline">Pending</Badge><span>Member hasn't opened the form yet.</span></li>
          <li className="flex items-start gap-2"><Badge variant="outline">Started</Badge><span>Member opened the form and saved at least once.</span></li>
          <li className="flex items-start gap-2"><Badge variant="outline">Completed</Badge><span>Member submitted the finished form.</span></li>
        </ul>
      </div>

      <NoteBox>If a member needs help, you can also complete a form on their behalf — open the template, choose the member, and fill it out together.</NoteBox>
    </div>
  )
}

function HelpingMembersSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Some members need help with their healthcare directive — they may not be comfortable online, need a family member to help, or simply want to review what they&apos;ve entered in a format they can read offline. As administrator, you can pull up a member&apos;s form, download it as a PDF, and email it to them (or anyone they choose).
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Pulling Up a Member&apos;s Form</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Resources from the sidebar" description="Click the Healthcare Directive (or any template you want to review)." />
          <WorkflowStep number={2} title="Scroll to the Assigned Members list" description="You'll see every member the template has been assigned to, with their progress status." />
          <WorkflowStep number={3} title="Click the member's name" description="You'll land on their form with their answers pre-filled. You can review each section." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Downloading Their PDF</h3>
        <p className="text-sm text-muted-foreground">
          At the top right of the member&apos;s form page you&apos;ll see a <strong>Download PDF</strong> dropdown. Pick the signing variant (with two witnesses, with notary, or both) and a PDF generates with whatever the member has entered so far. This works even if the form is only partially filled — useful if you want to review a draft with them.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Emailing Their PDF to Them</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Click Share via Email" description="Opens a dialog for composing the email." />
          <WorkflowStep number={2} title="Add the recipient" description="Usually the member's own email — so they can open the PDF on their device. You can add up to 5 recipients (member, spouse, attorney, etc.)." />
          <WorkflowStep number={3} title="Choose the signing variant" description="Match the variant to the state of signing: two witnesses, notary, or both." />
          <WorkflowStep number={4} title="Add an optional subject and message" description="A short note explaining what the PDF is and any next steps." />
          <WorkflowStep number={5} title="Send" description="The member receives an email with the PDF attached. They can print, review, and get back to you." />
        </div>
      </div>

      <TipBox>
        The PDF reflects whatever the member has entered at the moment you click Download or Share. If they want to see a &quot;current draft&quot; after you&apos;ve added new information together, save the form first — then re-download.
      </TipBox>

      <NoteBox>
        The email is labeled as coming from the member (not from you) so recipients see it in context. The member&apos;s email address appears as the sender identity in the PDF metadata.
      </NoteBox>
    </div>
  )
}

function ChatSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Chat is your direct line to members and family groups. Conversations are private to participants.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Starting a Conversation</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Chat from the sidebar" description="The chat bubble icon." />
          <WorkflowStep number={2} title="Click New Conversation" description="Choose between a direct message or a family group." />
          <WorkflowStep number={3} title="Select recipient(s)" description="Search by name or email." />
          <WorkflowStep number={4} title="Send your first message" description="The recipient gets a notification and an email if they haven't seen the message in a while." />
        </div>
      </div>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Notifications surface activity that may need your attention: new feedback, completed forms, family events, and chat messages.
      </p>

      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>The bell icon in the sidebar shows the number of unread notifications.</span></li>
        <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Open Notifications to see the full list and click any item to jump to its source.</span></li>
        <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Notifications are automatically marked as read after viewing.</span></li>
      </ul>
    </div>
  )
}

function FeedbackSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        The Feedback page collects suggestions, bug reports, and questions from your members. Reviewing it regularly is one of the best ways to know what's working and what isn't.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Reviewing Feedback</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Open <strong>Feedback</strong> from the sidebar.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Each item shows the member's name (unless submitted anonymously), title, description, and any attachments.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Feedback is also emailed to the platform team when submitted.</span></li>
        </ul>
      </div>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Settings is where you update your own profile, change display preferences, and manage notification preferences.
      </p>

      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span><strong>Profile:</strong> Update your name and contact information.</span></li>
        <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span><strong>Theme:</strong> Switch between light and dark mode.</span></li>
        <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span><strong>Notification preferences:</strong> Control which events trigger notifications and emails.</span></li>
      </ul>
    </div>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Member data is sensitive — much of it is healthcare-adjacent — and the platform is designed accordingly.
      </p>

      <ul className="space-y-2 text-sm">
        <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Encrypted storage and transit.</strong> All member documents and messages are encrypted at rest and over the wire.</span></li>
        <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Role-based access.</strong> Members see only their own data; you see your members' data.</span></li>
        <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Audit logs.</strong> Significant administrative actions are logged for accountability.</span></li>
        <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Soft-delete.</strong> User deletion has a 30-day grace window during which a record can be restored without losing content.</span></li>
      </ul>
    </div>
  )
}

function SupportSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        For platform questions, bugs, or feature ideas, reach the team using Feedback in the sidebar. For urgent issues affecting member access, contact the platform team directly.
      </p>
    </div>
  )
}
