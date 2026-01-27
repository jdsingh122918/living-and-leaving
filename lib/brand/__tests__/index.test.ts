import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { parse } from 'yaml';
import type { BrandConfig } from '../types';
import { YAMLParseError } from '../yaml-loader';

// Mock the partner config import
vi.mock('@brand-config', () => ({
  default: null as Partial<BrandConfig> | null,
}));

// We need to dynamically import and reset modules for each test
// to test caching behavior properly
async function getModule() {
  // Clear the module cache to get fresh imports
  vi.resetModules();
  const indexModule = await import('../index');
  return indexModule;
}

// Helper to create a mock YAML loader that parses YAML content
function createYamlLoader(yamlContent: string | null) {
  return () => {
    if (yamlContent === null) {
      return null;
    }
    return parse(yamlContent) as Partial<BrandConfig>;
  };
}

// Helper to create a mock YAML loader that throws
function createThrowingYamlLoader(error: Error) {
  return () => {
    throw error;
  };
}

describe('getBrandConfig with YAML', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Priority tests
  describe('loading priority', () => {
    it('uses YAML config over brand.config.ts when both exist', async () => {
      // Mock brand.config.ts to have different values
      vi.doMock('@brand-config', () => ({
        default: {
          name: 'TS Partner',
          shortName: 'TP',
        },
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: YAML loader returns config
      _setYamlLoaderForTesting(createYamlLoader(`
name: YAML Partner
shortName: YP
`));

      const config = getBrandConfig();

      // YAML should override TS config
      expect(config.name).toBe('YAML Partner');
      expect(config.shortName).toBe('YP');
    });

    it('falls back to brand.config.ts when no YAML exists', async () => {
      // Mock brand.config.ts
      vi.doMock('@brand-config', () => ({
        default: {
          name: 'TS Partner',
          shortName: 'TP',
        },
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: No YAML file (loader returns null)
      _setYamlLoaderForTesting(createYamlLoader(null));

      const config = getBrandConfig();

      expect(config.name).toBe('TS Partner');
      expect(config.shortName).toBe('TP');
    });

    it('falls back to defaults when neither YAML nor TS config exists', async () => {
      // Mock empty brand.config.ts
      vi.doMock('@brand-config', () => ({
        default: null,
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: No YAML file (loader returns null)
      _setYamlLoaderForTesting(createYamlLoader(null));

      const config = getBrandConfig();

      // Should have default Villages config
      expect(config.name).toBe('Villages');
      expect(config.shortName).toBe('VIL');
    });
  });

  // Merging tests
  describe('config merging', () => {
    it('deep merges YAML with defaults', async () => {
      vi.doMock('@brand-config', () => ({
        default: null,
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: YAML with partial values
      _setYamlLoaderForTesting(createYamlLoader(`
name: YAML Partner
colors:
  primary: oklch(0.6 0.1 200)
`));

      const config = getBrandConfig();

      // YAML value
      expect(config.name).toBe('YAML Partner');
      expect(config.colors.primary).toBe('oklch(0.6 0.1 200)');
      // Defaults preserved
      expect(config.colors.primaryForeground).toBe('oklch(1 0 0)');
      expect(config.features.chat).toBe(true);
    });

    it('YAML values override brand.config.ts values', async () => {
      // TS config with different values
      vi.doMock('@brand-config', () => ({
        default: {
          name: 'TS Loser',
          tagline: 'TS Tagline',
          features: {
            chat: true,
            forums: false,
          },
        },
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: YAML with some values
      _setYamlLoaderForTesting(createYamlLoader(`
name: YAML Winner
features:
  chat: false
`));

      const config = getBrandConfig();

      // YAML wins
      expect(config.name).toBe('YAML Winner');
      expect(config.features.chat).toBe(false);
      // TS config values preserved when not in YAML
      expect(config.tagline).toBe('TS Tagline');
      expect(config.features.forums).toBe(false);
    });

    it('preserves unspecified defaults', async () => {
      vi.doMock('@brand-config', () => ({
        default: null,
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: YAML with minimal values
      _setYamlLoaderForTesting(createYamlLoader(`
name: Minimal
`));

      const config = getBrandConfig();

      // All defaults should be preserved
      expect(config.shortName).toBe('VIL');
      expect(config.tagline).toBe('It takes a village');
      expect(config.domain).toBe('villages.com');
      expect(config.supportEmail).toBe('support@villages.com');
      expect(config.logos.light).toBe('/brand/logo-light.png');
      expect(config.features.chat).toBe(true);
      expect(config.email.fromAddress).toBe('noreply@villages.com');
    });

    it('deep merges fonts from YAML and TS config', async () => {
      // TS config with different font values
      vi.doMock('@brand-config', () => ({
        default: {
          fonts: {
            mono: 'Fira Code',
            googleFonts: ['Fira Code'],
          },
        },
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // Setup: YAML with partial fonts
      _setYamlLoaderForTesting(createYamlLoader(`
name: Font Partner
fonts:
  primary: Inter
`));

      const config = getBrandConfig();

      // YAML value wins for primary
      expect(config.fonts?.primary).toBe('Inter');
      // TS config values preserved for mono
      expect(config.fonts?.mono).toBe('Fira Code');
      // TS config values preserved for googleFonts
      expect(config.fonts?.googleFonts).toEqual(['Fira Code']);
    });
  });

  // Caching tests
  describe('caching', () => {
    it('caches merged config after first load', async () => {
      vi.doMock('@brand-config', () => ({
        default: null,
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      let callCount = 0;
      _setYamlLoaderForTesting(() => {
        callCount++;
        return { name: 'Cached Partner' };
      });

      // First call
      const config1 = getBrandConfig();
      // Second call
      const config2 = getBrandConfig();

      // Should be the same reference (cached)
      expect(config1).toBe(config2);
      // Loader should only be called once (during first load)
      expect(callCount).toBe(1);
    });

    it('resetBrandConfig clears cache', async () => {
      vi.doMock('@brand-config', () => ({
        default: null,
      }));

      const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
      resetBrandConfig();

      // First load
      _setYamlLoaderForTesting(createYamlLoader(`
name: Partner One
`));
      const config1 = getBrandConfig();
      expect(config1.name).toBe('Partner One');

      // Reset and set new loader
      resetBrandConfig();
      _setYamlLoaderForTesting(createYamlLoader(`
name: Partner Two
`));
      const config2 = getBrandConfig();

      // Should have new value
      expect(config2.name).toBe('Partner Two');
      // Different references
      expect(config1).not.toBe(config2);
    });
  });
});

describe('error handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('app fails to start with clear error on malformed YAML', async () => {
    vi.doMock('@brand-config', () => ({
      default: null,
    }));

    const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
    resetBrandConfig();

    // Setup: Loader throws YAMLParseError
    _setYamlLoaderForTesting(createThrowingYamlLoader(
      new YAMLParseError('Failed to parse: invalid YAML')
    ));

    // Should throw YAMLParseError
    expect(() => getBrandConfig()).toThrow(YAMLParseError);
  });

  it('logs info message when both YAML and TS config exist', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});

    // TS config has values
    vi.doMock('@brand-config', () => ({
      default: {
        name: 'TS Partner',
        shortName: 'TP',
      },
    }));

    const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
    resetBrandConfig();

    _setYamlLoaderForTesting(createYamlLoader(`
name: YAML Partner
`));

    getBrandConfig();

    expect(consoleInfo).toHaveBeenCalledWith(
      '[brand-config] Using config/brand.yaml (brand.config.ts also exists)'
    );
  });

  it('continues silently when YAML file missing', async () => {
    const consoleInfo = vi.spyOn(console, 'info').mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.doMock('@brand-config', () => ({
      default: {
        name: 'TS Partner',
      },
    }));

    const { getBrandConfig, resetBrandConfig, _setYamlLoaderForTesting } = await getModule();
    resetBrandConfig();

    // No YAML file (loader returns null)
    _setYamlLoaderForTesting(createYamlLoader(null));

    const config = getBrandConfig();

    // Should not log anything about missing YAML
    expect(consoleInfo).not.toHaveBeenCalledWith(
      expect.stringContaining('brand.yaml')
    );
    expect(consoleWarn).not.toHaveBeenCalledWith(
      expect.stringContaining('brand.yaml')
    );
    // Should still work
    expect(config.name).toBe('TS Partner');
  });
});
