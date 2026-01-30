/**
 * Theme Selector Component
 *
 * Provides comprehensive theme selection with support for:
 * - Light/Dark/System theme modes
 * - Multiple color themes (Default, Rose, Blue, Green, etc.)
 * - Visual theme previews with color swatches
 * - Persistent theme preferences
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sun, Moon, Monitor, Check, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

// Theme mode options
const THEME_MODES = [
  {
    id: 'light',
    label: 'Light',
    description: 'Light background',
    icon: Sun
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Dark background',
    icon: Moon
  },
  {
    id: 'system',
    label: 'System',
    description: 'Follow device',
    icon: Monitor
  }
] as const;

// Color theme definitions with CSS variable overrides
export interface ColorTheme {
  id: string;
  name: string;
  description: string;
  preview: {
    primary: string;
    secondary: string;
    accent: string;
  };
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
  isDefault?: boolean;
  isAccessibility?: boolean;
}

// Available color themes
export const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'villages',
    name: 'Default',
    description: 'Sage green healthcare theme',
    preview: {
      primary: '#5B7555',
      secondary: '#2D5A4A',
      accent: '#8FBC8F'
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.50 0.08 145)',
        '--ring': 'oklch(0.50 0.08 145)'
      },
      dark: {
        '--primary': 'oklch(0.62 0.08 145)',
        '--ring': 'oklch(0.62 0.08 145)'
      }
    },
    isDefault: true
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Warm rose pink theme',
    preview: {
      primary: '#e11d48',
      secondary: '#fda4af',
      accent: '#fecdd3'
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.585 0.233 3.958)',
        '--ring': 'oklch(0.585 0.233 3.958)'
      },
      dark: {
        '--primary': 'oklch(0.645 0.246 16.439)',
        '--ring': 'oklch(0.645 0.246 16.439)'
      }
    }
  },
  {
    id: 'blue',
    name: 'Blue',
    description: 'Classic blue theme',
    preview: {
      primary: '#2563eb',
      secondary: '#60a5fa',
      accent: '#dbeafe'
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.546 0.245 262.881)',
        '--ring': 'oklch(0.546 0.245 262.881)'
      },
      dark: {
        '--primary': 'oklch(0.623 0.214 259.815)',
        '--ring': 'oklch(0.623 0.214 259.815)'
      }
    }
  },
  {
    id: 'violet',
    name: 'Violet',
    description: 'Rich violet purple theme',
    preview: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      accent: '#ede9fe'
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.541 0.281 293.009)',
        '--ring': 'oklch(0.541 0.281 293.009)'
      },
      dark: {
        '--primary': 'oklch(0.627 0.265 303.9)',
        '--ring': 'oklch(0.627 0.265 303.9)'
      }
    }
  },
  {
    id: 'orange',
    name: 'Orange',
    description: 'Vibrant orange theme',
    preview: {
      primary: '#ea580c',
      secondary: '#fb923c',
      accent: '#fed7aa'
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.646 0.222 41.116)',
        '--ring': 'oklch(0.646 0.222 41.116)'
      },
      dark: {
        '--primary': 'oklch(0.702 0.209 37.7)',
        '--ring': 'oklch(0.702 0.209 37.7)'
      }
    }
  },
  {
    id: 'yellow',
    name: 'Yellow',
    description: 'Bright yellow theme',
    preview: {
      primary: '#ca8a04',
      secondary: '#facc15',
      accent: '#fef9c3'
    },
    cssVars: {
      light: {
        '--primary': 'oklch(0.681 0.162 75.834)',
        '--ring': 'oklch(0.681 0.162 75.834)'
      },
      dark: {
        '--primary': 'oklch(0.795 0.184 86.047)',
        '--ring': 'oklch(0.795 0.184 86.047)'
      }
    }
  },
  {
    id: 'high-contrast',
    name: 'High Contrast',
    description: 'Maximum readability',
    preview: {
      primary: '#ffff00',
      secondary: '#00ff00',
      accent: '#ffffff'
    },
    cssVars: {
      light: {
        '--primary': '#000000',
        '--ring': '#000000',
        '--background': '#ffffff',
        '--foreground': '#000000'
      },
      dark: {
        '--primary': '#ffff00',
        '--ring': '#ffff00',
        '--background': '#000000',
        '--foreground': '#ffffff'
      }
    },
    isAccessibility: true
  }
];

// Storage key for color theme preference
const COLOR_THEME_STORAGE_KEY = 'color-theme-preference';

/**
 * Hook for managing color theme preferences
 */
