/**
 * PDF Checkbox With Text Field Renderer
 * Renders checkboxes with optional explanation text fields in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import type { PDFFieldProps, CheckboxWithTextValue } from '@/lib/pdf/types';

// Checkbox icon component
function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <View style={checked ? [styles.checkboxIcon, styles.checkboxIconChecked] : styles.checkboxIcon}>
      {checked && <Text style={styles.checkboxCheck}>✓</Text>}
    </View>
  );
}

export function PDFCheckboxWithText({ field }: PDFFieldProps) {
  const value = field.value as CheckboxWithTextValue | undefined;
  const selected = value?.selected || [];
  const explanations = value?.explanations || {};
  const options = (field.options as string[]) || [];
  const showExplainFor = field.showExplainFor || [];

  // Check if an option should show explanation
  const shouldShowExplanation = (option: string) => {
    if (!showExplainFor.length) return false;
    return showExplainFor.some(pattern => option.includes(pattern) || pattern === option);
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <View style={{ marginTop: 4 }}>
        {options.map((option, index) => {
          const isChecked = selected.includes(option);
          const hasExplanation = shouldShowExplanation(option);
          const explanation = explanations[option];

          return (
            <View key={index} style={{ marginBottom: 6 }}>
              <View style={styles.checkboxRow}>
                <CheckboxIcon checked={isChecked} />
                <Text style={styles.checkboxLabel}>{option}</Text>
              </View>
              {/* Show explanation if option is checked and has explanation text */}
              {isChecked && hasExplanation && explanation && (
                <View style={styles.explanationBox}>
                  <Text style={styles.explanationLabel}>Explanation:</Text>
                  <Text style={styles.explanationText}>{explanation}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
