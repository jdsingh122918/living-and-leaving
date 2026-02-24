/**
 * PDF Signing Section Component
 * Renders blank signing lines for offline paper signing.
 * These sections are never filled online — they only appear in the PDF.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { styles, colors, spacing } from '@/lib/pdf/styles';

// Blank line for hand-written fields
function SignatureLine({ label, width = '100%' }: { label: string; width?: string | number }) {
  return (
    <View style={{ marginBottom: spacing.lg, width: width as number }}>
      <View style={{ borderBottomWidth: 1, borderBottomColor: colors.text, marginBottom: spacing.xs, height: 20 }} />
      <Text style={{ fontSize: 8, color: colors.textMuted }}>{label}</Text>
    </View>
  );
}

// Two-column row of signature lines
function SignatureLineRow({ left, right }: { left: string; right: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: spacing.lg }}>
      <View style={{ flex: 1 }}>
        <SignatureLine label={left} />
      </View>
      <View style={{ flex: 1 }}>
        <SignatureLine label={right} />
      </View>
    </View>
  );
}

function PrincipalSignatureSection() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader} wrap={false}>
        <Text style={styles.sectionTitle}>Signature</Text>
        <Text style={styles.sectionDescription}>
          I declare that I am of sound mind, understand the nature and consequences of this Advance Care Plan, and sign it voluntarily.
        </Text>
      </View>
      <View style={styles.sectionContent}>
        <SignatureLineRow left="Printed Name" right="Date" />
        <SignatureLine label="Signature" />
      </View>
      <View style={styles.divider} />
    </View>
  );
}

function WitnessSection({ witnessNumber }: { witnessNumber: 1 | 2 }) {
  const title = witnessNumber === 1 ? 'Witness One' : 'Witness Two';

  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[styles.fieldLabel, { marginBottom: spacing.sm, fontSize: 11 }]}>{title}</Text>
      <SignatureLineRow left="Print Name" right="Date" />
      <SignatureLine label="Address" />
      <SignatureLineRow left="Phone" right="Signature" />
    </View>
  );
}

function WitnessesSection() {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader} wrap={false}>
        <Text style={styles.sectionTitle}>Witnesses</Text>
        <Text style={styles.sectionDescription}>
          I declare that the person who signed or acknowledged this document is personally known to me, appeared to be of sound mind, and signed voluntarily and without duress. I further declare that I am not the person's Health Care Agent, a health care provider or employee, an owner/operator of a care facility, financially responsible for the person's care, or a beneficiary of the person's estate.
        </Text>
      </View>
      <View style={styles.sectionContent}>
        <WitnessSection witnessNumber={1} />
        <WitnessSection witnessNumber={2} />
      </View>
      <View style={styles.divider} />
    </View>
  );
}

function NotarySection() {
  return (
    <View style={styles.section} wrap={false}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>California Notary Acknowledgment</Text>
        <Text style={styles.sectionDescription}>
          A notary public or other officer completing this certificate verifies only the identity of the individual who signed the document to which this certificate is attached, and not the truthfulness, accuracy, or validity of that document.
        </Text>
      </View>
      <View style={styles.sectionContent}>
        <Text style={{ fontSize: 10, color: colors.text, marginBottom: spacing.md }}>
          State of California
        </Text>
        <SignatureLine label="County of" />
        <SignatureLine label="On (date)" />
        <SignatureLine label="before me, (insert name and title of the officer)" />
        <SignatureLine label="personally appeared" />
        <Text style={{ fontSize: 9, color: colors.text, marginBottom: spacing.lg, lineHeight: 1.5 }}>
          who proved to me on the basis of satisfactory evidence to be the person(s) whose name(s) is/are subscribed to the within instrument and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies), and that by his/her/their signature(s) on the instrument the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.
        </Text>
        <Text style={{ fontSize: 9, color: colors.text, marginBottom: spacing.lg }}>
          I certify under PENALTY OF PERJURY under the laws of the State of California that the foregoing paragraph is true and correct.
        </Text>
        <Text style={{ fontSize: 9, color: colors.text, marginBottom: spacing.lg }}>
          WITNESS my hand and official seal.
        </Text>
        <SignatureLineRow left="Notary Signature" right="Date" />
        <View style={{ flexDirection: 'row', gap: spacing.lg }}>
          <View style={{ flex: 1 }}>
            <SignatureLine label="Notary Printed Name" />
          </View>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, height: 60, marginBottom: spacing.lg }}>
            <Text style={{ fontSize: 8, color: colors.textMuted }}>(Official Seal)</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export type PDFSigningSectionId = 'signature' | 'witnesses' | 'notary';

export function PDFSigningSections({ sections }: { sections: PDFSigningSectionId[] }) {
  return (
    <View>
      {sections.includes('signature') && <PrincipalSignatureSection />}
      {sections.includes('witnesses') && <WitnessesSection />}
      {sections.includes('notary') && <NotarySection />}
    </View>
  );
}
