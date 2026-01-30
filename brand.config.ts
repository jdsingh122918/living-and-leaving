/**
 * Partner Brand Configuration
 *
 * This file is customized by each partner after forking.
 * See docs/PARTNER_SETUP.md for instructions.
 */
import { BrandConfigInput } from "./lib/brand/types";

const brandConfig: BrandConfigInput = {
  name: "Living & Leaving",
  shortName: "L&L",
  tagline: "Living fully, leaving gracefully",
  description: "Supporting families through end of life care with compassion, resources, and community",
  domain: "livingandleaving.com",
  supportEmail: "support@livingandleaving.com",
  //
  logos: {
    light: "/brand/logo-light.png",
    dark: "/brand/logo-dark.png",
    favicon: "/brand/favicon.svg",
  },
  //
  colors: {
    primary: "oklch(0.34 0.11 305)",
    primaryForeground: "oklch(1 0 0)",
    secondary: "oklch(0.97 0.02 342)",
  },
  //
  features: {
    forums: false,
  },
  //
  email: {
    fromAddress: "noreply@livingandleaving.com",
    fromName: "Living & Leaving Care Team",
  },
};

export default brandConfig;
