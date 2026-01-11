'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { notificationManager, Notification } from '@/lib/notifications';

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationBadgeProps {
  onClick: () => void;
  className?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NotificationBadge({ onClick, className }: NotificationBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isShaking, setIsShaking] = useState(false);

  // Update unread count on mount and when notifications change
  useEffect(() => {
    // Initial count
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: sync initial count on mount
    setUnreadCount(notificationManager.getUnreadCount());

    // Subscribe to new notifications
    const unsubscribe = notificationManager.subscribe((notification: Notification) => {
      setUnreadCount(notificationManager.getUnreadCount());
      
      // Trigger shake animation for high priority notifications
      if (notification.priority === 'high' || notification.priority === 'critical') {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Handle click - also updates unread count after opening center
  const handleClick = useCallback(() => {
    onClick();
    // Re-sync count after a short delay (in case center marks things as read)
    setTimeout(() => {
      setUnreadCount(notificationManager.getUnreadCount());
    }, 100);
  }, [onClick]);

  return (
    <button
      data-testid="notification-badge"
      onClick={handleClick}
      className={cn(
        'relative p-2 rounded-md transition-all',
        'hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-primary/50',
        isShaking && 'animate-shake',
        className
      )}
      aria-label="Notifications"
    >
      <Bell className="w-5 h-5 text-foreground/80" />
      
      {/* Unread count badge */}
      {unreadCount > 0 && (
        <span
          data-testid="notification-unread-count"
          className={cn(
            'absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px]',
            'flex items-center justify-center',
            'text-[10px] font-bold text-white',
            'bg-red-500 rounded-full px-1',
            'border-2 border-background',
            'transition-transform',
            isShaking && 'animate-bounce'
          )}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}

export default NotificationBadge;
