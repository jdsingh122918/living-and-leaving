"use client";

import { useCallback, useRef } from "react";

export interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onMouseLeave: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export interface UseLongPressOptions {
  /** Duration in milliseconds before triggering long press (default: 500) */
  delay?: number;
  /** Optional callback for regular click/tap */
  onClick?: () => void;
}

/**
 * Hook to detect long-press gestures on touch and mouse devices.
 *
 * @param onLongPress - Callback fired when long-press is detected
 * @param options - Configuration options
 * @returns Event handlers to spread on the target element
 */
export function useLongPress(
  onLongPress: () => void,
  options: UseLongPressOptions = {}
): LongPressHandlers {
  const { delay = 500, onClick } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const longPressTriggeredRef = useRef(false);

  const start = useCallback(() => {
    longPressTriggeredRef.current = false;

    timeoutRef.current = setTimeout(() => {
      longPressTriggeredRef.current = true;
      onLongPress();
    }, delay);
  }, [delay, onLongPress]);

  const clear = useCallback(
    (shouldTriggerClick: boolean = true) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If long press wasn't triggered and we should trigger click, do it
      if (shouldTriggerClick && !longPressTriggeredRef.current && onClick) {
        onClick();
      }
    },
    [onClick]
  );

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Only trigger on left click
      if (e.button === 0) {
        start();
      }
    },
    [start]
  );

  const onMouseUp = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 0) {
        clear(true);
      }
    },
    [clear]
  );

  const onMouseLeave = useCallback(() => {
    clear(false);
  }, [clear]);

  const onTouchStart = useCallback(() => {
    start();
  }, [start]);

  const onTouchEnd = useCallback(() => {
    clear(true);
  }, [clear]);

  return {
    onMouseDown,
    onMouseUp,
    onMouseLeave,
    onTouchStart,
    onTouchEnd,
  };
}

export default useLongPress;
