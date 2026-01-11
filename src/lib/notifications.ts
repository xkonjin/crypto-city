/**
 * Notification System for Crypto City (Issue #65)
 * 
 * Implements a Cities: Skylines-style "chirper" notification center for event history.
 * Notifications persist to localStorage and integrate with:
 * - Disasters and positive events
 * - Milestones and achievements
 * - Trading and economy events
 * - Advisor warnings
 */

// =============================================================================
// TYPES
// =============================================================================

export type NotificationType = 
  | 'rug_pull'
  | 'disaster'
  | 'positive_event'
  | 'milestone'
  | 'trade'
  | 'warning'
  | 'info';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  gameDay: number;
  isRead: boolean;
  priority: NotificationPriority;
  buildingId?: string;  // Related building if any
  actionUrl?: string;   // Link to relevant panel
  icon?: string;        // Emoji or icon identifier
}

export interface NotificationFilter {
  types?: NotificationType[];
  priority?: NotificationPriority[];
  isRead?: boolean;
  startDay?: number;
  endDay?: number;
}

export interface NotificationPreferences {
  enableToasts: boolean;
  toastDuration: number;  // milliseconds
  soundEnabled: boolean;
  priorityFilter: NotificationPriority[];  // Only show these priorities as toasts
  typeFilter: NotificationType[];          // Only show these types as toasts
}

// =============================================================================
// CONSTANTS
// =============================================================================

const STORAGE_KEY = 'cryptoCityNotifications';
const PREFERENCES_KEY = 'cryptoCityNotificationPreferences';
const MAX_NOTIFICATIONS = 100;

const DEFAULT_PREFERENCES: NotificationPreferences = {
  enableToasts: true,
  toastDuration: 5000,
  soundEnabled: true,
  priorityFilter: ['medium', 'high', 'critical'],
  typeFilter: ['rug_pull', 'disaster', 'positive_event', 'milestone', 'trade', 'warning', 'info'],
};

// Type-specific icons
export const NOTIFICATION_ICONS: Record<NotificationType, string> = {
  rug_pull: '🔴',
  disaster: '⚠️',
  positive_event: '🎉',
  milestone: '🏆',
  trade: '💱',
  warning: '⚡',
  info: 'ℹ️',
};

