'use client';

import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X } from 'lucide-react';
import type { CryptoNPC } from '@/games/isocity/types/npc';
import type { Relationship, RelationshipType } from '@/lib/npc/relationships';

interface NPCRelationshipViewProps {
  npc: CryptoNPC;
  allNPCs: CryptoNPC[];
  onSelectNPC: (id: string) => void;
  onClose?: () => void;
}

/**
 * Relationship category groupings for display
 */
type RelationshipCategory = 'friends' | 'rivals' | 'enemies' | 'romantic' | 'other';

/**
 * Map relationship types to display categories
 */
const RELATIONSHIP_CATEGORIES: Record<RelationshipType, RelationshipCategory> = {
  stranger: 'other',
  acquaintance: 'other',
  friend: 'friends',
  close_friend: 'friends',
  best_friend: 'friends',
  rival: 'rivals',
  enemy: 'enemies',
  nemesis: 'enemies',
  romantic_interest: 'romantic',
  partner: 'romantic',
  business_partner: 'other',
  mentor: 'other',
  mentee: 'other',
};

/**
 * Category labels with emoji
 */
const CATEGORY_INFO: Record<RelationshipCategory, { label: string; emoji: string }> = {
  friends: { label: 'Friends', emoji: '💚' },
  rivals: { label: 'Rivals', emoji: '⚔️' },
  enemies: { label: 'Enemies', emoji: '💀' },
  romantic: { label: 'Romantic', emoji: '💕' },
  other: { label: 'Other', emoji: '🤝' },
};

/**
 * Get color class for a metric value (-100 to +100 or 0 to 100)
 */
function getMetricColor(value: number, isSymmetric: boolean = true): string {
  if (isSymmetric) {
    // For -100 to +100 metrics (trust, respect, attraction)
    if (value >= 50) return 'bg-green-500';
    if (value >= 0) return 'bg-green-500/60';
    if (value >= -50) return 'bg-red-500/60';
    return 'bg-red-500';
  } else {
    // For 0 to 100 metrics (familiarity)
    if (value >= 60) return 'bg-blue-500';
    if (value >= 30) return 'bg-blue-500/60';
    return 'bg-blue-500/30';
  }
}

/**
 * Mini meter component for relationship metrics
 */
function RelationshipMeter({
  label,
  value,
  isSymmetric = true,
}: {
  label: string;
  value: number;
  isSymmetric?: boolean;
}) {
  // Calculate fill percentage
  const fillPercent = isSymmetric
    ? Math.abs(value) / 2 // -100 to +100 mapped to 0-50%
    : value; // 0-100 maps directly

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-14 text-muted-foreground truncate">{label}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        {isSymmetric ? (
          // Symmetric meter: center-based for trust/respect/attraction
          <div className="relative h-full">
            <div
              className={cn(
                'absolute h-full rounded-full transition-all duration-300',
                getMetricColor(value, true)
              )}
              style={{
                left: value >= 0 ? '50%' : `${50 - Math.abs(value) / 2}%`,
                width: `${Math.abs(value) / 2}%`,
              }}
            />
          </div>
        ) : (
          // Linear meter for familiarity (0-100)
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              getMetricColor(value, false)
            )}
            style={{ width: `${value}%` }}
          />
        )}
      </div>
      <span className="w-8 text-right tabular-nums">{Math.round(value)}</span>
    </div>
  );
}

/**
 * Single relationship row component
 */
function RelationshipRow({
  relationship,
  targetNPC,
  onSelect,
}: {
  relationship: Relationship;
  targetNPC: CryptoNPC | undefined;
  onSelect: () => void;
}) {
  if (!targetNPC) return null;

  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-2 rounded-sm hover:bg-muted/50 transition-colors duration-150"
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="font-medium text-sm truncate">{targetNPC.name}</span>
        <span className="text-xs text-muted-foreground capitalize">
          {relationship.type.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="space-y-1">
        <RelationshipMeter label="Trust" value={relationship.trust} isSymmetric />
        <RelationshipMeter label="Respect" value={relationship.respect} isSymmetric />
        <RelationshipMeter label="Familiar" value={relationship.familiarity} isSymmetric={false} />
        <RelationshipMeter label="Attract" value={relationship.attraction} isSymmetric />
      </div>
    </button>
  );
}

/**
 * View showing an NPC's relationships categorized by type.
 * Displays trust and respect meters for each relationship.
 */
export function NPCRelationshipView({
  npc,
  allNPCs,
  onSelectNPC,
  onClose,
}: NPCRelationshipViewProps) {
  // Create a map of NPC IDs to NPCs for quick lookup
  const npcMap = useMemo(() => {
    const map = new Map<string, CryptoNPC>();
    allNPCs.forEach((n) => map.set(n.id, n));
    return map;
  }, [allNPCs]);

  // Group relationships by category
  const groupedRelationships = useMemo(() => {
    const groups: Record<RelationshipCategory, Array<{ relationship: Relationship; targetNPC: CryptoNPC | undefined }>> = {
      friends: [],
      rivals: [],
      enemies: [],
      romantic: [],
      other: [],
    };

    Object.values(npc.relationships).forEach((rel) => {
      const category = RELATIONSHIP_CATEGORIES[rel.type];
      const targetNPC = npcMap.get(rel.targetId);
      // Only include non-strangers or those with significant familiarity
      if (rel.type !== 'stranger' || rel.familiarity >= 10) {
        groups[category].push({ relationship: rel, targetNPC });
      }
    });

    // Sort each group by familiarity (most familiar first)
    Object.keys(groups).forEach((key) => {
      const k = key as RelationshipCategory;
      groups[k].sort((a, b) => b.relationship.familiarity - a.relationship.familiarity);
    });

    return groups;
  }, [npc.relationships, npcMap]);

  // Categories with at least one relationship
  const nonEmptyCategories = (Object.keys(groupedRelationships) as RelationshipCategory[]).filter(
    (cat) => groupedRelationships[cat].length > 0
  );

  const totalRelationships = Object.values(groupedRelationships).reduce(
    (sum, arr) => sum + arr.length,
    0
  );

  return (
    <Card className="w-80 bg-sidebar/95 backdrop-blur-sm border-sidebar-border shadow-xl">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            {npc.name}&apos;s Relationships
          </CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              aria-label="Close relationship view"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {totalRelationships} known {totalRelationships === 1 ? 'citizen' : 'citizens'}
        </p>
      </CardHeader>

      <CardContent className="p-0">
        {totalRelationships === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            No meaningful relationships yet.
            <br />
            <span className="text-xs">Everyone starts as a stranger in Crypto City.</span>
          </div>
        ) : (
          <ScrollArea className="h-72">
            <div className="p-3 space-y-4">
              {nonEmptyCategories.map((category) => (
                <div key={category}>
                  <h4 className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    <span>{CATEGORY_INFO[category].emoji}</span>
                    <span>{CATEGORY_INFO[category].label}</span>
                    <span className="ml-auto text-[10px] opacity-70">
                      ({groupedRelationships[category].length})
                    </span>
                  </h4>
                  <div className="space-y-1">
                    {groupedRelationships[category].map(({ relationship, targetNPC }) => (
                      <RelationshipRow
                        key={relationship.targetId}
                        relationship={relationship}
                        targetNPC={targetNPC}
                        onSelect={() => onSelectNPC(relationship.targetId)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default NPCRelationshipView;
