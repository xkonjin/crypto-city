/**
 * Emergent Drama Engine
 * 
 * Generates relationship events and city news based on NPC interactions,
 * creating emergent storytelling and social dynamics.
 * 
 * Issue #138: Emergent Drama Engine - relationship events and city news
 */

import type { CryptoNPC } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

export type DramaEventType =
  | 'new_relationship'
  | 'breakup'
  | 'rivalry_started'
  | 'rivalry_ended'
  | 'friendship_formed'
  | 'friendship_broken'
  | 'wedding'
  | 'business_partnership'
  | 'business_rivalry'
  | 'scandal'
  | 'redemption'
  | 'public_fight'
  | 'reconciliation';

export interface DramaEvent {
  id: string;
  type: DramaEventType;
  timestamp: number;
  participants: string[];  // NPC IDs
  description: string;
  newsHeadline: string;
  impact: DramaImpact;
  isPublic: boolean;
}

export interface DramaImpact {
  relationshipChanges: Array<{
    npc1: string;
    npc2: string;
    change: number;
  }>;
  cityMoodChange: number;
  reputationChanges: Array<{
    npcId: string;
    change: number;
  }>;
}

export interface CityNewsItem {
  id: string;
  headline: string;
  body: string;
  timestamp: number;
  category: 'drama' | 'market' | 'achievement' | 'event' | 'gossip';
  relatedNPCs: string[];
  importance: number;  // 1-10
}

export interface NPCRelationshipState {
  npc1Id: string;
  npc2Id: string;
  trust: number;
  respect: number;
  attraction: number;
  rivalry: number;
  history: string[];
}

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Drama event templates
 */
