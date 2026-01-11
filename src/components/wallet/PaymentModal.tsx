/**
 * Payment Modal Component
 * 
 * Modal for in-game purchases using Plasma USDT0.
 * Shows item details, user balance, and handles payment flow.
 */

'use client';

import { useState, useCallback } from 'react';
import { X, Wallet, ExternalLink, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { usePlasmaWallet } from '@/hooks/usePlasmaWallet';
import { useUSDT0Balance } from '@/hooks/useUSDT0Balance';
import { useGaslessTransfer } from '@/hooks/useGaslessTransfer';
import { splitSignature, toAtomicUnits, fromAtomicUnits } from '@/lib/plasma/eip3009';
import { PLASMA_EXPLORER_URL } from '@/lib/plasma/constants';
import { addTransaction, updateTransactionStatus } from '@/lib/plasma/transactionHistory';
import type { StoreItem, RelayResponse } from '@/lib/plasma/types';
import type { Address } from 'viem';

interface PaymentModalProps {
  item: StoreItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (txHash: string) => void;
  merchantAddress?: Address;
}

type PaymentStatus = 'idle' | 'signing' | 'relaying' | 'success' | 'error';

export function PaymentModal({
  item,
  isOpen,
  onClose,
  onSuccess,
  merchantAddress = process.env.NEXT_PUBLIC_MERCHANT_ADDRESS as Address,
}: PaymentModalProps) {
  const { isConnected, address, login } = usePlasmaWallet();
  const { formatted: balance, refresh: refreshBalance } = useUSDT0Balance();
  const { signTransfer, loading: signing } = useGaslessTransfer();
  
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = useCallback(async () => {
    if (!item || !isConnected || !merchantAddress) return;

    setStatus('signing');
    setError(null);

    try {
      // Sign the transfer authorization
      const signResult = await signTransfer({
        to: merchantAddress,
        amount: item.priceAtomic,
      });

      if (!signResult.success || !signResult.signature || !signResult.typedData) {
        setStatus('error');
        setError(signResult.error || 'Failed to sign transaction');
        return;
      }

      setStatus('relaying');

      // Split signature into components
      const sig = splitSignature(signResult.signature);

      // Send to relay API
      const response = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          typedData: signResult.typedData,
          signature: sig,
          itemId: item.id,
        }),
      });

      const result: RelayResponse = await response.json();

      if (result.success && result.txHash) {
        // Record transaction
        addTransaction({
          type: 'purchase',
          amount: item.price.toFixed(2),
          item: item.name,
          txHash: result.txHash,
          status: 'confirmed',
        });

        setStatus('success');
        setTxHash(result.txHash);
        refreshBalance();
        onSuccess?.(result.txHash);
      } else {
        setStatus('error');
        setError(result.error || 'Transaction failed');
      }
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Payment failed');
    }
  }, [item, isConnected, merchantAddress, signTransfer, refreshBalance, onSuccess]);

  const handleClose = useCallback(() => {
    if (status !== 'signing' && status !== 'relaying') {
      setStatus('idle');
      setTxHash(null);
      setError(null);
      onClose();
    }
  }, [status, onClose]);

  if (!isOpen || !item) return null;

  const balanceNum = balance ? parseFloat(balance) : 0;
  const hasEnoughBalance = balanceNum >= item.price;
  const isProcessing = status === 'signing' || status === 'relaying';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-[#1a1f2e] rounded-xl border border-white/10 shadow-2xl w-full max-w-md pointer-events-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold text-white">Purchase Item</h2>
            <button
              onClick={handleClose}
              disabled={isProcessing}
              className="p-1 rounded-md hover:bg-white/10 transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Item details */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-lg bg-[#00D4FF]/10 flex items-center justify-center text-3xl">
                {item.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-semibold">{item.name}</h3>
                <p className="text-white/60 text-sm">{item.description}</p>
              </div>
            </div>

            {/* Price and balance */}
            <div className="bg-white/5 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white/60 text-sm">Price</span>
                <span className="text-[#00D4FF] text-xl font-bold">
                  ${item.price.toFixed(2)} USDT0
                </span>
              </div>
              {isConnected && (
                <div className="flex justify-between items-center">
                  <span className="text-white/60 text-sm">Your Balance</span>
                  <span className={`text-sm font-mono ${hasEnoughBalance ? 'text-green-400' : 'text-red-400'}`}>
                    ${balanceNum.toFixed(2)} USDT0
                  </span>
                </div>
              )}
            </div>

            {/* Status messages */}
            {status === 'success' && txHash && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-green-400 mb-2">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">Payment Successful!</span>
                </div>
                <a
                  href={`${PLASMA_EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-400/80 hover:text-green-400 flex items-center gap-1"
                >
                  View transaction <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            {status === 'error' && error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2 text-red-400">
                  <XCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isConnected ? (
              <button
                onClick={login}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                          bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-semibold
                          transition-colors"
              >
                <Wallet className="w-5 h-5" />
                Connect Wallet to Pay
              </button>
            ) : status === 'success' ? (
              <button
                onClick={handleClose}
                className="w-full px-4 py-3 rounded-lg bg-green-500 hover:bg-green-600
                          text-white font-semibold transition-colors"
              >
                Done
              </button>
            ) : (
              <button
                onClick={handlePayment}
                disabled={isProcessing || !hasEnoughBalance}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg
                          bg-[#00D4FF] hover:bg-[#00D4FF]/90 text-black font-semibold
                          transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {status === 'signing' ? 'Awaiting Signature...' : 'Processing...'}
                  </>
                ) : !hasEnoughBalance ? (
                  'Insufficient Balance'
                ) : (
                  <>
                    <Wallet className="w-5 h-5" />
                    Pay ${item.price.toFixed(2)}
                  </>
                )}
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 pb-4">
            <p className="text-xs text-white/40 text-center">
              Powered by Plasma • Gasless USDT0 transfers
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentModal;