export function useColorTheme() {
  const [colorTheme, setColorTheme] = useState<string>('villages');
  const [isLoaded, setIsLoaded] = useState(false);
  const { resolvedTheme } = useTheme();

  // Load preference from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(COLOR_THEME_STORAGE_KEY);
      if (stored) {
        setColorTheme(stored);
      }
    } catch (error) {
      console.warn('Failed to load color theme preference:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Apply color theme CSS variables
  useEffect(() => {
    if (!isLoaded) return;

    const theme = COLOR_THEMES.find(t => t.id === colorTheme);
    if (!theme) return;

    const root = document.documentElement;
    const isDark = resolvedTheme === 'dark';
    const vars = isDark ? theme.cssVars.dark : theme.cssVars.light;

    // Apply CSS variables
    Object.entries(vars).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Store preference
    root.setAttribute('data-color-theme', colorTheme);

  }, [colorTheme, resolvedTheme, isLoaded]);

  // Save preference
  const setTheme = useCallback((themeId: string) => {
    try {
      localStorage.setItem(COLOR_THEME_STORAGE_KEY, themeId);
      setColorTheme(themeId);
    } catch (error) {
      console.warn('Failed to save color theme preference:', error);
    }
  }, []);

  return {
    colorTheme,
    setColorTheme: setTheme,
    isLoaded,
    themes: COLOR_THEMES
  };
}

interface ThemeSelectorProps {
  className?: string;
  showColorThemes?: boolean;
}

export function ThemeSelector({ className, showColorThemes = true }: ThemeSelectorProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { colorTheme, setColorTheme, themes } = useColorTheme();

  return (
    <div className={cn("space-y-6", className)}>
      {/* Theme Mode Selection */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sun className="w-4 h-4" />
          <Label className="text-sm font-medium">Appearance</Label>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {THEME_MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = theme === mode.id;

            return (
              <Button
                key={mode.id}
                variant={isSelected ? "default" : "outline"}
                onClick={() => setTheme(mode.id)}
                className={cn(
                  "flex flex-col items-center gap-2 h-auto py-4 relative",
                  isSelected && "ring-2 ring-primary ring-offset-2"
                )}
                aria-pressed={isSelected}
              >
                {isSelected && (
                  <Check className="absolute top-2 right-2 w-4 h-4" />
                )}
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{mode.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Current theme indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Currently using:</span>
          <Badge variant="outline" className="capitalize">
            {resolvedTheme || 'system'}
          </Badge>
        </div>
      </div>

      {/* Color Theme Selection */}
      {showColorThemes && (
        <div className="border-t pt-6 space-y-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <Label className="text-sm font-medium">Color Theme</Label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {themes.map((colorThemeOption) => {
              const isSelected = colorTheme === colorThemeOption.id;

              return (
                <Card
                  key={colorThemeOption.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  onClick={() => setColorTheme(colorThemeOption.id)}
                >
                  <CardContent className="p-3 space-y-2">
                    {/* Color preview swatches */}
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: colorThemeOption.preview.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: colorThemeOption.preview.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-6 h-6 rounded-full border shadow-sm"
                        style={{ backgroundColor: colorThemeOption.preview.accent }}
                        title="Accent"
                      />
                      {isSelected && (
                        <div className="ml-auto">
                          <Check className="w-4 h-4 text-primary" />
                        </div>
                      )}
                    </div>

                    {/* Theme name and badges */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-sm font-medium">
                          {colorThemeOption.name}
                        </span>
                        {colorThemeOption.isDefault && (
                          <Badge variant="secondary" className="text-[10px] px-1 py-0">
                            Default
                          </Badge>
                        )}
                        {colorThemeOption.isAccessibility && (
                          <Badge variant="outline" className="text-[10px] px-1 py-0">
                            A11y
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {colorThemeOption.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Color themes change the primary accent color throughout the application.
            The High Contrast theme is recommended for users with vision impairment.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Compact theme toggle for headers/toolbars
 */
export function ThemeModeToggle() {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const currentIndex = modes.indexOf(theme as typeof modes[number]);
    const nextIndex = (currentIndex + 1) % modes.length;
    setTheme(modes[nextIndex]);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleTheme}
      className="min-h-[44px] min-w-[44px]"
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {theme === 'light' && <Sun className="w-4 h-4" />}
      {theme === 'dark' && <Moon className="w-4 h-4" />}
      {theme === 'system' && <Monitor className="w-4 h-4" />}
    </Button>
  );
}

/**
 * Color theme picker for quick access
 */
export function ColorThemePicker({ className }: { className?: string }) {
  const { colorTheme, setColorTheme, themes } = useColorTheme();

  return (
    <div className={cn("flex gap-1", className)}>
      {themes.slice(0, 5).map((theme) => (
        <button
          key={theme.id}
          onClick={() => setColorTheme(theme.id)}
          className={cn(
            "w-6 h-6 rounded-full border-2 transition-all",
            colorTheme === theme.id
              ? "border-foreground scale-110"
              : "border-transparent hover:scale-105"
          )}
          style={{ backgroundColor: theme.preview.primary }}
          title={theme.name}
          aria-label={`Select ${theme.name} theme`}
        />
      ))}
    </div>
  );
}

export default ThemeSelector;