export const DRAMA_TEMPLATES: Record<DramaEventType, {
  headlines: string[];
  descriptions: string[];
  conditions: (state: NPCRelationshipState) => boolean;
  probability: number;
}> = {
  new_relationship: {
    headlines: [
      "{npc1} and {npc2} spotted together at {location}!",
      "Love in the air? {npc1} and {npc2} seem close",
      "New couple alert: {npc1} x {npc2}",
    ],
    descriptions: [
      "{npc1} and {npc2} have started dating. Citizens are divided on whether they make a good match.",
      "Romance blooms in the city as {npc1} and {npc2} make their relationship official.",
    ],
    conditions: (state) => state.attraction > 70 && state.trust > 50,
    probability: 0.05,
  },
  
  breakup: {
    headlines: [
      "Splitsville: {npc1} and {npc2} call it quits",
      "{npc1} and {npc2} are DONE",
      "It's over between {npc1} and {npc2}",
    ],
    descriptions: [
      "The relationship between {npc1} and {npc2} has ended. Sources say it wasn't mutual.",
      "After months together, {npc1} and {npc2} have parted ways. The city mourns.",
    ],
    conditions: (state) => state.trust < 20 && state.attraction > 30,
    probability: 0.08,
  },
  
  rivalry_started: {
    headlines: [
      "Beef alert: {npc1} and {npc2} are feuding",
      "Tension rising between {npc1} and {npc2}",
      "{npc1} throws shade at {npc2} publicly",
    ],
    descriptions: [
      "A rivalry has emerged between {npc1} and {npc2}. Things are heating up.",
      "What started as mild disagreement has escalated into full rivalry between {npc1} and {npc2}.",
    ],
    conditions: (state) => state.rivalry > 60 && state.trust < 30,
    probability: 0.06,
  },
  
  rivalry_ended: {
    headlines: [
      "Peace at last: {npc1} and {npc2} bury the hatchet",
      "{npc1} and {npc2} squash their beef",
      "Rivals no more: {npc1} and {npc2} reconcile",
    ],
    descriptions: [
      "The long-standing rivalry between {npc1} and {npc2} appears to be over.",
      "In a surprising turn, {npc1} and {npc2} have ended their feud.",
    ],
    conditions: (state) => state.rivalry < 20 && state.trust > 40,
    probability: 0.04,
  },
  
  friendship_formed: {
    headlines: [
      "New besties: {npc1} and {npc2} hit it off",
      "{npc1} and {npc2} becoming inseparable",
      "Friendship goals: {npc1} x {npc2}",
    ],
    descriptions: [
      "A beautiful friendship has formed between {npc1} and {npc2}.",
      "{npc1} and {npc2} have become close friends after bonding over shared interests.",
    ],
    conditions: (state) => state.trust > 70 && state.respect > 60,
    probability: 0.04,
  },
  
  friendship_broken: {
    headlines: [
      "Friendship over? {npc1} and {npc2} on the outs",
      "Trouble in paradise for {npc1} and {npc2}",
      "{npc1} unfollows {npc2} - drama ensues",
    ],
    descriptions: [
      "The friendship between {npc1} and {npc2} appears to be over after a falling out.",
      "Once close friends, {npc1} and {npc2} are no longer speaking.",
    ],
    conditions: (state) => state.trust < 25 && state.respect < 30,
    probability: 0.05,
  },
  
  wedding: {
    headlines: [
      "Wedding bells! {npc1} and {npc2} tie the knot",
      "{npc1} and {npc2} say 'I do'",
      "Crypto wedding of the year: {npc1} x {npc2}",
    ],
    descriptions: [
      "The city celebrates as {npc1} and {npc2} get married in a beautiful ceremony.",
      "Love wins! {npc1} and {npc2} are officially married.",
    ],
    conditions: (state) => state.trust > 90 && state.attraction > 85,
    probability: 0.01,
  },
  
  business_partnership: {
    headlines: [
      "{npc1} and {npc2} launch joint venture",
      "Business power couple: {npc1} + {npc2}",
      "New partnership: {npc1} teams up with {npc2}",
    ],
    descriptions: [
      "{npc1} and {npc2} have announced a business partnership.",
      "Two of the city's notable figures, {npc1} and {npc2}, are joining forces.",
    ],
    conditions: (state) => state.trust > 65 && state.respect > 70,
    probability: 0.03,
  },
  
  business_rivalry: {
    headlines: [
      "Competition heats up: {npc1} vs {npc2}",
      "{npc1} and {npc2} going head to head",
      "Business rivals: {npc1} challenges {npc2}",
    ],
    descriptions: [
      "{npc1} and {npc2} are now competing directly in business.",
      "The business rivalry between {npc1} and {npc2} is affecting the local economy.",
    ],
    conditions: (state) => state.rivalry > 50 && state.respect > 40,
    probability: 0.04,
  },
  
  scandal: {
    headlines: [
      "SCANDAL: {npc1}'s secret revealed by {npc2}",
      "{npc2} exposes {npc1}! City shocked",
      "The {npc1} scandal: What we know so far",
    ],
    descriptions: [
      "A scandal has erupted involving {npc1}, with {npc2} at the center of the revelation.",
      "The city is buzzing after {npc2} revealed shocking information about {npc1}.",
    ],
    conditions: (state) => state.trust < 20 && state.rivalry > 70,
    probability: 0.02,
  },
  
  redemption: {
    headlines: [
      "{npc1} seeks redemption, {npc2} forgives",
      "Second chances: {npc1} makes amends with {npc2}",
      "{npc1}'s apology to {npc2} accepted",
    ],
    descriptions: [
      "After their falling out, {npc1} has sought and received forgiveness from {npc2}.",
      "In a touching moment, {npc2} forgave {npc1} for past wrongs.",
    ],
    conditions: (state) => state.trust > 50 && state.history.includes('conflict'),
    probability: 0.03,
  },
  
  public_fight: {
    headlines: [
      "FIGHT: {npc1} and {npc2} clash publicly",
      "Chaos at {location}: {npc1} vs {npc2}",
      "{npc1} and {npc2} caught fighting!",
    ],
    descriptions: [
      "{npc1} and {npc2} got into a heated public argument.",
      "Witnesses report a major fight between {npc1} and {npc2}.",
    ],
    conditions: (state) => state.rivalry > 80 && state.trust < 15,
    probability: 0.02,
  },
  
  reconciliation: {
    headlines: [
      "Friends again: {npc1} and {npc2} reconcile",
      "{npc1} and {npc2} patch things up",
      "Making up: {npc1} x {npc2} back on good terms",
    ],
    descriptions: [
      "{npc1} and {npc2} have reconciled after their disagreement.",
      "The rift between {npc1} and {npc2} has been healed.",
    ],
    conditions: (state) => state.trust > 55 && state.history.includes('conflict'),
    probability: 0.04,
  },
};

/**
 * Location names for headlines
 */
const LOCATIONS = [
  "the Uniswap Bar",
  "Satoshi Plaza",
  "the DeFi District",
  "Degen Alley",
  "the Whale Lounge",
  "Hodl Park",
  "the NFT Gallery",
  "Blockchain Boulevard",
];

// =============================================================================
// DRAMA ENGINE
// =============================================================================

/**
 * Check for potential drama events between NPCs
 */
export function checkForDrama(
  relationships: NPCRelationshipState[],
  npcs: Map<string, CryptoNPC>
): DramaEvent[] {
  const events: DramaEvent[] = [];
  
  for (const state of relationships) {
    for (const [type, template] of Object.entries(DRAMA_TEMPLATES)) {
      if (template.conditions(state) && Math.random() < template.probability) {
        const npc1 = npcs.get(state.npc1Id);
        const npc2 = npcs.get(state.npc2Id);
        
        if (!npc1 || !npc2) continue;
        
        const event = createDramaEvent(
          type as DramaEventType,
          npc1,
          npc2,
          state
        );
        
        events.push(event);
      }
    }
  }
  
  return events;
}

