/**
 * PDF Radio Field Renderer
 * Renders radio button selections in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import type { PDFFieldProps } from '@/lib/pdf/types';

// Radio icon component
function RadioIcon({ selected }: { selected: boolean }) {
  return (
    <View style={selected ? [styles.radioIcon, styles.radioIconSelected] : styles.radioIcon}>
      {selected && <View style={styles.radioDot} />}
    </View>
  );
}

export function PDFRadioField({ field }: PDFFieldProps) {
  const value = field.value as string | undefined;
  const options = (field.options as string[]) || [];

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <View style={{ marginTop: 4 }}>
        {options.map((option, index) => {
          const isSelected = value === option;
          return (
            <View key={index} style={styles.checkboxRow}>
              <RadioIcon selected={isSelected} />
              <Text style={styles.checkboxLabel}>{option}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
