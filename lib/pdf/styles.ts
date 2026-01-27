/**
 * PDF Styling Definitions
 * Colors, typography, and spacing for professional healthcare documents
 */

import { StyleSheet } from "@react-pdf/renderer";

// Color palette for healthcare documents - Villages Green Theme
export const colors = {
  primary: "#2D5A4A", // Villages Deep Teal-Green - professional healthcare
  secondary: "#2d3748", // Dark gray
  text: "#1a202c", // Near black
  textMuted: "#718096", // Gray for secondary text
  border: "#e2e8f0", // Light gray borders
  background: "#f7fafc", // Off white background
  accent: "#5B7555", // Villages Sage Green accent
  success: "#3D7A5A", // Villages Forest Green for completed
  white: "#ffffff",
};

// Spacing scale (in points)
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Page dimensions (Letter size)
export const page = {
  width: 612, // 8.5 inches
  height: 792, // 11 inches
  marginTop: 54,
  marginBottom: 54,
  marginLeft: 54,
  marginRight: 54,
};

// Typography styles
export const typography = {
  documentTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: colors.primary,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: 600,
    color: colors.secondary,
  },
  fieldValue: {
    fontSize: 10,
    fontWeight: 400,
    color: colors.text,
  },
  bodyText: {
    fontSize: 10,
    fontWeight: 400,
    color: colors.text,
  },
  caption: {
    fontSize: 9,
    fontWeight: 400,
    color: colors.textMuted,
  },
  footer: {
    fontSize: 8,
    fontWeight: 400,
    color: colors.textMuted,
  },
};

// Main stylesheet for PDF components
export const styles = StyleSheet.create({
  // Page layout
  page: {
    paddingTop: page.marginTop,
    paddingBottom: page.marginBottom + 20, // Extra space for footer
    paddingHorizontal: page.marginLeft,
    fontSize: 10,
    color: colors.text,
    backgroundColor: colors.white,
  },

  // Header styles
  header: {
    marginBottom: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  headerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  headerMetaItem: {
    fontSize: 9,
    color: colors.textMuted,
  },

  // Footer styles
  footer: {
    position: "absolute",
    bottom: 30,
    left: page.marginLeft,
    right: page.marginRight,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 8,
    color: colors.textMuted,
  },
  pageNumber: {
    fontSize: 8,
    color: colors.textMuted,
  },

  // Section styles
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: colors.primary,
  },
  sectionDescription: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sectionContent: {
    paddingLeft: spacing.xs,
  },

  // Field styles
  field: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.secondary,
    marginBottom: spacing.xs,
  },
  fieldValue: {
    fontSize: 10,
    color: colors.text,
  },
  fieldValueBox: {
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  fieldValueEmpty: {
    fontSize: 10,
    color: colors.textMuted,
    fontStyle: "italic",
  },

  // Checkbox/Radio styles
  checkboxRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.xs,
  },
  checkboxIcon: {
    width: 12,
    height: 12,
    marginRight: spacing.sm,
    marginTop: 1,
    borderWidth: 1,
    borderColor: colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxIconChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxCheck: {
    fontSize: 8,
    color: colors.white,
  },
  radioIcon: {
    width: 12,
    height: 12,
    marginRight: spacing.sm,
    marginTop: 1,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  radioIconSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  checkboxLabel: {
    fontSize: 10,
    color: colors.text,
    flex: 1,
  },

  // Nested content styles
  nestedContent: {
    marginLeft: spacing.lg,
    paddingLeft: spacing.md,
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  explanationBox: {
    marginLeft: spacing.lg,
    marginTop: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.background,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  explanationLabel: {
    fontSize: 8,
    color: colors.textMuted,
    marginBottom: 2,
  },
  explanationText: {
    fontSize: 9,
    color: colors.text,
    fontStyle: "italic",
  },

  // Contact/Info block styles
  infoBlock: {
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    marginBottom: spacing.md,
  },
  infoBlockTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  infoLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: colors.textMuted,
    width: 80,
  },
  infoValue: {
    fontSize: 9,
    color: colors.text,
    flex: 1,
  },

  // Dynamic list styles
  listContainer: {
    marginBottom: spacing.md,
  },
  listItem: {
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
  },
  listItemHeader: {
    fontSize: 11,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  listGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  listGridItem: {
    width: "50%",
    paddingRight: spacing.sm,
    marginBottom: spacing.xs,
  },

  // Utility styles
  row: {
    flexDirection: "row",
  },
  column: {
    flexDirection: "column",
  },
  textBold: {
    fontWeight: "bold",
  },
  textItalic: {
    fontStyle: "italic",
  },
  textMuted: {
    color: colors.textMuted,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginVertical: spacing.md,
  },
});
