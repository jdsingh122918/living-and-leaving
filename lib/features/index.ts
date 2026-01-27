import { getBrandConfig } from '../brand';
import { FeatureFlags } from '../brand/types';

/**
 * Feature flag service for checking enabled features
 */
class FeatureFlagService {
  private static instance: FeatureFlagService;

  static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled(feature: keyof FeatureFlags): boolean {
    const config = getBrandConfig();
    return config.features[feature] ?? false;
  }

  /**
   * Get all enabled features
   */
  getEnabledFeatures(): (keyof FeatureFlags)[] {
    const config = getBrandConfig();
    return Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([key]) => key as keyof FeatureFlags);
  }

  /**
   * Get all feature flags
   */
  getAllFlags(): FeatureFlags {
    return getBrandConfig().features;
  }
}

export const featureFlags = FeatureFlagService.getInstance();

/**
 * Convenience function for checking if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags.isEnabled(feature);
}

/**
 * Higher-order function to conditionally render based on feature flag
 */
export function withFeature<T>(
  feature: keyof FeatureFlags,
  enabledValue: T,
  disabledValue: T
): T {
  return isFeatureEnabled(feature) ? enabledValue : disabledValue;
}
