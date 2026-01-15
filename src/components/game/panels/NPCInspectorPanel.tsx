/**
 * NPCInspectorPanel - Progressive Disclosure NPC Inspector UI
 * 
 * A detailed panel for inspecting NPC state using progressive disclosure.
 * Shows identity, current thought, mood, activity, personality traits,
 * relationships, and recent thoughts history.
 * 
 * "In the crypto city, understanding your NPCs is half the battle.
 *  The other half is understanding why they just aped into a rug."
 * — The Hitchhiker's Guide to Crypto City
 */

'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Star,
  X,
  MessageCircle,
  Users,
  MapPin,
  Briefcase,
  Wallet,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Brain,
  Gift,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Package,
} from 'lucide-react';
import type { CryptoNPC, Occupation } from '@/games/isocity/types/npc';
import type { Relationship } from '@/lib/npc/relationships';
import { ARCHETYPE_DESCRIPTIONS, type PersonalityArchetype } from '@/lib/npc/personality';
import { OCCUPATION_DESCRIPTIONS } from '@/games/isocity/types/npc';
import type { NPCTransaction } from '@/lib/npc/x402/types';
import type { InventoryItem } from '@/lib/npc/x402/items';
import { getItem, formatItemPrice, getRarityColor } from '@/lib/npc/x402/items';
import { formatUnits } from 'viem';
import { NPCWalletBadge } from '../NPCWalletBadge';

// =============================================================================
// TYPES
// =============================================================================

interface NPCInspectorPanelProps {
  /** The NPC to inspect */
  npc: CryptoNPC;
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Recent thoughts for this NPC */
  recentThoughts?: string[];
  /** Whether this NPC is favorited */
  isFavorited?: boolean;
  /** Callback to toggle favorite */
  onToggleFavorite?: () => void;
  /** Callback when Talk action is clicked */
  onTalk?: () => void;
  /** Callback when Follow action is clicked */
  onFollow?: () => void;
  /** Callback to view relationships */
  onViewRelationships?: () => void;
  /** X402 wallet balance in atomic units (6 decimals) */
  x402Balance?: bigint;
  /** Recent X402 transactions for this NPC */
  x402Transactions?: NPCTransaction[];
  /** Items owned by this NPC */
  inventory?: InventoryItem[];
  /** Map of NPC IDs to names for transaction display */
  npcNames?: Map<string, string>;
}

// =============================================================================
// CONSTANTS
// =============================================================================

/** Emoji representation for each mood */
const MOOD_EMOJIS: Record<string, string> = {
  ecstatic: '🤩',
  happy: '😊',
  content: '😌',
  neutral: '😐',
  anxious: '😰',
  sad: '😢',
  angry: '😠',
  depressed: '😞',
};

/** Emoji representation for each activity */
const ACTIVITY_EMOJIS: Record<string, string> = {
  idle: '🧍',
  walking: '🚶',
  working: '💼',
  eating: '🍽️',
  sleeping: '😴',
  socializing: '💬',
  shopping: '🛒',
};

/** Color scale for personality traits */
const TRAIT_COLORS = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-red-500',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/** Truncates a wallet address for display */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/** Formats a number as currency */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/** Capitalize first letter and replace underscores with spaces */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
}

/** Get trait level description */
function getTraitLevel(value: number): 'low' | 'medium' | 'high' {
  if (value < 0.33) return 'low';
  if (value < 0.66) return 'medium';
  return 'high';
}

/** Format trait percentage */
function formatTraitPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

/** Progress bar for personality traits */
function TraitBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  const level = getTraitLevel(value);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="font-mono text-xs">{formatTraitPercent(value)}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', TRAIT_COLORS[level])}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Collapsible section */
function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border-t border-border pt-3">
      <button
        className="flex items-center justify-between w-full text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </span>
        {isOpen ? (
          <ChevronUp className="size-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="size-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

/** Relationship display item */
function RelationshipItem({
  npcName,
  relationship,
}: {
  npcName: string;
  relationship: Relationship;
}) {
  // Trust scale is -100 to 100
  const trustLevel = relationship.trust > 50 ? 'positive' : relationship.trust < -30 ? 'negative' : 'neutral';
  const emoji = trustLevel === 'positive' ? '💚' : trustLevel === 'negative' ? '💔' : '💭';
  
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="flex items-center gap-1">
        <span>{emoji}</span>
        <span className="truncate">{npcName}</span>
      </span>
      <span className="text-xs text-muted-foreground">
        {Math.round(relationship.familiarity)}% familiar
      </span>
    </div>
  );
}

/** X402 Transaction item display */
function TransactionItem({
  transaction,
  npcId,
  npcNames,
}: {
  transaction: NPCTransaction;
  npcId: string;
  npcNames?: Map<string, string>;
}) {
  const isIncoming = transaction.toNpcId === npcId;
  const otherNpcId = isIncoming ? transaction.fromNpcId : transaction.toNpcId;
  const otherName = npcNames?.get(otherNpcId) ?? otherNpcId.slice(0, 8);
  const amount = formatUnits(transaction.amount, 6);
  const value = parseFloat(amount);
  
  const Icon = isIncoming ? ArrowDownRight : ArrowUpRight;
  const colorClass = isIncoming ? 'text-green-400' : 'text-amber-400';
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className={cn('size-3', colorClass)} />
      <span className="flex-1 truncate">
        {isIncoming ? `From ${otherName}` : `To ${otherName}`}
      </span>
      <span className={cn('font-mono', colorClass)}>
        {isIncoming ? '+' : '-'}${value.toFixed(2)}
      </span>
    </div>
  );
}

