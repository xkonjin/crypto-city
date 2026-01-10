'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Medal, Users, Building2, Clock, RefreshCw } from 'lucide-react';
import {
  fetchLeaderboard,
  getLeaderboardSettings,
  setLeaderboardOptIn,
  submitToLeaderboard,
  formatLeaderboardNumber,
  getRankSuffix,
} from '@/lib/leaderboard/leaderboardService';
import type { LeaderboardData, LeaderboardCategory, LeaderboardEntry } from '@/lib/leaderboard/types';

const CATEGORY_INFO: Record<LeaderboardCategory, { label: string; icon: React.ReactNode; key: keyof LeaderboardEntry }> = {
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
          {category === 'tvl' && '$'}{formatLeaderboardNumber(value)}
        </div>
        {category === 'survival' && (
          <div className="text-xs text-muted-foreground">days</div>
        )}
      </div>
    </div>
  );
}

export function LeaderboardPanel() {
  const { state } = useGame();
  const [category, setCategory] = useState<LeaderboardCategory>('tvl');
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState(getLeaderboardSettings());
  const [playerName, setPlayerName] = useState(settings.playerName);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; rank: number | null } | null>(null);
  
  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchLeaderboard(category);
      setLeaderboard(data);
    } catch (e) {
      console.error('Failed to load leaderboard:', e);
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
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Count buildings from grid (non-terrain tiles)
      const TERRAIN_TYPES = new Set(['grass', 'water', 'tree', 'beach', 'sand', 'mountain', 'snow']);
      const buildingCount = state.grid.flat().filter(
        cell => cell.building?.type && !TERRAIN_TYPES.has(cell.building.type)
      ).length;
      
      const result = await submitToLeaderboard({
        cityId: state.id,
        cityName: state.cityName,
        playerName: playerName,
        population: state.stats.population,
        tvl: state.stats.money, // Using money as TVL proxy
        buildingCount,
        cryptoBuildingCount: 0, // TODO: Track crypto buildings
        daysSurvived: state.day || 1, // Use in-game days
        rugPullsSurvived: 0, // TODO: Track rug pulls survived
      });
      setSubmitResult(result);
      if (result.success) {
        await loadLeaderboard();
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            Leaderboard
          </h2>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadLeaderboard}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        
        {/* Category Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(Object.keys(CATEGORY_INFO) as LeaderboardCategory[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {CATEGORY_INFO[cat].icon}
              {CATEGORY_INFO[cat].label}
            </button>
          ))}
        </div>
      </div>
      
      {/* My Rank */}
      {settings.optedIn && leaderboard?.myRank && (
        <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your Rank</span>
            <span className="text-lg font-bold text-amber-400">
              {leaderboard.myRank}{getRankSuffix(leaderboard.myRank)}
            </span>
          </div>
        </div>
      )}
      
      {/* Leaderboard List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-1">
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
      <div className="p-4 border-t border-border space-y-4">
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
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name"
                className="h-8 text-sm"
              />
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !playerName.trim()}
              className="w-full"
            >
              {isSubmitting ? 'Submitting...' : 'Submit My City'}
            </Button>
            
            {submitResult && (
              <div className={`text-sm text-center ${submitResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {submitResult.success 
                  ? `Submitted! Rank: ${submitResult.rank}${submitResult.rank ? getRankSuffix(submitResult.rank) : ''}`
                  : 'Failed to submit'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default LeaderboardPanel;
