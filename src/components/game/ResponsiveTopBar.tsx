/**
 * ResponsiveTopBar Component
 * 
 * A unified top bar that adapts to mobile and desktop layouts using Tailwind.
 * Replaces the need for separate TopBar and MobileTopBar components.
 * 
 * Issue #144: Create responsive component variants
 */

'use client';

import React from 'react';
import { msg, useMessages } from 'gt-next';
import { useTopBarState } from '@/hooks/useTopBarState';
import { useMobile } from '@/hooks/useMobile';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  PlayIcon,
  PauseIcon,
  HappyIcon,
  HealthIcon,
  EducationIcon,
  SafetyIcon,
  EnvironmentIcon,
} from '@/components/ui/Icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { ConnectWalletButton, StoreButton } from '@/components/wallet';
import { LogOut } from 'lucide-react';

// UI Labels
const UI_LABELS = {
  pop: msg('Pop'),
  funds: msg('Funds'),
  tax: msg('Tax'),
  monthly: msg('Monthly'),
  happiness: msg('Happiness'),
  health: msg('Health'),
  education: msg('Education'),
  safety: msg('Safety'),
  environment: msg('Environment'),
  exitDialogTitle: msg('Exit to Main Menu'),
  exitDialogDescription: msg('Would you like to save your city before exiting?'),
  exitWithoutSaving: msg('Exit Without Saving'),
  saveAndExit: msg('Save & Exit'),
};

