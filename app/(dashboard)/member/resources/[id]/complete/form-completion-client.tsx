'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, AlertCircle, FileText, Mail, User, CheckCircle2, Rows3, Rows4 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { AdvanceDirectiveForm, FormResponseData, FormSectionData } from '@/components/forms/advance-directive-forms';
import { ShareFormDialog } from '@/components/resources/share-form-dialog';
import { PdfDownloadDropdown } from '@/components/resources/pdf-download-dropdown';

function isFieldAnswered(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) return false;
    return keys.some((k) => isFieldAnswered((value as Record<string, unknown>)[k]));
  }
  return true;
}

function countFieldsInSection(section: FormSectionData): { answered: number; total: number } {
  if (!section.fields) return { answered: 0, total: 0 };
  const total = section.fields.length;
  // N/A sections count as fully answered — the member's explicit decision
  // that the section doesn't apply is just as resolved as filling it in.
  if (section.notApplicable) return { answered: total, total };
  const answered = section.fields.filter((f) => isFieldAnswered(f.value)).length;
  return { answered, total };
}

function countFieldsAcrossSections(sections: Record<string, FormSectionData>) {
  let answered = 0;
  let total = 0;
  for (const section of Object.values(sections)) {
    const s = countFieldsInSection(section);
    answered += s.answered;
    total += s.total;
  }
  return { answered, total };
}

interface FormCompletionClientProps {
  resourceId: string;
  resourceTitle: string;
  resourceDescription: string;
  formSchema: { sections: Record<string, any> };
  userId: string;
  memberName: string;
  existingFormData?: Record<string, any>;
  proxyMemberId?: string;
  proxyMemberName?: string;
}

