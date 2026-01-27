'use client';

/**
 * Share Form Dialog Component
 * Allows members to share completed forms via email as PDF attachments
 */

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Send, FileText, Plus, X, Download } from 'lucide-react';

// Validation schema for the share form
const shareFormSchema = z.object({
  recipients: z
    .array(z.string().email('Please enter a valid email address'))
    .min(1, 'At least one recipient is required')
    .max(5, 'Maximum 5 recipients allowed'),
  subject: z.string().max(200, 'Subject must be 200 characters or less').optional(),
  message: z.string().max(1000, 'Message must be 1000 characters or less').optional(),
});

type ShareFormValues = z.infer<typeof shareFormSchema>;

interface ShareFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceId: string;
  resourceTitle: string;
  memberName: string;
  onSuccess?: () => void;
}

export function ShareFormDialog({
  open,
  onOpenChange,
  resourceId,
  resourceTitle,
  memberName,
  onSuccess,
}: ShareFormDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'quick' | 'custom'>('custom');
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [emailInput, setEmailInput] = useState('');

  const form = useForm<ShareFormValues>({
    resolver: zodResolver(shareFormSchema),
    defaultValues: {
      recipients: [],
      subject: '',
      message: '',
    },
  });

  const recipients = form.watch('recipients');

  // Add email to recipients list
  const addRecipient = useCallback(() => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      });
      return;
    }

    // Check for duplicates
    if (recipients.includes(email)) {
      toast({
        title: 'Duplicate email',
        description: 'This email is already in the list',
        variant: 'destructive',
      });
      return;
    }

    // Check max recipients
    if (recipients.length >= 5) {
      toast({
        title: 'Maximum recipients reached',
        description: 'You can only send to 5 recipients at a time',
        variant: 'destructive',
      });
      return;
    }

    form.setValue('recipients', [...recipients, email]);
    setEmailInput('');
  }, [emailInput, recipients, form, toast]);

  // Remove email from recipients list
  const removeRecipient = useCallback(
    (index: number) => {
      const newRecipients = [...recipients];
      newRecipients.splice(index, 1);
      form.setValue('recipients', newRecipients);
    },
    [recipients, form]
  );

  // Handle email input key press (Enter to add)
  const handleEmailKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addRecipient();
      }
    },
    [addRecipient]
  );

  // Handle form submission
  const onSubmit = async (data: ShareFormValues) => {
    if (data.recipients.length === 0) {
      toast({
        title: 'No recipients',
        description: 'Please add at least one email address',
        variant: 'destructive',
      });
      return;
    }

    setIsSending(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/form-response/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipientEmails: data.recipients,
          subject: data.subject || undefined,
          message: data.message || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      toast({
        title: 'Email sent',
        description: result.message || `Email sent to ${result.sent} recipient(s)`,
      });

      // Reset form and close dialog
      form.reset();
      setEmailInput('');
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error sharing form:', error);
      toast({
        title: 'Failed to send email',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  // Handle PDF download
  const handleDownload = async () => {
    setIsDownloading(true);

    try {
      const response = await fetch(`/api/resources/${resourceId}/form-response/share`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      // Get the blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${resourceTitle.replace(/\s+/g, '_')}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) {
          filename = match[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'PDF downloaded',
        description: 'The form has been downloaded as a PDF',
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Download failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Close handler with reset
  const handleClose = (open: boolean) => {
    if (!open) {
      form.reset();
      setEmailInput('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Share Form via Email
          </DialogTitle>
          <DialogDescription>
            Share "{resourceTitle}" as a PDF attachment via email
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Recipient Emails */}
            <div className="space-y-2">
              <Label>Recipients</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={handleEmailKeyPress}
                  placeholder="Enter email address"
                  className="flex-1 min-h-[44px]"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRecipient}
                  className="min-h-[44px]"
                  disabled={!emailInput.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {recipients.map((email, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                    >
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="hover:text-destructive ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {form.formState.errors.recipients && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.recipients.message}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Press Enter or click + to add. Maximum 5 recipients.
              </p>
            </div>

            {/* Subject (Optional) */}
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={`${memberName} shared "${resourceTitle}" with you`}
                      className="min-h-[44px]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Message (Optional) */}
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Personal Message (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Add a personal message to include in the email..."
                      className="min-h-[100px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleDownload}
                disabled={isDownloading || isSending}
                className="min-h-[44px] flex-1 sm:flex-initial"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button
                type="submit"
                disabled={isSending || isDownloading || recipients.length === 0}
                className="min-h-[44px] flex-1 sm:flex-initial"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
