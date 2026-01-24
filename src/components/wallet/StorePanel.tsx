/**
 * Store Panel Component
 * 
 * In-game store UI for purchasing items with Plasma USDT0.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ShoppingBag, Wallet, Check, Sparkles } from 'lucide-react';
import { usePlasmaWallet } from '@/hooks/usePlasmaWallet';
import { useUSDT0Balance } from '@/hooks/useUSDT0Balance';
import { PaymentModal } from './PaymentModal';
import {
  STORE_ITEMS,
  getOwnedItems,
  addOwnedItem,
  isItemOwned,
} from '@/lib/plasma/storeItems';
import type { StoreItem } from '@/lib/plasma/types';

interface StorePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type CategoryFilter = 'all' | StoreItem['category'];

const CATEGORY_LABELS: Record<CategoryFilter, string> = {
  all: 'All Items',
  credits: 'Credits',
  expansion: 'Expansions',
  cosmetic: 'Cosmetics',
  subscription: 'Premium',
};

export function StorePanel({ isOpen, onClose }: StorePanelProps) {
  const { isConnected, login } = usePlasmaWallet();
  const { formatted: balance } = useUSDT0Balance();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);

  // Load owned items
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOwnedItems(getOwnedItems());
    }
  }, [isOpen]);

  // Filter items by category
  const filteredItems = selectedCategory === 'all'
    ? STORE_ITEMS
    : STORE_ITEMS.filter(item => item.category === selectedCategory);

  // Handle purchase
  const handlePurchase = useCallback((item: StoreItem) => {
    setSelectedItem({ ...item, owned: ownedItems.includes(item.id) });
    setPaymentModalOpen(true);
  }, [ownedItems]);

  // Handle successful payment
  const handlePaymentSuccess = useCallback((txHash: string) => {
    if (selectedItem) {
      addOwnedItem(selectedItem.id);
      setOwnedItems(prev => [...prev, selectedItem.id]);
    }
    console.log('Purchase successful:', txHash);
  }, [selectedItem]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-lg bg-[#0f1219] border-l border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[#00D4FF]" />
            <h2 className="text-xl font-bold text-white">Crypto City Store</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-white/60" />
          </button>
        </div>

        {/* Balance bar */}
        <div className="px-4 py-3 bg-[#00D4FF]/5 border-b border-white/10">
          {isConnected ? (
            <div className="flex items-center justify-between">
              <span className="text-white/60 text-sm">Your Balance</span>
              <span className="text-[#00D4FF] font-bold">
                ${balance ? parseFloat(balance).toFixed(2) : '0.00'} USDT0
              </span>
            </div>
          ) : (
            <button
              onClick={login}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg
                        bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 text-[#00D4FF] text-sm
                        transition-colors border border-[#00D4FF]/30"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet to Purchase
            </button>
          )}
        </div>

        {/* Category tabs */}
        <div className="px-4 py-3 border-b border-white/10 overflow-x-auto">
          <div className="flex gap-2">
            {(Object.keys(CATEGORY_LABELS) as CategoryFilter[]).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors
                  ${selectedCategory === cat 
                    ? 'bg-[#00D4FF] text-black font-medium' 
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Items grid */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => {
              const owned = ownedItems.includes(item.id);
              
              return (
                <div
                  key={item.id}
                  className={`relative rounded-xl border transition-all cursor-pointer
                    ${owned 
                      ? 'bg-green-500/5 border-green-500/20' 
                      : 'bg-white/5 border-white/10 hover:border-[#00D4FF]/50 hover:bg-white/10'
                    }`}
                  onClick={() => !owned && handlePurchase(item)}
                >
                  {/* Owned badge */}
                  {owned && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 
                                  rounded-full bg-green-500/20 text-green-400 text-xs">
                      <Check className="w-3 h-3" />
                      Owned
                    </div>
                  )}

                  {/* Item content */}
                  <div className="p-4">
                    <div className="text-4xl mb-3">{item.icon}</div>
                    <h3 className="text-white font-semibold mb-1">{item.name}</h3>
                    <p className="text-white/50 text-xs mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold ${owned ? 'text-green-400' : 'text-[#00D4FF]'}`}>
                        {owned ? 'Purchased' : `$${item.price.toFixed(2)}`}
                      </span>
                      {!owned && (
                        <span className="text-[10px] text-white/30 uppercase">USDT0</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredItems.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/40">
              <ShoppingBag className="w-12 h-12 mb-3 opacity-50" />
              <p>No items in this category</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-center gap-2 text-white/30 text-xs">
            <Sparkles className="w-3 h-3" />
            Powered by Plasma • Instant gasless payments
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal
        item={selectedItem}
        isOpen={paymentModalOpen}
        onClose={() => {
          setPaymentModalOpen(false);
          setSelectedItem(null);
        }}
        onSuccess={handlePaymentSuccess}
      />
    </>
  );
}

export default StorePanel;
