/**
 * PDF Field Renderer Factory
 * Dispatches to appropriate field renderer based on field type
 */

import React from 'react';
import type { PDFFieldProps } from '@/lib/pdf/types';
import { PDFTextField, PDFTextareaField } from './PDFTextField';
import { PDFCheckboxField } from './PDFCheckboxField';
import { PDFRadioField } from './PDFRadioField';
import { PDFSelectField } from './PDFSelectField';
import { PDFCheckboxWithText } from './PDFCheckboxWithText';
import { PDFCheckboxWithNested } from './PDFCheckboxWithNested';

export function PDFFieldRenderer({ field }: PDFFieldProps) {
  switch (field.type) {
    case 'text':
      return <PDFTextField field={field} />;

    case 'textarea':
      return <PDFTextareaField field={field} />;

    case 'checkbox':
      return <PDFCheckboxField field={field} />;

    case 'radio':
      return <PDFRadioField field={field} />;

    case 'select':
      return <PDFSelectField field={field} />;

    case 'checkbox-with-text':
      return <PDFCheckboxWithText field={field} />;

    case 'checkbox-with-nested':
      return <PDFCheckboxWithNested field={field} />;

    // Contact and medical types use text field rendering as fallback
    case 'contact':
    case 'medical':
      return <PDFTextField field={field} />;

    default:
      // Fallback to text field for unknown types
      return <PDFTextField field={field} />;
  }
}

// Export all field renderers
export { PDFTextField, PDFTextareaField } from './PDFTextField';
export { PDFCheckboxField } from './PDFCheckboxField';
export { PDFRadioField } from './PDFRadioField';
export { PDFSelectField } from './PDFSelectField';
export { PDFCheckboxWithText } from './PDFCheckboxWithText';
export { PDFCheckboxWithNested } from './PDFCheckboxWithNested';
