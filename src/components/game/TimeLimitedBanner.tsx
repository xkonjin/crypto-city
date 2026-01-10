'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  type TimeLimitedOffer,
  getAllOffers,
  isOfferValid,
  isOfferSoldOut,
  isOfferExpired,
  formatTimeRemaining,
  getDiscountedPrice,
  purchaseOffer,
} from '@/lib/timeLimitedBuildings';
import { getCryptoBuilding } from '@/games/isocity/crypto';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles, AlertTriangle, Check } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

interface TimeLimitedBannerProps {
  treasury: number;
  onSelectBuilding: (buildingId: string, offer?: TimeLimitedOffer) => void;
  className?: string;
}

// =============================================================================
// OFFER CARD COMPONENT
// =============================================================================

interface OfferCardProps {
  offer: TimeLimitedOffer;
  treasury: number;
  onPurchase: (offerId: string, buildingId: string) => void;
}

function OfferCard({ offer, treasury, onPurchase }: OfferCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(formatTimeRemaining(offer.expiresAt));
  const [isPurchasing, setIsPurchasing] = useState(false);
  
  const building = getCryptoBuilding(offer.buildingId);
  const isSoldOut = isOfferSoldOut(offer);
  const isExpired = isOfferExpired(offer);
  const isValid = isOfferValid(offer);
  
  // Calculate discounted price
  const originalPrice = building?.cost || 0;
  const discountedPrice = getDiscountedPrice(offer, originalPrice);
  const canAfford = treasury >= discountedPrice;
  
  // Update countdown timer
  useEffect(() => {
    if (isExpired || isSoldOut) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(formatTimeRemaining(offer.expiresAt));
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [offer.expiresAt, isExpired, isSoldOut]);
  
  const handlePurchase = useCallback(() => {
    if (!isValid || !canAfford || isPurchasing) return;
    
    setIsPurchasing(true);
    const success = purchaseOffer(offer.id);
    
    if (success) {
      onPurchase(offer.id, offer.buildingId);
    }
    
    setIsPurchasing(false);
  }, [offer.id, offer.buildingId, isValid, canAfford, isPurchasing, onPurchase]);
  
  // Determine card state styling
  const getCardStyle = () => {
    if (isSoldOut) {
      return 'bg-gray-800/60 border-gray-600/30 opacity-75';
    }
    if (isExpired) {
      return 'bg-gray-800/60 border-gray-600/30 opacity-50';
    }
    if (!canAfford) {
      return 'bg-gray-800/80 border-amber-500/30';
    }
    // Active offer - gradient based on type
    switch (offer.type) {
      case 'flash_sale':
        return 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-400/50 hover:border-red-400';
      case 'limited_edition':
        return 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-400/50 hover:border-purple-400';
      case 'early_bird':
        return 'bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border-yellow-400/50 hover:border-yellow-400';
      case 'weekend_special':
        return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-blue-400/50 hover:border-blue-400';
      default:
        return 'bg-gray-800/80 border-gray-600/50';
    }
  };
  
  const getTypeBadgeStyle = () => {
    switch (offer.type) {
      case 'flash_sale':
        return 'bg-red-500/90 text-white';
      case 'limited_edition':
        return 'bg-purple-500/90 text-white';
      case 'early_bird':
        return 'bg-yellow-500/90 text-black';
      case 'weekend_special':
        return 'bg-blue-500/90 text-white';
      default:
        return 'bg-gray-500/90 text-white';
    }
  };
  
  const getTypeLabel = () => {
    switch (offer.type) {
      case 'flash_sale':
        return '⚡ Flash Sale';
      case 'limited_edition':
        return '💎 Limited Edition';
      case 'early_bird':
        return '🐦 Early Bird';
      case 'weekend_special':
        return '🎉 Weekend Special';
      default:
        return 'Special Offer';
    }
  };

  return (
    <div 
      className={`relative rounded-lg border p-3 transition-all duration-200 ${getCardStyle()}`}
      data-testid="time-limited-offer"
    >
      {/* Type Badge */}
      <div className="absolute -top-2 left-2">
        <span 
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getTypeBadgeStyle()}`}
        >
          {getTypeLabel()}
        </span>
      </div>
      
      {/* Limited Badge (pulsing) */}
      {isValid && (
        <div className="absolute -top-2 right-2">
          <span 
            className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black animate-pulse"
            data-testid="limited-badge"
          >
            Limited!
          </span>
        </div>
      )}
      
      {/* Sold Out Overlay */}
      {isSoldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
          <span className="text-red-400 font-bold text-lg rotate-[-15deg]">SOLD OUT</span>
        </div>
      )}
      
      {/* Expired Overlay */}
      {isExpired && !isSoldOut && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg z-10">
          <span className="text-gray-400 font-bold text-lg rotate-[-15deg]">EXPIRED</span>
        </div>
      )}
      
      {/* Content */}
      <div className="mt-3 space-y-2">
        {/* Building info */}
        <div className="flex items-start gap-2">
          <span className="text-2xl">{building?.icon || '🏗️'}</span>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate">{offer.name}</div>
            <div className="text-xs text-gray-400 line-clamp-1">{offer.description}</div>
          </div>
        </div>
        
        {/* Offer details */}
        <div className="flex flex-wrap gap-2 text-xs">
          {/* Discount badge */}
          {offer.discount > 0 && (
            <span 
              className="px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded"
              data-testid="offer-discount"
            >
              -{offer.discount}% OFF
            </span>
          )}
          
          {/* Bonus yield badge */}
          {offer.bonusYield > 0 && (
            <span 
              className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded"
              data-testid="offer-bonus"
            >
              +{offer.bonusYield}% Yield
            </span>
          )}
          
          {/* Countdown timer */}
          {!isExpired && !isSoldOut && (
            <span 
              className="px-1.5 py-0.5 bg-gray-700/50 text-gray-300 rounded flex items-center gap-1"
              data-testid="offer-countdown"
            >
              <Clock className="w-3 h-3" />
              {timeRemaining}
            </span>
          )}
        </div>
        
        {/* Purchase info */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-700/50">
          {/* Purchase count */}
          <span 
            className="text-xs text-gray-400"
            data-testid="purchase-count"
          >
            {offer.maxPurchases - offer.purchased}/{offer.maxPurchases} remaining
          </span>
          
          {/* Price */}
          <div className="flex items-center gap-2">
            {offer.discount > 0 && (
              <span className="text-xs text-gray-500 line-through">
                ${originalPrice.toLocaleString()}
              </span>
            )}
            <span className={`font-mono text-sm ${canAfford ? 'text-amber-400' : 'text-red-400'}`}>
              ${discountedPrice.toLocaleString()}
            </span>
          </div>
        </div>
        
        {/* Purchase button */}
        {isValid && (
          <Button
            onClick={handlePurchase}
            disabled={!canAfford || isPurchasing}
            className="w-full h-8 text-xs"
            variant={canAfford ? 'default' : 'outline'}
            data-testid="offer-purchase-btn"
          >
            {isPurchasing ? (
              <>
                <Sparkles className="w-3 h-3 mr-1 animate-spin" />
                Purchasing...
              </>
            ) : !canAfford ? (
              <>
                <AlertTriangle className="w-3 h-3 mr-1" />
                Not Enough Funds
              </>
            ) : (
              <>
                <Check className="w-3 h-3 mr-1" />
                Purchase & Place
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

// Initialize offers lazily on first render (client-side only)
function getInitialOffers(): TimeLimitedOffer[] {
  if (typeof window === 'undefined') return [];
  return getAllOffers();
}

export default function TimeLimitedBanner({
  treasury,
  onSelectBuilding,
  className = '',
}: TimeLimitedBannerProps) {
  const [offers, setOffers] = useState<TimeLimitedOffer[]>(getInitialOffers);
  
  // Get Cobie comment from first valid offer
  const cobieComment = offers.find(o => isOfferValid(o))?.cobieComment || '';
  
  // Handle purchase
  const handlePurchase = useCallback((offerId: string, buildingId: string) => {
    // Refresh offers to get updated purchase counts
    const updatedOffers = getAllOffers();
    setOffers(updatedOffers);
    
    // Find the offer to get its data
    const offer = updatedOffers.find(o => o.id === offerId);
    
    // Notify parent to select this building for placement
    onSelectBuilding(buildingId, offer);
  }, [onSelectBuilding]);
  
  // Don't render if no offers
  if (offers.length === 0) {
    return null;
  }
  
  const activeOffers = offers.filter(o => isOfferValid(o));
  const hasActiveOffers = activeOffers.length > 0;

  return (
    <div 
      className={`bg-gray-900/95 backdrop-blur-md border border-amber-500/30 rounded-lg overflow-hidden ${className}`}
      data-testid="time-limited-banner"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 px-3 py-2 border-b border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <h4 className="font-bold text-sm text-amber-400">Limited Time Offers</h4>
          </div>
          <span className="text-xs text-gray-400">
            {activeOffers.length} active
          </span>
        </div>
      </div>
      
      {/* Cobie FOMO Commentary */}
      {cobieComment && hasActiveOffers && (
        <div 
          className="px-3 py-2 bg-gray-800/50 border-b border-gray-700/30 text-xs text-gray-400 italic"
          data-testid="cobie-fomo-comment"
        >
          🧠 Cobie: &ldquo;{cobieComment}&rdquo;
        </div>
      )}
      
      {/* Offers grid */}
      <div className="p-3 space-y-3 max-h-64 overflow-y-auto">
        {offers.map(offer => (
          <OfferCard
            key={offer.id}
            offer={offer}
            treasury={treasury}
            onPurchase={handlePurchase}
          />
        ))}
      </div>
      
      {/* No active offers message */}
      {!hasActiveOffers && (
        <div className="px-3 pb-3 text-center text-xs text-gray-500">
          All offers have expired or sold out. Check back tomorrow!
        </div>
      )}
    </div>
  );
}
