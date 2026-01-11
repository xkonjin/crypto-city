'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X, 
  Bell, 
  CheckCheck, 
  Filter,
  AlertTriangle,
  Trophy,
  TrendingUp,
  Info,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  notificationManager, 
  Notification, 
  NotificationType,
  NotificationPriority,
  NotificationFilter
} from '@/lib/notifications';
import { NotificationItem } from './NotificationItem';

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

// =============================================================================
// FILTER BUTTON COMPONENT
// =============================================================================

interface FilterButtonProps {
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
  testId: string;
}

function FilterButton({ label, icon, isActive, onClick, testId }: FilterButtonProps) {
  return (
    <button
      data-testid={testId}
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all',
        isActive 
          ? 'bg-primary text-primary-foreground' 
          : 'bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground'
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

// =============================================================================
// DAY GROUP COMPONENT
// =============================================================================

interface DayGroupProps {
  day: number;
  notifications: Notification[];
  onItemClick?: () => void;
}

function DayGroup({ day, notifications, onItemClick }: DayGroupProps) {
  return (
    <div data-testid="notification-day-group" className="mb-6 last:mb-0">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-muted-foreground px-2">
          Day {day}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <div className="space-y-2">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClick={onItemClick}
          />
        ))}
      </div>
    </div>
  );
}

// =============================================================================
// NOTIFICATION CENTER COMPONENT
// =============================================================================

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [typeFilter, setTypeFilter] = useState<NotificationType | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications on open
  useEffect(() => {
    if (isOpen) {
      const filter: NotificationFilter = {};
      if (typeFilter) filter.types = [typeFilter];
      if (priorityFilter) filter.priority = [priorityFilter];
      
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync state when panel opens
      setNotifications(notificationManager.getFiltered(filter));
      setUnreadCount(notificationManager.getUnreadCount());
    }
  }, [isOpen, typeFilter, priorityFilter]);

  // Subscribe to new notifications
  useEffect(() => {
    const unsubscribe = notificationManager.subscribe(() => {
      if (isOpen) {
        const filter: NotificationFilter = {};
        if (typeFilter) filter.types = [typeFilter];
        if (priorityFilter) filter.priority = [priorityFilter];
        
        setNotifications(notificationManager.getFiltered(filter));
        setUnreadCount(notificationManager.getUnreadCount());
      }
    });

    return () => unsubscribe();
  }, [isOpen, typeFilter, priorityFilter]);

  // Group notifications by day
  const groupedNotifications = useMemo(() => {
    const groups = new Map<number, Notification[]>();
    
    for (const notification of notifications) {
      const day = notification.gameDay;
      if (!groups.has(day)) {
        groups.set(day, []);
      }
      groups.get(day)!.push(notification);
    }

    // Sort by day descending (most recent first)
    return Array.from(groups.entries()).sort((a, b) => b[0] - a[0]);
  }, [notifications]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    notificationManager.markAllAsRead();
    setUnreadCount(0);
    // Refresh notifications to update read states
    const filter: NotificationFilter = {};
    if (typeFilter) filter.types = [typeFilter];
    if (priorityFilter) filter.priority = [priorityFilter];
    setNotifications(notificationManager.getFiltered(filter));
  }, [typeFilter, priorityFilter]);

  // Toggle type filter
  const handleTypeFilter = useCallback((type: NotificationType) => {
    setTypeFilter(prev => prev === type ? null : type);
  }, []);

  // Toggle priority filter  
  const handlePriorityFilter = useCallback((priority: NotificationPriority) => {
    setPriorityFilter(prev => prev === priority ? null : priority);
  }, []);

  // Refresh when item is clicked (marks as read)
  const handleItemClick = useCallback(() => {
    setUnreadCount(notificationManager.getUnreadCount());
    const filter: NotificationFilter = {};
    if (typeFilter) filter.types = [typeFilter];
    if (priorityFilter) filter.priority = [priorityFilter];
    setNotifications(notificationManager.getFiltered(filter));
  }, [typeFilter, priorityFilter]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="notification-center"
      className={cn(
        'fixed inset-y-0 right-0 z-50',
        'w-full max-w-md',
        'bg-background/95 backdrop-blur-lg border-l border-border',
        'shadow-2xl',
        'flex flex-col',
        'animate-in slide-in-from-right duration-300'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold">Notifications</h2>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-testid="mark-all-read"
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
            className="h-8 px-2 text-xs"
          >
            <CheckCheck className="w-4 h-4 mr-1" />
            Mark all read
          </Button>
          <button
            data-testid="notification-center-close"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-secondary transition-colors"
            aria-label="Close notifications"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div data-testid="notification-filters" className="p-3 border-b border-border">
        <div className="flex items-center gap-1 mb-2">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Type:</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-3">
          <FilterButton
            testId="filter-disaster"
            label="Disasters"
            icon={<AlertTriangle className="w-3 h-3" />}
            isActive={typeFilter === 'disaster'}
            onClick={() => handleTypeFilter('disaster')}
          />
          <FilterButton
            testId="filter-milestone"
            label="Milestones"
            icon={<Trophy className="w-3 h-3" />}
            isActive={typeFilter === 'milestone'}
            onClick={() => handleTypeFilter('milestone')}
          />
          <FilterButton
            testId="filter-trade"
            label="Trades"
            icon={<TrendingUp className="w-3 h-3" />}
            isActive={typeFilter === 'trade'}
            onClick={() => handleTypeFilter('trade')}
          />
          <FilterButton
            testId="filter-warning"
            label="Warnings"
            icon={<Zap className="w-3 h-3" />}
            isActive={typeFilter === 'warning'}
            onClick={() => handleTypeFilter('warning')}
          />
          <FilterButton
            testId="filter-info"
            label="Info"
            icon={<Info className="w-3 h-3" />}
            isActive={typeFilter === 'info'}
            onClick={() => handleTypeFilter('info')}
          />
        </div>
        
        <div className="flex items-center gap-1 mb-2">
          <span className="text-xs text-muted-foreground">Priority:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <FilterButton
            testId="filter-critical"
            label="Critical"
            icon={<span className="w-2 h-2 rounded-full bg-red-500" />}
            isActive={priorityFilter === 'critical'}
            onClick={() => handlePriorityFilter('critical')}
          />
          <FilterButton
            testId="filter-high"
            label="High"
            icon={<span className="w-2 h-2 rounded-full bg-amber-500" />}
            isActive={priorityFilter === 'high'}
            onClick={() => handlePriorityFilter('high')}
          />
          <FilterButton
            testId="filter-medium"
            label="Medium"
            icon={<span className="w-2 h-2 rounded-full bg-blue-500" />}
            isActive={priorityFilter === 'medium'}
            onClick={() => handlePriorityFilter('medium')}
          />
          <FilterButton
            testId="filter-low"
            label="Low"
            icon={<span className="w-2 h-2 rounded-full bg-gray-500" />}
            isActive={priorityFilter === 'low'}
            onClick={() => handlePriorityFilter('low')}
          />
        </div>
      </div>

      {/* Notification List */}
      <ScrollArea className="flex-1">
        <div data-testid="notification-list" className="p-4">
          {groupedNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notifications yet</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Events will appear here as they happen
              </p>
            </div>
          ) : (
            groupedNotifications.map(([day, dayNotifications]) => (
              <DayGroup
                key={day}
                day={day}
                notifications={dayNotifications}
                onItemClick={handleItemClick}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default NotificationCenter;
