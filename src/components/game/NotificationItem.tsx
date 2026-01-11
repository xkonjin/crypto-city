'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { 
  Notification, 
  NotificationType,
  PRIORITY_COLORS,
  notificationManager 
} from '@/lib/notifications';

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationItemProps {
  notification: Notification;
  onClick?: () => void;
  onMarkAsRead?: (id: string) => void;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatTimestamp(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than a minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than an hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // More than a day
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getTypeIcon(type: NotificationType): string {
  switch (type) {
    case 'rug_pull': return '🔴';
    case 'disaster': return '⚠️';
    case 'positive_event': return '🎉';
    case 'milestone': return '🏆';
    case 'trade': return '💱';
    case 'warning': return '⚡';
    case 'info': return 'ℹ️';
    default: return '📌';
  }
}

// =============================================================================
// COMPONENT
// =============================================================================

export function NotificationItem({ 
  notification, 
  onClick,
  onMarkAsRead 
}: NotificationItemProps) {
  const { id, type, title, message, timestamp, isRead, priority, icon } = notification;
  const colors = PRIORITY_COLORS[priority];

  const handleClick = () => {
    if (!isRead) {
      notificationManager.markAsRead(id);
      onMarkAsRead?.(id);
    }
    onClick?.();
  };

  return (
    <div
      data-testid="notification-item"
      data-notification-type={type}
      data-notification-priority={priority}
      data-read={String(isRead)}
      onClick={handleClick}
      className={cn(
        'relative p-3 rounded-lg border cursor-pointer transition-all',
        'hover:bg-secondary/50',
        isRead 
          ? 'bg-card/50 border-border/50 opacity-70' 
          : `${colors.bg} ${colors.border} unread`,
        priority === 'critical' && !isRead && 'border-l-4 border-l-red-500'
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div 
          className="absolute top-3 left-1 w-2 h-2 rounded-full bg-primary animate-pulse"
          aria-hidden="true"
        />
      )}

      <div className="flex items-start gap-3 ml-2">
        {/* Icon */}
        <div 
          data-testid="notification-icon"
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg',
            colors.bg
          )}
        >
          {icon || getTypeIcon(type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h4 
            data-testid="notification-title"
            className={cn(
              'text-sm font-medium truncate',
              isRead ? 'text-foreground/70' : 'text-foreground'
            )}
          >
            {title}
          </h4>
          
          {/* Message */}
          <p 
            data-testid="notification-message"
            className={cn(
              'text-xs mt-0.5 line-clamp-2',
              isRead ? 'text-muted-foreground/70' : 'text-muted-foreground'
            )}
          >
            {message}
          </p>
        </div>

        {/* Timestamp */}
        <div 
          data-testid="notification-timestamp"
          className="flex-shrink-0 text-xs text-muted-foreground"
        >
          {formatTimestamp(timestamp)}
        </div>
      </div>

      {/* Priority indicator for high/critical */}
      {(priority === 'high' || priority === 'critical') && !isRead && (
        <div 
          className={cn(
            'absolute top-0 right-0 px-1.5 py-0.5 text-[10px] font-medium rounded-bl-lg rounded-tr-lg',
            priority === 'critical' 
              ? 'bg-red-500/20 text-red-400' 
              : 'bg-amber-500/20 text-amber-400'
          )}
        >
          {priority === 'critical' ? 'URGENT' : 'IMPORTANT'}
        </div>
      )}
    </div>
  );
}

export default NotificationItem;
