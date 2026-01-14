'use client';

/**
 * X/Twitter Profile Ingestion Modal
 *
 * UI component for ingesting X/Twitter profiles into Crypto City as NPCs.
 * Features a multi-stage flow: input → preview → confirm → spawning.
 *
 * The Hitchhiker's Guide notes: "The ingestion modal is where Twitter
 * personalities go to be reborn as isometric pixel citizens. It's basically
 * digital reincarnation, but with better dialogue options."
 */

import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  X,
  Search,
  UserPlus,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Twitter,
  Brain,
  Home,
  Wallet,
  Sparkles,
} from 'lucide-react';
import {
  previewIngestion,
  ingestXProfile,
  type IngestionProgress,
  type IngestionPreview,
  type IngestionResult,
  type IngestionOptions,
} from '@/lib/ingestion/IngestionPipeline';
import { ARCHETYPE_DESCRIPTIONS } from '@/lib/npc/personality';
import { OCCUPATION_DESCRIPTIONS } from '@/games/isocity/types/npc';

// =============================================================================
// TYPES
// =============================================================================

export interface IngestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNPCSpawned?: (npc: IngestionResult) => void;
  ingestionOptions?: IngestionOptions;
}

type ModalStage = 'input' | 'loading' | 'preview' | 'ingesting' | 'success' | 'error';

// =============================================================================
// COMPONENTS
// =============================================================================

/**
 * Progress indicator showing current ingestion stage.
 */
function IngestionProgressBar({
  progress,
  message,
}: {
  progress: IngestionProgress;
  message?: string;
}) {
  const stageLabels: Record<string, string> = {
    idle: 'Ready',
    fetching: 'Fetching Profile',
    extracting: 'Analyzing Personality',
    generating_avatar: 'Creating Avatar',
    assigning_housing: 'Finding Residence',
    creating_wallet: 'Creating Wallet',
    spawning: 'Spawning NPC',
    completed: 'Complete!',
    failed: 'Failed',
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">{stageLabels[progress.stage] || progress.stage}</span>
        <span className="text-cyan-400">{Math.round(progress.progress)}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      {message && <p className="text-xs text-gray-500 text-center">{message}</p>}
    </div>
  );
}

/**
 * Preview card showing extracted personality before spawning.
 */