// Priority-specific colors (for UI reference)
export const PRIORITY_COLORS: Record<NotificationPriority, { bg: string; text: string; border: string }> = {
  low: { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/30' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
};

// =============================================================================
// NOTIFICATION MANAGER CLASS
// =============================================================================

export type NotificationCallback = (notification: Notification) => void;

/**
 * NotificationManager
 * 
 * Manages the notification system - stores notifications, handles subscriptions,
 * filters, and persistence to localStorage.
 */
export class NotificationManager {
  private notifications: Notification[] = [];
  private maxNotifications: number = MAX_NOTIFICATIONS;
  private subscribers: Set<NotificationCallback> = new Set();
  private preferences: NotificationPreferences = { ...DEFAULT_PREFERENCES };
  private currentGameDay: number = 1;

  constructor() {
    this.loadFromStorage();
    this.loadPreferences();
  }

  // ---------------------------------------------------------------------------
  // NOTIFICATION OPERATIONS
  // ---------------------------------------------------------------------------

  /**
   * Add a new notification
   */
  add(notification: Omit<Notification, 'id' | 'timestamp'>): Notification {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: Date.now(),
      icon: notification.icon || NOTIFICATION_ICONS[notification.type],
    };

    // Add to beginning of array (newest first)
    this.notifications.unshift(fullNotification);

    // Trim to max size
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    // Persist
    this.saveToStorage();

    // Notify subscribers
    this.notifySubscribers(fullNotification);

    return fullNotification;
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification && !notification.isRead) {
      notification.isRead = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    let changed = false;
    for (const notification of this.notifications) {
      if (!notification.isRead) {
        notification.isRead = true;
        changed = true;
      }
    }
    if (changed) {
      this.saveToStorage();
    }
  }

  /**
   * Get notifications with optional filtering
   */
  getFiltered(filter: NotificationFilter = {}): Notification[] {
    let result = [...this.notifications];

    if (filter.types && filter.types.length > 0) {
      result = result.filter(n => filter.types!.includes(n.type));
    }

    if (filter.priority && filter.priority.length > 0) {
      result = result.filter(n => filter.priority!.includes(n.priority));
    }

    if (filter.isRead !== undefined) {
      result = result.filter(n => n.isRead === filter.isRead);
    }

    if (filter.startDay !== undefined) {
      result = result.filter(n => n.gameDay >= filter.startDay!);
    }

    if (filter.endDay !== undefined) {
      result = result.filter(n => n.gameDay <= filter.endDay!);
    }

    return result;
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  /**
   * Get notifications grouped by game day
   */
  getGroupedByDay(): Map<number, Notification[]> {
    const grouped = new Map<number, Notification[]>();
    
    for (const notification of this.notifications) {
      const day = notification.gameDay;
      if (!grouped.has(day)) {
        grouped.set(day, []);
      }
      grouped.get(day)!.push(notification);
    }

    return grouped;
  }

  /**
   * Clear all notifications
   */
  clear(): void {
    this.notifications = [];
    this.saveToStorage();
  }

  /**
   * Remove a specific notification
   */
  remove(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
  }

  // ---------------------------------------------------------------------------
  // SUBSCRIPTIONS
  // ---------------------------------------------------------------------------

  /**
   * Subscribe to new notifications
   * Returns unsubscribe function
   */
  subscribe(callback: NotificationCallback): () => void {
    this.subscribers.add(callback);
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Notify all subscribers of a new notification
   */
  private notifySubscribers(notification: Notification): void {
    for (const callback of this.subscribers) {
      try {
        callback(notification);
      } catch (error) {
        console.error('[NotificationManager] Subscriber error:', error);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // PREFERENCES
  // ---------------------------------------------------------------------------

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Update preferences
   */
  setPreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = {
      ...this.preferences,
      ...updates,
    };
    this.savePreferences();
  }

  /**
   * Check if a notification should show as toast based on preferences
   */
  shouldShowToast(notification: Notification): boolean {
    if (!this.preferences.enableToasts) {
      return false;
    }

    // Check priority filter
    if (this.preferences.priorityFilter.length > 0 && 
        !this.preferences.priorityFilter.includes(notification.priority)) {
      return false;
    }

    // Check type filter
    if (this.preferences.typeFilter.length > 0 && 
        !this.preferences.typeFilter.includes(notification.type)) {
      return false;
    }

    return true;
  }

  // ---------------------------------------------------------------------------
  // GAME STATE
  // ---------------------------------------------------------------------------

  /**
   * Update the current game day
   */
  setGameDay(day: number): void {
    this.currentGameDay = day;
  }

  /**
   * Get current game day
   */
  getGameDay(): number {
    return this.currentGameDay;
  }

  // ---------------------------------------------------------------------------
  // PERSISTENCE
  // ---------------------------------------------------------------------------

  /**
   * Load notifications from localStorage
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.notifications = parsed;
        }
      }
    } catch (error) {
      console.error('[NotificationManager] Failed to load from storage:', error);
    }
  }

  /**
   * Save notifications to localStorage
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.notifications));
    } catch (error) {
      console.error('[NotificationManager] Failed to save to storage:', error);
    }
  }

  /**
   * Load preferences from localStorage
   */
  private loadPreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      const stored = localStorage.getItem(PREFERENCES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.preferences = { ...DEFAULT_PREFERENCES, ...parsed };
      }
    } catch (error) {
      console.error('[NotificationManager] Failed to load preferences:', error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  private savePreferences(): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(PREFERENCES_KEY, JSON.stringify(this.preferences));
    } catch (error) {
      console.error('[NotificationManager] Failed to save preferences:', error);
    }
  }

  /**
   * Export state for saving
   */
  exportState(): { notifications: Notification[]; preferences: NotificationPreferences } {
    return {
      notifications: [...this.notifications],
      preferences: { ...this.preferences },
    };
  }

  /**
   * Import state from save
   */
  importState(data: { notifications?: Notification[]; preferences?: NotificationPreferences }): void {
    if (data.notifications) {
      this.notifications = data.notifications;
    }
    if (data.preferences) {
      this.preferences = { ...DEFAULT_PREFERENCES, ...data.preferences };
    }
    this.saveToStorage();
    this.savePreferences();
  }

  // ---------------------------------------------------------------------------
  // HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Generate a unique notification ID
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const notificationManager = new NotificationManager();

// =============================================================================
// HELPER FUNCTIONS FOR CREATING NOTIFICATIONS
// =============================================================================

/**
 * Create a rug pull notification
 */
export function createRugPullNotification(
  buildingName: string,
  loss: number,
  gameDay: number
): Omit<Notification, 'id' | 'timestamp'> {
  return {
    type: 'rug_pull',
    title: '🔴 RUG PULL!',
    message: `${buildingName} has been rugged! Lost $${loss.toLocaleString()}`,
    gameDay,
    isRead: false,
    priority: 'critical',
    icon: '🔴',
  };
}

/**
 * Create a disaster notification
 */
export function createDisasterNotification(
  disasterName: string,
  description: string,
  gameDay: number,
  isPositive: boolean = false
): Omit<Notification, 'id' | 'timestamp'> {
  return {
    type: isPositive ? 'positive_event' : 'disaster',
    title: isPositive ? `🎉 ${disasterName}` : `⚠️ ${disasterName}`,
    message: description,
    gameDay,
    isRead: false,
    priority: isPositive ? 'medium' : 'high',
    icon: isPositive ? '🎉' : '⚠️',
  };
}

/**
 * Create a milestone notification
 */
export function createMilestoneNotification(
  milestoneName: string,
  reward: string,
  gameDay: number
): Omit<Notification, 'id' | 'timestamp'> {
  return {
    type: 'milestone',
    title: '🏆 Milestone Complete!',
    message: `${milestoneName}: ${reward}`,
    gameDay,
    isRead: false,
    priority: 'high',
    icon: '🏆',
  };
}

/**
 * Create a trade notification
 */
export function createTradeNotification(
  tradeName: string,
  outcome: 'success' | 'failure',
  amount: number,
  gameDay: number
): Omit<Notification, 'id' | 'timestamp'> {
  const isSuccess = outcome === 'success';
  return {
    type: 'trade',
    title: isSuccess ? '💰 Trade Success!' : '📉 Trade Failed',
    message: isSuccess 
      ? `${tradeName} earned $${amount.toLocaleString()}`
      : `${tradeName} lost $${amount.toLocaleString()}`,
    gameDay,
    isRead: false,
    priority: isSuccess ? 'medium' : 'high',
    icon: isSuccess ? '💰' : '📉',
  };
}

/**
 * Create a warning notification
 */
export function createWarningNotification(
  title: string,
  message: string,
  gameDay: number
): Omit<Notification, 'id' | 'timestamp'> {
  return {
    type: 'warning',
    title: `⚡ ${title}`,
    message,
    gameDay,
    isRead: false,
    priority: 'high',
    icon: '⚡',
  };
}

/**
 * Create an info notification
 */
export function createInfoNotification(
  title: string,
  message: string,
  gameDay: number
): Omit<Notification, 'id' | 'timestamp'> {
  return {
    type: 'info',
    title: `ℹ️ ${title}`,
    message,
    gameDay,
    isRead: false,
    priority: 'low',
    icon: 'ℹ️',
  };
}

export default NotificationManager;
