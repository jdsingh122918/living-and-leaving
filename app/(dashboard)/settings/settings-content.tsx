'use client'

import React from 'react'
import { AccountManagement } from '@/components/account/account-management'
import { AccessibilityControls } from '@/components/ui/accessibility-controls'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserRole } from '@prisma/client'
import { User, Eye, Palette } from 'lucide-react'

interface SettingsContentProps {
  userRole?: UserRole
}

export function SettingsContent({ userRole: _userRole }: SettingsContentProps) {
  return (
    <div data-testid="settings-container" className="space-y-3">
      {/* Header */}
      <div data-testid="settings-header" className="space-y-2">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account settings, accessibility options, and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="account" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Account</span>
          </TabsTrigger>
          <TabsTrigger value="accessibility" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Accessibility</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Appearance</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-4">
          <AccountManagement />
        </TabsContent>

        {/* Accessibility Tab */}
        <TabsContent value="accessibility" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Accessibility Settings
              </CardTitle>
              <CardDescription>
                Customize text size, contrast, and other accessibility features for better readability.
                These settings are designed to help users with visual impairments or those who prefer larger text.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AccessibilityControls />
            </CardContent>
          </Card>

          {/* Accessibility Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Tip:</strong> Use the &quot;Elderly Mode&quot; preset for optimal settings if you need larger text and easier-to-click buttons.
                </p>
                <p>
                  These settings are saved to your device and will persist across sessions.
                </p>
                <p>
                  Need additional accessibility support?{' '}
                  <a href="mailto:support@villages.com" className="text-primary hover:underline">
                    Contact our support team
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Theme & Appearance
              </CardTitle>
              <CardDescription>
                Choose your preferred appearance mode and color theme.
                These settings let you personalize the look and feel of the application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSelector showColorThemes={true} />
            </CardContent>
          </Card>

          {/* Theme Info Card */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>
                  <strong>Available themes:</strong> Villages (default), Rose, Blue, Violet, Orange, Yellow, and High Contrast.
                </p>
                <p>
                  Theme preferences are saved to your device and will persist across sessions.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
