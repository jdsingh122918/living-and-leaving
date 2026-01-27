/**
 * Accessibility Controls Component - Enhanced for Elderly Users
 *
 * Provides user controls for accessibility features including:
 * - Font size adjustment with slider (87.5% to 200%)
 * - Quick presets: Standard, Large Print, Elderly Mode
 * - High contrast mode toggle
 * - Reduced motion support
 * - Large touch targets
 * - Persistent user preferences via localStorage
 * - Live preview of font size changes
 * - WCAG 2.1 AA compliance features
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import {
  Type,
  Eye,
  Monitor,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Accessibility,
  ZoomIn,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Accessibility preference types - Enhanced with continuous font scaling
export interface AccessibilityPreferences {
  fontScale: number; // 0.875 to 2.0 (continuous)
  highContrast: boolean;
  reducedMotion: boolean;
  largeButtons: boolean;
  elderlyMode: boolean;
  // Legacy support
  fontSize?: 'small' | 'medium' | 'large' | 'xl' | 'xxl' | 'max';
}

// Default preferences
const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  fontScale: 1,
  highContrast: false,
  reducedMotion: false,
  largeButtons: false,
  elderlyMode: false
};

// Storage key for preferences
const STORAGE_KEY = 'accessibility-preferences';

// Font scale configuration
const FONT_SCALE_CONFIG = {
  min: 0.875,
  max: 2.0,
  step: 0.125,
  default: 1,
  presets: {
    standard: { scale: 1, label: 'Standard', description: '100% - Default size' },
    largePrint: { scale: 1.5, label: 'Large Print', description: '150% - Easier to read' },
    elderly: { scale: 1.75, label: 'Elderly Mode', description: '175% - Maximum comfort' }
  }
};

// Convert scale to percentage for display
const scaleToPercent = (scale: number): number => Math.round(scale * 100);

// Get appropriate font size label for legacy support
const getFontSizeLabel = (scale: number): string => {
  if (scale <= 0.875) return 'small';
  if (scale <= 1) return 'medium';
  if (scale <= 1.125) return 'large';
  if (scale <= 1.5) return 'xl';
  if (scale <= 1.75) return 'xxl';
  return 'max';
};

/**
 * Hook for managing accessibility preferences - Enhanced version
 */
