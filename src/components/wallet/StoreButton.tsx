/**
 * Store Button Component
 * 
 * Button to open the in-game store.
 */

'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { StorePanel } from './StorePanel';

interface StoreButtonProps {
  className?: string;
}

export function StoreButton({ className = '' }: StoreButtonProps) {
  const [storeOpen, setStoreOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setStoreOpen(true)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 
                   text-amber-400 text-sm font-medium transition-colors border border-amber-500/30 ${className}`}
        title="Open Store"
      >
        <ShoppingBag className="w-4 h-4" />
        <span className="hidden sm:inline">Store</span>
      </button>

      <StorePanel 
        isOpen={storeOpen} 
        onClose={() => setStoreOpen(false)} 
      />
    </>
  );
}

export default StoreButton;
