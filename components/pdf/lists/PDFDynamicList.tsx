/**
 * PDF Dynamic List Renderer
 * Renders family members, guardians, and relatives/friends lists in PDF documents
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles } from '@/lib/pdf/styles';
import type { PDFDynamicListProps, FamilyMemberEntry, RelativeFriendEntry, GuardianEntry } from '@/lib/pdf/types';
import { RELATIONSHIP_OPTIONS } from '@/components/forms/family-member-card';

// Helper to get relationship label
function getRelationshipLabel(value: string): string {
  const option = RELATIONSHIP_OPTIONS.find(opt => opt.value === value);
  return option ? option.label : value;
}

// Info row component for consistent field display
function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value || value.trim() === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}:</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

// Family Member Item
function FamilyMemberItem({ member, index }: { member: FamilyMemberEntry; index: number }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listItemHeader}>Family Member #{index + 1}</Text>
      <View style={styles.listGrid}>
        <View style={styles.listGridItem}>
          <InfoRow label="Name" value={member.name} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Relationship" value={getRelationshipLabel(member.relationship)} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Age" value={member.age} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Phone" value={member.phone} />
        </View>
      </View>
      <InfoRow label="Email" value={member.email} />
    </View>
  );
}

// Relative/Friend Item
function RelativeFriendItem({ person, index }: { person: RelativeFriendEntry; index: number }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listItemHeader}>Relative/Friend #{index + 1}</Text>
      <View style={styles.listGrid}>
        <View style={styles.listGridItem}>
          <InfoRow label="Name" value={person.name} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Relationship" value={person.relationship} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Phone" value={person.phone} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Email" value={person.email} />
        </View>
      </View>
    </View>
  );
}

// Guardian Item
function GuardianItem({ guardian, index }: { guardian: GuardianEntry; index: number }) {
  return (
    <View style={styles.listItem}>
      <Text style={styles.listItemHeader}>Additional Guardian #{index + 1}</Text>
      <View style={styles.listGrid}>
        <View style={styles.listGridItem}>
          <InfoRow label="Name" value={guardian.name} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Relationship" value={guardian.relationship} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Phone" value={guardian.phone} />
        </View>
        <View style={styles.listGridItem}>
          <InfoRow label="Email" value={guardian.email} />
        </View>
      </View>
      <InfoRow label="Address" value={guardian.address} />
    </View>
  );
}

export function PDFDynamicList({ listType, familyMembers, relativesFriends, guardians, notes }: PDFDynamicListProps) {
  // Render based on list type
  switch (listType) {
    case 'family-members':
      if (!familyMembers || familyMembers.length === 0) {
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Family Members</Text>
            </View>
            <Text style={styles.fieldValueEmpty}>No family members added</Text>
          </View>
        );
      }
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Family Members</Text>
          </View>
          <View style={styles.listContainer}>
            {familyMembers.map((member, index) => (
              <FamilyMemberItem key={member.id || index} member={member} index={index} />
            ))}
          </View>
        </View>
      );

    case 'relatives-friends':
      if (!relativesFriends || relativesFriends.length === 0) {
        return (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Other Important People in My Child's Life</Text>
            </View>
            <Text style={styles.fieldValueEmpty}>No relatives or friends added</Text>
          </View>
        );
      }
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Other Important People in My Child's Life</Text>
          </View>
          <View style={styles.listContainer}>
            {relativesFriends.map((person, index) => (
              <RelativeFriendItem key={person.id || index} person={person} index={index} />
            ))}
          </View>
        </View>
      );

    case 'guardians':
      return (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Additional Parent/Legal Guardian(s)</Text>
            <Text style={styles.sectionDescription}>
              Individuals with legal authority to make medical decisions for this child
            </Text>
          </View>
          {(!guardians || guardians.length === 0) ? (
            <Text style={styles.fieldValueEmpty}>No additional guardians added</Text>
          ) : (
            <View style={styles.listContainer}>
              {guardians.map((guardian, index) => (
                <GuardianItem key={guardian.id || index} guardian={guardian} index={index} />
              ))}
            </View>
          )}
          {notes && (
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.fieldLabel, { marginBottom: 4 }]}>Additional Notes:</Text>
              <View style={styles.fieldValueBox}>
                <Text style={styles.fieldValue}>{notes}</Text>
              </View>
            </View>
          )}
        </View>
      );

    default:
      return null;
  }
}
