import { UserGuideContent } from '@/components/member/user-guide-content'

export const metadata = {
  title: 'User Guide | Living & Leaving',
  description: 'Comprehensive guide for using Living & Leaving',
}

export default function MemberHelpPage() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-6">
      <UserGuideContent />
    </div>
  )
}
