'use client';

/**
 * Find My Character Panel
 * 
 * Shows all ingested X/Twitter NPCs and allows the user to
 * pan the camera to find their character in the city.
 */

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { CloseIcon } from '@/components/ui/Icons';
import {
  MapPin,
  User,
  Clock,
  Wallet,
  Trash2,
  RefreshCw,
  Search,
} from 'lucide-react';
import IngestedNPCStore, {
  type PersistedIngestedNPC,
} from '@/lib/ingestion/IngestedNPCStore';

interface FindMyCharacterPanelProps {
  onClose: () => void;
  onFindCharacter: (x: number, y: number, username: string) => void;
  isMobile?: boolean;
}

export function FindMyCharacterPanel({
  onClose,
  onFindCharacter,
  isMobile = false,
}: FindMyCharacterPanelProps) {
  const [ingestedNPCs, setIngestedNPCs] = useState<PersistedIngestedNPC[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null);
  const [loadTrigger, setLoadTrigger] = useState(0);

  // Load ingested NPCs from IndexedDB
  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      setLoading(true);
      try {
        const npcs = await IngestedNPCStore.getAll();
        if (!cancelled) {
          setIngestedNPCs(npcs.sort((a, b) => b.createdAt - a.createdAt));
        }
      } catch (error) {
        console.error('[FindMyCharacter] Failed to load NPCs:', error);
      }
      if (!cancelled) {
        setLoading(false);
      }
    }
    
    load();
    
    return () => { cancelled = true; };
  }, [loadTrigger]);
  
  // Trigger a reload
  const loadNPCs = useCallback(() => {
    setLoadTrigger(t => t + 1);
  }, []);

  // Handle finding a character
  const handleFind = useCallback(
    (npc: PersistedIngestedNPC) => {
      setSelectedNPC(npc.profileId);
      onFindCharacter(npc.lastPosition.x, npc.lastPosition.y, npc.username);
    },
    [onFindCharacter]
  );

  // Handle deleting a character
  const handleDelete = useCallback(
    async (profileId: string) => {
      if (
        !confirm('Are you sure you want to remove this character from your city?')
      ) {
        return;
      }
      try {
        await IngestedNPCStore.delete(profileId);
        setIngestedNPCs((prev) => prev.filter((n) => n.profileId !== profileId));
      } catch (error) {
        console.error('[FindMyCharacter] Failed to delete NPC:', error);
      }
    },
    []
  );

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card
      className={`${
        isMobile
          ? 'fixed left-0 right-0 w-full rounded-none border-x-0 border-t border-b z-30'
          : 'absolute top-4 right-4 w-80'
      } bg-gray-900/95 border-cyan-500/30`}
      style={
        isMobile
          ? { top: 'calc(72px + env(safe-area-inset-top, 0px))' }
          : undefined
      }
    >
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" />
          <CardTitle className="text-sm font-sans text-white">
            Find My Character
          </CardTitle>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={loadNPCs}
            className="text-gray-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <CloseIcon size={14} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <RefreshCw className="w-6 h-6 mx-auto mb-2 animate-spin" />
            Loading characters...
          </div>
        ) : ingestedNPCs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No ingested characters yet.</p>
            <p className="text-xs mt-1">
              Use the 𝕏 button to ingest a Twitter profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {ingestedNPCs.map((npc) => (
              <div
                key={npc.profileId}
                className={`p-3 rounded-lg border transition-all ${
                  selectedNPC === npc.profileId
                    ? 'bg-cyan-500/20 border-cyan-500/50'
                    : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                }`}
              >
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-cyan-500/30">
                    <Image
                      src={npc.profileImageUrl}
                      alt={npc.displayName}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-white truncate">
                      {npc.displayName}
                    </h4>
                    <p className="text-xs text-cyan-400">@{npc.username}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="flex items-center gap-1 text-gray-400">
                    <User className="w-3 h-3" />
                    <span className="capitalize">{npc.occupation}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(npc.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-400">
                    <MapPin className="w-3 h-3" />
                    <span className="font-mono">
                      ({npc.lastPosition.x}, {npc.lastPosition.y})
                    </span>
                  </div>
                  {npc.x402WalletAddress && (
                    <div className="flex items-center gap-1 text-green-400">
                      <Wallet className="w-3 h-3" />
                      <span>x402</span>
                    </div>
                  )}
                </div>

                {/* Archetype Badge */}
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="outline"
                    className="text-xs capitalize bg-purple-500/20 text-purple-300 border-purple-500/30"
                  >
                    {npc.archetype.replace(/_/g, ' ')}
                  </Badge>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleFind(npc)}
                    className="flex-1 gap-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <MapPin className="w-3 h-3" />
                    Find
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(npc.profileId)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Separator className="bg-gray-700" />

        <p className="text-[10px] text-gray-500 text-center">
          Ingested characters are saved and will persist between sessions.
        </p>
      </CardContent>
    </Card>
  );
}

export default FindMyCharacterPanel;
