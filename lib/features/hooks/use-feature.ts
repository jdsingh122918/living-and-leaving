'use client';

import { useMemo } from 'react';
import { FeatureFlags } from '../../brand/types';
import { isFeatureEnabled, featureFlags } from '../index';

/**
 * React hook for checking feature flags in client components
 */
export function useFeature(feature: keyof FeatureFlags): boolean {
  return useMemo(() => isFeatureEnabled(feature), [feature]);
}

/**
 * React hook for getting all feature flags
 */
export function useFeatures(): FeatureFlags {
  return useMemo(() => featureFlags.getAllFlags(), []);
}

/**
 * React hook for conditional rendering based on feature flag
 */
export function useFeatureValue<T>(
  feature: keyof FeatureFlags,
  enabledValue: T,
  disabledValue: T
): T {
  const enabled = useFeature(feature);
  return enabled ? enabledValue : disabledValue;
}
