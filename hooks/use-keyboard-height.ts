"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Hook to detect virtual keyboard height on mobile devices.
 * Uses the Visual Viewport API to track when the keyboard appears/disappears.
 *
 * @returns {object} Keyboard state including height and visibility
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const handleResize = useCallback(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    // Calculate the difference between window height and visual viewport height
    // This difference represents the virtual keyboard height on mobile
    const heightDiff = window.innerHeight - window.visualViewport.height;

    // Only consider it a keyboard if the difference is significant (> 100px)
    // This helps filter out minor browser UI changes
    const isOpen = heightDiff > 100;

    setKeyboardHeight(isOpen ? heightDiff : 0);
    setIsKeyboardOpen(isOpen);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) {
      return;
    }

    // Initial check - delayed to avoid cascading renders
    const initialCheckTimeout = setTimeout(handleResize, 0);

    // Listen for viewport changes (keyboard show/hide)
    window.visualViewport.addEventListener("resize", handleResize);
    window.visualViewport.addEventListener("scroll", handleResize);

    return () => {
      clearTimeout(initialCheckTimeout);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.visualViewport?.removeEventListener("scroll", handleResize);
    };
  }, [handleResize]);

  return {
    keyboardHeight,
    isKeyboardOpen,
  };
}

export default useKeyboardHeight;
