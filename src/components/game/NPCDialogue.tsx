'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { X } from 'lucide-react';
import type { CryptoNPC } from '@/games/isocity/types/npc';

interface NPCDialogueProps {
  npc: CryptoNPC;
  onClose: () => void;
}

/**
 * Mood emoji mapping
 */
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

/**
 * Crypto-themed dialogue options
 */
const DIALOGUE_OPTIONS = [
  { id: 'alpha', text: "What's the alpha?", emoji: '🔥' },
  { id: 'market', text: "How's the market?", emoji: '📈' },
  { id: 'portfolio', text: 'Nice portfolio.', emoji: '💼' },
  { id: 'wagmi', text: 'WAGMI', emoji: '🚀' },
  { id: 'wen', text: 'Wen moon?', emoji: '🌙' },
  { id: 'gm', text: 'GM', emoji: '☀️' },
];

/**
 * Generate a crypto-themed greeting based on NPC state
 */
function getGreeting(npc: CryptoNPC): string {
  const mood = npc.internalWorld?.currentMood ?? 'neutral';
  const occupation = npc.occupation;

  const greetings: Record<string, string[]> = {
    ecstatic: [
      "LETS GOOO! Everything's pumping!",
      "I'm up 10x this week! Ask me anything!",
      "Best day in crypto EVER!",
    ],
    happy: [
      "Hey! Great to see a fellow degen!",
      "Markets looking good today, aren't they?",
      "Feeling bullish! What brings you here?",
    ],
    content: [
      "Hey there. Holding steady.",
      "Not bad, not bad. Stacking sats.",
      "GM. Another day in the trenches.",
    ],
    neutral: [
      "Hey.",
      "What's up?",
      "GM.",
    ],
    anxious: [
      "Have you seen the charts?! HAVE YOU?!",
      "I'm not panicking, you're panicking!",
      "Maybe I should have taken profits...",
    ],
    sad: [
      "*sigh* Another day, another dump.",
      "I should have sold the top...",
      "Remember when we were all gonna make it?",
    ],
    angry: [
      "Don't talk to me about that rugpull!",
      "The devs did WHAT?!",
      "These gas fees are CRIMINAL!",
    ],
    depressed: [
      "...what's the point of any of this?",
      "I've seen too many cycles...",
      "We're all just bags waiting to dump...",
    ],
  };

  // Add occupation-specific flavor
  const occupationFlavor: Record<string, string> = {
    trader: " *glances at multiple monitors*",
    miner: " *fans whirring in background*",
    developer: " *closes laptop briefly*",
    shop_owner: " *adjusts 'We Accept Crypto' sign*",
    bartender: " *polishes glass with crypto logo*",
    artist: " *minimizes NFT gallery*",
    security: " *checks hardware wallet*",
    unemployed: " *refreshes portfolio again*",
  };

  const moodGreetings = greetings[mood] || greetings.neutral;
  const greeting = moodGreetings[Math.floor(Math.random() * moodGreetings.length)];
  const flavor = occupationFlavor[occupation] || '';

  return greeting + flavor;
}

/**
 * Generate a response based on the chosen dialogue option
 */
