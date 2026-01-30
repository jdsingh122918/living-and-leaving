/**
 * Form PDF Document Component
 * Main document wrapper for generating PDFs from form responses
 */

import React from 'react';
import { Document, Page, View } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFSection } from './PDFSection';
import type { PDFDocumentProps } from '@/lib/pdf/types';

export function FormPDFDocument({
  formData,
  resourceTitle,
  resourceDescription,
  memberName,
  memberEmail,
  generatedAt,
  completedAt,
}: PDFDocumentProps) {
  // Convert sections object to array with entries
  const sectionEntries = Object.entries(formData);

  return (
    <Document
      title={resourceTitle}
      author="Living & Leaving"
      subject={`${resourceTitle} - ${memberName}`}
      keywords="healthcare, advance directive, living and leaving, end of life care"
      creator="Living & Leaving"
      producer="React-PDF"
    >
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <PDFHeader
          title={resourceTitle}
          description={resourceDescription}
          memberName={memberName}
          memberEmail={memberEmail}
          generatedAt={generatedAt}
          completedAt={completedAt}
        />

        {/* Form sections */}
        <View>
          {sectionEntries.map(([sectionId, section], index) => (
            <PDFSection
              key={sectionId}
              section={section}
              sectionIndex={index}
              isLastSection={index === sectionEntries.length - 1}
            />
          ))}
        </View>

        {/* Footer with page numbers */}
        <PDFFooter showPrivacy={true} />
      </Page>
    </Document>
  );
}

// Export all PDF components
export { PDFHeader } from './PDFHeader';
export { PDFFooter } from './PDFFooter';
export { PDFSection } from './PDFSection';
export { PDFFieldRenderer } from './fields/PDFFieldRenderer';
export { PDFDynamicList } from './lists/PDFDynamicList';
