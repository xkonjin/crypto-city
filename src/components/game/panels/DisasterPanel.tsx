'use client';

/**
 * Disaster Panel
 * 
 * "The ships hung in the sky in much the same way that bricks don't.
 * This panel hangs in the UI in much the same way that your city's
 * peace and tranquility won't after you click these buttons."
 * 
 * UI for player-triggered disasters with USDT₮ payments.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useGame } from '@/context/GameContext';
import {
  PLAYER_DISASTERS,
  playerDisasterManager,
  type PlayerDisaster,
  type ActivePlayerDisaster,
  type DamagedBuildingFromDisaster,
} from '@/lib/disasters/index';
import { AlertTriangle, Flame, Wrench, Clock, DollarSign, Shield, Zap } from 'lucide-react';

// =============================================================================
// CONSTANTS
// =============================================================================

const DISASTER_ICONS: Record<string, React.ReactNode> = {
  market_crash: <span className="text-2xl">📉</span>,
  rug_pull: <span className="text-2xl">🧹</span>,
  fire: <Flame className="w-6 h-6 text-orange-500" />,
  earthquake: <span className="text-2xl">🌋</span>,
  whale_dump: <span className="text-2xl">🐋</span>,
  fifty_one_attack: <span className="text-2xl">⚔️</span>,
  sec_raid: <span className="text-2xl">🏛️</span>,
};

const SEVERITY_COLORS: Record<string, string> = {
  market_crash: 'bg-red-500',
  rug_pull: 'bg-purple-500',
  fire: 'bg-orange-500',
  earthquake: 'bg-yellow-600',
  whale_dump: 'bg-blue-500',
  fifty_one_attack: 'bg-red-700',
  sec_raid: 'bg-gray-500',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

function formatCost(usdtAmount: number): string {
  return `${usdtAmount.toFixed(2)} USDT₮`;
}

// =============================================================================
// DISASTER CARD COMPONENT
// =============================================================================

interface DisasterCardProps {
  disaster: PlayerDisaster;
  onTrigger: (disasterId: string) => void;
  disabled: boolean;
  cooldownRemaining?: number;
  cost: string;
}

function DisasterCard({ disaster, onTrigger, disabled, cooldownRemaining, cost }: DisasterCardProps) {
  const [confirmTrigger, setConfirmTrigger] = useState(false);

  const handleTrigger = () => {
    if (confirmTrigger) {
      onTrigger(disaster.id);
      setConfirmTrigger(false);
    } else {
      setConfirmTrigger(true);
      // Auto-reset confirm after 5 seconds
      setTimeout(() => setConfirmTrigger(false), 5000);
    }
  };

  const isOnCooldown = cooldownRemaining && cooldownRemaining > 0;

  return (
    <div className={`rounded-lg border p-4 transition-all ${
      disabled ? 'opacity-50 bg-muted/50' : 'bg-card hover:border-primary/50'
    }`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
          {DISASTER_ICONS[disaster.id] || <AlertTriangle className="w-6 h-6" />}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-sm">{disaster.name}</h3>
            <Badge variant="outline" className={`text-[10px] ${SEVERITY_COLORS[disaster.id]} text-white`}>
              {formatTime(disaster.durationSeconds)}
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {disaster.description}
          </p>
          
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-xs">
              <DollarSign className="w-3 h-3" />
              <span className="font-mono">{cost}</span>
            </div>
            
            {isOnCooldown ? (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{formatTime(cooldownRemaining)}</span>
              </div>
            ) : (
              <Button
                size="sm"
                variant={confirmTrigger ? 'destructive' : 'outline'}
                onClick={handleTrigger}
                disabled={disabled}
                className="h-7 text-xs"
              >
                {confirmTrigger ? 'Confirm?' : 'Trigger'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Cobie quote on hover/focus */}
      {!disabled && (
        <div className="mt-2 pt-2 border-t border-border/50">
          <p className="text-[10px] text-muted-foreground italic">
            &ldquo;{disaster.cobieQuote}&rdquo; - Cobie
          </p>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// ACTIVE DISASTER COMPONENT
// =============================================================================

interface ActiveDisasterDisplayProps {
  disaster: ActivePlayerDisaster;
}

function ActiveDisasterDisplay({ disaster }: ActiveDisasterDisplayProps) {
  const [progress, setProgress] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - disaster.startedAt;
      const total = disaster.endsAt - disaster.startedAt;
      setProgress(Math.min(100, (elapsed / total) * 100));
      setRemainingTime(Math.max(0, (disaster.endsAt - now) / 1000));
    };

    updateProgress();
    const interval = setInterval(updateProgress, 1000);
    return () => clearInterval(interval);
  }, [disaster]);

  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
      <div className="flex items-center gap-2 mb-2">
        {DISASTER_ICONS[disaster.disaster.id]}
        <span className="font-semibold text-sm">{disaster.disaster.name}</span>
        <Badge variant="destructive" className="text-[10px]">ACTIVE</Badge>
      </div>
      
      <Progress value={progress} className="h-2 mb-2" />
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{disaster.affectedBuildingIds.length} buildings affected</span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(remainingTime)} remaining
        </span>
      </div>
    </div>
  );
}

// =============================================================================
// DAMAGED BUILDING COMPONENT
// =============================================================================

interface DamagedBuildingCardProps {
  building: DamagedBuildingFromDisaster;
  onRepair: (buildingId: string) => void;
}