function getResponse(npc: CryptoNPC, optionId: string): string {
  const mood = npc.internalWorld?.currentMood ?? 'neutral';
  const isPositive = ['ecstatic', 'happy', 'content'].includes(mood);
  const isNegative = ['anxious', 'sad', 'angry', 'depressed'].includes(mood);

  const responses: Record<string, string[]> = {
    alpha: isPositive
      ? [
          "I heard Layer 3s are the next play...",
          "DePIN is looking spicy. Do your own research though.",
          "My buddy knows a guy who knows a VC... 👀",
          "Everyone's sleeping on modular blockchains.",
        ]
      : [
          "Alpha? In this market? Good luck with that.",
          "The only alpha is the friends we rugged along the way.",
          "If I had alpha, would I be standing here?",
          "Last alpha I followed cost me 90%...",
        ],
    market: isPositive
      ? [
          "Looking healthy! Support levels holding strong.",
          "Volume's picking up. Could be something brewing.",
          "Fear and Greed index looking reasonable.",
          "Accumulation phase, if you know what I mean.",
        ]
      : [
          "Don't get me started...",
          "It's giving 'extended accumulation' vibes.",
          "Crab market forever, apparently.",
          "My portfolio says 'not good'.",
        ],
    portfolio: [
      "Thanks! Diamond hands, you know how it is.",
      "It's... diversified. Very diversified.",
      "Mostly unrealized gains. Very unrealized.",
      "I'm in it for the tech, obviously.",
      "It's not about the money, it's about sending a message.",
    ],
    wagmi: isNegative
      ? [
          "...are we though?",
          "WAGMI... WAGMI... I keep telling myself that.",
          "One of us will make it. Probably not me.",
          "*nervous laughter* Yeah... totally...",
        ]
      : [
          "WAGMI! 🚀",
          "This is the way!",
          "Together, fren!",
          "LFG! We're all gonna make it!",
        ],
    wen: [
      "Soon™",
      "After the next halving. Or the one after that.",
      "Wen you stop asking. That's wen.",
      "My TA says Q3... of some year.",
      "Two more weeks, always two more weeks.",
    ],
    gm: [
      "GM! ☀️",
      "GM fren! Have a blessed day.",
      "GM! May your candles be green.",
      "GM! Stay hydrated and DYOR.",
    ],
  };

  const optionResponses = responses[optionId] || ["Hmm, interesting point..."];
  return optionResponses[Math.floor(Math.random() * optionResponses.length)];
}

/**
 * Conversation interface for interacting with NPCs.
 * Shows NPC portrait, current dialogue, and crypto-themed response options.
 */
export function NPCDialogue({ npc, onClose }: NPCDialogueProps) {
  const mood = npc.internalWorld?.currentMood ?? 'neutral';
  const moodEmoji = MOOD_EMOJIS[mood] ?? '😐';

  const [dialogueText, setDialogueText] = useState(() => getGreeting(npc));
  const [hasResponded, setHasResponded] = useState(false);

  const handleOptionClick = useCallback(
    (optionId: string) => {
      const response = getResponse(npc, optionId);
      setDialogueText(response);
      setHasResponded(true);
    },
    [npc]
  );

  const handleRestart = useCallback(() => {
    setDialogueText(getGreeting(npc));
    setHasResponded(false);
  }, [npc]);

  return (
    <Card className="w-96 bg-sidebar/95 backdrop-blur-sm border-sidebar-border shadow-xl">
      {/* Header with NPC portrait */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Portrait */}
            <div className="size-16 rounded-sm bg-muted flex items-center justify-center text-3xl shrink-0 border border-sidebar-border">
              {moodEmoji}
            </div>
            <div className="min-w-0">
              <h3 className="font-display text-lg font-semibold text-gold truncate">
                {npc.name}
              </h3>
              <p className="text-xs text-muted-foreground capitalize">
                {npc.occupation.replace(/_/g, ' ')}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="shrink-0"
            aria-label="Close dialogue"
          >
            <X className="size-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Dialogue bubble */}
        <div className="relative bg-muted/50 rounded-sm p-3 border border-sidebar-border/50">
          <p className="text-sm text-pretty leading-relaxed">{dialogueText}</p>
          {/* Speech bubble tail */}
          <div className="absolute -top-2 left-4 size-4 bg-muted/50 border-l border-t border-sidebar-border/50 rotate-45" />
        </div>

        {/* Response options */}
        <div className="space-y-2">
          {!hasResponded ? (
            <div className="grid grid-cols-2 gap-2">
              {DIALOGUE_OPTIONS.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleOptionClick(option.id)}
                  className="justify-start gap-1.5 h-auto py-2 px-3 text-xs"
                >
                  <span>{option.emoji}</span>
                  <span className="truncate">{option.text}</span>
                </Button>
              ))}
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestart}
                className="flex-1"
              >
                Continue talking
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex-1"
              >
                Goodbye
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default NPCDialogue;
