import type { GuideContentSection } from '@/lib/pdf/guide-pdf-document';

export const ADMIN_GUIDE_TITLE = 'Administrator Guide';
export const ADMIN_GUIDE_SUBTITLE = 'Everything you need to administer Living & Leaving for your members';

export const ADMIN_GUIDE_SECTIONS: GuideContentSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    blocks: [
      { type: 'paragraph', text: "As an administrator on Living & Leaving you set up members, manage their families, assign documents to complete, and review feedback. This guide walks through every feature you'll use day to day." },
      { type: 'heading', text: 'Your First Day' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Sign In', description: 'Sign in with your email. We send a 6-digit verification code — no password needed.' },
          { title: 'Review Existing Users', description: 'Open Users in the sidebar to see everyone who has access to your instance.' },
          { title: 'Create Family Records', description: 'Group related members into a family so they can share documents and chat together.' },
          { title: 'Invite Members', description: "Send invitations to the people you want to onboard. They'll receive an email with sign-in instructions." },
          { title: 'Assign Templates', description: 'Send healthcare directive forms to specific members and track their progress.' },
        ],
      },
      { type: 'tip', text: 'Verification codes expire after a few minutes. If you sign in from a new device, you may need to request a fresh code.' },
    ],
  },
  {
    id: 'dashboard',
    title: 'Admin Dashboard',
    blocks: [
      { type: 'paragraph', text: 'Your admin dashboard surfaces what needs your attention: pending assignments, unread messages, and recent activity across your members.' },
      { type: 'heading', text: 'Sections of the Dashboard' },
      { type: 'subheading', text: 'Welcome Header' },
      { type: 'paragraph', text: "Confirms you're signed in as an administrator." },
      { type: 'subheading', text: 'Activity Counters' },
      { type: 'paragraph', text: 'Quick counts of unread messages and notifications, with click-through to the full list.' },
      { type: 'subheading', text: 'Recent Activity' },
      { type: 'paragraph', text: 'A feed of the most recent member activity — completed forms, new messages, etc.' },
    ],
  },
  {
    id: 'users',
    title: 'Managing Users',
    blocks: [
      { type: 'paragraph', text: 'The Users page is where you invite new people, change roles, soft-delete inactive accounts, and restore deleted users within the grace period.' },
      { type: 'heading', text: 'Inviting a New User' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open Users from the sidebar', description: 'The people-icon link.' },
          { title: 'Click Invite User', description: 'A form appears asking for email, name, and role.' },
          { title: 'Choose a role', description: 'Member is the default. Use Volunteer or Administrator only when intentional.' },
          { title: 'Optionally assign a family', description: "If they're joining an existing family group, assign it now to skip a step later." },
          { title: 'Send the invitation', description: 'They receive an email with a link to sign in. The link is single-use.' },
        ],
      },
      { type: 'heading', text: 'Soft-Delete and Restore' },
      { type: 'paragraph', text: "When you delete a user, they don't disappear instantly. Their record is hidden from member-facing lists but stays recoverable for 30 days." },
      {
        type: 'list',
        items: [
          "Click the menu next to a user and choose Delete. You'll be asked for an optional reason.",
          'To see deleted users, switch to the Deleted tab.',
          'Click Restore to bring a deleted user back. Their content (chat history, completed forms) is preserved.',
        ],
      },
      { type: 'note', text: "Content created by a deleted user — chat messages, form responses — is preserved even after permanent deletion. It's reattributed to a placeholder account so historical context stays intact." },
    ],
  },
  {
    id: 'families',
    title: 'Families',
    blocks: [
      { type: 'paragraph', text: 'Families let you group related members so they can share documents, see each other in conversations, and coordinate on healthcare decisions.' },
      { type: 'heading', text: 'Creating a Family' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open Families from the sidebar', description: 'The group-of-people icon.' },
          { title: 'Click Create Family', description: 'Give the family a name (usually the surname).' },
          { title: 'Add members', description: 'Search and select existing users, or invite new ones directly into the family.' },
          { title: 'Designate a Family Admin', description: 'One member can be marked as Family Admin — they can manage other members of their family.' },
        ],
      },
      { type: 'tip', text: 'If a family member needs help completing their healthcare directive, you can complete it on their behalf from the Resources page.' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources & Templates',
    blocks: [
      { type: 'paragraph', text: 'Resources is your library of documents, templates, and forms — the content you make available to members.' },
      { type: 'heading', text: 'Resource Types' },
      {
        type: 'list',
        items: [
          'Templates are fillable forms members can complete (the Healthcare Directive is the most-used template).',
          'Documents are static files — PDFs, guides, references — that members can read.',
        ],
      },
      { type: 'heading', text: 'Managing Resources' },
      {
        type: 'list',
        items: [
          "Click any resource to see who's been assigned it and their completion status.",
          "Use the Assigned Members view to see progress at a glance and follow up with members who haven't started.",
        ],
      },
    ],
  },
  {
    id: 'template-assignments',
    title: 'Template Assignments',
    blocks: [
      { type: 'paragraph', text: "Template assignments let you formally hand a form to a specific member, then track their progress until it's complete." },
      { type: 'heading', text: 'Assigning a Template' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open the resource', description: 'From Resources, click the template you want to assign.' },
          { title: 'Click Assign Members', description: 'A picker appears showing all eligible members.' },
          { title: 'Select one or more members', description: 'You can search by name, email, or family.' },
          { title: 'Confirm', description: 'Each member receives an email notification that they have a new form to complete.' },
        ],
      },
      { type: 'heading', text: 'Tracking Progress' },
      {
        type: 'list',
        items: [
          "Pending: Member hasn't opened the form yet.",
          'Started: Member opened the form and saved at least once.',
          'Completed: Member submitted the finished form.',
        ],
      },
      { type: 'note', text: 'If a member needs help, you can also complete a form on their behalf — open the template, choose the member, and fill it out together.' },
    ],
  },
  {
    id: 'helping-members',
    title: 'Helping a Member with Their Form',
    blocks: [
      { type: 'paragraph', text: "Some members need help with their healthcare directive — they may not be comfortable online, need a family member to help, or simply want to review what they've entered in a format they can read offline. As administrator, you can pull up a member's form, download it as a PDF, and email it to them (or anyone they choose)." },
      { type: 'heading', text: 'Pulling Up a Member\u2019s Form' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open Resources from the sidebar', description: 'Click the Healthcare Directive (or any template you want to review).' },
          { title: 'Scroll to the Assigned Members list', description: 'You\u2019ll see every member the template has been assigned to, with their progress status.' },
          { title: 'Click the member\u2019s name', description: 'You\u2019ll land on their form with their answers pre-filled. You can review each section.' },
        ],
      },
      { type: 'heading', text: 'Downloading Their PDF' },
      { type: 'paragraph', text: 'At the top right of the member\u2019s form page you\u2019ll see a Download PDF dropdown. Pick the signing variant (with two witnesses, with notary, or both) and a PDF generates with whatever the member has entered so far. This works even if the form is only partially filled — useful if you want to review a draft with them.' },
      { type: 'heading', text: 'Emailing Their PDF to Them' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Click Share via Email', description: 'Opens a dialog for composing the email.' },
          { title: 'Add the recipient', description: 'Usually the member\u2019s own email — so they can open the PDF on their device. You can add up to 5 recipients (member, spouse, attorney, etc.).' },
          { title: 'Choose the signing variant', description: 'Match the variant to the state of signing: two witnesses, notary, or both.' },
          { title: 'Add an optional subject and message', description: 'A short note explaining what the PDF is and any next steps.' },
          { title: 'Send', description: 'The member receives an email with the PDF attached. They can print, review, and get back to you.' },
        ],
      },
      { type: 'tip', text: 'The PDF reflects whatever the member has entered at the moment you click Download or Share. If they want to see a "current draft" after you\u2019ve added new information together, save the form first — then re-download.' },
      { type: 'note', text: "The email is labeled as coming from the member (not from you) so recipients see it in context. The member's email address appears as the sender identity in the PDF metadata." },
    ],
  },
  {
    id: 'chat',
    title: 'Chat',
    blocks: [
      { type: 'paragraph', text: 'Chat is your direct line to members and family groups. Conversations are private to participants.' },
      { type: 'heading', text: 'Starting a Conversation' },
      {
        type: 'numbered-list',
        steps: [
          { title: 'Open Chat from the sidebar', description: 'The chat bubble icon.' },
          { title: 'Click New Conversation', description: 'Choose between a direct message or a family group.' },
          { title: 'Select recipient(s)', description: 'Search by name or email.' },
          { title: 'Send your first message', description: "The recipient gets a notification and an email if they haven't seen the message in a while." },
        ],
      },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    blocks: [
      { type: 'paragraph', text: 'Notifications surface activity that may need your attention: new feedback, completed forms, family events, and chat messages.' },
      {
        type: 'list',
        items: [
          'The bell icon in the sidebar shows the number of unread notifications.',
          'Open Notifications to see the full list and click any item to jump to its source.',
          'Notifications are automatically marked as read after viewing.',
        ],
      },
    ],
  },
  {
    id: 'feedback',
    title: 'Reviewing Feedback',
    blocks: [
      { type: 'paragraph', text: "The Feedback page collects suggestions, bug reports, and questions from your members. Reviewing it regularly is one of the best ways to know what's working and what isn't." },
      { type: 'heading', text: 'Reviewing Feedback' },
      {
        type: 'list',
        items: [
          'Open Feedback from the sidebar.',
          "Each item shows the member's name (unless submitted anonymously), title, description, and any attachments.",
          'Feedback is also emailed to the platform team when submitted.',
        ],
      },
    ],
  },
  {
    id: 'settings',
    title: 'Settings',
    blocks: [
      { type: 'paragraph', text: 'Settings is where you update your own profile, change display preferences, and manage notification preferences.' },
      {
        type: 'list',
        items: [
          'Profile: Update your name and contact information.',
          'Theme: Switch between light and dark mode.',
          'Notification preferences: Control which events trigger notifications and emails.',
        ],
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    blocks: [
      { type: 'paragraph', text: 'Member data is sensitive — much of it is healthcare-adjacent — and the platform is designed accordingly.' },
      {
        type: 'list',
        items: [
          'Encrypted storage and transit. All member documents and messages are encrypted at rest and over the wire.',
          "Role-based access. Members see only their own data; you see your members' data.",
          'Audit logs. Significant administrative actions are logged for accountability.',
          'Soft-delete. User deletion has a 30-day grace window during which a record can be restored without losing content.',
        ],
      },
    ],
  },
  {
    id: 'support',
    title: 'Getting Help',
    blocks: [
      { type: 'paragraph', text: 'For platform questions, bugs, or feature ideas, reach the team using Feedback in the sidebar. For urgent issues affecting member access, contact the platform team directly.' },
    ],
  },
];
