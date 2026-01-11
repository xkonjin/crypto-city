/**
 * Transaction History Component
 * 
 * Displays recent Plasma transactions with status and links.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, ExternalLink, RefreshCw, Clock, CheckCircle, XCircle, Loader2, History } from 'lucide-react';
import { usePlasmaWallet } from '@/hooks/usePlasmaWallet';
import {
  getRecentTransactions,
  formatRelativeTime,
} from '@/lib/plasma/transactionHistory';
import { PLASMA_EXPLORER_URL } from '@/lib/plasma/constants';
import type { TransactionRecord } from '@/lib/plasma/types';

interface TransactionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

function truncateHash(hash: string): string {
  return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
}

function StatusIcon({ status }: { status: TransactionRecord['status'] }) {
  switch (status) {
    case 'confirmed':
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-400" />;
    case 'pending':
    default:
      return <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />;
  }
}

function StatusBadge({ status }: { status: TransactionRecord['status'] }) {
  const colors = {
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    confirmed: 'bg-green-500/10 text-green-400 border-green-500/30',
    failed: 'bg-red-500/10 text-red-400 border-red-500/30',
  };

  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${colors[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export function TransactionHistory({ isOpen, onClose }: TransactionHistoryProps) {
  const { isConnected } = usePlasmaWallet();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const loadTransactions = useCallback(() => {
    setLoading(true);
    // Small delay to show loading state
    setTimeout(() => {
      setTransactions(getRecentTransactions(20));
      setLoading(false);
    }, 300);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadTransactions();
    }
  }, [isOpen, loadTransactions]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-[#0f1219] border-l border-white/10 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <History className="w-6 h-6 text-[#00D4FF]" />
            <h2 className="text-xl font-bold text-white">Transaction History</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadTransactions}
              disabled={loading}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 p-8">
              <History className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">Connect your wallet to view transaction history</p>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-white/40 p-8">
              <History className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-center">No transactions yet</p>
              <p className="text-sm mt-2">Your purchase history will appear here</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {transactions.map(tx => (
                <div key={tx.id} className="p-4 hover:bg-white/5 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon status={tx.status} />
                      <div>
                        <div className="text-white font-medium">
                          {tx.item || (tx.type === 'purchase' ? 'Purchase' : 'Transfer')}
                        </div>
                        <div className="text-white/50 text-sm">
                          ${tx.amount} USDT0
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <StatusBadge status={tx.status} />
                      <div className="text-white/40 text-xs mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(tx.timestamp)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-white/30 text-xs font-mono">
                      {truncateHash(tx.txHash)}
                    </span>
                    <a
                      href={`${PLASMA_EXPLORER_URL}/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D4FF]/70 hover:text-[#00D4FF] text-xs flex items-center gap-1"
                    >
                      View <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-black/20">
          <p className="text-white/30 text-xs text-center">
            Transactions are stored locally and may not reflect the full on-chain history
          </p>
        </div>
      </div>
    </>
  );
}

export default TransactionHistory;
