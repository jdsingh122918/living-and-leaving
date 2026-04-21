'use client'

import { ChevronRight, CheckCircle2, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export interface GuideSection {
  id: string
  title: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  content: React.ReactNode
}

export interface NavigationButtonsProps {
  sections: GuideSection[]
  activeSection: string
  onNavigate: (sectionId: string) => void
}

export function NavigationButtons({ sections, activeSection, onNavigate }: NavigationButtonsProps): React.ReactNode {
  const currentIndex = sections.findIndex(s => s.id === activeSection)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < sections.length - 1

  return (
    <div className="flex justify-between">
      {hasPrevious && (
        <Button variant="outline" onClick={() => onNavigate(sections[currentIndex - 1].id)}>
          Previous Section
        </Button>
      )}
      {hasNext && (
        <Button className="ml-auto" onClick={() => onNavigate(sections[currentIndex + 1].id)}>
          Next Section
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      )}
    </div>
  )
}

export function WorkflowStep({ number, title, description }: { number: number; title: string; description: string }): React.ReactNode {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
        {number}
      </div>
      <div className="pt-0.5">
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }): React.ReactNode {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export function FolderCard({ title, description }: { title: string; description: string }): React.ReactNode {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
      <FolderOpen className="h-5 w-5 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{title}</p>
        <p className="text-sm text-muted-foreground truncate">{description}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  )
}

export function TipBox({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
      <p className="text-sm text-blue-900 dark:text-blue-100">
        <strong className="text-blue-900 dark:text-blue-100">Tip:</strong> {children}
      </p>
    </div>
  )
}

export function NoteBox({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
      <p className="text-sm text-amber-900 dark:text-amber-100">
        <strong className="text-amber-900 dark:text-amber-100">Note:</strong> {children}
      </p>
    </div>
  )
}

export function SuccessBox({ children }: { children: React.ReactNode }): React.ReactNode {
  return (
    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
        <p className="text-sm text-green-700 dark:text-green-200">{children}</p>
      </div>
    </div>
  )
}

export function createDownloadHandler(endpoint: string, filename: string): () => Promise<void> {
  return async function handleDownloadGuide(): Promise<void> {
    try {
      const response = await fetch(endpoint)
      if (!response.ok) throw new Error(`Download failed (${response.status})`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.appendChild(anchor)
      anchor.click()
      window.URL.revokeObjectURL(url)
      anchor.remove()
    } catch (error) {
      console.error('Download error:', error)
      toast.error('Failed to download guide. Please try again.')
    }
  }
}