/** Inventory item display */
function InventoryItemDisplay({
  inventoryItem,
}: {
  inventoryItem: InventoryItem;
}) {
  const item = getItem(inventoryItem.itemId);
  if (!item) return null;
  
  const rarityColor = getRarityColor(item.rarity);
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <span>{item.icon || '📦'}</span>
      <span className="flex-1 truncate" style={{ color: rarityColor }}>
        {item.name}
      </span>
      <span className="text-muted-foreground">
        x{inventoryItem.quantity}
      </span>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

/**
 * NPCInspectorPanel - Full NPC inspection with progressive disclosure
 */
export function NPCInspectorPanel({
  npc,
  isOpen,
  onClose,
  recentThoughts = [],
  isFavorited = false,
  onToggleFavorite,
  onTalk,
  onFollow,
  onViewRelationships,
  x402Balance,
  x402Transactions = [],
  inventory = [],
  npcNames,
}: NPCInspectorPanelProps) {
  // Extract NPC state
  const mood = npc.internalWorld?.currentMood ?? 'neutral';
  const moodEmoji = MOOD_EMOJIS[mood] ?? '😐';
  const activityEmoji = npc.currentActivity ? ACTIVITY_EMOJIS[npc.currentActivity] ?? '🧍' : '🧍';
  const netWorth = npc.finances?.netWorth ?? 0;
  const walletBalance = npc.wallet?.cash ?? 0;
  const currentThought = npc.thoughtStream?.currentThought ?? recentThoughts[0] ?? 'Just arrived in Crypto City...';
  
  // Get archetype description
  const archetypeDescription = npc.personalityArchetype 
    ? ARCHETYPE_DESCRIPTIONS[npc.personalityArchetype]
    : 'A mysterious citizen of Crypto City.';
    
  // Get occupation description
  const occupationDescription = OCCUPATION_DESCRIPTIONS[npc.occupation as Occupation] ?? '';
  
  // Get relationships as array
  const relationshipsList = Object.entries(npc.relationships || {}).slice(0, 5);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-dialog-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar/Mood indicator */}
              <div className="size-14 rounded-lg bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
                {moodEmoji}
              </div>
              
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-lg truncate">{npc.name}</DialogTitle>
                  {onToggleFavorite && (
                    <button
                      onClick={onToggleFavorite}
                      className="shrink-0"
                      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star
                        className={cn(
                          'size-4 transition-colors',
                          isFavorited
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground hover:text-yellow-400'
                        )}
                      />
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {truncateAddress(npc.walletAddress)}
                </p>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Current Thought - Always visible (💭) */}
          <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">💭</span>
              <p className="text-sm italic text-muted-foreground leading-relaxed">
                &ldquo;{currentThought}&rdquo;
              </p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-lg">{moodEmoji}</div>
              <div className="text-xs text-muted-foreground">{capitalize(mood)}</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-lg">{activityEmoji}</div>
              <div className="text-xs text-muted-foreground">
                {npc.currentActivity ? capitalize(npc.currentActivity) : 'Idle'}
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-sm font-mono text-green-400">
                {formatCurrency(walletBalance)}
              </div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </div>
            <div className="bg-muted/30 rounded-lg p-2">
              <div className="text-sm font-medium">{npc.age}</div>
              <div className="text-xs text-muted-foreground">Age</div>
            </div>
          </div>

          {/* Occupation */}
          <div className="flex items-center gap-2 text-sm">
            <Briefcase className="size-4 text-muted-foreground" />
            <span className="font-medium">{capitalize(npc.occupation)}</span>
            {occupationDescription && (
              <span className="text-xs text-muted-foreground italic truncate">
                — {occupationDescription}
              </span>
            )}
          </div>

          {/* Personality Traits Section */}
          <CollapsibleSection
            title="Crypto Personality"
            icon={<Brain className="size-4 text-purple-400" />}
            defaultOpen={true}
          >
            {npc.personalityArchetype && (
              <p className="text-xs text-muted-foreground italic mb-3">
                {archetypeDescription}
              </p>
            )}
            <div className="space-y-2">
              <TraitBar
                label="Risk Tolerance"
                value={npc.personality.crypto.riskTolerance}
                icon={<span>🎲</span>}
              />
              <TraitBar
                label="FOMO Level"
                value={npc.personality.crypto.fomo}
                icon={<span>📈</span>}
              />
              <TraitBar
                label="Degen Level"
                value={npc.personality.crypto.degenLevel}
                icon={<span>🦍</span>}
              />
              <TraitBar
                label="Technical Knowledge"
                value={npc.personality.crypto.technicalKnowledge}
                icon={<span>🔧</span>}
              />
              <TraitBar
                label="Trust in Institutions"
                value={npc.personality.crypto.trustInInstitutions}
                icon={<span>🏦</span>}
              />
            </div>
          </CollapsibleSection>

          {/* Recent Thoughts Section */}
          {recentThoughts.length > 1 && (
            <CollapsibleSection
              title="Recent Thoughts"
              icon={<Sparkles className="size-4 text-amber-400" />}
            >
              <div className="space-y-2">
                {recentThoughts.slice(1).map((thought, i) => (
                  <div
                    key={i}
                    className="text-xs text-muted-foreground pl-3 border-l-2 border-muted"
                  >
                    &ldquo;{thought}&rdquo;
                  </div>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* X402 Wallet Section */}
          {x402Balance !== undefined && (
            <CollapsibleSection
              title="X402 Wallet"
              icon={<Wallet className="size-4 text-green-400" />}
              defaultOpen={true}
            >
              <div className="space-y-3">
                {/* Balance Display */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">USDT₮ Balance</span>
                  <NPCWalletBadge balance={x402Balance} size="md" />
                </div>
                
                {/* Recent Transactions */}
                {x402Transactions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground font-medium">
                      Recent Transactions
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {x402Transactions.slice(0, 5).map((tx) => (
                        <TransactionItem
                          key={tx.id}
                          transaction={tx}
                          npcId={npc.id}
                          npcNames={npcNames}
                        />
                      ))}
                    </div>
                    {x402Transactions.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{x402Transactions.length - 5} more transactions
                      </div>
                    )}
                  </div>
                )}
                
                {/* Inventory */}
                {inventory.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
                      <Package className="size-3" />
                      Inventory ({inventory.length})
                    </div>
                    <div className="space-y-1.5 pl-1">
                      {inventory.slice(0, 5).map((item) => (
                        <InventoryItemDisplay
                          key={item.itemId}
                          inventoryItem={item}
                        />
                      ))}
                    </div>
                    {inventory.length > 5 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{inventory.length - 5} more items
                      </div>
                    )}
                  </div>
                )}
                
                {/* Empty State */}
                {x402Transactions.length === 0 && inventory.length === 0 && (
                  <div className="text-xs text-muted-foreground text-center py-2">
                    No economic activity yet
                  </div>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Relationships Section */}
          {relationshipsList.length > 0 && (
            <CollapsibleSection
              title={`Relationships (${Object.keys(npc.relationships || {}).length})`}
              icon={<Users className="size-4 text-blue-400" />}
            >
              <div className="space-y-2">
                {relationshipsList.map(([npcId, rel]) => (
                  <RelationshipItem
                    key={npcId}
                    npcName={npcId}
                    relationship={rel}
                  />
                ))}
                {Object.keys(npc.relationships || {}).length > 5 && onViewRelationships && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onViewRelationships}
                    className="w-full text-xs"
                  >
                    View all relationships →
                  </Button>
                )}
              </div>
            </CollapsibleSection>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-border">
            {onTalk && (
              <Button
                variant="default"
                size="sm"
                onClick={onTalk}
                className="flex-1 gap-1.5"
              >
                <MessageCircle className="size-4" />
                <span>Talk</span>
              </Button>
            )}
            {onFollow && (
              <Button
                variant="outline"
                size="sm"
                onClick={onFollow}
                className="flex-1 gap-1.5"
              >
                <MapPin className="size-4" />
                <span>Follow</span>
              </Button>
            )}
            {onViewRelationships && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewRelationships}
                className="flex-1 gap-1.5"
              >
                <Users className="size-4" />
                <span>Relations</span>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default NPCInspectorPanel;
