/**
 * PDF Header Component
 * Document header with title, member info, and generation date
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';

interface PDFHeaderProps {
  title: string;
  description?: string;
  memberName: string;
  memberEmail?: string;
  generatedAt: Date;
  completedAt?: Date | null;
}

export function PDFHeader({
  title,
  description,
  memberName,
  memberEmail,
  generatedAt,
  completedAt,
}: PDFHeaderProps) {
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      {description && (
        <Text style={styles.headerSubtitle}>{description}</Text>
      )}
      <View style={styles.headerMeta}>
        <View>
          <Text style={styles.headerMetaItem}>Prepared by: {memberName}</Text>
          {memberEmail && (
            <Text style={styles.headerMetaItem}>{memberEmail}</Text>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.headerMetaItem}>
            Generated: {formatDateTime(generatedAt)}
          </Text>
          {completedAt && (
            <Text style={styles.headerMetaItem}>
              Completed: {formatDate(completedAt)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