export function FormCompletionClient({
  resourceId,
  resourceTitle,
  resourceDescription,
  formSchema,
  userId,
  memberName,
  existingFormData,
  proxyMemberId,
  proxyMemberName,
}: FormCompletionClientProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [latestSections, setLatestSections] = useState<Record<string, FormSectionData> | null>(null);
  const [compactMode, setCompactMode] = useState(false);

  // Restore the user's compact-mode preference from localStorage on mount.
  // We hydrate after mount (rather than initializing with the value) so SSR
  // and the first client render produce the same markup.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem('form-completion-compact');
      if (stored === '1') setCompactMode(true);
    } catch {
      // localStorage unavailable (private mode, disabled cookies) — fine,
      // compact mode just won't persist across sessions.
    }
  }, []);

  const toggleCompactMode = useCallback(() => {
    setCompactMode((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem('form-completion-compact', next ? '1' : '0');
      } catch {
        // ignore — see useEffect above
      }
      return next;
    });
  }, []);

  // Convert formSchema sections to FormSectionData format
  const convertToFormSections = useCallback((
    schema: { sections: Record<string, any> },
    existingData?: Record<string, any>
  ): Record<string, FormSectionData> => {
    const sections: Record<string, FormSectionData> = {};

    // Signing sections are completed on paper only — hide from online form
    // Cover all ID variants across seeded forms (comprehensive, healthcare directive, etc.)
    const ONLINE_HIDDEN_SECTIONS = [
      'signature', 'member-signature',
      'witness-1', 'witness-2', 'witness-one', 'witness-two',
      'notary', 'notary-section', 'notary-ca',
    ];

    Object.entries(schema.sections)
    .filter(([sectionId]) => !ONLINE_HIDDEN_SECTIONS.includes(sectionId))
    .forEach(([sectionId, sectionDef]) => {
      const existingSectionData = existingData?.[sectionId];
      const isDynamicList = sectionDef.isDynamicList || false;

      // Build base section data structure
      const sectionData: FormSectionData = {
        id: sectionDef.id || sectionId,
        title: sectionDef.title,
        description: sectionDef.description,
        completed: existingSectionData?.completed || false,
        // Preserve "Not applicable" flag from saved data so the toggle
        // survives round-trips through the auto-save endpoint.
        notApplicable: existingSectionData?.notApplicable || false,
        fields: sectionDef.fields.map((field: any) => ({
          id: field.id,
          type: field.type,
          label: field.label,
          required: field.required || false,
          options: field.options,
          selectOptions: field.selectOptions,
          placeholder: field.placeholder,
          // Pass through checkbox-with-text showExplainFor option
          showExplainFor: field.showExplainFor,
          // Restore existing values
          value: existingSectionData?.fields?.find((f: any) => f.id === field.id)?.value || field.value,
        })),
      };

      // Only add dynamic list properties if section is actually a dynamic list
      // This prevents normal sections from being incorrectly rendered as dynamic lists in PDF
      if (isDynamicList) {
        sectionData.isDynamicList = true;
        sectionData.listType = sectionDef.listType;

        // Add appropriate data based on list type
        if (sectionDef.listType === 'family-members') {
          sectionData.familyMembers = existingSectionData?.familyMembers || [];
        } else if (sectionDef.listType === 'relatives-friends') {
          sectionData.relativesFriends = existingSectionData?.relativesFriends || [];
        } else if (sectionDef.listType === 'guardians') {
          sectionData.guardians = existingSectionData?.guardians || [];
          sectionData.notes = existingSectionData?.notes || '';
        }
      }

      sections[sectionId] = sectionData;
    });

    return sections;
  }, []);

  // Build initial form data
  const initialFormData: FormResponseData = {
    contentId: resourceId,
    userId: userId,
    sections: convertToFormSections(formSchema, existingFormData),
    lastSaved: undefined,
  };

  // Handle form save (called by AdvanceDirectiveForm auto-save)
  const handleSave = useCallback(async (data: FormResponseData) => {
    setIsSaving(true);
    setSaveError(null);
    setLatestSections(data.sections);

    try {
      const url = proxyMemberId
        ? `/api/resources/${resourceId}/complete-for-member`
        : `/api/resources/${resourceId}/form-response`;

      const body = proxyMemberId
        ? {
            memberId: proxyMemberId,
            formData: data.sections,
            isComplete: data.completedAt ? true : false,
          }
        : {
            formData: data.sections,
            isComplete: data.completedAt ? true : false,
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save form');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving form:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save form');
      throw error; // Re-throw for auto-save to handle
    } finally {
      setIsSaving(false);
    }
  }, [resourceId, proxyMemberId]);

  const progressSections = latestSections ?? initialFormData.sections;
  const progress = useMemo(
    () => countFieldsAcrossSections(progressSections),
    [progressSections],
  );
  const progressPercent = progress.total === 0
    ? 0
    : Math.round((progress.answered / progress.total) * 100);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <Button variant="ghost" size="sm" asChild={!proxyMemberId} onClick={proxyMemberId ? () => window.history.back() : undefined}>
          {proxyMemberId ? (
            <>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resource
            </>
          ) : (
            <Link href={`/member/resources/${resourceId}`}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Resource
            </Link>
          )}
        </Button>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleCompactMode}
            className="min-h-[44px]"
            aria-pressed={compactMode}
            title={compactMode ? 'Switch to roomy view' : 'Switch to compact view'}
          >
            {compactMode ? (
              <Rows4 className="h-4 w-4 mr-2" />
            ) : (
              <Rows3 className="h-4 w-4 mr-2" />
            )}
            {compactMode ? 'Roomy' : 'Compact'}
          </Button>
          <PdfDownloadDropdown
            resourceId={resourceId}
            resourceTitle={resourceTitle}
            memberId={proxyMemberId}
          />
          <Button
            variant="default"
            size="sm"
            onClick={() => setShowShareDialog(true)}
            className="min-h-[44px]"
          >
            <Mail className="h-4 w-4 mr-2" />
            Share via Email
          </Button>
        </div>
      </div>

      {/* Title Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            <FileText className="h-5 w-5 text-primary shrink-0" />
            <span>{resourceTitle}</span>
            {proxyMemberName && (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs font-normal">
                <User className="h-3 w-3" />
                {proxyMemberName}
              </Badge>
            )}
          </CardTitle>
          {resourceDescription && (
            <CardDescription>{resourceDescription}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {/* Progress */}
      {progress.total > 0 && (
        <Card className="sticky top-2 z-10 shadow-sm">
          <CardContent className="py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                {progressPercent === 100 ? (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                ) : null}
                <span>
                  {progress.answered} of {progress.total} answered
                  <span className="text-muted-foreground ml-2">({progressPercent}%)</span>
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Your answers save automatically — you can finish later.
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {saveError && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{saveError}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      <AdvanceDirectiveForm
        contentId={resourceId}
        userId={userId}
        initialData={initialFormData}
        onSave={handleSave}
        compact={compactMode}
      />

      {/* Share Dialog */}
      <ShareFormDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        resourceId={resourceId}
        resourceTitle={resourceTitle}
        memberName={memberName}
        memberId={proxyMemberId}
      />
    </div>
  );
}
