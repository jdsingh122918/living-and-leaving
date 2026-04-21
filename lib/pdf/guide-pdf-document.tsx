import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface GuideContentBlock {
  type: 'paragraph' | 'heading' | 'subheading' | 'list' | 'numbered-list' | 'tip' | 'note';
  text?: string;
  items?: string[];
  steps?: { title: string; description: string }[];
}

export interface GuideContentSection {
  id: string;
  title: string;
  blocks: GuideContentBlock[];
}

export interface GuidePDFDocumentProps {
  title: string;
  subtitle: string;
  sections: GuideContentSection[];
  generatedAt: Date;
}

const styles = StyleSheet.create({
  page: {
    padding: 56,
    fontSize: 11,
    fontFamily: 'Helvetica',
    color: '#1a1a1a',
    lineHeight: 1.5,
  },
  coverTitle: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  coverSubtitle: {
    fontSize: 14,
    color: '#5a5a5a',
    marginBottom: 24,
  },
  coverFooter: {
    fontSize: 10,
    color: '#999',
    marginTop: 64,
  },
  tocTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    marginTop: 24,
  },
  tocItem: {
    fontSize: 11,
    marginBottom: 6,
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 12,
    color: '#1a1a1a',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
    paddingBottom: 4,
  },
  heading: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    marginTop: 12,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginTop: 10,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 11,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 11,
    marginBottom: 4,
    marginLeft: 12,
  },
  numberedStep: {
    fontSize: 11,
    marginBottom: 8,
    marginLeft: 12,
  },
  numberedStepTitle: {
    fontFamily: 'Helvetica-Bold',
  },
  tipBox: {
    backgroundColor: '#eff6ff',
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6',
    padding: 8,
    marginVertical: 6,
  },
  tipText: {
    fontSize: 10,
    color: '#1e3a8a',
  },
  noteBox: {
    backgroundColor: '#fffbeb',
    borderLeftWidth: 3,
    borderLeftColor: '#d97706',
    padding: 8,
    marginVertical: 6,
  },
  noteText: {
    fontSize: 10,
    color: '#7c2d12',
  },
  pageNumber: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 9,
    color: '#999',
  },
});

function renderBlock(block: GuideContentBlock, idx: number): React.ReactNode {
  switch (block.type) {
    case 'paragraph':
      return <Text key={idx} style={styles.paragraph}>{block.text}</Text>;
    case 'heading':
      return <Text key={idx} style={styles.heading}>{block.text}</Text>;
    case 'subheading':
      return <Text key={idx} style={styles.subheading}>{block.text}</Text>;
    case 'list':
      return (
        <View key={idx}>
          {(block.items || []).map((item, i) => (
            <Text key={i} style={styles.listItem}>{`\u2022 ${item}`}</Text>
          ))}
        </View>
      );
    case 'numbered-list':
      return (
        <View key={idx}>
          {(block.steps || []).map((step, i) => (
            <Text key={i} style={styles.numberedStep}>
              <Text style={styles.numberedStepTitle}>{`${i + 1}. ${step.title}`}</Text>
              {`  ${step.description}`}
            </Text>
          ))}
        </View>
      );
    case 'tip':
      return (
        <View key={idx} style={styles.tipBox}>
          <Text style={styles.tipText}>{`Tip: ${block.text}`}</Text>
        </View>
      );
    case 'note':
      return (
        <View key={idx} style={styles.noteBox}>
          <Text style={styles.noteText}>{`Note: ${block.text}`}</Text>
        </View>
      );
    default:
      return null;
  }
}

export function GuidePDFDocument({ title, subtitle, sections, generatedAt }: GuidePDFDocumentProps): React.ReactElement {
  const dateStr = generatedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Document>
      {/* Cover + TOC */}
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.coverTitle}>{title}</Text>
        <Text style={styles.coverSubtitle}>{subtitle}</Text>
        <Text style={styles.coverFooter}>{`Generated ${dateStr}`}</Text>

        <Text style={styles.tocTitle}>Contents</Text>
        {sections.map((s, i) => (
          <Text key={s.id} style={styles.tocItem}>{`${i + 1}. ${s.title}`}</Text>
        ))}
        <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} fixed />
      </Page>

      {/* Section pages */}
      {sections.map((section) => (
        <Page key={section.id} size="LETTER" style={styles.page}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.blocks.map((block, idx) => renderBlock(block, idx))}
          <Text style={styles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`} fixed />
        </Page>
      ))}
    </Document>
  );
}
