'use client';

import { useMemo } from 'react';
import { getBrandConfig } from '../index';
import { BrandConfig } from '../types';

/**
 * React hook for accessing brand configuration in client components
 * Returns the brand config synchronously since it's loaded at build time
 */
export function useBrand(): BrandConfig {
  return useMemo(() => getBrandConfig(), []);
}

/**
 * Get a specific brand value
 */
export function useBrandValue<K extends keyof BrandConfig>(key: K): BrandConfig[K] {
  const brand = useBrand();
  return brand[key];
}

/**
 * Get brand name
 */
export function useBrandName(): string {
  return useBrand().name;
}

/**
 * Get brand logos based on theme
 */
export function useBrandLogos(): BrandConfig['logos'] {
  return useBrand().logos;
}
