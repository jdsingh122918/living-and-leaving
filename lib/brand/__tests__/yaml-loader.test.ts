import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { loadYamlBrandConfig, validateConfig, YAMLParseError } from '../yaml-loader';

// Mock fs module
vi.mock('fs');

const mockFs = vi.mocked(fs);

describe('loadYamlBrandConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Suppress console.warn during tests
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // File existence tests
  it('returns null when config/brand.yaml does not exist', () => {
    mockFs.existsSync.mockReturnValue(false);

    const result = loadYamlBrandConfig();

    expect(result).toBeNull();
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining(path.join('config', 'brand.yaml'))
    );
  });

  it('returns parsed config when config/brand.yaml exists', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Partner Care
shortName: PC
`);

    const result = loadYamlBrandConfig();

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Partner Care');
    expect(result?.shortName).toBe('PC');
  });

  // Parsing tests
  it('parses valid YAML with all fields', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Full Partner
shortName: FP
tagline: Full Partner Care
description: A complete care platform
domain: fullpartner.com
supportEmail: support@fullpartner.com
privacyUrl: https://fullpartner.com/privacy
termsUrl: https://fullpartner.com/terms
logos:
  light: /brand/logo-light.png
  dark: /brand/logo-dark.png
  favicon: /brand/favicon.svg
colors:
  primary: oklch(0.5 0.1 200)
  primaryForeground: oklch(1 0 0)
fonts:
  primary: Inter
  mono: JetBrains Mono
features:
  chat: true
  forums: false
email:
  fromAddress: noreply@fullpartner.com
  fromName: Full Partner Team
legal:
  companyName: Full Partner Inc
  hipaaCompliant: true
`);

    const result = loadYamlBrandConfig();

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Full Partner');
    expect(result?.domain).toBe('fullpartner.com');
    expect(result?.logos?.light).toBe('/brand/logo-light.png');
    expect(result?.colors?.primary).toBe('oklch(0.5 0.1 200)');
    expect(result?.features?.chat).toBe(true);
    expect(result?.features?.forums).toBe(false);
    expect(result?.email?.fromName).toBe('Full Partner Team');
    expect(result?.legal?.companyName).toBe('Full Partner Inc');
  });

  it('parses valid YAML with partial fields', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Minimal Partner
`);

    const result = loadYamlBrandConfig();

    expect(result).not.toBeNull();
    expect(result?.name).toBe('Minimal Partner');
    expect(result?.shortName).toBeUndefined();
    expect(result?.logos).toBeUndefined();
  });

  it('throws YAMLParseError on malformed YAML syntax', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Bad Config
  invalid indentation here
    this: is wrong
`);

    expect(() => loadYamlBrandConfig()).toThrow(YAMLParseError);
  });

  it('returns empty object for empty YAML file', () => {
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('');

    const result = loadYamlBrandConfig();

    expect(result).toEqual({});
  });

  // Validation tests
  it('warns on unknown top-level keys (typos)', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Partner
nmae: Typo Partner
suportEmail: typo@example.com
`);

    loadYamlBrandConfig();

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown keys in brand.yaml')
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('nmae')
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('suportEmail')
    );
  });

  it('allows nested unknown keys without warning', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Partner
colors:
  primary: oklch(0.5 0.1 200)
  customColor: oklch(0.3 0.2 100)
`);

    loadYamlBrandConfig();

    // Should not warn about nested customColor
    expect(consoleWarn).not.toHaveBeenCalled();
  });

  it('accepts all valid BrandConfig fields', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue(`
name: Partner
shortName: PC
tagline: Partner Care
description: Description
domain: partner.com
supportEmail: support@partner.com
privacyUrl: https://partner.com/privacy
termsUrl: https://partner.com/terms
logos:
  light: /logo.png
colors:
  primary: blue
fonts:
  primary: Arial
features:
  chat: true
email:
  fromAddress: noreply@partner.com
legal:
  companyName: Partner Inc
`);

    loadYamlBrandConfig();

    // Should not warn about any valid keys
    expect(consoleWarn).not.toHaveBeenCalled();
  });
});

describe('validateConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns true for valid partial config', () => {
    const config = {
      name: 'Partner',
      domain: 'partner.com',
    };

    const result = validateConfig(config);

    expect(result).toBe(true);
  });

  it('logs warning for unknown keys', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = {
      name: 'Partner',
      unknownKey: 'value',
      anotherUnknown: 'value2',
    };

    validateConfig(config);

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Unknown keys in brand.yaml')
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('unknownKey')
    );
    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('anotherUnknown')
    );
  });

  it('does not warn for known optional keys', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const config = {
      name: 'Partner',
      privacyUrl: 'https://partner.com/privacy',
      termsUrl: 'https://partner.com/terms',
      fonts: { primary: 'Arial' },
      legal: { companyName: 'Partner Inc' },
    };

    validateConfig(config);

    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