export function useAccessibilityPreferences() {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate old fontSize to new fontScale if needed
        if (parsed.fontSize && !parsed.fontScale) {
          const scaleMap: Record<string, number> = {
            small: 0.875,
            medium: 1,
            large: 1.125,
            xl: 1.5,
            xxl: 1.75,
            max: 2
          };
          parsed.fontScale = scaleMap[parsed.fontSize] || 1;
        }
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load accessibility preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Apply preferences to document
  useEffect(() => {
    if (!isLoaded) return;

    const root = document.documentElement;

    // Apply font scale using CSS variable
    root.style.setProperty('--font-size-scale', String(preferences.fontScale));
    // Set data attribute for CSS selector fallback
    root.setAttribute('data-font-scale', 'true');
    // Legacy support
    root.setAttribute('data-font-size', getFontSizeLabel(preferences.fontScale));

    // Apply high contrast
    if (preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (preferences.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply large buttons
    if (preferences.largeButtons) {
      root.classList.add('large-buttons');
    } else {
      root.classList.remove('large-buttons');
    }

    // Apply elderly mode
    if (preferences.elderlyMode) {
      root.classList.add('elderly-mode');
    } else {
      root.classList.remove('elderly-mode');
    }

  }, [preferences, isLoaded]);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: AccessibilityPreferences) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      setPreferences(newPreferences);
    } catch (error) {
      console.warn('Failed to save accessibility preferences:', error);
    }
  }, []);

  // Update specific preference
  const updatePreference = useCallback(<K extends keyof AccessibilityPreferences>(
    key: K,
    value: AccessibilityPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    // If disabling elderly mode, also reset related settings
    if (key === 'elderlyMode' && value === false) {
      // Keep the current fontScale but remove elderly mode class
    }
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Apply a preset
  const applyPreset = useCallback((preset: 'standard' | 'largePrint' | 'elderly') => {
    const config = FONT_SCALE_CONFIG.presets[preset];
    const newPrefs: AccessibilityPreferences = {
      ...preferences,
      fontScale: config.scale,
      elderlyMode: preset === 'elderly',
      largeButtons: preset === 'elderly' || preset === 'largePrint',
      reducedMotion: preset === 'elderly'
    };
    savePreferences(newPrefs);
  }, [preferences, savePreferences]);

  // Reset to defaults
  const resetPreferences = useCallback(() => {
    savePreferences(DEFAULT_PREFERENCES);
  }, [savePreferences]);

  return {
    preferences,
    updatePreference,
    applyPreset,
    resetPreferences,
    isLoaded
  };
}

/**
 * Compact accessibility widget for page headers
 */
interface AccessibilityWidgetProps {
  className?: string;
  showLabels?: boolean;
}

export function AccessibilityWidget({ className, showLabels = false }: AccessibilityWidgetProps) {
  const { preferences, updatePreference, applyPreset, isLoaded } = useAccessibilityPreferences();
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isLoaded) return null;

  const activeCount = [
    preferences.fontScale !== 1,
    preferences.highContrast,
    preferences.elderlyMode
  ].filter(Boolean).length;

  return (
    <div className={cn("relative", className)}>
      {/* Toggle button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 min-h-[44px]"
        aria-label="Open accessibility controls"
        aria-expanded={isExpanded}
      >
        <Accessibility className="w-4 h-4" />
        {showLabels && <span>Accessibility</span>}
        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        {/* Active indicators */}
        {activeCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5">
            {activeCount}
          </Badge>
        )}
      </Button>

      {/* Expanded controls */}
      {isExpanded && (
        <Card className="absolute top-full right-0 mt-2 w-96 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Accessibility Options
            </CardTitle>
            <CardDescription>
              Adjust display settings for better readability
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AccessibilityControls compact />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Full accessibility controls panel - Enhanced with slider
 */
interface AccessibilityControlsProps {
  compact?: boolean;
  className?: string;
}

export function AccessibilityControls({ compact = false, className }: AccessibilityControlsProps) {
  const { preferences, updatePreference, applyPreset, resetPreferences, isLoaded } = useAccessibilityPreferences();

  if (!isLoaded) {
    return <div className="animate-pulse bg-muted h-32 rounded" />;
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Quick Presets */}
      {!compact && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <Label className="text-sm font-medium">Quick Presets</Label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={preferences.fontScale === 1 && !preferences.elderlyMode ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset('standard')}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-sm font-medium">Standard</span>
              <span className="text-xs text-muted-foreground">100%</span>
            </Button>
            <Button
              variant={preferences.fontScale === 1.5 && !preferences.elderlyMode ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset('largePrint')}
              className="flex flex-col items-center gap-1 h-auto py-3"
            >
              <span className="text-sm font-medium">Large Print</span>
              <span className="text-xs text-muted-foreground">150%</span>
            </Button>
            <Button
              variant={preferences.elderlyMode ? "default" : "outline"}
              size="sm"
              onClick={() => applyPreset('elderly')}
              className="flex flex-col items-center gap-1 h-auto py-3 bg-primary/10 border-primary/30 hover:bg-primary/20"
            >
              <span className="text-sm font-medium">Elderly Mode</span>
              <span className="text-xs text-muted-foreground">175%+</span>
            </Button>
          </div>
        </div>
      )}

      {!compact && <Separator />}

      {/* Font Size Slider */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4" />
            <Label className="text-sm font-medium">Text Size</Label>
          </div>
          <Badge variant="outline" className="font-mono">
            {scaleToPercent(preferences.fontScale)}%
          </Badge>
        </div>

        {/* Slider with visual indicators */}
        <div className="space-y-3">
          <div className="flex justify-between items-end px-1">
            <span className="text-xs text-muted-foreground">A</span>
            <span className="text-lg font-medium">A</span>
            <span className="text-2xl font-bold">A</span>
          </div>
          <Slider
            value={[preferences.fontScale]}
            min={FONT_SCALE_CONFIG.min}
            max={FONT_SCALE_CONFIG.max}
            step={FONT_SCALE_CONFIG.step}
            onValueChange={([value]) => updatePreference('fontScale', value)}
            className="w-full"
            aria-label="Text size"
          />
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>87.5%</span>
            <span>100%</span>
            <span>150%</span>
            <span>200%</span>
          </div>
        </div>

        {/* Live Preview */}
        {!compact && (
          <Card className="p-4 bg-muted/50">
            <p
              className="text-center transition-all duration-200"
              style={{ fontSize: `calc(1rem * ${preferences.fontScale})` }}
            >
              Preview: The quick brown fox jumps over the lazy dog.
            </p>
          </Card>
        )}
      </div>

      {!compact && <Separator />}

      {/* High Contrast Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Monitor className="w-4 h-4" />
          <div>
            <Label className="text-sm font-medium">High Contrast</Label>
            {!compact && (
              <p className="text-xs text-muted-foreground">
                Increases color contrast for better visibility
              </p>
            )}
          </div>
        </div>
        <Switch
          checked={preferences.highContrast}
          onCheckedChange={(checked) => updatePreference('highContrast', checked)}
          aria-label="Toggle high contrast mode"
        />
      </div>

      {!compact && (
        <>
          <Separator />

          {/* Reduced Motion Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <RotateCcw className="w-4 h-4" />
              <div>
                <Label className="text-sm font-medium">Reduce Motion</Label>
                <p className="text-xs text-muted-foreground">
                  Minimizes animations and transitions
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.reducedMotion}
              onCheckedChange={(checked) => updatePreference('reducedMotion', checked)}
              aria-label="Toggle reduced motion"
            />
          </div>

          <Separator />

          {/* Large Buttons Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Type className="w-4 h-4" />
              <div>
                <Label className="text-sm font-medium">Large Touch Targets</Label>
                <p className="text-xs text-muted-foreground">
                  Makes buttons and links larger for easier interaction
                </p>
              </div>
            </div>
            <Switch
              checked={preferences.largeButtons}
              onCheckedChange={(checked) => updatePreference('largeButtons', checked)}
              aria-label="Toggle large touch targets"
            />
          </div>

          <Separator />

          {/* Reset Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetPreferences}
            className="w-full flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </>
      )}

      {/* Compact mode quick controls */}
      {compact && (
        <div className="flex gap-2 pt-2">
          <Button
            variant={preferences.elderlyMode ? "default" : "outline"}
            size="sm"
            onClick={() => applyPreset('elderly')}
            className="flex-1"
          >
            Elderly Mode
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={resetPreferences}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Accessibility floating action button for quick access
 */
export function AccessibilityFAB() {
  const { preferences, applyPreset } = useAccessibilityPreferences();
  const [isOpen, setIsOpen] = useState(false);

  const activeCount = [
    preferences.fontScale !== 1,
    preferences.highContrast,
    preferences.elderlyMode
  ].filter(Boolean).length;

  return (
    <>
      {/* Floating action button */}
      <div className="fixed bottom-4 left-4 z-50">
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "rounded-full w-14 h-14 shadow-lg",
            "transition-all duration-200",
            isOpen && "bg-primary-600"
          )}
          aria-label="Accessibility options"
        >
          <Accessibility className="w-5 h-5" />
          {activeCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Floating panel */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 z-40">
          <Card className="w-96 shadow-xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Accessibility</CardTitle>
              <CardDescription>
                Customize your viewing experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessibilityControls />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="w-full mt-4"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}

/**
 * Accessibility page component for settings
 */
export function AccessibilitySettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Accessibility Settings</h1>
        <p className="text-muted-foreground mt-1">
          Customize your experience for better accessibility and usability.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Visual Preferences
          </CardTitle>
          <CardDescription>
            Adjust text size, contrast, and display options to improve readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessibilityControls />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              These settings are saved to your device and will persist across sessions.
            </p>
            <p>
              Need additional accessibility support?
              <a href="mailto:support@villages.com" className="text-primary hover:underline ml-1">
                Contact our support team
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AccessibilityControls;
