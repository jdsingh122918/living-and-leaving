import { BrandConfig } from './types';
import { defaultBrandConfig } from './defaults';
import partnerConfig from '@brand-config';

// Cached config - computed once on server, passed to client via React context
let brandConfig: BrandConfig | null = null;

// Server-side only: YAML config loaded once at startup
let yamlConfigLoaded = false;
let yamlConfig: Partial<BrandConfig> | null = null;

// For testing: allows injecting a mock YAML loader
let yamlLoaderOverride: (() => Partial<BrandConfig> | null) | null = null;

/**
 * For testing only: override the YAML loader function
 */
export function _setYamlLoaderForTesting(
  loader: (() => Partial<BrandConfig> | null) | null
): void {
  yamlLoaderOverride = loader;
}

/**
 * Load YAML config (server-side only)
 * This is a separate function to isolate the dynamic import
 */
function loadYamlConfigOnServer(): Partial<BrandConfig> | null {
  if (yamlConfigLoaded) {
    return yamlConfig;
  }

  // Use override if set (for testing)
  if (yamlLoaderOverride !== null) {
    yamlConfig = yamlLoaderOverride();
    yamlConfigLoaded = true;
    return yamlConfig;
  }

  // Only load on server (Node.js environment)
  if (typeof window === 'undefined') {
    try {
      // Dynamic require to avoid bundling fs/path for client
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { loadYamlBrandConfig } = require('./yaml-loader');
      yamlConfig = loadYamlBrandConfig();
    } catch (error) {
      // Re-throw YAML parse errors (they should crash the app at startup)
      if (error && typeof error === 'object' && 'name' in error && error.name === 'YAMLParseError') {
        throw error;
      }
      // For other errors (module resolution), log and continue
      console.warn('[brand-config] Failed to load yaml-loader:', error);
      yamlConfig = null;
    }
  } else {
    // Client-side: no YAML loading
    yamlConfig = null;
  }

  yamlConfigLoaded = true;
  return yamlConfig;
}

/**
 * Get the brand configuration
 * Loading priority: YAML config → brand.config.ts → defaults
 */
export function getBrandConfig(): BrandConfig {
  if (brandConfig) {
    return brandConfig;
  }

  // Load YAML config (server-only, returns null on client or if file doesn't exist)
  // Throws YAMLParseError if YAML is malformed (app should fail to start)
  const loadedYamlConfig = loadYamlConfigOnServer();

  // Log info when both config sources exist (server-side only)
  if (typeof window === 'undefined') {
    const partnerHasValues = partnerConfig && Object.keys(partnerConfig).length > 0;
    if (loadedYamlConfig && partnerHasValues) {
      console.info('[brand-config] Using config/brand.yaml (brand.config.ts also exists)');
    }
  }

  // Merge configs: defaults → partnerConfig → yamlConfig
  // Later sources override earlier ones
  brandConfig = mergeConfigs(
    defaultBrandConfig,
    partnerConfig || {},
    loadedYamlConfig ?? {}
  );

  return brandConfig;
}

/**
 * Deep merge configs with priority: defaults < partner < yaml
 * Each successive config overrides the previous
 */
function mergeConfigs(
  defaults: BrandConfig,
  partner: Partial<BrandConfig>,
  yaml: Partial<BrandConfig>
): BrandConfig {
  // First merge: defaults + partner
  const withPartner = mergeTwoConfigs(defaults, partner);
  // Second merge: result + yaml
  return mergeTwoConfigs(withPartner, yaml);
}

/**
 * Deep merge two configs, with override taking precedence
 */
function mergeTwoConfigs(base: BrandConfig, override: Partial<BrandConfig>): BrandConfig {
  return {
    ...base,
    ...override,
    logos: { ...base.logos, ...override.logos },
    colors: {
      ...base.colors,
      ...override.colors,
      palette: { ...base.colors.palette, ...override.colors?.palette },
    },
    fonts: base.fonts || override.fonts ? { ...base.fonts, ...override.fonts } : undefined,
    features: { ...base.features, ...override.features },
    email: { ...base.email, ...override.email },
    legal: {
      companyName: override.legal?.companyName ?? base.legal?.companyName ?? base.name,
      address: override.legal?.address ?? base.legal?.address,
      hipaaCompliant: override.legal?.hipaaCompliant ?? base.legal?.hipaaCompliant,
    },
  };
}

/**
 * Reset cached config (useful for testing)
 */
export function resetBrandConfig(): void {
  brandConfig = null;
  yamlConfigLoaded = false;
  yamlConfig = null;
  yamlLoaderOverride = null;
}

// Re-export types
export * from './types';
export { defaultBrandConfig } from './defaults';
