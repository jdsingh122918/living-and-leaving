// This module uses Node.js fs/path and should only be imported on the server
// It is conditionally imported by index.ts
import * as fs from 'fs';
import * as path from 'path';
import { parse, YAMLParseError as YAMLLibParseError } from 'yaml';
import type { BrandConfig } from './types';

/**
 * Custom error for YAML parsing failures
 */
export class YAMLParseError extends Error {
  constructor(message: string, public cause?: Error) {
    super(message);
    this.name = 'YAMLParseError';
  }
}

/**
 * Path to the YAML config file
 */
const YAML_PATH = path.join(process.cwd(), 'config', 'brand.yaml');

/**
 * Known top-level keys in BrandConfig
 * Used for validation and warning on typos
 */
const KNOWN_KEYS = [
  'name',
  'shortName',
  'tagline',
  'description',
  'domain',
  'supportEmail',
  'privacyUrl',
  'termsUrl',
  'logos',
  'colors',
  'fonts',
  'features',
  'email',
  'legal',
];

/**
 * Validate config object and warn on unknown top-level keys
 * @param config - The parsed config object
 * @returns true if valid (may still have warnings)
 */
export function validateConfig(config: Record<string, unknown>): boolean {
  const configKeys = Object.keys(config);
  const unknownKeys = configKeys.filter((key) => !KNOWN_KEYS.includes(key));

  if (unknownKeys.length > 0) {
    console.warn(
      `Unknown keys in brand.yaml: ${unknownKeys.join(', ')}. ` +
        `Did you mean one of: ${KNOWN_KEYS.join(', ')}?`
    );
  }

  return true;
}

/**
 * Load brand configuration from config/brand.yaml
 * @returns Partial<BrandConfig> if file exists, null if not found
 * @throws YAMLParseError if YAML syntax is invalid
 */
export function loadYamlBrandConfig(): Partial<BrandConfig> | null {
  // Check if config file exists
  if (!fs.existsSync(YAML_PATH)) {
    return null;
  }

  // Read and parse YAML
  const content = fs.readFileSync(YAML_PATH, 'utf-8');

  // Handle empty file
  if (!content.trim()) {
    return {};
  }

  try {
    const parsed = parse(content);

    // Handle null/undefined from YAML parse (e.g., file with only comments)
    if (parsed === null || parsed === undefined) {
      return {};
    }

    // Validate top-level keys
    validateConfig(parsed);

    return parsed as Partial<BrandConfig>;
  } catch (error) {
    if (error instanceof YAMLLibParseError) {
      throw new YAMLParseError(
        `Failed to parse config/brand.yaml: ${error.message}`,
        error
      );
    }
    throw error;
  }
}
