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
  Send,
  Download,
  LifeBuoy,
  Route,
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
      id: 'daily-workflow',
      title: 'Your Daily Workflow',
      icon: Route,
      description: 'A doula\'s start-to-finish flow with a family',
      content: <DailyWorkflowSection />,
    },
    {
      id: 'families',
      title: 'Families',
      icon: UsersRound,
      description: 'Create a family record before inviting members',
      content: <FamiliesSection />,
    },
    {
      id: 'users',
      title: 'Inviting Members',
      icon: Users,
      description: 'Send invitations, resend, soft-delete, and restore',
      content: <UsersSection />,
    },
    {
      id: 'resources',
      title: 'Forms & Resources',
      icon: FolderOpen,
      description: 'The Healthcare Directive and other documents',
      content: <ResourcesSection />,
    },
    {
      id: 'template-assignments',
      title: 'Sending a Form to a Member',
      icon: Send,
      description: 'Share a form, track progress, follow up',
      content: <TemplateAssignmentsSection />,
    },
    {
      id: 'helping-members',
      title: 'Filling Out a Form Together',
      icon: LifeBuoy,
      description: "Walk through, download, and send the signed PDF",
      content: <HelpingMembersSection />,
    },
    {
      id: 'dashboard',
      title: 'Admin Dashboard',
      icon: Home,
      description: 'Your home page at a glance',
      content: <DashboardSection />,
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
        As an administrator on Living &amp; Leaving you onboard families, send them their healthcare directive, walk through it together, and get the signed PDF into their hands. This guide is built around that workflow — start with the next section, &ldquo;Your Daily Workflow&rdquo;, for an end-to-end overview, then dive into the feature-by-feature pages as you need them.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Your First Day</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Sign In" description="Sign in with your email — we send a 6-digit code, no password to remember." />
          <WorkflowStep number={2} title="Read the Daily Workflow page" description="The next section walks the full flow of working with one family." />
          <WorkflowStep number={3} title="Create the family record" description="Always create the family before inviting individual members — that's how you can group them together later." />
          <WorkflowStep number={4} title="Invite the family members" description="Send invitations one at a time. Each person receives an email with a sign-in link." />
          <WorkflowStep number={5} title="Send the Healthcare Directive" description="Once a member is signed in, share the form with them and they can start filling it out." />
        </div>
      </div>

      <TipBox>Sign-in codes expire after a few minutes. If you sign in from a new device, request a fresh code from the sign-in page.</TipBox>
    </div>
  )
}

function DailyWorkflowSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Most days, your work with a family follows the same arc: get them set up, hand them the form, sit with them while they fill it out, and finalize the signed document. Here's the whole loop in order, with links to the deeper pages.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Start to Finish</h3>
        <div className="space-y-3">
          <WorkflowStep
            number={1}
            title="Create the family record"
            description="Open Families, click Create Family, give it the surname. This is the container — every member you invite next will be tied to it. (See the Families page for details.)"
          />
          <WorkflowStep
            number={2}
            title="Invite each family member"
            description="Open Inviting Members, click Invite User. Use their real email — it's how they receive the sign-in link. Pick the right role (almost always Member). Assign them to the family you just created."
          />
          <WorkflowStep
            number={3}
            title="If an invitation didn't arrive, resend it"
            description="On the user's detail page, click Resend Invitation to issue a fresh email. Their existing record stays linked — you don't have to re-create them."
          />
          <WorkflowStep
            number={4}
            title="Send them the Healthcare Directive"
            description="Open Forms & Resources, find the Healthcare Directive, and use Send to share it with the member. They get an email with a link that drops them straight into the form. (See Sending a Form for details.)"
          />
          <WorkflowStep
            number={5}
            title="Walk through it together"
            description="If the member would rather have you fill it out with them, open the form from their assignment, click Fill Out for Member, and complete the sections side-by-side. The form auto-saves so you can take breaks. (See Filling Out a Form Together for the full walkthrough.)"
          />
          <WorkflowStep
            number={6}
            title="Download the signed PDF"
            description="Use the Download PDF dropdown to pick the signing variant — witnesses-only, notary-only, or both. The PDF includes the right blank signature pages for in-person signing. While the form is incomplete, the PDF is automatically watermarked DRAFT so it's never confused for a final document."
          />
          <WorkflowStep
            number={7}
            title="Email the PDF or generate the QR card"
            description="From the form page, use Share via Email to send the PDF directly to the member or their family. Once finalized, you can also generate a QR-coded wallet card from the admin Advance Directives page so the family can pull the document up on a phone in an emergency."
          />
        </div>
      </div>

      <TipBox>
        The form auto-saves on every keystroke. There's no &ldquo;save&rdquo; button — if you close the page mid-session, the member can pick up exactly where you left off when they sign back in.
      </TipBox>

      <NoteBox>
        <strong>What about Anthony, Teresa, and the Pierce family?</strong> Real client data lives in your live instance — never test new features against real families. Use a placeholder member (e.g., &ldquo;Sam Memberson&rdquo;) to walk through this workflow end-to-end before you do it for the first time with a real family.
      </NoteBox>
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
        The Users page is where you invite new people, resend invitations that never arrived, change roles, soft-delete inactive accounts, and restore them within the grace period.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Inviting Someone New</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Users from the sidebar" description="The people icon." />
          <WorkflowStep number={2} title="Click Invite User" description="A form appears asking for email, name, and role." />
          <WorkflowStep number={3} title="Choose a role" description="Member is the default and the right choice for almost everyone. Volunteer and Administrator are reserved for staff." />
          <WorkflowStep number={4} title="Assign them to a family" description="If they're joining an existing family, set it now — saves you a step later." />
          <WorkflowStep number={5} title="Send the invitation" description="They get an email with a sign-in link. The link is single-use; once they accept it, they're in the system." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Resending an Invitation</h3>
        <p className="text-sm text-muted-foreground">
          If a member never received their first invite, lost the email, or hit an issue signing in for the first time, you can issue a fresh invitation without recreating their record.
        </p>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Click the member's name on Users" description="You'll land on their detail page." />
          <WorkflowStep number={2} title="Click Resend Invitation" description="The button is at the top right, next to Delete User. A fresh sign-in email goes out immediately." />
          <WorkflowStep number={3} title="Confirm with the member" description="Ask them to check their inbox (and spam folder). The new link is single-use, just like the first one." />
        </div>
        <NoteBox>
          You don't need to delete-and-re-invite the user. Their existing record — including any forms they've already started — stays intact and re-binds automatically when they accept the new invitation.
        </NoteBox>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Soft-Delete and Restore</h3>
        <p className="text-sm text-muted-foreground">When you delete a user, they don&apos;t disappear instantly. Their record is hidden from member-facing lists but stays recoverable for 30 days.</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click the menu next to a user and choose <strong>Delete</strong>. You&apos;ll be asked for an optional reason.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>To see deleted users, switch to the <strong>Deleted</strong> tab.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click <strong>Restore</strong> to bring a deleted user back. Their content (chat history, completed forms) is preserved.</span></li>
        </ul>
      </div>

      <NoteBox>Content created by a deleted user — chat messages, form responses — is preserved even after permanent deletion. It&apos;s reattributed to a placeholder account so historical context stays intact.</NoteBox>
    </div>
  )
}

function FamiliesSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        A family is the container that holds related members together — typically a parent, partner, adult children, and anyone else helping with care decisions. Always create the family record before inviting individual members; that way each person gets attached to the family as you onboard them, and you don&apos;t have to re-organize later.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Creating a Family</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Families from the sidebar" description="The group-of-people icon." />
          <WorkflowStep number={2} title="Click Create Family" description="Give the family a name — usually the surname (&ldquo;Pierce Family&rdquo;)." />
          <WorkflowStep number={3} title="Add the primary contact" description="The first person you invite is usually the one driving the planning. They become the natural point of contact." />
          <WorkflowStep number={4} title="Invite the rest of the family" description="Add other family members one at a time. Each gets their own sign-in and their own forms — they&apos;re not just dependents on the primary contact&apos;s record." />
          <WorkflowStep number={5} title="Designate a Family Admin (optional)" description="One member can be marked as Family Admin — they can add or remove other members of their family without going through you." />
        </div>
      </div>

      <TipBox>
        If a family member would rather have you fill the form out with them — they&apos;re not comfortable on a computer, or they want to talk through it — you can complete it on their behalf using the Fill Out for Member flow. See &ldquo;Filling Out a Form Together&rdquo; for the walkthrough.
      </TipBox>
    </div>
  )
}

function ResourcesSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Forms &amp; Resources is your library of documents and fillable forms — the content you make available to members. The Healthcare Directive is the form you&apos;ll send most often.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">What You&apos;ll Find Here</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Forms</strong> are fillable — members complete them online and you generate a signed PDF. The Healthcare Directive is the primary form on Living &amp; Leaving.</span></li>
          <li className="flex items-start gap-2"><FileText className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Documents</strong> are static — PDFs, guides, references — that members can read but don&apos;t fill out.</span></li>
        </ul>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Tracking Who&apos;s Working on What</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click any form to see who you&apos;ve sent it to and where they are in completing it.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>The <strong>Assigned Members</strong> view shows status at a glance so you can follow up with anyone stuck or stalled.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>The admin dashboard also surfaces an <strong>Advance Directives</strong> section for finalized forms — that&apos;s where you go to print wallet cards or generate QR shares after signing.</span></li>
        </ul>
      </div>
    </div>
  )
}

function TemplateAssignmentsSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Sending a form means handing the Healthcare Directive (or another form) to a specific member so they can fill it out. They get an email with a link, the form auto-saves as they go, and you can track their progress from your end.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Sending a Form</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Forms &amp; Resources" description="Click the form you want to send (most often, the Healthcare Directive)." />
          <WorkflowStep number={2} title="Click Assign Members" description="A picker opens showing every member you can send it to." />
          <WorkflowStep number={3} title="Pick the member or members" description="Search by name, email, or family. You can send to several people at once." />
          <WorkflowStep number={4} title="Confirm" description="They each get an email with a link that opens the form. The link drops them in where they left off, so it works as both &ldquo;start&rdquo; and &ldquo;resume&rdquo;." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Tracking Progress</h3>
        <p className="text-sm text-muted-foreground">From the form&apos;s Assigned Members view (or your admin dashboard), each member shows a status pill:</p>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><Badge variant="outline">Not started</Badge><span>The member hasn&apos;t opened the form yet. Worth a follow-up nudge if it&apos;s been a few days.</span></li>
          <li className="flex items-start gap-2"><Badge variant="outline">In progress</Badge><span>They opened it and have entered at least some data. The form is auto-saving in the background.</span></li>
          <li className="flex items-start gap-2"><Badge variant="outline">Completed</Badge><span>They marked the form complete and the data is ready for signing.</span></li>
          <li className="flex items-start gap-2"><Badge variant="outline">Finalized</Badge><span>You&apos;ve generated and shared the signed PDF — the form is locked.</span></li>
        </ul>
      </div>

      <NoteBox>
        If a member would rather have you walk through the form with them, see the next page (&ldquo;Filling Out a Form Together&rdquo;) for the Fill Out for Member flow.
      </NoteBox>
    </div>
  )
}

function HelpingMembersSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Some families would rather work through the Healthcare Directive with you in the room than fill it out alone. The Fill Out for Member flow lets you take notes for them while you walk through it together — same form, same auto-save, just with you driving instead of them.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Opening Their Form to Fill Out Together</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Forms &amp; Resources" description="Click the Healthcare Directive." />
          <WorkflowStep number={2} title="Find the member in Assigned Members" description="You&apos;ll see every member you&apos;ve sent it to, with their current status." />
          <WorkflowStep number={3} title="Click Fill Out for Member" description="The form opens with their existing answers pre-filled (if any). A &ldquo;Filling for [Member Name]&rdquo; banner appears so you don&apos;t lose track of whose form you&apos;re editing." />
          <WorkflowStep number={4} title="Walk through the sections together" description="Each answer auto-saves as you type — no save button to remember. If you need a break, close the page; the form picks up exactly where you left off when you come back." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Downloading the PDF</h3>
        <p className="text-sm text-muted-foreground">
          At the top right of the form page is a <strong>Download PDF</strong> dropdown. Pick the signing variant (witnesses-only, notary-only, or witnesses + notary) and a PDF generates with everything they&apos;ve entered. While the form is incomplete, the PDF is automatically watermarked <strong>DRAFT</strong> so a printed draft can never be confused with a final document. Once finalized, the watermark disappears.
        </p>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Emailing the PDF</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Click Share via Email" description="Opens a dialog where you compose the email." />
          <WorkflowStep number={2} title="Add the recipients" description="Usually the member&apos;s own email — so they can open the PDF on their device. You can add up to 5 recipients (member, spouse, agent, attorney)." />
          <WorkflowStep number={3} title="Choose the signing variant" description="Match it to how they&apos;ll sign in person — witnesses-only, notary-only, or both." />
          <WorkflowStep number={4} title="Add an optional subject and message" description="A short note explaining what the PDF is and the next steps." />
          <WorkflowStep number={5} title="Send" description="The recipients get an email with the PDF attached. They can print it, sign it, and bring or scan it back to you." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">After It&apos;s Signed</h3>
        <p className="text-sm text-muted-foreground">
          Once the family signs the PDF in person, you can finalize the form on the system side and generate a QR-coded wallet card from the admin Advance Directives page. The QR card is a one-page printout with a code the family can scan in an emergency to pull up the full directive on a phone — no fumbling for the paper.
        </p>
      </div>

      <TipBox>
        The PDF reflects whatever the member has entered at the moment you click Download or Share. If you&apos;ve added new information together, the auto-save means you don&apos;t need to do anything special — re-download and the PDF is fresh.
      </TipBox>

      <NoteBox>
        The Share via Email dialog labels the email as coming from the member (not from you), so recipients see it in context. The member&apos;s email address appears as the sender identity in the PDF metadata.
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
