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
  MessageCircle,
  FolderOpen,
  Bell,
  Settings,
  BookOpen,
  FileText,
  Shield,
  HelpCircle,
  CheckCircle2,
  MessageSquarePlus,
  Download,
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
  '/api/member/guide/download',
  'Living_and_Leaving_Member_User_Guide.pdf'
)

export function UserGuideContent(): React.ReactNode {
  const [activeSection, setActiveSection] = useState<string>('getting-started')

  const guideSections: GuideSection[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: Home,
      description: 'Sign in and learn the basics',
      content: <GettingStartedSection />,
    },
    {
      id: 'dashboard',
      title: 'Your Dashboard',
      icon: Home,
      description: 'Your home page at a glance',
      content: <DashboardSection />,
    },
    {
      id: 'resources',
      title: 'Resources & Forms',
      icon: FolderOpen,
      description: 'Find and complete documents',
      content: <ResourcesSection />,
    },
    {
      id: 'healthcare-directive',
      title: 'Healthcare Directive',
      icon: FileText,
      description: 'Complete and download your HCD',
      content: <HealthcareDirectiveSection />,
    },
    {
      id: 'chat',
      title: 'Chat',
      icon: MessageCircle,
      description: 'Message your administrator and family',
      content: <ChatSection />,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Stay updated on activity',
      content: <NotificationsSection />,
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      icon: MessageSquarePlus,
      description: 'Share suggestions or report issues',
      content: <FeedbackSection />,
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: Settings,
      description: 'Customize your experience',
      content: <SettingsSection />,
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'How your information is protected',
      content: <PrivacySection />,
    },
    {
      id: 'support',
      title: 'Getting Help',
      icon: HelpCircle,
      description: 'How to reach support',
      content: <SupportSection />,
    },
  ]

  const currentSection = guideSections.find(s => s.id === activeSection) || guideSections[0]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Member User Guide</h1>
          <p className="text-muted-foreground">
            Everything you need to know about using Living &amp; Leaving
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
        Welcome to Living &amp; Leaving. This guide walks through the platform step by step so you can complete your healthcare directive, share documents with your family, and manage your account.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Your First Steps</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Sign In" description="Enter your email address. We send a 6-digit verification code to your inbox — no password required." />
          <WorkflowStep number={2} title="Open Your Dashboard" description="Your home page shows quick actions, your family, and any documents waiting on you." />
          <WorkflowStep number={3} title="Complete Your Healthcare Directive" description="The HCD is the central form. It captures your medical wishes and can be downloaded as a signed PDF." />
          <WorkflowStep number={4} title="Share With Family" description="Once your directive is complete, share it with the people who need access in an emergency." />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Navigation Basics</h3>
        <ul className="space-y-2">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Use the <strong>sidebar on the left</strong> to move between sections.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>The <strong>bell icon</strong> in the sidebar shows unread notifications.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Use the <strong>Feedback</strong> link in the sidebar to send us suggestions or report problems.</span></li>
        </ul>
      </div>

      <TipBox>Verification codes expire after a few minutes. If your code stops working, request a new one.</TipBox>
    </div>
  )
}

function DashboardSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Your dashboard is the first page you see after signing in. It surfaces what you need to act on and gives you fast access to your most-used features.
      </p>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">What's On Your Dashboard</h3>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="welcome">
            <AccordionTrigger>Welcome Header</AccordionTrigger>
            <AccordionContent>
              Greets you by name and shows your role. Confirms you're signed in correctly.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="family">
            <AccordionTrigger>Your Family</AccordionTrigger>
            <AccordionContent>
              If your administrator has set up a family record for you, this card shows your family name and members.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="stats">
            <AccordionTrigger>Activity Counters</AccordionTrigger>
            <AccordionContent>
              Quick counts of unread chat messages and notifications. Click to jump straight to that section.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  )
}

function ResourcesSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Resources is where you find documents and forms your administrator has shared with you, including templates assigned for you to complete.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">How To Use Resources</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Resources from the sidebar" description="The folder icon on the left." />
          <WorkflowStep number={2} title="Find your assigned form" description="Forms your admin has assigned to you appear at the top of the list." />
          <WorkflowStep number={3} title="Click to open and complete" description="Forms auto-save as you type — you can leave and come back without losing work." />
          <WorkflowStep number={4} title="Submit when complete" description="Submitted forms can be downloaded as PDF and shared with your family or care team." />
        </div>
      </div>

      <NoteBox>If you don't see a form you expected, contact your administrator — they may need to assign it to you first.</NoteBox>
    </div>
  )
}

function HealthcareDirectiveSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        The Healthcare Directive (HCD) is the central document on Living &amp; Leaving. It records your medical wishes so your family and providers know how you want to be cared for.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Completing Your Directive</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open the HCD form" description="Find it in Resources. Click to open." />
          <WorkflowStep number={2} title="Work through each section" description="The form has multiple sections (medical wishes, healthcare agent, signatures). A progress bar at the top shows how far along you are." />
          <WorkflowStep number={3} title="Save as you go" description="Your work is saved automatically. You can close the form and come back later." />
          <WorkflowStep number={4} title="Download and sign" description="When complete, download the PDF. Choose between two-witness or notary signing variants depending on your state." />
          <WorkflowStep number={5} title="Share the signed copy" description="Give signed copies to your healthcare agent, family members, and your primary care provider." />
        </div>
      </div>

      <TipBox>Your healthcare agent is the person you trust to make medical decisions if you can't speak for yourself. Talk with them before naming them in your directive.</TipBox>
    </div>
  )
}

function ChatSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Chat is where you message your administrator and family members. Conversations are private to the participants.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Using Chat</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Open <strong>Chat</strong> from the sidebar.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Existing conversations appear in the list. Click one to open.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Type a message and press Enter (or click Send).</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>You'll see a <Badge variant="outline">Connected</Badge> indicator when real-time messages are working.</span></li>
        </ul>
      </div>
    </div>
  )
}

function NotificationsSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Notifications keep you informed about what's happening in your account: new messages, document assignments, and updates from your administrator.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Reading Notifications</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>The <strong>bell icon</strong> in the sidebar shows a number badge for unread notifications.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Click <strong>Notifications</strong> to see the full list.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span>Notifications mark themselves as read after you view them.</span></li>
        </ul>
      </div>
    </div>
  )
}

function FeedbackSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Feedback is the fastest way to tell us what's working, what isn't, or what you wish the platform could do.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Submitting Feedback</h3>
        <div className="space-y-3">
          <WorkflowStep number={1} title="Open Feedback from the sidebar" description="Look for the message-with-plus icon." />
          <WorkflowStep number={2} title="Add a title" description="A short summary of what you want to share." />
          <WorkflowStep number={3} title="Describe in detail" description="Include what you were doing, what you expected, and what actually happened. Screenshots help — you can attach them." />
          <WorkflowStep number={4} title="Submit anonymously if you prefer" description="Toggle the anonymous switch. Your name and email won't be included." />
          <WorkflowStep number={5} title="Send" description="Your feedback goes directly to the team. We read every one." />
        </div>
      </div>
    </div>
  )
}

function SettingsSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Settings is where you update your profile, change your display preferences, and manage notifications.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Available Settings</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span><strong>Profile:</strong> Update your name and contact information.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span><strong>Theme:</strong> Switch between light and dark mode using the toggle in the sidebar.</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" /><span><strong>Notification preferences:</strong> Choose which events you want to be notified about.</span></li>
        </ul>
      </div>
    </div>
  )
}

function PrivacySection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        Living &amp; Leaving is built to protect your information. Here's how.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">How We Protect You</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Encrypted storage.</strong> Your documents and chat messages are stored encrypted at rest.</span></li>
          <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Encrypted transit.</strong> All connections to Living &amp; Leaving use HTTPS.</span></li>
          <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Role-based access.</strong> Only your administrator and the family members you're connected to can see your information.</span></li>
          <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>You can delete your account.</strong> Contact your administrator if you want your records removed.</span></li>
        </ul>
      </div>

      <NoteBox>If you ever suspect your account has been accessed without your permission, contact your administrator immediately.</NoteBox>
    </div>
  )
}

function SupportSection() {
  return (
    <div className="space-y-6">
      <p className="text-base leading-relaxed">
        If something isn't working or you have a question this guide didn't answer, we're here to help.
      </p>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">How To Reach Us</h3>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><MessageSquarePlus className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Use the Feedback link in the sidebar.</strong> Quickest way to reach the team.</span></li>
          <li className="flex items-start gap-2"><MessageCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" /><span><strong>Message your administrator in Chat.</strong> They can answer most account questions directly.</span></li>
        </ul>
      </div>
    </div>
  )
}
