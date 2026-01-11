'use client';

import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { AccessibilitySettings as AccessibilitySettingsType } from '@/hooks/useAccessibility';

/**
 * Accessibility Settings Panel Component (Issue #60)
 * 
 * Provides toggles for accessibility preferences:
 * - Reduced motion
 * - Screen reader announcements
 * - High contrast mode
 * - Keyboard navigation
 */

export interface AccessibilitySettingsPanelProps {
  settings: AccessibilitySettingsType;
  onSettingsChange: (settings: Partial<AccessibilitySettingsType>) => void;
  className?: string;
}

export function AccessibilitySettingsPanel({
  settings,
  onSettingsChange,
  className,
}: AccessibilitySettingsPanelProps) {
  return (
    <div className={`space-y-4 ${className || ''}`}>
      <h3 className="text-lg font-semibold text-foreground">Accessibility</h3>
      
      {/* Reduced Motion Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label 
            htmlFor="reduced-motion" 
            className="text-sm font-medium"
          >
            Reduce motion
          </Label>
          <p className="text-xs text-muted-foreground">
            Minimize animations and transitions
          </p>
        </div>
        <Switch
          id="reduced-motion"
          data-testid="reduced-motion-toggle"
          aria-label="Toggle reduced motion"
          checked={settings.reducedMotion}
          onCheckedChange={(checked) => onSettingsChange({ reducedMotion: checked })}
        />
      </div>
      
      {/* Screen Reader Announcements Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label 
            htmlFor="sr-announcements" 
            className="text-sm font-medium"
          >
            Screen reader announcements
          </Label>
          <p className="text-xs text-muted-foreground">
            Announce game events for screen readers
          </p>
        </div>
        <Switch
          id="sr-announcements"
          data-testid="sr-announcements-toggle"
          aria-label="Toggle screen reader announcements"
          checked={settings.screenReaderAnnouncements}
          onCheckedChange={(checked) => onSettingsChange({ screenReaderAnnouncements: checked })}
        />
      </div>
      
      {/* High Contrast Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label 
            htmlFor="high-contrast" 
            className="text-sm font-medium"
          >
            High contrast
          </Label>
          <p className="text-xs text-muted-foreground">
            Increase color contrast for better visibility
          </p>
        </div>
        <Switch
          id="high-contrast"
          data-testid="high-contrast-toggle"
          aria-label="Toggle high contrast mode"
          checked={settings.highContrast}
          onCheckedChange={(checked) => onSettingsChange({ highContrast: checked })}
        />
      </div>
      
      {/* Keyboard Navigation Toggle */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label 
            htmlFor="keyboard-nav" 
            className="text-sm font-medium"
          >
            Keyboard navigation
          </Label>
          <p className="text-xs text-muted-foreground">
            Navigate grid with arrow keys
          </p>
        </div>
        <Switch
          id="keyboard-nav"
          data-testid="keyboard-nav-toggle"
          aria-label="Toggle keyboard navigation"
          checked={settings.keyboardNavigationEnabled}
          onCheckedChange={(checked) => onSettingsChange({ keyboardNavigationEnabled: checked })}
        />
      </div>
    </div>
  );
}

export default AccessibilitySettingsPanel;
