'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Users, Building2, Clock, RefreshCw, Wifi, WifiOff, Star, AlertCircle } from 'lucide-react';
import {
  fetchLeaderboard,
  getLeaderboardSettings,
  setLeaderboardOptIn,
  submitToLeaderboard,
  formatLeaderboardNumber,
  getRankSuffix,
  calculateScore,
  canSubmitScore,
  formatRateLimitTime,
  getConnectionStatus,
} from '@/lib/leaderboard/leaderboardService';
import type { LeaderboardData, LeaderboardCategory, LeaderboardEntry } from '@/lib/leaderboard/types';

const CATEGORY_INFO: Record<LeaderboardCategory, { label: string; icon: React.ReactNode; key: keyof LeaderboardEntry }> = {
  score: { label: 'Score', icon: <Star className="w-4 h-4" />, key: 'score' },
  tvl: { label: 'TVL', icon: <Trophy className="w-4 h-4" />, key: 'tvl' },
  population: { label: 'Population', icon: <Users className="w-4 h-4" />, key: 'population' },
  buildings: { label: 'Buildings', icon: <Building2 className="w-4 h-4" />, key: 'buildingCount' },
  survival: { label: 'Survival', icon: <Clock className="w-4 h-4" />, key: 'daysSurvived' },
};

function getRankIcon(rank: number): React.ReactNode {
  if (rank === 1) return <span className="text-yellow-400">🥇</span>;
  if (rank === 2) return <span className="text-gray-300">🥈</span>;
  if (rank === 3) return <span className="text-amber-600">🥉</span>;
  return <span className="text-muted-foreground w-6 text-center">{rank}</span>;
}

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  rank: number;
  category: LeaderboardCategory;
  isCurrentUser: boolean;
}

