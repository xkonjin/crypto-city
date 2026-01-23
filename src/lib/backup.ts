/**
 * Database Backup and Recovery
 * Issue #255: Implement Database Backup and Disaster Recovery
 * 
 * Provides utilities for backing up and restoring game state
 */

import { GameStateV1, serializeSaveState, loadSaveState } from './saveStateSchema';

/**
 * Backup storage interface
 */
export interface BackupStorage {
  save(key: string, data: string): Promise<void>;
  load(key: string): Promise<string | null>;
  list(): Promise<string[]>;
  delete(key: string): Promise<void>;
}

/**
 * LocalStorage backup implementation
 */
export class LocalStorageBackup implements BackupStorage {
  private prefix: string = 'plasma_city_backup_';
  
  async save(key: string, data: string): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, data);
    } catch (error) {
      throw new Error(`Failed to save backup: ${error}`);
    }
  }
  
  async load(key: string): Promise<string | null> {
    return localStorage.getItem(this.prefix + key);
  }
  
  async list(): Promise<string[]> {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.replace(this.prefix, ''));
      }
    }
    return keys.sort().reverse(); // Most recent first
  }
  
  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key);
  }
}

/**
 * Backup manager
 */
export class BackupManager {
  private storage: BackupStorage;
  private maxBackups: number = 10;
  
  constructor(storage: BackupStorage = new LocalStorageBackup()) {
    this.storage = storage;
  }
  
  /**
   * Create a backup of game state
   */
  async createBackup(gameState: GameStateV1, label?: string): Promise<string> {
    const timestamp = Date.now();
    const key = `${timestamp}_${label || 'auto'}`;
    
    try {
      const serialized = serializeSaveState(gameState);
      await this.storage.save(key, serialized);
      
      // Clean up old backups
      await this.cleanupOldBackups();
      
      return key;
    } catch (error) {
      throw new Error(`Failed to create backup: ${error}`);
    }
  }
  
  /**
   * Restore game state from backup
   */
  async restoreBackup(key: string): Promise<GameStateV1 | null> {
    try {
      const data = await this.storage.load(key);
      if (!data) {
        return null;
      }
      
      const result = loadSaveState(data);
      if (!result.success) {
        throw new Error(result.error);
      }
      
      return result.data || null;
    } catch (error) {
      throw new Error(`Failed to restore backup: ${error}`);
    }
  }
  
  /**
   * List all available backups
   */
  async listBackups(): Promise<Array<{ key: string; timestamp: number; label: string }>> {
    const keys = await this.storage.list();
    
    return keys.map(key => {
      const parts = key.split('_');
      const timestamp = parseInt(parts[0]);
      const label = parts.slice(1).join('_');
      
      return { key, timestamp, label };
    });
  }
  
  /**
   * Delete a backup
   */
  async deleteBackup(key: string): Promise<void> {
    await this.storage.delete(key);
  }
  
  /**
   * Clean up old backups, keeping only the most recent ones
   */
  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    
    if (backups.length > this.maxBackups) {
      const toDelete = backups.slice(this.maxBackups);
      
      for (const backup of toDelete) {
        await this.deleteBackup(backup.key);
      }
    }
  }
  
  /**
   * Export backup as downloadable file
   */
  exportBackup(gameState: GameStateV1, filename?: string): void {
    const serialized = serializeSaveState(gameState);
    const blob = new Blob([serialized], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `plasma_city_backup_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<GameStateV1> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const result = loadSaveState(content);
          
          if (!result.success) {
            reject(new Error(result.error));
          } else {
            resolve(result.data!);
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
}

/**
 * Auto-backup manager
 */
export class AutoBackupManager {
  private backupManager: BackupManager;
  private intervalId: NodeJS.Timeout | null = null;
  private intervalMs: number = 5 * 60 * 1000; // 5 minutes
  
  constructor(backupManager: BackupManager) {
    this.backupManager = backupManager;
  }
  
  /**
   * Start automatic backups
   */
  start(getGameState: () => GameStateV1): void {
    if (this.intervalId) {
      return; // Already running
    }
    
    this.intervalId = setInterval(async () => {
      try {
        const gameState = getGameState();
        await this.backupManager.createBackup(gameState, 'auto');
        console.log('Auto-backup created');
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, this.intervalMs);
    
    console.log('Auto-backup started (every 5 minutes)');
  }
  
  /**
   * Stop automatic backups
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Auto-backup stopped');
    }
  }
  
  /**
   * Set backup interval
   */
  setInterval(minutes: number): void {
    this.intervalMs = minutes * 60 * 1000;
    
    if (this.intervalId) {
      // Restart with new interval
      this.stop();
    }
  }
}

// Singleton instance
export const backupManager = new BackupManager();
export const autoBackupManager = new AutoBackupManager(backupManager);