// Time of day icon
function TimeOfDayIcon({ hour, size = 'md' }: { hour: number; size?: 'sm' | 'md' }) {
  const isNight = hour < 6 || hour >= 20;
  const isDawn = hour >= 6 && hour < 8;
  const isDusk = hour >= 18 && hour < 20;
  const sizeClass = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';

  if (isNight) {
    return (
      <svg className={`${sizeClass} text-blue-300`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
      </svg>
    );
  } else if (isDawn || isDusk) {
    return (
      <svg className={`${sizeClass} text-orange-400`} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
      </svg>
    );
  }
  return (
    <svg className={`${sizeClass} text-yellow-400`} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0z" />
    </svg>
  );
}

// Speed controls
function SpeedControls({ 
  speed, 
  setSpeed, 
  compact = false 
}: { 
  speed: 0 | 1 | 2 | 3; 
  setSpeed: (s: 0 | 1 | 2 | 3) => void;
  compact?: boolean;
}) {
  const buttonClass = compact ? 'h-6 w-6 min-w-6' : 'h-7 w-7';
  const iconSize = compact ? 10 : 12;
  
  return (
    <div className="flex items-center gap-0 bg-secondary rounded-md p-0">
      {[0, 1, 2, 3].map(s => (
        <Button
          key={s}
          onClick={() => setSpeed(s as 0 | 1 | 2 | 3)}
          variant={speed === s ? 'default' : 'ghost'}
          size="icon-sm"
          className={`${buttonClass} p-0 m-0`}
          title={s === 0 ? 'Pause' : s === 1 ? 'Normal' : s === 2 ? 'Fast' : 'Very Fast'}
        >
          {s === 0 ? <PauseIcon size={iconSize} /> : 
           s === 1 ? <PlayIcon size={iconSize} /> : 
           s === 2 ? (
             <div className="flex items-center -space-x-[5px]">
               <PlayIcon size={iconSize} />
               <PlayIcon size={iconSize} />
             </div>
           ) :
           <div className="flex items-center -space-x-[7px]">
             <PlayIcon size={iconSize} />
             <PlayIcon size={iconSize} />
             <PlayIcon size={iconSize} />
           </div>}
        </Button>
      ))}
    </div>
  );
}

// Demand bar for mobile
function DemandBar({ label, demand, color }: { label: string; demand: number; color: string }) {
  const percentage = Math.min(100, Math.abs(demand));
  const isPositive = demand >= 0;

  return (
    <div className="flex items-center gap-1">
      <span className={`text-[9px] font-bold ${color} w-2`}>{label}</span>
      <div className="w-8 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${isPositive ? color.replace('text-', 'bg-') : 'bg-red-500'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Demand indicator for desktop
function DemandIndicator({ label, demand, color }: { label: string; demand: number; color: string }) {
  const height = Math.abs(demand) / 2;
  const isPositive = demand >= 0;
  
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[10px] font-bold ${color}`}>{label}</span>
      <div className="w-3 h-8 bg-secondary relative rounded-sm overflow-hidden">
        <div className="absolute left-0 right-0 top-1/2 h-px bg-border" />
        <div
          className={`absolute left-0 right-0 ${color.replace('text-', 'bg-')}`}
          style={{
            height: `${height}%`,
            top: isPositive ? `${50 - height}%` : '50%',
          }}
        />
      </div>
    </div>
  );
}

// Mini stat for desktop stats panel
function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  const color = value >= 70 ? 'text-green-500' : value >= 40 ? 'text-amber-500' : 'text-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono ${color}`}>{Math.round(value)}%</span>
    </div>
  );
}

// Stat badge
function StatBadge({ 
  value, 
  label, 
  variant = 'default',
  compact = false,
}: { 
  value: string; 
  label: string; 
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  compact?: boolean;
}) {
  const colorClass = variant === 'success' ? 'text-green-500' : 
                     variant === 'warning' ? 'text-amber-500' : 
                     variant === 'destructive' ? 'text-red-500' : 'text-foreground';
  
  if (compact) {
    return (
      <div className="flex flex-col items-start">
        <span className={`text-xs font-mono font-semibold ${colorClass}`}>{value}</span>
        <span className="text-[9px] text-muted-foreground">{label}</span>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-start min-w-[70px]">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">{label}</div>
      <div className={`text-sm font-mono tabular-nums font-semibold ${colorClass}`}>{value}</div>
    </div>
  );
}

interface ResponsiveTopBarProps {
  onExit?: () => void;
  onShare?: () => void;
}

export function ResponsiveTopBar({ onExit, onShare }: ResponsiveTopBarProps) {
  const topBar = useTopBarState();
  const { isMobileDevice, isSmallScreen } = useMobile();
  const isMobile = isMobileDevice || isSmallScreen;
  const m = useMessages();

  const handleSaveAndExit = () => {
    topBar.saveCity();
    topBar.closeExitDialog();
    onExit?.();
  };

  const handleExitWithoutSaving = () => {
    topBar.closeExitDialog();
    onExit?.();
  };

  // Mobile Layout
  if (isMobile) {
    return (
      <>
        <Card className="fixed top-0 left-0 right-0 z-40 rounded-none border-x-0 border-t-0 bg-card/95 backdrop-blur-sm safe-area-top">
          <div className="flex items-center justify-between px-3 py-1.5">
            {/* Left: City info and stats */}
            <button
              className="flex items-center gap-3 min-w-0 active:opacity-70 p-0 m-0 mr-auto"
              onClick={topBar.toggleDetails}
            >
              <div className="flex flex-col items-start">
                <span className="text-foreground font-semibold text-xs truncate max-w-[80px]">
                  {topBar.cityName}
                </span>
                <span className="text-muted-foreground text-[10px] font-mono">
                  {topBar.monthName} {topBar.year}
                </span>
              </div>
              <StatBadge value={topBar.formattedPopulation} label={String(m(UI_LABELS.pop))} compact />
              <StatBadge 
                value={topBar.formattedMoney} 
                label={String(m(UI_LABELS.funds))} 
                variant={topBar.moneyVariant}
                compact 
              />
            </button>

            {/* Right: Speed controls and exit */}
            <div className="flex items-center gap-1">
              <SpeedControls speed={topBar.speed} setSpeed={topBar.setSpeed} compact />
              {onExit && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground"
                  onClick={topBar.openExitDialog}
                >
                  <LogOut size={12} />
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Exit Dialog */}
        <Dialog open={topBar.showExitDialog} onOpenChange={topBar.closeExitDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{m(UI_LABELS.exitDialogTitle)}</DialogTitle>
              <DialogDescription>{m(UI_LABELS.exitDialogDescription)}</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={handleExitWithoutSaving}>
                {m(UI_LABELS.exitWithoutSaving)}
              </Button>
              <Button onClick={handleSaveAndExit}>
                {m(UI_LABELS.saveAndExit)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop Layout
  return (
    <>
      {/* Main Top Bar */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <div>
            <h1 className="text-foreground font-semibold text-sm">{topBar.cityName}</h1>
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-mono tabular-nums">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>{topBar.monthName} {topBar.year}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{topBar.formattedDate}</p>
                </TooltipContent>
              </Tooltip>
              <TimeOfDayIcon hour={topBar.visualHour} />
            </div>
          </div>
          
          <SpeedControls speed={topBar.speed} setSpeed={topBar.setSpeed} />
        </div>
        
        <div className="flex items-center gap-3">
          <StatBadge value={topBar.stats.population.toLocaleString()} label={String(m(UI_LABELS.pop))} />
          <StatBadge 
            value={topBar.formattedMoney} 
            label={String(m(UI_LABELS.funds))}
            variant={topBar.moneyVariant}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <StatBadge 
            value={topBar.formattedMonthly} 
            label={String(m(UI_LABELS.monthly))}
            variant={topBar.monthlyVariant}
          />
          
          <Separator orientation="vertical" className="h-8" />
          
          <div className="flex items-center gap-1.5">
            <DemandIndicator label="R" demand={topBar.stats.demand.residential} color="text-green-500" />
            <DemandIndicator label="C" demand={topBar.stats.demand.commercial} color="text-blue-500" />
            <DemandIndicator label="I" demand={topBar.stats.demand.industrial} color="text-amber-500" />
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground text-xs">{m(UI_LABELS.tax)}</span>
            <Slider
              value={[topBar.taxRate]}
              onValueChange={(value) => topBar.setTaxRate(value[0])}
              min={0}
              max={100}
              step={1}
              className="w-14"
            />
            <span className="text-foreground text-xs font-mono tabular-nums w-7">{topBar.taxRate}%</span>
          </div>
          
          <Separator orientation="vertical" className="h-8" />
          
          <LanguageSelector iconOnly={false} variant="ghost" iconSize={14} />
          
          <Separator orientation="vertical" className="h-8" />
          
          <StoreButton />
          <ConnectWalletButton />
        </div>
      </div>

      {/* Stats Panel */}
      <div className="h-8 bg-secondary/50 border-b border-border flex items-center justify-center gap-8 text-xs">
        <MiniStat icon={<HappyIcon size={12} />} label={String(m(UI_LABELS.happiness))} value={topBar.stats.happiness} />
        <MiniStat icon={<HealthIcon size={12} />} label={String(m(UI_LABELS.health))} value={topBar.stats.health} />
        <MiniStat icon={<EducationIcon size={12} />} label={String(m(UI_LABELS.education))} value={topBar.stats.education} />
        <MiniStat icon={<SafetyIcon size={12} />} label={String(m(UI_LABELS.safety))} value={topBar.stats.safety} />
        <MiniStat icon={<EnvironmentIcon size={12} />} label={String(m(UI_LABELS.environment))} value={topBar.stats.environment} />
      </div>
    </>
  );
}

// Re-export old components for backward compatibility
export { TopBar, StatsPanel, StatBadge, DemandIndicator, MiniStat, TimeOfDayIcon } from './TopBar';
