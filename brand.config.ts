/**
 * Partner Brand Configuration
 *
 * This file is customized by each partner after forking.
 * See docs/PARTNER_SETUP.md for instructions.
 */
import { BrandConfig } from "./lib/brand/types";

const brandConfig: Partial<BrandConfig> = {
  // Uncomment and customize for your brand:
  name: "Villages",
  shortName: "VIL",
  tagline: "It takes a village",
  domain: "demo.villages.com",
  supportEmail: "support@villages.com",
  //
  logos: {
    light: "/brand/logo-light.png",
    dark: "/brand/logo-dark.png",
    favicon: "/brand/favicon.svg",
  },
  //
  colors: {
    primary: "oklch(0.50 0.08 145)", // Villages Sage Green #5B7555
    primaryForeground: "oklch(1 0 0)",
  },
  //
  // features: {
  //   chat: true,
  //   forums: true,
  //   // ... enable/disable features
  // },
  //
  email: {
    fromAddress: "info@villages.com",
    fromName: "Villages Team",
  },
};

export default brandConfig;
