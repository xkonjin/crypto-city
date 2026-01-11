/**
 * Transaction History
 * 
 * Local storage management for transaction records.
 */

import type { TransactionRecord } from './types';

const TRANSACTION_HISTORY_KEY = 'crypto-city-transactions';
const MAX_TRANSACTIONS = 50;

/**
 * Get all transaction records from localStorage
 */
export function getTransactionHistory(): TransactionRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(TRANSACTION_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Add a new transaction record
 */
export function addTransaction(transaction: Omit<TransactionRecord, 'id' | 'timestamp'>): TransactionRecord {
  const record: TransactionRecord = {
    ...transaction,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  if (typeof window === 'undefined') return record;

  try {
    const history = getTransactionHistory();
    // Add to beginning (most recent first)
    history.unshift(record);
    // Keep only the most recent transactions
    const trimmed = history.slice(0, MAX_TRANSACTIONS);
    localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('Failed to save transaction:', e);
  }

  return record;
}

/**
 * Update a transaction's status
 */
export function updateTransactionStatus(
  txHash: string,
  status: TransactionRecord['status']
): void {
  if (typeof window === 'undefined') return;

  try {
    const history = getTransactionHistory();
    const index = history.findIndex(tx => tx.txHash === txHash);
    if (index !== -1) {
      history[index].status = status;
      localStorage.setItem(TRANSACTION_HISTORY_KEY, JSON.stringify(history));
    }
  } catch (e) {
    console.error('Failed to update transaction:', e);
  }
}

/**
 * Get recent transactions (default last 10)
 */
export function getRecentTransactions(limit = 10): TransactionRecord[] {
  return getTransactionHistory().slice(0, limit);
}

/**
 * Clear all transaction history
 */
export function clearTransactionHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(TRANSACTION_HISTORY_KEY);
  } catch (e) {
    console.error('Failed to clear transactions:', e);
  }
}

/**
 * Format timestamp to relative time string
 */
export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}
