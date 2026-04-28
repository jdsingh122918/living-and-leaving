/**
 * PDF Section Component
 * Renders a form section with title, description, and fields
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import { PDFFieldRenderer } from './fields/PDFFieldRenderer';
import { PDFDynamicList } from './lists/PDFDynamicList';
import type { PDFSectionProps } from '@/lib/pdf/types';

export function PDFSection({ section, sectionIndex, isLastSection }: PDFSectionProps) {
  // Handle dynamic list sections (explicit flag from form schema)
  if (section.isDynamicList && section.listType) {
    return (
      <PDFDynamicList
        listType={section.listType}
        familyMembers={section.familyMembers}
        relativesFriends={section.relativesFriends}
        guardians={section.guardians}
        notes={section.notes}
      />
    );
  }

  // Handle legacy additional-guardians section (for backwards compatibility)
  // Only treat as guardians list if:
  // 1. guardians property exists AND is a non-empty array
  // 2. AND section has no regular fields (true for pure dynamic list sections)
  // This prevents normal sections with accidental guardians: [] from being misrendered
  if (
    Array.isArray(section.guardians) &&
    section.guardians.length > 0 &&
    (!section.fields || section.fields.length === 0)
  ) {
    return (
      <PDFDynamicList
        listType="guardians"
        guardians={section.guardians}
        notes={section.notes}
      />
    );
  }

  // Skip sections with no fields (unless flagged Not applicable — those
  // still render their header so the document structure stays intact for
  // legal review).
  if (!section.notApplicable && (!section.fields || section.fields.length === 0)) {
    return null;
  }

  // Sections marked Not applicable preserve their header — the body just
  // says so explicitly so a reviewer can tell the difference between
  // "section was skipped" and "we forgot to ask".
  if (section.notApplicable) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader} wrap={false}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
        </View>
        <View style={styles.sectionContent}>
          <Text style={{ fontSize: 10, fontStyle: 'italic', color: '#475569' }}>
            Not applicable for this individual.
          </Text>
        </View>
        {!isLastSection && <View style={styles.divider} />}
      </View>
    );
  }

  // Standard section rendering.
  // The outer View must allow wrapping (default in @react-pdf) so long sections
  // split across pages rather than overflowing and overlapping their content.
  // The header (title + description) stays together via wrap={false} so a
  // section heading never orphans from its first field.
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader} wrap={false}>
        <Text style={styles.sectionTitle}>{section.title}</Text>
        {section.description && (
          <Text style={styles.sectionDescription}>{section.description}</Text>
        )}
      </View>
      <View style={styles.sectionContent}>
        {section.fields.map((field, fieldIndex) => (
          <PDFFieldRenderer key={field.id || fieldIndex} field={field} />
        ))}
      </View>
      {!isLastSection && <View style={styles.divider} />}
    </View>
  );
}
