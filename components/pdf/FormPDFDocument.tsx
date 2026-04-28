/**
 * Form PDF Document Component
 * Main document wrapper for generating PDFs from form responses
 */

import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import { PDFHeader } from './PDFHeader';
import { PDFFooter } from './PDFFooter';
import { PDFSection } from './PDFSection';
import { PDFFieldRenderer } from './fields/PDFFieldRenderer';
import { PDFSigningSections } from './PDFSigningSection';
import type { PDFDocumentProps, PDFSigningVariant, FormSectionData, FormFieldData } from '@/lib/pdf/types';
import type { PDFSigningSectionId } from './PDFSigningSection';

// All signing section IDs that should be stripped from the main body
// Cover all ID variants across seeded forms (comprehensive, healthcare directive, etc.)
const ALL_SIGNING_SECTION_IDS = [
  'signature', 'member-signature',
  'witness-1', 'witness-2', 'witness-one', 'witness-two',
  'notary', 'notary-section', 'notary-ca',
];

// Map signing variant to which signing section components to render
const SIGNING_SECTIONS_BY_VARIANT: Record<PDFSigningVariant, PDFSigningSectionId[]> = {
  'witnesses-only':       ['signature', 'witnesses'],
  'notary-only':          ['signature', 'notary'],
  'witnesses-and-notary': ['signature', 'witnesses', 'notary'],
};

// Helper to check if a field has a value
function hasFieldValue(field: FormFieldData): boolean {
  if (!field.value) return false;
  if (typeof field.value === 'string') return field.value.trim() !== '';
  if (Array.isArray(field.value)) return field.value.length > 0;
  if (typeof field.value === 'object') {
    const val = field.value as Record<string, unknown>;
    if (Array.isArray(val.selected)) return val.selected.length > 0;
    return Object.values(val).some(v => Boolean(v));
  }
  return Boolean(field.value);
}

// Combined Witnesses Section Component (for legacy data-populated rendering)
function PDFWitnessesSection({
  witnessOne,
  witnessTwo,
  isLastSection
}: {
  witnessOne?: FormSectionData;
  witnessTwo?: FormSectionData;
  isLastSection: boolean;
}) {
  const witness1Fields = witnessOne?.fields?.filter(f => hasFieldValue(f)) || [];
  const witness2Fields = witnessTwo?.fields?.filter(f => hasFieldValue(f)) || [];

  if (witness1Fields.length === 0 && witness2Fields.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader} wrap={false}>
        <Text style={styles.sectionTitle}>Witnesses</Text>
        <Text style={styles.sectionDescription}>
          We certify that: (I) We witnessed the signature on this document, (II) We are at least 18 years of age, (III) We are not named as a medical decision maker in this document.
        </Text>
      </View>

      <View style={styles.sectionContent}>
        {witness1Fields.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.fieldLabel, { marginBottom: 8, fontSize: 11 }]}>Witness One</Text>
            {witness1Fields.map((field, idx) => (
              <PDFFieldRenderer key={field.id || idx} field={field} />
            ))}
          </View>
        )}

        {witness2Fields.length > 0 && (
          <View>
            <Text style={[styles.fieldLabel, { marginBottom: 8, fontSize: 11 }]}>Witness Two</Text>
            {witness2Fields.map((field, idx) => (
              <PDFFieldRenderer key={field.id || idx} field={field} />
            ))}
          </View>
        )}
      </View>

      {!isLastSection && <View style={styles.divider} />}
    </View>
  );
}

// Diagonal "DRAFT" watermark anchored to the page. Rendered last so it
// paints over the form content. fixed=true keeps it on every page.
function DraftWatermark() {
  return (
    <View
      fixed
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontSize: 110,
          fontWeight: 700,
          color: '#94a3b8',
          opacity: 0.18,
          transform: 'rotate(-30deg)',
          letterSpacing: 8,
        }}
      >
        DRAFT
      </Text>
    </View>
  );
}

export function FormPDFDocument({
  formData,
  resourceTitle,
  resourceDescription,
  memberName,
  memberEmail,
  generatedAt,
  completedAt,
  signingVariant,
  isDraft,
}: PDFDocumentProps) {
  // Strip ALL signing sections from the main body
  const sectionEntries = Object.entries(formData).filter(
    ([id]) => !ALL_SIGNING_SECTION_IDS.includes(id)
  );

  // For legacy support: if no signingVariant, fall back to data-populated witness rendering
  const witnessOne = formData['witness-one'] || formData['witness-1'];
  const witnessTwo = formData['witness-two'] || formData['witness-2'];
  const hasLegacyWitnesses = !signingVariant && (witnessOne || witnessTwo);

  // Get the signing sections to render based on variant
  const signingSections = signingVariant ? SIGNING_SECTIONS_BY_VARIANT[signingVariant] : undefined;

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

        {/* Form sections (body — no signing sections) */}
        <View>
          {sectionEntries.map(([sectionId, section], index) => (
            <PDFSection
              key={sectionId}
              section={section}
              sectionIndex={index}
              isLastSection={!signingSections && !hasLegacyWitnesses && index === sectionEntries.length - 1}
            />
          ))}

          {/* Variant-driven blank signing sections */}
          {signingSections && (
            <PDFSigningSections sections={signingSections} />
          )}

          {/* Legacy: data-populated witnesses (when no variant specified) */}
          {hasLegacyWitnesses && (
            <PDFWitnessesSection
              witnessOne={witnessOne}
              witnessTwo={witnessTwo}
              isLastSection={true}
            />
          )}
        </View>

        {/* Footer with page numbers */}
        <PDFFooter showPrivacy={true} />

        {/* Watermark layer rendered last so it paints over content */}
        {isDraft && <DraftWatermark />}
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
