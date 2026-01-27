/**
 * PDF Generation Service
 * Server-side service for generating PDFs from form responses
 */

import React from 'react';
import { renderToBuffer, DocumentProps } from '@react-pdf/renderer';
import { FormPDFDocument } from '@/components/pdf/FormPDFDocument';
import type {
  PDFGenerationOptions,
  PDFGenerationResult,
  PDFDocumentProps,
  FormSectionData,
} from './types';

// Timeout for PDF generation (30 seconds)
const PDF_GENERATION_TIMEOUT = 30000;

/**
 * Generate PDF buffer from form data with timeout
 */
async function generateWithTimeout<T>(
  operation: () => Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('PDF generation timeout')), timeoutMs)
  );
  return Promise.race([operation(), timeoutPromise]);
}

/**
 * Generate a sanitized filename for the PDF
 */
export function generatePDFFilename(title: string, memberLastName?: string): string {
  const sanitizedTitle = title
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);

  const date = new Date().toISOString().split('T')[0];

  if (memberLastName) {
    const sanitizedName = memberLastName.replace(/[^a-zA-Z]/g, '');
    return `${sanitizedTitle}_${sanitizedName}_${date}.pdf`;
  }

  return `${sanitizedTitle}_${date}.pdf`;
}

/**
 * Generate PDF buffer from form response data
 */
export async function generateFormPDF(
  formData: Record<string, FormSectionData>,
  resourceTitle: string,
  memberName: string,
  options: PDFGenerationOptions & {
    resourceDescription?: string;
    memberEmail?: string;
    completedAt?: Date | null;
  } = {}
): Promise<PDFGenerationResult> {
  try {
    const documentProps: PDFDocumentProps = {
      formData,
      resourceTitle,
      resourceDescription: options.resourceDescription,
      memberName,
      memberEmail: options.memberEmail,
      generatedAt: new Date(),
      completedAt: options.completedAt,
    };

    // Generate PDF with timeout
    const buffer = await generateWithTimeout(
      async () => {
        // Create the document element - cast needed due to react-pdf type constraints
        const documentElement = React.createElement(
          FormPDFDocument,
          documentProps
        ) as React.ReactElement<DocumentProps>;
        const pdfBuffer = await renderToBuffer(documentElement);
        return Buffer.from(pdfBuffer);
      },
      PDF_GENERATION_TIMEOUT
    );

    // Generate filename
    const memberLastName = memberName.split(' ').pop();
    const filename = generatePDFFilename(resourceTitle, memberLastName);

    return {
      success: true,
      buffer,
      filename,
    };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * PDF Generation Service Class
 * For more complex use cases with email integration
 */
export class PDFGenerationService {
  /**
   * Generate PDF from form response
   */
  async generateFormResponsePDF(
    formData: Record<string, FormSectionData>,
    resourceTitle: string,
    memberName: string,
    options: PDFGenerationOptions & {
      resourceDescription?: string;
      memberEmail?: string;
      completedAt?: Date | null;
    } = {}
  ): Promise<PDFGenerationResult> {
    return generateFormPDF(formData, resourceTitle, memberName, options);
  }
}

// Export singleton instance
export const pdfGenerationService = new PDFGenerationService();