function LeaderboardRow({ entry, rank, category, isCurrentUser }: LeaderboardRowProps) {
  const valueKey = CATEGORY_INFO[category].key;
  const value = entry[valueKey] as number;
  
  return (
    <div 
      data-testid="leaderboard-entry"
      className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
        isCurrentUser 
          ? 'bg-amber-500/20 border border-amber-500/50' 
          : 'hover:bg-muted/50'
      }`}
    >
      <div className="w-8 flex justify-center">
        {getRankIcon(rank)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium truncate">{entry.cityName}</div>
        <div className="text-xs text-muted-foreground truncate">by {entry.playerName}</div>
      </div>
      <div className="text-right">
        <div className="font-mono font-semibold">
          {category === 'tvl' && '$'}
          {category === 'score' && '⭐ '}
          {formatLeaderboardNumber(value)}
        </div>
        {category === 'survival' && (
          <div className="text-xs text-muted-foreground">days</div>
        )}
      </div>
    </div>
  );
}

export function LeaderboardPanel() {
  const { state, setActivePanel } = useGame();
  const [category, setCategory] = useState<LeaderboardCategory>('score');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(getLeaderboardSettings());
  const [playerName, setPlayerName] = useState(settings.playerName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; rank: number | null; error?: string; rateLimited?: boolean; remainingMs?: number } | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [rateLimit, setRateLimit] = useState(canSubmitScore());
  
  // Update rate limit every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setRateLimit(canSubmitScore());
    }, 60000);
    return () => clearInterval(interval);
  }, []);
  
  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Initial check
    setIsOffline(!navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard(category);
      setLeaderboard(data);
      setIsOffline(data.isOffline);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
      setIsOffline(true);
    } finally {
      setIsLoading(false);
    }
  }, [category]);
  
  useEffect(() => {
    loadLeaderboard();
  }, [loadLeaderboard]);
  
  const handleOptInChange = (optIn: boolean) => {
    setLeaderboardOptIn(optIn, playerName);
    setSettings({ ...settings, optedIn: optIn, playerName });
  };
  
  // Calculate score preview
  const getScorePreview = useCallback(() => {
    const TERRAIN_TYPES = new Set(['grass', 'water', 'tree', 'beach', 'sand', 'mountain', 'snow']);
    const buildingCount = state.grid.flat().filter(
      cell => cell.building?.type && !TERRAIN_TYPES.has(cell.building.type)
    ).length;
    
    const achievementCount = (state.achievements || []).length;
    const hasRugPulls = (state as { rugPullsSurvived?: number }).rugPullsSurvived ? 
      (state as { rugPullsSurvived?: number }).rugPullsSurvived! > 0 : false;
    
    return calculateScore(
      state.stats.money,
      state.stats.population,
      state.day || 1,
      achievementCount,
      hasRugPulls
    );
  }, [state]);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitResult(null);
    
    try {
      const TERRAIN_TYPES = new Set(['grass', 'water', 'tree', 'beach', 'sand', 'mountain', 'snow']);
      const buildingCount = state.grid.flat().filter(
        cell => cell.building?.type && !TERRAIN_TYPES.has(cell.building.type)
      ).length;
      
      const achievementCount = (state.achievements || []).length;
      const hasRugPulls = (state as { rugPullsSurvived?: number }).rugPullsSurvived ? 
        (state as { rugPullsSurvived?: number }).rugPullsSurvived! > 0 : false;
      
      const result = await submitToLeaderboard({
        cityId: state.id,
        cityName: state.cityName,
        playerName: playerName,
        population: state.stats.population,
        tvl: state.stats.money,
        buildingCount,
        cryptoBuildingCount: 0,
        daysSurvived: state.day || 1,
        achievements: achievementCount,
        rugPullsSurvived: (state as { rugPullsSurvived?: number }).rugPullsSurvived || 0,
        hasRugPulls,
      });
      
      setSubmitResult(result);
      setRateLimit(canSubmitScore());
      
      if (result.success) {
        await loadLeaderboard();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const scorePreview = getScorePreview();
  const connectionStatus = getConnectionStatus();
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent 
        data-testid="leaderboard-panel"
        className="max-w-md max-h-[90vh] flex flex-col"
      >
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Leaderboard
            </DialogTitle>
            <div className="flex items-center gap-2">
              {/* Offline indicator */}
              {isOffline && (
                <div 
                  data-testid="offline-indicator"
                  className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded"
                >
                  <WifiOff className="w-3 h-3" />
                  Offline
                </div>
              )}
              {!isOffline && (
                <div className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded">
                  <Wifi className="w-3 h-3" />
                  Online
                </div>
              )}
              <Button
                data-testid="leaderboard-refresh-btn"
                variant="ghost"
                size="icon-sm"
                onClick={loadLeaderboard}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        {/* Category Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(Object.keys(CATEGORY_INFO) as LeaderboardCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {CATEGORY_INFO[cat].icon}
              <span className="hidden sm:inline">{CATEGORY_INFO[cat].label}</span>
            </button>
          ))}
        </div>
        
        {/* My Rank */}
        {settings.optedIn && leaderboard?.myRank && (
          <div 
            data-testid="player-rank-display"
            className="px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your Rank</span>
              <span className="text-lg font-bold text-amber-400">
                {leaderboard.myRank}{getRankSuffix(leaderboard.myRank)}
              </span>
            </div>
          </div>
        )}
        
        {/* Leaderboard List */}
        <ScrollArea className="flex-1 max-h-[300px]">
          <div className="space-y-1 pr-2">
            {isLoading ? (
              <div className="text-center text-muted-foreground py-8">Loading...</div>
            ) : leaderboard?.entries.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No entries yet</div>
            ) : (
              leaderboard?.entries.map((entry, index) => (
                <LeaderboardRow
                  key={entry.id}
                  entry={entry}
                  rank={index + 1}
                  category={category}
                  isCurrentUser={entry.id === state.id}
                />
              ))
            )}
          </div>
        </ScrollArea>
        
        {/* Opt-in Section */}
        <div className="space-y-3 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <Label htmlFor="leaderboard-optin" className="text-sm">
              Share my city on leaderboard
            </Label>
            <Switch
              id="leaderboard-optin"
              checked={settings.optedIn}
              onCheckedChange={handleOptInChange}
            />
          </div>
          
          {settings.optedIn && (
            <>
              <div className="space-y-2">
                <Label htmlFor="player-name" className="text-xs text-muted-foreground">
                  Display Name
                </Label>
                <Input
                  id="player-name"
                  data-testid="player-name-input"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  className="h-8 text-sm"
                />
              </div>
              
              {/* Score Preview */}
              <div className="bg-muted/50 p-3 rounded-lg space-y-2 text-xs">
                <div className="font-medium text-sm flex items-center gap-2">
                  <Star className="w-4 h-4 text-amber-400" />
                  Score Preview
                </div>
                <div className="grid grid-cols-2 gap-1 text-muted-foreground">
                  <span>Base Score:</span>
                  <span className="text-right font-mono">{formatLeaderboardNumber(scorePreview.baseScore)}</span>
                  <span>Achievement Bonus:</span>
                  <span className="text-right font-mono">+{formatLeaderboardNumber(scorePreview.achievementBonus)}</span>
                  <span>Multiplier:</span>
                  <span className="text-right font-mono">{scorePreview.multiplier}x</span>
                </div>
                <div className="border-t border-border pt-2 flex justify-between font-medium">
                  <span>Final Score:</span>
                  <span className="text-amber-400 font-mono">{formatLeaderboardNumber(scorePreview.finalScore)}</span>
                </div>
              </div>
              
              {/* Rate limit message */}
              {!rateLimit.allowed && (
                <div 
                  data-testid="rate-limit-message"
                  className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 px-3 py-2 rounded"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Next submission in {formatRateLimitTime(rateLimit.remainingMs)}</span>
                </div>
              )}
              
              <Button
                data-testid="submit-score-btn"
                onClick={handleSubmit}
                disabled={isSubmitting || !playerName.trim() || !rateLimit.allowed}
                className="w-full"
              >
                {isSubmitting ? 'Submitting...' : 
                 !rateLimit.allowed ? `Wait ${formatRateLimitTime(rateLimit.remainingMs)}` :
                 'Submit My Score'}
              </Button>
              
              {submitResult && (
                <div className={`text-sm text-center ${submitResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {submitResult.success 
                    ? `Submitted! Score: ${formatLeaderboardNumber(scorePreview.finalScore)} - Rank: ${submitResult.rank}${submitResult.rank ? getRankSuffix(submitResult.rank) : ''}`
                    : submitResult.error || 'Failed to submit'}
                </div>
              )}
            </>
          )}
          
          {/* Connection info */}
          {!connectionStatus.supabaseConfigured && (
            <div className="text-xs text-muted-foreground text-center">
              Demo mode (Supabase not configured)
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LeaderboardPanel;