function DamagedBuildingCard({ building, onRepair }: DamagedBuildingCardProps) {
  const [confirmRepair, setConfirmRepair] = useState(false);

  const handleRepair = () => {
    if (confirmRepair) {
      onRepair(building.buildingId);
      setConfirmRepair(false);
    } else {
      setConfirmRepair(true);
      setTimeout(() => setConfirmRepair(false), 5000);
    }
  };

  return (
    <div className="rounded-lg border border-yellow-500/50 bg-yellow-500/10 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-yellow-500" />
          <div>
            <div className="font-medium text-sm">{building.buildingName}</div>
            <div className="text-[10px] text-muted-foreground">
              Damage: {Math.round(building.severity * 100)}%
            </div>
          </div>
        </div>
        
        <Button
          size="sm"
          variant={confirmRepair ? 'default' : 'outline'}
          onClick={handleRepair}
          className="h-7 text-xs"
        >
          {confirmRepair ? `Pay ${formatCost(building.repairCostUSDT)}?` : `Repair (${formatCost(building.repairCostUSDT)})`}
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN PANEL COMPONENT
// =============================================================================

interface DisasterPanelProps {
  onClose?: () => void;
}

export function DisasterPanel({ onClose }: DisasterPanelProps = {}) {
  const { state, setActivePanel } = useGame();
  
  // Handle close - call both setActivePanel and onClose prop if provided
  const handleClose = useCallback(() => {
    setActivePanel('none');
    onClose?.();
  }, [setActivePanel, onClose]);
  const [disasterState, setDisasterState] = useState(playerDisasterManager.getState());
  const [cooldowns, setCooldowns] = useState<Record<string, number>>({});

  // Update state periodically
  useEffect(() => {
    const updateState = () => {
      setDisasterState(playerDisasterManager.getState());
      
      // Update cooldowns
      const newCooldowns: Record<string, number> = {};
      for (const disasterId of Object.keys(PLAYER_DISASTERS)) {
        const check = playerDisasterManager.canTriggerDisaster(disasterId);
        if (!check.canTrigger && check.cooldownRemaining) {
          newCooldowns[disasterId] = check.cooldownRemaining;
        }
      }
      setCooldowns(newCooldowns);
    };

    updateState();
    const interval = setInterval(updateState, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle disaster trigger
  const handleTriggerDisaster = useCallback((disasterId: string) => {
    // In a real implementation, this would:
    // 1. Check wallet balance
    // 2. Request USDT₮ payment via Plasma
    // 3. Wait for confirmation
    // 4. Then trigger the disaster
    
    // For now, we simulate the trigger
    const result = playerDisasterManager.triggerDisaster({
      disasterId,
      triggerAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    });

    if (!result.success) {
      console.error('Failed to trigger disaster:', result.error);
      // Would show toast notification here
    }
  }, []);

  // Handle repair
  const handleRepairBuilding = useCallback((buildingId: string) => {
    // Similar to disaster trigger - would process payment first
    const result = playerDisasterManager.repairBuilding({
      buildingId,
      payerAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    });

    if (!result.success) {
      console.error('Failed to repair building:', result.error);
    }
  }, []);

  const hasNewPlayerShield = playerDisasterManager.hasNewPlayerShield();
  const activeDisasters = disasterState.activeDisasters;
  const damagedBuildings = disasterState.damagedBuildings;

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="max-w-dialog-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            Disaster Control
          </DialogTitle>
        </DialogHeader>

        {/* New Player Shield Warning */}
        {hasNewPlayerShield && (
          <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-3 flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-500" />
            <div>
              <div className="font-medium text-sm">New Player Shield Active</div>
              <div className="text-xs text-muted-foreground">
                Your city is protected from disasters for the first 24 hours
              </div>
            </div>
          </div>
        )}

        {/* Active Disasters */}
        {activeDisasters.length > 0 && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Active Disasters
            </div>
            <div className="space-y-2">
              {activeDisasters.map((disaster) => (
                <ActiveDisasterDisplay key={disaster.instanceId} disaster={disaster} />
              ))}
            </div>
          </div>
        )}

        {/* Damaged Buildings */}
        {damagedBuildings.length > 0 && (
          <div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
              Damaged Buildings ({damagedBuildings.length})
            </div>
            <div className="space-y-2 max-h-[150px] overflow-y-auto">
              {damagedBuildings.map((building) => (
                <DamagedBuildingCard
                  key={building.buildingId}
                  building={building}
                  onRepair={handleRepairBuilding}
                />
              ))}
            </div>
          </div>
        )}

        <Separator />

        {/* Available Disasters */}
        <div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            Trigger Disaster
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Pay USDT₮ to unleash chaos upon your city. Why? Because you can.
          </p>
          
          <div className="space-y-3">
            {Object.values(PLAYER_DISASTERS).map((disaster) => {
              const canTrigger = playerDisasterManager.canTriggerDisaster(disaster.id);
              const cost = playerDisasterManager.getDisasterCostDisplay(disaster.id);
              
              return (
                <DisasterCard
                  key={disaster.id}
                  disaster={disaster}
                  onTrigger={handleTriggerDisaster}
                  disabled={!canTrigger.canTrigger || hasNewPlayerShield}
                  cooldownRemaining={cooldowns[disaster.id]}
                  cost={cost}
                />
              );
            })}
          </div>
        </div>

        <Separator />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <div className="text-muted-foreground">Total Disaster Spend</div>
            <div className="font-mono">
              {(Number(disasterState.totalDisasterSpend) / 1000000).toFixed(2)} USDT₮
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Total Repair Spend</div>
            <div className="font-mono">
              {(Number(disasterState.totalRepairSpend) / 1000000).toFixed(2)} USDT₮
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DisasterPanel;
