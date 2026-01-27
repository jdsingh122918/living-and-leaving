/**
 * PDF Generation Types
 * TypeScript interfaces for PDF document generation
 */

import type { FormSectionData, FormFieldData } from '@/components/forms/advance-directive-forms';
import type { FamilyMemberEntry } from '@/components/forms/family-member-card';
import type { RelativeFriendEntry } from '@/components/forms/relatives-friends-card';
import type { GuardianEntry } from '@/components/forms/additional-guardians-section';

// Main document props
export interface PDFDocumentProps {
  formData: Record<string, FormSectionData>;
  resourceTitle: string;
  resourceDescription?: string;
  memberName: string;
  memberEmail?: string;
  generatedAt: Date;
  completedAt?: Date | null;
}

// Section rendering props
export interface PDFSectionProps {
  section: FormSectionData;
  sectionIndex: number;
  isLastSection: boolean;
}

// Field rendering props
export interface PDFFieldProps {
  field: FormFieldData;
}

// Dynamic list section props
export interface PDFDynamicListProps {
  listType: 'family-members' | 'relatives-friends' | 'guardians';
  familyMembers?: FamilyMemberEntry[];
  relativesFriends?: RelativeFriendEntry[];
  guardians?: GuardianEntry[];
  notes?: string;
}

// Checkbox with text value structure
export interface CheckboxWithTextValue {
  selected: string[];
  explanations: Record<string, string>;
}

// Checkbox with nested options value structure
export interface CheckboxWithNestedValue {
  selected: string[];
  nestedSelected: Record<string, string[]>;
  explanations: Record<string, string>;
}

// Contact information structure
export interface ContactInfo {
  name?: string;
  relationship?: string;
  phone?: string;
  email?: string;
  address?: string;
}

// Medical provider structure
export interface MedicalProviderInfo {
  name?: string;
  specialty?: string;
  practice?: string;
  phone?: string;
}

// PDF generation options
export interface PDFGenerationOptions {
  includeCompletionDate?: boolean;
  includeResourceTitle?: boolean;
}

// PDF generation result
export interface PDFGenerationResult {
  success: boolean;
  buffer?: Buffer;
  filename?: string;
  error?: string;
}

// PDF email options
export interface PDFEmailOptions extends PDFGenerationOptions {
  recipientEmails: string[];
  subject?: string;
  message?: string;
  senderUserId: string;
}

// PDF email result
export interface PDFEmailResult {
  success: boolean;
  sent: number;
  failed: number;
  errors?: { email: string; error: string }[];
}

// Re-export form types for convenience
export type { FormSectionData, FormFieldData, FamilyMemberEntry, RelativeFriendEntry, GuardianEntry };
