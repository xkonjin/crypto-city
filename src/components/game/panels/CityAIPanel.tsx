/**
 * City AI Panel
 * 
 * "Time is an illusion. Lunchtime doubly so." - Ford Prefect
 * 
 * This panel provides controls for the autonomous city AI system.
 * Features:
 * - Toggle switch for autonomous mode
 * - AI aggressiveness slider
 * - List of pending AI actions
 * - Override/cancel buttons for individual actions
 * - City health summary
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Bot, 
  Pause, 
  Play, 
  Trash2, 
  ArrowUp, 
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  getCityAIManager,
  CityAIState,
  CityAction,
  AIAggressiveness,
} from '@/lib/cityAI';

// =============================================================================
// COMPONENT
// =============================================================================

interface CityAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CityAIPanel({ isOpen, onClose }: CityAIPanelProps) {
  const { state: gameState } = useGame();
  const [aiState, setAIState] = useState<CityAIState | null>(null);
  const [cityHealth, setCityHealth] = useState<{
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    score: number;
    mainIssues: string[];
  } | null>(null);

  // Subscribe to AI state changes
  useEffect(() => {
    const manager = getCityAIManager();
    
    // Initial state load in subscription callback to avoid sync setState in effect
    const unsubscribe = manager.subscribe((newState) => {
      setAIState(newState);
      setCityHealth(manager.getCityHealth());
    });
    
    // Trigger initial state by getting it from manager
    // Use a microtask to defer the setState call
    queueMicrotask(() => {
       
      setAIState(manager.getState());
       
      setCityHealth(manager.getCityHealth());
    });

    return unsubscribe;
  }, []);

  // Toggle autonomous mode
  const handleToggleAI = useCallback(() => {
    const manager = getCityAIManager();
    manager.toggle();
  }, []);

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    const manager = getCityAIManager();
    if (aiState?.isPaused) {
      manager.resume();
    } else {
      manager.pause();
    }
  }, [aiState?.isPaused]);

  // Set aggressiveness
  const handleAggressivenessChange = useCallback((value: number[]) => {
    const manager = getCityAIManager();
    const levels: AIAggressiveness[] = ['conservative', 'moderate', 'aggressive'];
    manager.setAggressiveness(levels[value[0]] || 'moderate');
  }, []);

  // Cancel action
  const handleCancelAction = useCallback((actionId: string) => {
    const manager = getCityAIManager();
    manager.cancelAction(actionId);
  }, []);

  // Prioritize action
  const handlePrioritizeAction = useCallback((actionId: string) => {
    const manager = getCityAIManager();
    manager.prioritizeAction(actionId);
  }, []);

  // Clear queue
  const handleClearQueue = useCallback(() => {
    const manager = getCityAIManager();
    manager.clearQueue();
  }, []);

  // Force assessment
  const handleForceAssessment = useCallback(() => {
    const manager = getCityAIManager();
    manager.forceAssessment(gameState);
  }, [gameState]);

  // Get aggressiveness slider value
  const getAggressivenessValue = (): number[] => {
    const levels: Record<AIAggressiveness, number> = {
      conservative: 0,
      moderate: 1,
      aggressive: 2,
    };
    return [levels[aiState?.aggressiveness || 'moderate']];
  };

  // Get status badge color
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-green-400';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Get action type icon
  const getActionIcon = (type: CityAction['type']): React.ReactNode => {
    switch (type) {
      case 'zone_residential':
      case 'zone_commercial':
      case 'zone_industrial':
        return <span className="text-green-400">🏗️</span>;
      case 'build_road':
        return <span>🛣️</span>;
      case 'build_power_plant':
        return <Zap className="h-4 w-4 text-yellow-400" />;
      case 'build_water_tower':
        return <span>💧</span>;
      case 'build_police_station':
        return <span>🚔</span>;
      case 'build_fire_station':
        return <span>🚒</span>;
      case 'build_hospital':
        return <span>🏥</span>;
      case 'build_school':
        return <span>🏫</span>;
      case 'build_park':
        return <span>🌳</span>;
      case 'bulldoze':
        return <Trash2 className="h-4 w-4 text-red-400" />;
      case 'adjust_tax_rate':
        return <span>💰</span>;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (!aiState) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-dialog-lg bg-gray-900/95 border-cyan-500/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-cyan-400">
            <Bot className="h-5 w-5" />
            City AI Controller
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Bot className={`h-6 w-6 ${aiState.enabled ? 'text-cyan-400' : 'text-gray-500'}`} />
              <div>
                <Label className="text-sm font-medium text-white">Autonomous Mode</Label>
                <p className="text-xs text-gray-400">Let AI manage city operations</p>
              </div>
            </div>
            <Switch
              checked={aiState.enabled}
              onCheckedChange={handleToggleAI}
              className="data-[state=checked]:bg-cyan-500"
            />
          </div>

          {/* AI Status */}
          {aiState.enabled && (
            <>
              {/* Pause/Resume */}
              <div className="flex items-center justify-between px-4">
                <span className="text-sm text-gray-400">Status</span>
                <div className="flex items-center gap-2">
                  {aiState.isPaused ? (
                    <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/50">
                      <Pause className="h-3 w-3 mr-1" />
                      Paused
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-500/20 text-green-400 border-green-500/50">
                      <Play className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleTogglePause}
                    className="h-7 px-2"
                  >
                    {aiState.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Aggressiveness Slider */}
              <div className="px-4 space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm text-gray-400">Aggressiveness</Label>
                  <span className="text-sm text-cyan-400 capitalize">{aiState.aggressiveness}</span>
                </div>
                <Slider
                  value={getAggressivenessValue()}
                  onValueChange={handleAggressivenessChange}
                  max={2}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Conservative</span>
                  <span>Moderate</span>
                  <span>Aggressive</span>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              {/* City Health */}
              {cityHealth && (
                <div className="px-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm text-gray-400">City Health</Label>
                    <Badge className={`${getStatusColor(cityHealth.status)} capitalize`}>
                      {cityHealth.status} ({Math.round(cityHealth.score)}%)
                    </Badge>
                  </div>
                  {cityHealth.mainIssues.length > 0 && (
                    <div className="space-y-1">
                      {cityHealth.mainIssues.slice(0, 3).map((issue, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span className="truncate">{issue}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleForceAssessment}
                    className="text-xs text-gray-400"
                  >
                    <Activity className="h-3 w-3 mr-1" />
                    Refresh Assessment
                  </Button>
                </div>
              )}

              <Separator className="bg-gray-700" />

              {/* Action Queue */}
              <div className="px-4 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm text-gray-400">
                    Pending Actions ({aiState.actionQueue.length})
                  </Label>
                  {aiState.actionQueue.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearQueue}
                      className="h-6 text-xs text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                </div>

                <ScrollArea className="h-40 rounded-md border border-gray-700 bg-gray-800/30">
                  {aiState.actionQueue.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-sm text-gray-500">
                      No pending actions
                    </div>
                  ) : (
                    <div className="p-2 space-y-1">
                      {aiState.actionQueue.map((action, index) => (
                        <ActionItem
                          key={action.id}
                          action={action}
                          index={index}
                          onCancel={handleCancelAction}
                          onPrioritize={handlePrioritizeAction}
                          getIcon={getActionIcon}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Stats */}
              <div className="px-4 flex items-center justify-between text-xs text-gray-500">
                <span>Total actions executed: {aiState.totalActionsExecuted}</span>
                {aiState.lastError && (
                  <span className="text-red-400 truncate max-w-[200px]">
                    Error: {aiState.lastError}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Disabled State Info */}
          {!aiState.enabled && (
            <div className="px-4 py-6 text-center text-gray-400">
              <Bot className="h-12 w-12 mx-auto mb-3 text-gray-600" />
              <p className="text-sm">
                Enable autonomous mode to let the AI manage your city.
              </p>
              <p className="text-xs mt-2 text-gray-500">
                The AI will maintain happiness, balance the budget, and grow your city.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================================================
// ACTION ITEM COMPONENT
// =============================================================================

interface ActionItemProps {
  action: CityAction;
  index: number;
  onCancel: (id: string) => void;
  onPrioritize: (id: string) => void;
  getIcon: (type: CityAction['type']) => React.ReactNode;
}

function ActionItem({ action, index, onCancel, onPrioritize, getIcon }: ActionItemProps) {
  return (
    <div className="flex items-center gap-2 p-2 rounded bg-gray-700/30 hover:bg-gray-700/50 transition-colors">
      <div className="flex-shrink-0 w-6 text-center">
        {getIcon(action.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white truncate">{action.reason}</p>
        {action.position && (
          <p className="text-[10px] text-gray-500">
            at ({action.position.x}, {action.position.y}) • ${action.cost}
          </p>
        )}
      </div>
      <div className="flex-shrink-0 flex items-center gap-1">
        {index > 0 && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-gray-400 hover:text-white"
            onClick={() => onPrioritize(action.id)}
            title="Move to top"
          >
            <ArrowUp className="h-3 w-3" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-gray-400 hover:text-red-400"
          onClick={() => onCancel(action.id)}
          title="Cancel action"
        >
          <XCircle className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

export default CityAIPanel;
