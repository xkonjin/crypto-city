'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Notification, PRIORITY_COLORS, notificationManager } from '@/lib/notifications';

// =============================================================================
// TYPES
// =============================================================================

export interface NotificationToastProps {
  notification: Notification | null;
  isVisible: boolean;
  onDismiss: () => void;
  onOpenCenter?: () => void;
  duration?: number; // Auto-dismiss duration in ms
}

// =============================================================================
// TOAST CONTENT COMPONENT
// =============================================================================

function NotificationToastContent({
  notification,
  isVisible,
  onDismiss,
  onOpenCenter,
  duration = 5000,
}: NotificationToastProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isVisible && notification) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: animation state must sync with visibility
      setShouldRender(true);

      // Trigger entrance animation
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
        });
      });

      // Auto-dismiss after duration
      const dismissTimer = setTimeout(() => {
        onDismiss();
      }, duration);

      return () => {
        cancelAnimationFrame(frame);
        clearTimeout(dismissTimer);
      };
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isVisible, notification, onDismiss, duration]);

  if (!shouldRender || !notification) {
    return null;
  }

  const colors = PRIORITY_COLORS[notification.priority];

  const handleBodyClick = () => {
    if (!notification.isRead) {
      notificationManager.markAsRead(notification.id);
    }
    onOpenCenter?.();
    onDismiss();
  };

  return (
    <div
      data-testid="notification-toast"
      className={cn(
        'fixed z-[9999] pointer-events-auto',
        'transition-all duration-300 ease-out',
        // Mobile: bottom position
        'bottom-20 left-3 right-3',
        // Desktop: bottom right position
        'md:bottom-24 md:left-auto md:right-4 md:max-w-md',
        isAnimating
          ? 'opacity-100 translate-y-0 scale-100'
          : 'opacity-0 translate-y-4 scale-95'
      )}
    >
      <div
        className={cn(
          'relative bg-gray-900/95 backdrop-blur-sm border-2 rounded-lg shadow-2xl overflow-hidden',
          colors.border,
          notification.priority === 'critical' && 'border-red-500/70'
        )}
      >
        {/* Top accent stripe */}
        <div
          className={cn(
            'absolute top-0 left-0 right-0 h-1',
            notification.priority === 'critical'
              ? 'bg-gradient-to-r from-red-600 via-red-400 to-red-600'
              : notification.priority === 'high'
              ? 'bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600'
              : 'bg-gradient-to-r from-blue-600 via-blue-400 to-blue-600'
          )}
        />

        {/* Content */}
        <div className="p-4 flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-lg',
              notification.priority === 'critical'
                ? 'bg-gradient-to-br from-red-500 to-red-700'
                : notification.priority === 'high'
                ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                : 'bg-gradient-to-br from-blue-500 to-blue-700'
            )}
          >
            {notification.icon}
          </div>

          {/* Message */}
          <div
            data-testid="toast-body"
            onClick={handleBodyClick}
            className="flex-1 min-w-0 cursor-pointer"
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded font-medium',
                  notification.priority === 'critical'
                    ? 'bg-red-500/30 text-red-400'
                    : notification.priority === 'high'
                    ? 'bg-amber-500/30 text-amber-400'
                    : 'bg-blue-500/30 text-blue-400'
                )}
              >
                {notification.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <h3 className="text-sm font-bold text-white mb-0.5">
              {notification.title}
            </h3>
            <p className="text-xs text-gray-300 line-clamp-2">
              {notification.message}
            </p>
          </div>

          {/* Close button */}
          <button
            data-testid="toast-close"
            onClick={onDismiss}
            className="flex-shrink-0 p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// PORTAL WRAPPER
// =============================================================================

export function NotificationToast(props: NotificationToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Intentional: client-side portal mounting detection
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <NotificationToastContent {...props} />,
    document.body
  );
}

export default NotificationToast;
