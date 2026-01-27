/**
 * PDF Text Field Renderer
 * Renders text and textarea fields in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, colors } from '@/lib/pdf/styles';
import type { PDFFieldProps } from '@/lib/pdf/types';

export function PDFTextField({ field }: PDFFieldProps) {
  const value = field.value as string | undefined;
  const hasValue = value && value.trim().length > 0;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      {hasValue ? (
        <View style={styles.fieldValueBox}>
          <Text style={styles.fieldValue}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.fieldValueEmpty}>Not provided</Text>
      )}
    </View>
  );
}

export function PDFTextareaField({ field }: PDFFieldProps) {
  const value = field.value as string | undefined;
  const hasValue = value && value.trim().length > 0;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      {hasValue ? (
        <View style={styles.fieldValueBox}>
          <Text style={[styles.fieldValue, { lineHeight: 1.5 }]}>{value}</Text>
        </View>
      ) : (
        <Text style={styles.fieldValueEmpty}>Not provided</Text>
      )}
    </View>
  );
}
