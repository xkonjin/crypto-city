'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Download, Copy, Check, X, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Achievement } from '@/types/game';
import {
  generateAchievementCard,
  generateShareText,
  generateTwitterShareUrl,
  downloadAchievementCard,
  AchievementShareStats,
} from '@/lib/achievementShare';

export interface AchievementShareDialogProps {
  achievement: Achievement | null;
  stats: AchievementShareStats;
  isOpen: boolean;
  onClose: () => void;
}

export function AchievementShareDialog({
  achievement,
  stats,
  isOpen,
  onClose,
}: AchievementShareDialogProps) {
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shareText, setShareText] = useState('');

  // Generate card when dialog opens
  useEffect(() => {
    if (isOpen && achievement) {
      setIsGenerating(true);
      setShareText(generateShareText(achievement));
      
      generateAchievementCard(achievement, stats)
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          setCardImageUrl(url);
        })
        .catch((error) => {
          console.error('Failed to generate achievement card:', error);
        })
        .finally(() => {
          setIsGenerating(false);
        });
    }
    
    // Cleanup URL on close
    return () => {
      if (cardImageUrl) {
        URL.revokeObjectURL(cardImageUrl);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Only regenerate when dialog opens with new achievement
  }, [isOpen, achievement?.id]);

  const handleDownload = useCallback(async () => {
    if (!achievement) return;
    
    try {
      await downloadAchievementCard(achievement, stats);
    } catch (error) {
      console.error('Failed to download achievement card:', error);
    }
  }, [achievement, stats]);

  const handleCopyText = useCallback(async () => {
    if (!shareText) return;
    
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  }, [shareText]);

  const handleShareTwitter = useCallback(() => {
    if (!achievement) return;
    
    const url = generateTwitterShareUrl(achievement);
    window.open(url, '_blank', 'noopener,noreferrer');
  }, [achievement]);

  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-lg"
        data-testid="achievement-share-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-yellow-500" />
            Share Achievement
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card Preview */}
          <div 
            className="relative rounded-lg overflow-hidden border border-border bg-muted"
            data-testid="achievement-card-preview"
          >
            {isGenerating ? (
              <div className="h-64 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm text-muted-foreground">Generating card...</span>
                </div>
              </div>
            ) : cardImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- Dynamic blob URL cannot use Next.js Image
              <img 
                src={cardImageUrl} 
                alt={`Achievement: ${achievement.name}`} 
                className="w-full h-auto"
              />
            ) : (
              <div className="h-64 flex items-center justify-center">
                <span className="text-sm text-muted-foreground">Failed to generate card</span>
              </div>
            )}
          </div>

          {/* Share Text Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Share Text</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyText}
                className="h-7 text-xs gap-1"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3 text-green-500" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            <div className="p-3 bg-muted rounded-lg text-sm whitespace-pre-wrap text-muted-foreground">
              {shareText}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex-1"
              disabled={isGenerating || !cardImageUrl}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
            <Button
              onClick={handleShareTwitter}
              className="flex-1 bg-[#1DA1F2] hover:bg-[#1a8cd8]"
              disabled={isGenerating}
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Share on X
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AchievementShareDialog;
