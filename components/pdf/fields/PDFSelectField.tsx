/**
 * PDF Select Field Renderer
 * Renders select dropdown values in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import type { PDFFieldProps } from '@/lib/pdf/types';

export function PDFSelectField({ field }: PDFFieldProps) {
  const value = field.value as string | undefined;

  // Find the label for the selected value
  let displayValue = value;
  if (value && field.selectOptions) {
    const selectedOption = field.selectOptions.find(opt => opt.value === value);
    if (selectedOption) {
      displayValue = selectedOption.label;
    }
  }

  const hasValue = displayValue && displayValue.trim().length > 0;

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      {hasValue ? (
        <Text style={styles.fieldValue}>{displayValue}</Text>
      ) : (
        <Text style={styles.fieldValueEmpty}>Not selected</Text>
      )}
    </View>
  );
}
