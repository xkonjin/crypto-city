/**
 * Connect Wallet Button
 * 
 * Button component for wallet connection. Shows different states:
 * - Not connected: "Connect Wallet" button
 * - Connected: Truncated address with balance
 */

'use client';

import { useState } from 'react';
import { Wallet, ChevronDown, LogOut, RefreshCw, ExternalLink, History } from 'lucide-react';
import { TransactionHistory } from './TransactionHistory';
import { usePlasmaWallet } from '@/hooks/usePlasmaWallet';
import { useUSDT0Balance } from '@/hooks/useUSDT0Balance';
import { PLASMA_EXPLORER_URL } from '@/lib/plasma/constants';

interface ConnectWalletButtonProps {
  className?: string;
  compact?: boolean;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function ConnectWalletButton({ className = '', compact = false }: ConnectWalletButtonProps) {
  const { isConnected, isReady, address, login, logout } = usePlasmaWallet();
  const { formatted, loading: balanceLoading, refresh } = useUSDT0Balance();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Not ready yet (Privy loading)
  if (!isReady) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-white/50 text-sm ${className}`}
      >
        <div className="w-4 h-4 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
        {!compact && <span>Loading...</span>}
      </button>
    );
  }

  // Not connected - show connect button
  if (!isConnected) {
    return (
      <button
        onClick={login}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00D4FF]/20 hover:bg-[#00D4FF]/30 
                   text-[#00D4FF] text-sm font-medium transition-colors border border-[#00D4FF]/30 ${className}`}
      >
        <Wallet className="w-4 h-4" />
        {!compact && <span>Connect Wallet</span>}
      </button>
    );
  }

  // Connected - show address and balance dropdown
  return (
    <div className="relative">
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#00D4FF]/10 hover:bg-[#00D4FF]/20 
                   text-white text-sm transition-colors border border-[#00D4FF]/20 ${className}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="font-mono">{truncateAddress(address!)}</span>
        </div>
        {formatted && !compact && (
          <span className="text-[#00D4FF] font-medium">
            ${parseFloat(formatted).toFixed(2)}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setDropdownOpen(false)} 
          />
          
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-[#1a1f2e] rounded-lg border border-white/10 
                          shadow-xl z-50 overflow-hidden">
            {/* Balance section */}
            <div className="p-4 border-b border-white/10">
              <div className="text-xs text-white/50 mb-1">USDT0 Balance</div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-[#00D4FF]">
                  ${formatted ? parseFloat(formatted).toFixed(2) : '0.00'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    refresh();
                  }}
                  disabled={balanceLoading}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 text-white/50 ${balanceLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Address section */}
            <div className="p-4 border-b border-white/10">
              <div className="text-xs text-white/50 mb-1">Wallet Address</div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-white/80">{truncateAddress(address!)}</span>
                <a
                  href={`${PLASMA_EXPLORER_URL}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white/50" />
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="p-2 space-y-1">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  setHistoryOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 
                          text-white/70 text-sm transition-colors"
              >
                <History className="w-4 h-4" />
                Transaction History
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 
                          text-red-400 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </>
      )}

      {/* Transaction History Panel */}
      <TransactionHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </div>
  );
}

export default ConnectWalletButton;
