import { BrandConfig } from "./types";

/**
 * Default Villages brand configuration
 * This is used when no brand.config.ts exists or as fallback
 */
export const defaultBrandConfig: BrandConfig = {
  name: "Villages",
  shortName: "VIL",
  tagline: "It takes a village",
  description:
    "Supporting families through end of life care with compassion, resources, and community",

  domain: "villages.com",
  supportEmail: "support@villages.com",

  logos: {
    light: "/brand/logo-light.png",
    dark: "/brand/logo-dark.png",
    favicon: "/brand/favicon.svg",
    loginHero: "/brand/login-hero.jpg",
  },

  colors: {
    primary: "oklch(0.50 0.08 145)", // Villages Sage Green #5B7555
    primaryForeground: "oklch(1 0 0)", // White
    palette: {
      sage: "oklch(0.50 0.08 145)", // #5B7555 - Primary Sage Green
      deepTeal: "oklch(0.40 0.08 165)", // #2D5A4A - Deep Teal-Green
      forest: "oklch(0.50 0.10 160)", // #3D7A5A - Forest Green
      sea: "oklch(0.72 0.08 140)", // #8FBC8F - Dark Sea Green
      moss: "oklch(0.58 0.06 145)", // #6B8E6B - Moss Green
      olive: "oklch(0.35 0.05 145)", // #2F4F2F - Dark Olive
    },
  },

  features: {
    chat: true,
    forums: true,
    resources: true,
    notifications: true,
    advanceDirectives: true,
    pdfGeneration: true,
    healthcareTags: true,
    familyManagement: true,
    volunteerManagement: true,
    darkMode: true,
    accessibilityWidget: true,
    feedbackButton: true,
    emailNotifications: true,
  },

  email: {
    fromAddress: "noreply@villages.com",
    fromName: "Villages Care Team",
  },

  legal: {
    companyName: "Villages Care, Inc.",
    hipaaCompliant: true,
  },
};
