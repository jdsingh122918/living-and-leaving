/**
 * PDF Checkbox With Nested Options Field Renderer
 * Renders hierarchical checkboxes with nested sub-options in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import type { PDFFieldProps, CheckboxWithNestedValue } from '@/lib/pdf/types';
import type { NestedCheckboxOption } from '@/components/forms/advance-directive-forms';

// Checkbox icon component
function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <View style={checked ? [styles.checkboxIcon, styles.checkboxIconChecked] : styles.checkboxIcon}>
      {checked && <Text style={styles.checkboxCheck}>✓</Text>}
    </View>
  );
}

export function PDFCheckboxWithNested({ field }: PDFFieldProps) {
  const value = field.value as CheckboxWithNestedValue | undefined;
  const selected = value?.selected || [];
  const nestedSelected = value?.nestedSelected || {};
  const explanations = value?.explanations || {};
  const options = (field.options as NestedCheckboxOption[]) || [];

  // Check if option label contains "(please explain)"
  const needsExplanation = (label: string) => {
    return label.toLowerCase().includes('(please explain)');
  };

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{field.label}</Text>
      <View style={{ marginTop: 4 }}>
        {options.map((option, index) => {
          const isChecked = selected.includes(option.value);
          const hasNested = option.nested && option.nested.length > 0;
          const nestedChecked = nestedSelected[option.value] || [];
          const hasExplanation = needsExplanation(option.label);
          const explanation = explanations[option.value];

          return (
            <View key={index} style={{ marginBottom: 8 }}>
              {/* Parent checkbox */}
              <View style={styles.checkboxRow}>
                <CheckboxIcon checked={isChecked} />
                <Text style={styles.checkboxLabel}>{option.label}</Text>
              </View>

              {/* Nested options (only if parent is checked) */}
              {isChecked && hasNested && (
                <View style={styles.nestedContent}>
                  {option.nested!.map((nestedOption, nestedIndex) => {
                    const isNestedChecked = nestedChecked.includes(nestedOption);
                    return (
                      <View key={nestedIndex} style={styles.checkboxRow}>
                        <CheckboxIcon checked={isNestedChecked} />
                        <Text style={styles.checkboxLabel}>{nestedOption}</Text>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Explanation (only if parent is checked and needs explanation) */}
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