/**
 * Create a drama event
 */
function createDramaEvent(
  type: DramaEventType,
  npc1: CryptoNPC,
  npc2: CryptoNPC,
  state: NPCRelationshipState
): DramaEvent {
  const template = DRAMA_TEMPLATES[type];
  const location = LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
  
  const fillTemplate = (text: string) =>
    text
      .replace(/{npc1}/g, npc1.name)
      .replace(/{npc2}/g, npc2.name)
      .replace(/{location}/g, location);
  
  const headline = fillTemplate(
    template.headlines[Math.floor(Math.random() * template.headlines.length)]
  );
  const description = fillTemplate(
    template.descriptions[Math.floor(Math.random() * template.descriptions.length)]
  );
  
  return {
    id: `drama_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    timestamp: Date.now(),
    participants: [npc1.id, npc2.id],
    description,
    newsHeadline: headline,
    impact: calculateDramaImpact(type, npc1.id, npc2.id),
    isPublic: Math.random() > 0.3,  // 70% chance of being public
  };
}

/**
 * Calculate the impact of a drama event
 */
function calculateDramaImpact(
  type: DramaEventType,
  npc1Id: string,
  npc2Id: string
): DramaImpact {
  const impacts: Record<DramaEventType, DramaImpact> = {
    new_relationship: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 20 }],
      cityMoodChange: 5,
      reputationChanges: [],
    },
    breakup: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: -30 }],
      cityMoodChange: -2,
      reputationChanges: [],
    },
    rivalry_started: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: -20 }],
      cityMoodChange: -3,
      reputationChanges: [],
    },
    rivalry_ended: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 25 }],
      cityMoodChange: 3,
      reputationChanges: [],
    },
    friendship_formed: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 30 }],
      cityMoodChange: 3,
      reputationChanges: [],
    },
    friendship_broken: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: -25 }],
      cityMoodChange: -2,
      reputationChanges: [],
    },
    wedding: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 50 }],
      cityMoodChange: 10,
      reputationChanges: [
        { npcId: npc1Id, change: 10 },
        { npcId: npc2Id, change: 10 },
      ],
    },
    business_partnership: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 15 }],
      cityMoodChange: 2,
      reputationChanges: [
        { npcId: npc1Id, change: 5 },
        { npcId: npc2Id, change: 5 },
      ],
    },
    business_rivalry: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: -10 }],
      cityMoodChange: 0,
      reputationChanges: [],
    },
    scandal: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: -40 }],
      cityMoodChange: -5,
      reputationChanges: [{ npcId: npc1Id, change: -20 }],
    },
    redemption: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 35 }],
      cityMoodChange: 5,
      reputationChanges: [{ npcId: npc1Id, change: 10 }],
    },
    public_fight: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: -30 }],
      cityMoodChange: -5,
      reputationChanges: [
        { npcId: npc1Id, change: -5 },
        { npcId: npc2Id, change: -5 },
      ],
    },
    reconciliation: {
      relationshipChanges: [{ npc1: npc1Id, npc2: npc2Id, change: 20 }],
      cityMoodChange: 3,
      reputationChanges: [],
    },
  };
  
  return impacts[type];
}

/**
 * Convert drama event to news item
 */
export function dramaToNews(event: DramaEvent): CityNewsItem {
  const categoryMap: Record<DramaEventType, CityNewsItem['category']> = {
    new_relationship: 'gossip',
    breakup: 'gossip',
    rivalry_started: 'drama',
    rivalry_ended: 'drama',
    friendship_formed: 'gossip',
    friendship_broken: 'drama',
    wedding: 'event',
    business_partnership: 'market',
    business_rivalry: 'market',
    scandal: 'drama',
    redemption: 'drama',
    public_fight: 'drama',
    reconciliation: 'drama',
  };
  
  return {
    id: `news_${event.id}`,
    headline: event.newsHeadline,
    body: event.description,
    timestamp: event.timestamp,
    category: categoryMap[event.type],
    relatedNPCs: event.participants,
    importance: event.isPublic ? 7 : 4,
  };
}

/**
 * Generate gossip about an event
 */
export function generateGossip(
  event: DramaEvent,
  gossiperNpc: CryptoNPC
): string {
  const gossipTemplates = [
    `Did you hear about ${event.newsHeadline.toLowerCase()}? Wild!`,
    `Everyone's talking about it... ${event.newsHeadline}`,
    `Can you believe ${event.newsHeadline.toLowerCase()}?`,
    `I probably shouldn't say this, but... ${event.description.toLowerCase()}`,
  ];
  
  return gossipTemplates[Math.floor(Math.random() * gossipTemplates.length)];
}
