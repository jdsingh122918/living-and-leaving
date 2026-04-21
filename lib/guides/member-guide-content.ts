import type { GuideContentSection } from '@/lib/pdf/guide-pdf-document';

export const MEMBER_GUIDE_TITLE = 'Member User Guide';
export const MEMBER_GUIDE_SUBTITLE = 'Everything you need to know about using Living & Leaving';

export const MEMBER_GUIDE_SECTIONS: GuideContentSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    blocks: [
      { type: 'paragraph', text: 'Welcome to Living & Leaving. This guide walks through the platform step by step so you can complete your healthcare directive, share documents with your family, and manage your account.' },
      { type: 'heading', text: 'Your First Steps' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Sign In', description: 'Enter your email address. We send a 6-digit verification code to your inbox — no password required.' },
          { title: 'Open Your Dashboard', description: 'Your home page shows quick actions, your family, and any documents waiting on you.' },
          { title: 'Complete Your Healthcare Directive', description: 'The HCD is the central form. It captures your medical wishes and can be downloaded as a signed PDF.' },
          { title: 'Share With Family', description: 'Once your directive is complete, share it with the people who need access in an emergency.' },
        ],
      },
      { type: 'heading', text: 'Navigation Basics' },
      {
        type: 'list',
        items: [
          'Use the sidebar on the left to move between sections.',
          'The bell icon in the sidebar shows unread notifications.',
          'Use the Feedback link in the sidebar to send us suggestions or report problems.',
        ],
      },
      { type: 'tip', text: 'Verification codes expire after a few minutes. If your code stops working, request a new one.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    blocks: [
      { type: 'paragraph', text: 'Your dashboard is the first page you see after signing in. It surfaces what you need to act on and gives you fast access to your most-used features.' },
      { type: 'heading', text: "What's On Your Dashboard" },
      { type: 'subheading', text: 'Welcome Header' },
      { type: 'paragraph', text: "Greets you by name and shows your role. Confirms you're signed in correctly." },
      { type: 'subheading', text: 'Your Family' },
      { type: 'paragraph', text: 'If your administrator has set up a family record for you, this card shows your family name and members.' },
      { type: 'subheading', text: 'Activity Counters' },
      { type: 'paragraph', text: 'Quick counts of unread chat messages and notifications. Click to jump straight to that section.' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources & Forms',
    blocks: [
      { type: 'paragraph', text: 'Resources is where you find documents and forms your administrator has shared with you, including templates assigned for you to complete.' },
      { type: 'heading', text: 'How To Use Resources' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open Resources from the sidebar', description: 'The folder icon on the left.' },
          { title: 'Find your assigned form', description: 'Forms your admin has assigned to you appear at the top of the list.' },
          { title: 'Click to open and complete', description: 'Forms auto-save as you type — you can leave and come back without losing work.' },
          { title: 'Submit when complete', description: 'Submitted forms can be downloaded as PDF and shared with your family or care team.' },
        ],
      },
      { type: 'note', text: "If you don't see a form you expected, contact your administrator — they may need to assign it to you first." },
    ],
  },
  {
    id: 'healthcare-directive',
    title: 'Healthcare Directive',
    blocks: [
      { type: 'paragraph', text: 'The Healthcare Directive (HCD) is the central document on Living & Leaving. It records your medical wishes so your family and providers know how you want to be cared for.' },
      { type: 'heading', text: 'Completing Your Directive' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open the HCD form', description: 'Find it in Resources. Click to open.' },
          { title: 'Work through each section', description: 'The form has multiple sections (medical wishes, healthcare agent, signatures). A progress bar at the top shows how far along you are.' },
          { title: 'Save as you go', description: 'Your work is saved automatically. You can close the form and come back later.' },
          { title: 'Download and sign', description: 'When complete, download the PDF. Choose between two-witness or notary signing variants depending on your state.' },
          { title: 'Share the signed copy', description: 'Give signed copies to your healthcare agent, family members, and your primary care provider.' },
        ],
      },
      { type: 'tip', text: "Your healthcare agent is the person you trust to make medical decisions if you can't speak for yourself. Talk with them before naming them in your directive." },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    blocks: [
      { type: 'paragraph', text: 'Chat is where you message your administrator and family members. Conversations are private to the participants.' },
      { type: 'heading', text: 'Using Chat' },
      {
        type: 'list',
        items: [
          'Open Chat from the sidebar.',
          'Existing conversations appear in the list. Click one to open.',
          'Type a message and press Enter (or click Send).',
          "You'll see a Connected indicator when real-time messages are working.",
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    blocks: [
      { type: 'paragraph', text: "Notifications keep you informed about what's happening in your account: new messages, document assignments, and updates from your administrator." },
      { type: 'heading', text: 'Reading Notifications' },
      {
        type: 'list',
        items: [
          'The bell icon in the sidebar shows a number badge for unread notifications.',
          'Click Notifications to see the full list.',
          'Notifications mark themselves as read after you view them.',
        ],
      },
    ],
  },
  {
    id: 'feedback',
    title: 'Send Feedback',
    blocks: [
      { type: 'paragraph', text: "Feedback is the fastest way to tell us what's working, what isn't, or what you wish the platform could do." },
      { type: 'heading', text: 'Submitting Feedback' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open Feedback from the sidebar', description: 'Look for the message-with-plus icon.' },
          { title: 'Add a title', description: 'A short summary of what you want to share.' },
          { title: 'Describe in detail', description: 'Include what you were doing, what you expected, and what actually happened. Screenshots help — you can attach them.' },
          { title: 'Submit anonymously if you prefer', description: "Toggle the anonymous switch. Your name and email won't be included." },
          { title: 'Send', description: 'Your feedback goes directly to the team. We read every one.' },
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    blocks: [
      { type: 'paragraph', text: 'Settings is where you update your profile, change your display preferences, and manage notifications.' },
      { type: 'heading', text: 'Available Settings' },
      {
        type: 'list',
        items: [
          'Profile: Update your name and contact information.',
          'Theme: Switch between light and dark mode using the toggle in the sidebar.',
          'Notification preferences: Choose which events you want to be notified about.',
        ],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    blocks: [
      { type: 'paragraph', text: "Living & Leaving is built to protect your information. Here's how." },
      { type: 'heading', text: 'How We Protect You' },
      {
        type: 'list',
        items: [
          'Encrypted storage. Your documents and chat messages are stored encrypted at rest.',
          'Encrypted transit. All connections to Living & Leaving use HTTPS.',
          "Role-based access. Only your administrator and the family members you're connected to can see your information.",
          'You can delete your account. Contact your administrator if you want your records removed.',
        ],
      },
      { type: 'note', text: 'If you ever suspect your account has been accessed without your permission, contact your administrator immediately.' },
    ],
  },
  {
    id: 'support',
    title: 'Getting Help',
    blocks: [
      { type: 'paragraph', text: "If something isn't working or you have a question this guide didn't answer, we're here to help." },
      { type: 'heading', text: 'How To Reach Us' },
      {
        type: 'list',
        items: [
          'Use the Feedback link in the sidebar. Quickest way to reach the team.',
          'Message your administrator in Chat. They can answer most account questions directly.',
        ],
      },
    ],
  },
];
