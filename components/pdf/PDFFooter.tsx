/**
 * PDF Footer Component
 * Page footer with branding and page numbers
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';

interface PDFFooterProps {
  showPrivacy?: boolean;
}

export function PDFFooter({ showPrivacy = true }: PDFFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <View>
        <Text style={styles.footerText}>Villages End of Life Care Platform</Text>
        {showPrivacy && (
          <Text style={[styles.footerText, { marginTop: 2 }]}>
            This document contains personal health information
          </Text>
        )}
      </View>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}
