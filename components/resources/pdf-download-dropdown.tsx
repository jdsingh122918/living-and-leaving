'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown, Download, FileText, Loader2, Scale, Users } from 'lucide-react';
import type { PDFSigningVariant } from '@/lib/pdf/types';

interface PdfDownloadDropdownProps {
  resourceId: string;
  resourceTitle: string;
  memberId?: string;
  disabled?: boolean;
  onBeforeDownload?: () => Promise<void>;
}

const VARIANT_OPTIONS: {
  value: PDFSigningVariant;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'witnesses-only',
    label: 'With 2 Witnesses',
    description: 'No notary section',
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: 'notary-only',
    label: 'With Notary Only',
    description: 'No witness sections',
    icon: <Scale className="h-4 w-4" />,
  },
  {
    value: 'witnesses-and-notary',
    label: 'Witnesses + Notary',
    description: 'Complete signing package',
    icon: <FileText className="h-4 w-4" />,
  },
];

export function PdfDownloadDropdown({
  resourceId,
  resourceTitle,
  memberId,
  disabled = false,
  onBeforeDownload,
}: PdfDownloadDropdownProps) {
  const [loadingVariant, setLoadingVariant] = useState<PDFSigningVariant | null>(null);

  const handleDownload = useCallback(async (variant: PDFSigningVariant) => {
    setLoadingVariant(variant);
    try {
      // Save first if callback provided
      if (onBeforeDownload) {
        await onBeforeDownload();
      }

      const params = new URLSearchParams({ variant });
      if (memberId) params.set('memberId', memberId);

      const response = await fetch(
        `/api/resources/${resourceId}/form-response/share?${params.toString()}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `${resourceTitle.replace(/\s+/g, '_')}.pdf`;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    } finally {
      setLoadingVariant(null);
    }
  }, [resourceId, resourceTitle, memberId, onBeforeDownload]);

  const isLoading = loadingVariant !== null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || isLoading}
          className="min-h-[44px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
              <ChevronDown className="h-3 w-3 ml-1" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Choose signing sections
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {VARIANT_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleDownload(option.value)}
            disabled={isLoading}
            className="flex items-start gap-3 py-2.5 cursor-pointer"
          >
            <span className="mt-0.5 text-muted-foreground">{option.icon}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">{option.label}</span>
              <span className="text-xs text-muted-foreground">{option.description}</span>
            </div>
            {loadingVariant === option.value && (
              <Loader2 className="h-3.5 w-3.5 ml-auto animate-spin" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
