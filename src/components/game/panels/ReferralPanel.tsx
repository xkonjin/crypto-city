'use client';

import React, { useState, useCallback } from 'react';
import { msg, useMessages } from 'gt-next';
import { useGame } from '@/context/GameContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Check, UserPlus, Gift, Crown, Users } from 'lucide-react';
import {
  loadReferralState,
  saveReferralState,
  applyReferralCode,
  getReferralLink,
  getTierDisplayName,
  canEnterReferralCode,
  REFERRER_REWARD,
  REFERRED_BONUS,
  ReferralTier,
} from '@/lib/referral';

// Translatable UI labels
const UI_LABELS = {
  referral: msg('Referral Program'),
  yourCode: msg('Your Code:'),
  copyCode: msg('Copy code'),
  copyLink: msg('Copy link'),
  shareLink: msg('Share Link:'),
  referrals: msg('Referrals:'),
  tier: msg('Tier:'),
  totalRewards: msg('Total Rewards:'),
  enterCode: msg('Enter Referral Code'),
  enterCodePlaceholder: msg('Enter code'),
  apply: msg('Apply'),
  alreadyReferred: msg('You were referred by:'),
  invalidCode: msg('Invalid or expired code'),
  codeApplied: msg('Code applied! You received a bonus.'),
  referrerReward: msg('You earn $5,000 per referral'),
  referredBonus: msg('New players get $25,000 bonus'),
};

// Tier colors
const TIER_COLORS: Record<ReferralTier, string> = {
  bronze: 'text-amber-600',
  silver: 'text-slate-400',
  gold: 'text-yellow-400',
  whale: 'text-blue-400',
};

// Tier icons
const TIER_ICONS: Record<ReferralTier, string> = {
  bronze: '🥉',
  silver: '🥈',
  gold: '🥇',
  whale: '🐋',
};

export function ReferralPanel() {
  const { state, setActivePanel, addMoney } = useGame();
  const m = useMessages();
  
  const referralState = loadReferralState();
  const [inputCode, setInputCode] = useState('');
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const canEnter = canEnterReferralCode();
  
  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralState.myCode);
      setCopied('code');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralState.myCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied('code');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [referralState.myCode]);
  
  const handleCopyLink = useCallback(async () => {
    const link = getReferralLink(referralState.myCode);
    try {
      await navigator.clipboard.writeText(link);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied('link');
      setTimeout(() => setCopied(null), 2000);
    }
  }, [referralState.myCode]);
  
  const handleApplyCode = useCallback(() => {
    setError(null);
    setSuccess(false);
    
    const trimmedCode = inputCode.trim().toUpperCase();
    if (!trimmedCode) return;
    
    const bonus = applyReferralCode(trimmedCode);
    
    if (bonus === null) {
      setError(String(m(UI_LABELS.invalidCode)));
      return;
    }
    
    // Apply the bonus to the player's treasury
    addMoney(bonus);
    setSuccess(true);
    setInputCode('');
  }, [inputCode, addMoney, m]);
  
  return (
    <Dialog open={true} onOpenChange={() => setActivePanel('none')}>
      <DialogContent className="max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            {m(UI_LABELS.referral)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Your Referral Code */}
          <div className="bg-muted/30 rounded-lg p-4">
            <Label className="text-sm text-muted-foreground mb-2 block">{m(UI_LABELS.yourCode)}</Label>
            <div className="flex items-center gap-2">
              <div 
                data-testid="referral-code"
                className="flex-1 text-2xl font-mono font-bold tracking-wider text-center bg-background rounded-md py-2 px-4 border"
              >
                {referralState.myCode}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCode}
                title={String(m(UI_LABELS.copyCode))}
              >
                {copied === 'code' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          {/* Shareable Link */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">{m(UI_LABELS.shareLink)}</Label>
            <div className="flex items-center gap-2">
              <div className="flex-1 text-xs font-mono bg-muted/50 rounded-md py-2 px-3 truncate">
                {getReferralLink(referralState.myCode)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
                title={String(m(UI_LABELS.copyLink))}
              >
                {copied === 'link' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                <span className="ml-1 hidden sm:inline">Copy</span>
              </Button>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-border">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Users className="w-3 h-3" />
                {m(UI_LABELS.referrals)}
              </div>
              <div className="text-2xl font-bold">{referralState.referralCount}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Crown className="w-3 h-3" />
                {m(UI_LABELS.tier)}
              </div>
              <div className={`text-lg font-bold ${TIER_COLORS[referralState.tier]}`}>
                {TIER_ICONS[referralState.tier]} {getTierDisplayName(referralState.tier)}
              </div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-muted-foreground text-xs mb-1">
                <Gift className="w-3 h-3" />
                {m(UI_LABELS.totalRewards)}
              </div>
              <div className="text-lg font-bold text-green-400">
                ${referralState.totalRewards.toLocaleString()}
              </div>
            </div>
          </div>
          
          {/* Rewards Info */}
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg p-3 text-sm space-y-1">
            <p className="text-amber-400">💰 {m(UI_LABELS.referrerReward)}</p>
            <p className="text-green-400">🎁 {m(UI_LABELS.referredBonus)}</p>
          </div>
          
          {/* Enter Referral Code OR Show Referrer */}
          {canEnter ? (
            <div className="space-y-3">
              <Label className="text-sm">{m(UI_LABELS.enterCode)}</Label>
              <div className="flex gap-2">
                <Input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder={String(m(UI_LABELS.enterCodePlaceholder))}
                  maxLength={6}
                  className="flex-1 font-mono tracking-wider uppercase"
                />
                <Button onClick={handleApplyCode} disabled={!inputCode.trim()}>
                  {m(UI_LABELS.apply)}
                </Button>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              {success && <p className="text-sm text-green-400">{m(UI_LABELS.codeApplied)}</p>}
            </div>
          ) : (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">{m(UI_LABELS.alreadyReferred)}</p>
              <p className="font-mono font-bold text-lg">{referralState.referredBy}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
