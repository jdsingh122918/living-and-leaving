import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Send, Eye, FileText } from 'lucide-react'
import type { TemplateAssignment } from '@/lib/types'

interface ResourcesSharedSectionProps {
  assignments: TemplateAssignment[]
  role: 'admin' | 'volunteer'
}

function getStatusDisplay(status: string): { label: string; variant: 'outline' | 'secondary' | 'default'; className?: string } {
  switch (status) {
    case 'pending':
      return { label: 'Not Started', variant: 'outline' }
    case 'started':
      return { label: 'In Progress', variant: 'secondary' }
    case 'completed':
      return { label: 'Completed', variant: 'default', className: 'bg-green-600 hover:bg-green-700' }
    default:
      return { label: status, variant: 'outline' }
  }
}

function getMemberDisplayName(assignee: TemplateAssignment['assignee']): string {
  if (!assignee) return 'Unknown Member'
  if (assignee.firstName || assignee.lastName) {
    return `${assignee.firstName || ''} ${assignee.lastName || ''}`.trim()
  }
  return assignee.email
}

export function ResourcesSharedSection({ assignments, role }: ResourcesSharedSectionProps) {
  const viewAllHref = `/${role}/resources`

  return (
    <Card className="border-l-4 border-l-[var(--healthcare-education)] bg-[hsl(var(--healthcare-education)/0.05)] hover:bg-[hsl(var(--healthcare-education)/0.08)] transition-colors">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-[hsl(var(--healthcare-education))]" />
            <CardTitle>Resources Shared</CardTitle>
          </div>
          <Button size="sm" variant="default" asChild>
            <Link href={viewAllHref}>
              <Eye className="mr-2 h-4 w-4" />
              View All
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold text-muted-foreground">No resources shared yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Share templates with family members to track their progress here.
            </p>
            <div className="mt-6">
              <Button size="sm" asChild>
                <Link href={viewAllHref}>
                  <Eye className="mr-2 h-4 w-4" />
                  Browse Resources
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.slice(0, 5).map((assignment) => {
              const statusDisplay = getStatusDisplay(assignment.status)
              return (
                <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${role}/resources/${assignment.resourceId}`}
                      className="font-medium text-primary hover:underline truncate block"
                    >
                      {assignment.resource?.title || 'Untitled Resource'}
                    </Link>
                    <div className="text-sm text-muted-foreground">
                      Shared with: {getMemberDisplayName(assignment.assignee)} &bull; {new Date(assignment.assignedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <Badge
                    variant={statusDisplay.variant}
                    className={`ml-2 shrink-0 ${statusDisplay.className || ''}`}
                  >
                    {statusDisplay.label}
                  </Badge>
                </div>
              )
            })}
            {assignments.length > 5 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={viewAllHref}>
                    View {assignments.length - 5} more shared resources
                  </Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
