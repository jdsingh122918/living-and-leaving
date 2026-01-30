'use client'

import { useState } from 'react'
import { FeedbackForm } from '@/components/feedback/feedback-form'
import { Card, CardContent } from '@/components/ui/card'
import { MessageSquarePlus, Send, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState(false)

  if (submitted) {
    return (
      <div className="space-y-6 pb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Send Feedback
          </h2>
          <p className="text-muted-foreground">
            Share your thoughts, suggestions, or report issues
          </p>
        </div>

        <Card className="border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
              <p className="text-muted-foreground max-w-md">
                Your feedback has been submitted successfully. We appreciate you taking the time to help us improve.
              </p>
              <Button
                className="mt-6"
                onClick={() => setSubmitted(false)}
              >
                <Send className="mr-2 h-4 w-4" />
                Send More Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Send Feedback
        </h2>
        <p className="text-muted-foreground">
          Share your thoughts, suggestions, or report issues
        </p>
      </div>

      {/* Description Card */}
      <Card className="bg-muted/30">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <MessageSquarePlus className="h-6 w-6 text-primary mt-0.5" />
            <div>
              <h3 className="font-semibold mb-1">We Value Your Input</h3>
              <p className="text-sm text-muted-foreground">
                Help us improve Living &amp; Leaving by sharing your feedback. Whether it&apos;s a bug report,
                feature suggestion, or general comment, we want to hear from you.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inline Feedback Form */}
      <FeedbackForm onSuccess={() => setSubmitted(true)} />
    </div>
  )
}
