import { AdminUserGuideContent } from '@/components/admin/admin-user-guide-content'

export const metadata = {
  title: 'Administrator Guide | Living & Leaving',
  description: 'Comprehensive guide for administering Living & Leaving',
}

export default function AdminHelpPage() {
  return (
    <div className="space-y-4 sm:space-y-6 pb-4 sm:pb-6">
      <AdminUserGuideContent />
    </div>
  )
}
