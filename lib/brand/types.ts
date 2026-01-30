/**
 * Brand configuration for white-label deployments
 * Partners customize this in brand.config.ts at the project root
 */
export interface BrandConfig {
  // Core Identity
  name: string; // "Villages" → "Partner Care"
  shortName: string; // "PPCC" → "PC"
  tagline: string; // "End of Life Care Platform"
  description: string; // For meta tags and SEO

  // Contact & Links
  domain: string; // "villages.com" → "partnercare.com"
  supportEmail: string; // "support@villages.com"
  privacyUrl?: string;
  termsUrl?: string;

  // Visual Identity
  logos: {
    light: string; // "/brand/logo-light.png"
    dark: string; // "/brand/logo-dark.png"
    favicon: string; // "/brand/favicon.svg"
    loginHero?: string; // "/brand/login-hero.jpg"
    ogImage?: string; // Open Graph image
  };

  // Color Palette (OkLCH format matching existing globals.css)
  colors: {
    primary: string; // Main brand color
    primaryForeground: string; // Text on primary
    secondary?: string;
    accent?: string;
    // Extended palette (optional - Villages Green Theme)
    palette?: {
      // Villages Green Palette
      sage?: string; // oklch(0.50 0.08 145) - #5B7555 Primary Sage Green
      deepTeal?: string; // oklch(0.40 0.08 165) - #2D5A4A Deep Teal-Green
      forest?: string; // oklch(0.50 0.10 160) - #3D7A5A Forest Green
      sea?: string; // oklch(0.72 0.08 140) - #8FBC8F Dark Sea Green
      moss?: string; // oklch(0.58 0.06 145) - #6B8E6B Moss Green
      olive?: string; // oklch(0.35 0.05 145) - #2F4F2F Dark Olive
      // Legacy aliases for backward compatibility
      orange?: string; // Maps to sage
      pink?: string; // Maps to deepTeal
      teal?: string; // Maps to forest
      purple?: string; // Maps to sea
      blue?: string; // Maps to moss
      gray?: string; // Maps to olive
    };
  };

  // Typography (optional - defaults to Roboto)
  fonts?: {
    primary?: string;
    mono?: string;
    googleFonts?: string[];
  };

  // Feature Configuration
  features: FeatureFlags;

  // Email Configuration
  email: {
    fromAddress: string; // "noreply@partnercare.com"
    fromName: string; // "Partner Care Team"
    replyTo?: string;
  };

  // Legal & Compliance (optional)
  legal?: {
    companyName: string;
    address?: string;
    hipaaCompliant?: boolean;
  };
}

export interface FeatureFlags {
  // Core Features
  chat: boolean;
  forums: boolean;
  resources: boolean;
  notifications: boolean;

  // Healthcare Features
  advanceDirectives: boolean;
  pdfGeneration: boolean;
  healthcareTags: boolean;
  familyManagement: boolean;
  volunteerManagement: boolean;

  // UI Features
  darkMode: boolean;
  accessibilityWidget: boolean;
  feedbackButton: boolean;

  // Email Features
  emailNotifications: boolean;
}

/**
 * Input type for partner brand overrides (brand.config.ts / brand.yaml).
 * All fields are optional; features can be partially specified
 * and will be merged with defaults at runtime.
 */
export type BrandConfigInput = Partial<Omit<BrandConfig, 'features'>> & {
  features?: Partial<FeatureFlags>;
};