function PreviewCard({ preview }: { preview: IngestionPreview }) {
  const archetypeDescription =
    ARCHETYPE_DESCRIPTIONS[preview.archetype] || 'A mysterious crypto personality.';
  const occupationDescription =
    OCCUPATION_DESCRIPTIONS[preview.occupation] || 'Does... things.';

  return (
    <div className="space-y-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-cyan-500/50">
          <Image
            src={preview.profileImageUrl}
            alt={preview.displayName}
            fill
            className="object-cover"
            unoptimized
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-white truncate">{preview.displayName}</h3>
          <p className="text-sm text-cyan-400">@{preview.username}</p>
          <p className="text-xs text-gray-400 line-clamp-2 mt-1">{preview.bio}</p>
        </div>
      </div>

      {/* Archetype & Occupation */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Archetype</span>
          </div>
          <div className="text-sm font-medium text-white capitalize">
            {preview.archetype.replace(/_/g, ' ')}
          </div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{archetypeDescription}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Home className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Occupation</span>
          </div>
          <div className="text-sm font-medium text-white capitalize">{preview.occupation}</div>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{occupationDescription}</p>
        </div>
      </div>

      {/* Confidence Score */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">Extraction Confidence</span>
        <div className="flex items-center gap-2">
          <div className="w-20 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                preview.confidence > 0.7
                  ? 'bg-green-500'
                  : preview.confidence > 0.4
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
              )}
              style={{ width: `${preview.confidence * 100}%` }}
            />
          </div>
          <span className="text-cyan-400">{Math.round(preview.confidence * 100)}%</span>
        </div>
      </div>

      {/* Dialogue Preview */}
      <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-xs text-gray-400 uppercase tracking-wide">Sample Dialogue</span>
        </div>
        <div className="space-y-1">
          {preview.dialogueSeeds.slice(0, 3).map((seed, i) => (
            <p key={i} className="text-sm text-gray-300 italic">
              &ldquo;{seed}&rdquo;
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Success screen after NPC is spawned.
 */
function SuccessScreen({
  preview,
  onClose,
  onSpawnAnother,
}: {
  preview: IngestionPreview | null;
  onClose: () => void;
  onSpawnAnother: () => void;
}) {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center ring-4 ring-green-500/30">
        <CheckCircle className="w-8 h-8 text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Welcome to Crypto City!</h3>
        {preview && (
          <p className="text-gray-400">
            @{preview.username} is now a {preview.occupation} in your city.
          </p>
        )}
      </div>
      <div className="flex gap-3 justify-center pt-2">
        <Button variant="outline" onClick={onSpawnAnother} className="gap-2">
          <UserPlus className="w-4 h-4" />
          Add Another
        </Button>
        <Button onClick={onClose} className="gap-2 bg-cyan-600 hover:bg-cyan-700">
          <CheckCircle className="w-4 h-4" />
          Done
        </Button>
      </div>
    </div>
  );
}

/**
 * Error screen with retry option.
 */
function ErrorScreen({
  error,
  onRetry,
  onClose,
}: {
  error: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <div className="text-center py-6 space-y-4">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/20 flex items-center justify-center ring-4 ring-red-500/30">
        <AlertCircle className="w-8 h-8 text-red-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Ingestion Failed</h3>
        <p className="text-gray-400 text-sm">{error}</p>
      </div>
      <div className="flex gap-3 justify-center pt-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={onRetry} className="gap-2 bg-red-600 hover:bg-red-700">
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    </div>
  );
}

// =============================================================================
// MAIN MODAL COMPONENT
// =============================================================================

function IngestionModalContent({
  isOpen,
  onClose,
  onNPCSpawned,
  ingestionOptions = {},
}: IngestionModalProps) {
  const [stage, setStage] = useState<ModalStage>('input');
  const [username, setUsername] = useState('');
  const [preview, setPreview] = useState<IngestionPreview | null>(null);
  const [progress, setProgress] = useState<IngestionProgress>({
    stage: 'idle',
    progress: 0,
    message: '',
  });
  const [error, setError] = useState<string>('');

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStage('input');
    setUsername('');
    setPreview(null);
    setError('');
    setProgress({ stage: 'idle', progress: 0, message: '' });
    onClose();
  }, [onClose]);

  // Fetch preview for the entered username
  const handlePreview = useCallback(async () => {
    if (!username.trim()) return;

    setStage('loading');
    setError('');

    try {
      const result = await previewIngestion(username, ingestionOptions);

      if ('error' in result) {
        setError(result.error);
        setStage('error');
      } else {
        setPreview(result);
        setStage('preview');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Preview failed');
      setStage('error');
    }
  }, [username, ingestionOptions]);

  // Perform full ingestion
  const handleIngest = useCallback(async () => {
    if (!username.trim()) return;

    setStage('ingesting');

    try {
      const result = await ingestXProfile(username, {
        ...ingestionOptions,
        onProgress: setProgress,
      });

      if (result.success) {
        setStage('success');
        onNPCSpawned?.(result);
      } else {
        setError(result.error);
        setStage('error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ingestion failed');
      setStage('error');
    }
  }, [username, ingestionOptions, onNPCSpawned]);

  // Start over with a new username
  const handleSpawnAnother = useCallback(() => {
    setStage('input');
    setUsername('');
    setPreview(null);
    setError('');
    setProgress({ stage: 'idle', progress: 0, message: '' });
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[10000] flex items-center justify-center p-4',
        'transition-opacity duration-300 ease-out',
        isOpen ? 'opacity-100' : 'opacity-0'
      )}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={stage !== 'ingesting' ? handleClose : undefined}
      />

      {/* Modal */}
      <div
        className={cn(
          'relative max-w-md w-full bg-gray-900 rounded-2xl shadow-2xl overflow-hidden',
          'transition-all duration-300 ease-out border-2 border-cyan-500/30',
          isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        )}
      >
        {/* Header */}
        <div className="relative px-6 py-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <Twitter className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ingest X Profile</h2>
              <p className="text-xs text-gray-400">Turn Twitter personalities into NPCs</p>
            </div>
          </div>

          {/* Close button */}
          {stage !== 'ingesting' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* INPUT STAGE */}
          {stage === 'input' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-400">X/Twitter Username</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      @
                    </span>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/^@/, ''))}
                      placeholder="username"
                      className="pl-8 bg-gray-800 border-gray-700"
                      onKeyDown={(e) => e.key === 'Enter' && handlePreview()}
                    />
                  </div>
                  <Button
                    onClick={handlePreview}
                    disabled={!username.trim()}
                    className="gap-2 bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Search className="w-4 h-4" />
                    Preview
                  </Button>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Enter a Twitter/X username to preview how they&apos;ll appear as an NPC
              </p>
            </div>
          )}

          {/* LOADING STAGE */}
          {stage === 'loading' && (
            <div className="py-8 text-center space-y-4">
              <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
              <p className="text-gray-400">Fetching @{username}&apos;s profile...</p>
            </div>
          )}

          {/* PREVIEW STAGE */}
          {stage === 'preview' && preview && (
            <div className="space-y-4">
              <PreviewCard preview={preview} />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setStage('input')}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleIngest}
                  className="flex-1 gap-2 bg-cyan-600 hover:bg-cyan-700"
                >
                  <UserPlus className="w-4 h-4" />
                  Spawn NPC
                </Button>
              </div>
            </div>
          )}

          {/* INGESTING STAGE */}
          {stage === 'ingesting' && (
            <div className="py-8 space-y-6">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Creating citizen...</p>
              </div>
              <IngestionProgressBar progress={progress} />
            </div>
          )}

          {/* SUCCESS STAGE */}
          {stage === 'success' && (
            <SuccessScreen
              preview={preview}
              onClose={handleClose}
              onSpawnAnother={handleSpawnAnother}
            />
          )}

          {/* ERROR STAGE */}
          {stage === 'error' && (
            <ErrorScreen error={error} onRetry={handlePreview} onClose={handleClose} />
          )}
        </div>

        {/* Footer hint */}
        {(stage === 'input' || stage === 'preview') && (
          <div className="px-6 py-3 border-t border-gray-800 bg-gray-800/30">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Wallet className="w-3 h-3" />
              <span>NPCs get an x402 wallet for on-chain transactions</span>
            </div>
          </div>
        )}

        {/* Decorative corners */}
        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-cyan-500/30" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-cyan-500/30" />
      </div>
    </div>
  );
}

/**
 * X/Twitter Profile Ingestion Modal
 *
 * Renders a modal for ingesting X/Twitter profiles as NPCs.
 * Uses portal to render at document root.
 */
export function IngestionModal(props: IngestionModalProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(<IngestionModalContent {...props} />, document.body);
}

export default IngestionModal;
