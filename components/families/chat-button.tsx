'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface ChatButtonProps {
  targetUserId: string
  targetUserName?: string
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  showLabel?: boolean
  className?: string
}

export function ChatButton({
  targetUserId,
  targetUserName,
  variant = 'outline',
  size = 'sm',
  showLabel = false,
  className,
}: ChatButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleChat = async () => {
    try {
      setLoading(true)

      const response = await fetch('/api/conversations/direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start conversation')
      }

      const data = await response.json()

      // Navigate to the conversation
      // Determine the role-based path from current URL
      const currentPath = window.location.pathname
      let basePath = '/member'
      if (currentPath.includes('/admin')) {
        basePath = '/admin'
      } else if (currentPath.includes('/volunteer')) {
        basePath = '/volunteer'
      }

      router.push(`${basePath}/chat/${data.data.id}`)
    } catch (error) {
      console.error('Error starting conversation:', error)
      toast.error(
        error instanceof Error ? error.message : 'Failed to start conversation'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleChat}
      disabled={loading}
      className={className}
      title={`Chat with ${targetUserName || 'member'}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4" />
      )}
      {showLabel && <span className="ml-2">Chat</span>}
    </Button>
  )
}
