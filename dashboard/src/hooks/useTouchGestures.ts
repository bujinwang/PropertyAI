import { useEffect, useRef, useCallback } from 'react';

export interface TouchGestureConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onPinch?: (scale: number, center: { x: number; y: number }) => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  enableHapticFeedback?: boolean;
}

export interface TouchGestureState {
  isPressed: boolean;
  isLongPress: boolean;
  startTime: number;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  velocity: { x: number; y: number };
}

const DEFAULT_CONFIG = {
  swipeThreshold: 50,
  longPressDelay: 500,
  enableHapticFeedback: true
};

/**
 * Custom hook for handling touch gestures on mobile devices
 * Supports swipe, tap, double tap, long press, and pinch gestures
 */
export function useTouchGestures(config: TouchGestureConfig) {
  const elementRef = useRef<HTMLElement>(null);
  const gestureState = useRef<TouchGestureState>({
    isPressed: false,
    isLongPress: false,
    startTime: 0,
    startPosition: { x: 0, y: 0 },
    currentPosition: { x: 0, y: 0 },
    velocity: { x: 0, y: 0 }
  });

  const lastTapTime = useRef(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const pinchTouches = useRef<{ [key: number]: Touch }>({});

  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  const triggerHapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (finalConfig.enableHapticFeedback && 'vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [30, 10, 30]
      };
      navigator.vibrate(patterns[type]);
    }
  }, [finalConfig.enableHapticFeedback]);

  const calculateDistance = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const calculateAngle = useCallback((start: { x: number; y: number }, end: { x: number; y: number }) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  }, []);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;

    gestureState.current = {
      isPressed: true,
      isLongPress: false,
      startTime: Date.now(),
      startPosition: { x: touch.clientX, y: touch.clientY },
      currentPosition: { x: touch.clientX, y: touch.clientY },
      velocity: { x: 0, y: 0 }
    };

    // Handle pinch start
    if (event.touches.length === 2) {
      pinchTouches.current = {
        [event.touches[0].identifier]: event.touches[0],
        [event.touches[1].identifier]: event.touches[1]
      };
    }

    // Set up long press timer
    longPressTimer.current = setTimeout(() => {
      gestureState.current.isLongPress = true;
      triggerHapticFeedback('medium');
      config.onLongPress?.(event);
    }, finalConfig.longPressDelay);

  }, [config, finalConfig.longPressDelay, triggerHapticFeedback]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!gestureState.current.isPressed) return;

    const touch = event.touches[0];
    if (!touch) return;

    gestureState.current.currentPosition = { x: touch.clientX, y: touch.clientY };

    // Clear long press timer if moved
    if (longPressTimer.current && !gestureState.current.isLongPress) {
      const distance = calculateDistance(
        gestureState.current.startPosition,
        gestureState.current.currentPosition
      );

      if (distance > 10) { // 10px threshold for movement
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
    }

    // Handle pinch move
    if (event.touches.length === 2 && config.onPinch) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      const startTouch1 = pinchTouches.current[touch1.identifier];
      const startTouch2 = pinchTouches.current[touch2.identifier];

      if (startTouch1 && startTouch2) {
        const startDistance = calculateDistance(
          { x: startTouch1.clientX, y: startTouch1.clientY },
          { x: startTouch2.clientX, y: startTouch2.clientY }
        );

        const currentDistance = calculateDistance(
          { x: touch1.clientX, y: touch1.clientY },
          { x: touch2.clientX, y: touch2.clientY }
        );

        const scale = currentDistance / startDistance;
        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2
        };

        config.onPinch(scale, center);
      }
    }

  }, [config, calculateDistance]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!gestureState.current.isPressed) return;

    // Clear timers
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    const endTime = Date.now();
    const duration = endTime - gestureState.current.startTime;
    const distance = calculateDistance(
      gestureState.current.startPosition,
      gestureState.current.currentPosition
    );

    // Handle tap gestures
    if (distance < 10 && duration < 300 && !gestureState.current.isLongPress) {
      const currentTime = Date.now();
      const timeSinceLastTap = currentTime - lastTapTime.current;

      if (timeSinceLastTap < 300) {
        // Double tap
        triggerHapticFeedback('light');
        config.onDoubleTap?.(event);
        lastTapTime.current = 0;
      } else {
        // Single tap
        triggerHapticFeedback('light');
        config.onTap?.(event);
        lastTapTime.current = currentTime;
      }
    }

    // Handle swipe gestures
    if (distance > finalConfig.swipeThreshold && duration < 500) {
      const angle = calculateAngle(
        gestureState.current.startPosition,
        gestureState.current.currentPosition
      );

      // Determine swipe direction
      if (angle >= -45 && angle <= 45) {
        // Right swipe
        triggerHapticFeedback('light');
        config.onSwipeRight?.();
      } else if (angle >= 135 || angle <= -135) {
        // Left swipe
        triggerHapticFeedback('light');
        config.onSwipeLeft?.();
      } else if (angle > 45 && angle < 135) {
        // Down swipe
        triggerHapticFeedback('light');
        config.onSwipeDown?.();
      } else if (angle < -45 && angle > -135) {
        // Up swipe
        triggerHapticFeedback('light');
        config.onSwipeUp?.();
      }
    }

    // Reset state
    gestureState.current.isPressed = false;
    gestureState.current.isLongPress = false;
    pinchTouches.current = {};

  }, [config, finalConfig.swipeThreshold, calculateDistance, calculateAngle, triggerHapticFeedback]);

  const handleTouchCancel = useCallback(() => {
    // Clear timers and reset state
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    gestureState.current.isPressed = false;
    gestureState.current.isLongPress = false;
    pinchTouches.current = {};
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Add touch event listeners
    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: false });
    element.addEventListener('touchcancel', handleTouchCancel, { passive: false });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      element.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, handleTouchCancel]);

  return {
    ref: elementRef,
    isPressed: gestureState.current.isPressed,
    isLongPress: gestureState.current.isLongPress
  };
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void>, threshold: number = 80) {
  const elementRef = useRef<HTMLElement>(null);
  const isRefreshing = useRef(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (isRefreshing.current) return;
    startY.current = event.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (isRefreshing.current) return;

    currentY.current = event.touches[0].clientY;
    const pullDistance = currentY.current - startY.current;

    if (pullDistance > threshold) {
      event.preventDefault();
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async (event: TouchEvent) => {
    if (isRefreshing.current) return;

    const pullDistance = currentY.current - startY.current;

    if (pullDistance > threshold) {
      isRefreshing.current = true;
      try {
        await onRefresh();
      } finally {
        isRefreshing.current = false;
      }
    }
  }, [threshold, onRefresh]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ref: elementRef,
    isRefreshing: isRefreshing.current,
    pullDistance: Math.max(0, currentY.current - startY.current)
  };
}

/**
 * Hook for swipeable list items
 */
export function useSwipeableItem(
  onSwipeLeft?: () => void,
  onSwipeRight?: () => void,
  threshold: number = 50
) {
  const elementRef = useRef<HTMLElement>(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);

  const handleTouchStart = useCallback((event: TouchEvent) => {
    startX.current = event.touches[0].clientX;
    isSwiping.current = false;
  }, []);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isSwiping.current) {
      currentX.current = event.touches[0].clientX;
      const deltaX = Math.abs(currentX.current - startX.current);

      if (deltaX > 10) { // Start swiping after 10px movement
        isSwiping.current = true;
      }
    }
  }, []);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isSwiping.current) return;

    const deltaX = currentX.current - startX.current;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }

    isSwiping.current = false;
  }, [threshold, onSwipeLeft, onSwipeRight]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { ref: elementRef };
}

export default useTouchGestures;