/**
 * PDF Checkbox Field Renderer
 * Renders checkbox fields (single and multi-select) in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, colors } from '@/lib/pdf/styles';
import type { PDFFieldProps } from '@/lib/pdf/types';

// Checkbox icon component
function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <View style={checked ? [styles.checkboxIcon, styles.checkboxIconChecked] : styles.checkboxIcon}>
      {checked && <Text style={styles.checkboxCheck}>✓</Text>}
    </View>
  );
}

export function PDFCheckboxField({ field }: PDFFieldProps) {
  const value = field.value;

  // Single checkbox (boolean)
  if (typeof value === 'boolean') {
    return (
      <View style={styles.field}>
        <View style={styles.checkboxRow}>
          <CheckboxIcon checked={value} />
          <Text style={styles.checkboxLabel}>{field.label}</Text>
        </View>
      </View>
    );
  }

  // Multi-select checkbox (string array with options)
  if (Array.isArray(value) && field.options) {
    const selectedValues = value as string[];
    const options = field.options as string[];

    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <View style={{ marginTop: 4 }}>
          {options.map((option, index) => {
            const isChecked = selectedValues.includes(option);
            return (
              <View key={index} style={styles.checkboxRow}>
                <CheckboxIcon checked={isChecked} />
                <Text style={styles.checkboxLabel}>{option}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  // No value - show options unchecked
  if (field.options) {
    const options = field.options as string[];
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{field.label}</Text>
        <View style={{ marginTop: 4 }}>
          {options.map((option, index) => (
            <View key={index} style={styles.checkboxRow}>
              <CheckboxIcon checked={false} />
              <Text style={styles.checkboxLabel}>{option}</Text>
            </View>
          ))}
        </View>
      </View>
    );
  }

  return null;
}
