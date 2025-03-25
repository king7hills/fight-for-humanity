import { useState, useEffect, useCallback, useRef } from 'react';

// Movement control keys
const KEYS = {
  // Movement
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  
  // Actions
  Space: 'jump',
  ShiftLeft: 'sprint',
  ShiftRight: 'sprint',
  KeyR: 'reload',
  
  // Mouse buttons (handled separately)
  // 0: left mouse button (shoot)
  // 2: right mouse button (aim)
};

type MovementState = {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  reload: boolean;
  shoot: boolean;
  aim: boolean;
};

/**
 * Custom hook for handling keyboard and mouse input for player movement
 */
export const useKeyboardControls = () => {
  const [movement, setMovement] = useState<MovementState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    reload: false,
    shoot: false,
    aim: false,
  });

  // Use ref to prevent infinite updates
  const mountedRef = useRef(false);

  // Track key states to prevent stuck keys
  const keyStates = useCallback(() => {
    const keyMap = new Map<string, boolean>();
    return {
      set: (code: string, value: boolean) => keyMap.set(code, value),
      get: (code: string) => keyMap.get(code) || false
    };
  }, [])();

  useEffect(() => {
    // Only reset keys once on mount
    if (!mountedRef.current) {
      console.log("Initializing key states");
      mountedRef.current = true;
      // No need to call setMovement here since we already set the default state above
    }
    
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if key is already pressed (prevents repeats)
      if (keyStates.get(e.code)) return;
      
      // Mark key as pressed
      keyStates.set(e.code, true);
      
      // @ts-expect-error - KEYS type is string-indexed but TypeScript doesn't infer the right type
      const action = KEYS[e.code];
      if (action) {
        console.log(`Key down: ${e.code} -> ${action}`);
        setMovement((state) => ({
          ...state,
          [action]: true,
        }));
        
        // Prevent default browser behaviors for game controls
        // Preventing space scrolling, etc.
        if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          e.preventDefault();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Mark key as released
      keyStates.set(e.code, false);
      
      // @ts-expect-error - KEYS type is string-indexed but TypeScript doesn't infer the right type
      const action = KEYS[e.code];
      if (action) {
        console.log(`Key up: ${e.code} -> ${action}`);
        setMovement((state) => ({
          ...state,
          [action]: false,
        }));
      }
    };
    
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        setMovement((state) => ({
          ...state,
          shoot: true,
        }));
      } else if (e.button === 2) { // Right click
        setMovement((state) => ({
          ...state,
          aim: true,
        }));
      }
    };
    
    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) { // Left click
        setMovement((state) => ({
          ...state,
          shoot: false,
        }));
      } else if (e.button === 2) { // Right click
        setMovement((state) => ({
          ...state,
          aim: false,
        }));
      }
    };
    
    // Handle blur event to reset all keys when window loses focus
    const handleBlur = () => {
      // Reset all key states without calling setState repeatedly
      Object.keys(KEYS).forEach(key => {
        keyStates.set(key, false);
      });
      
      // Single state update instead of multiple
      setMovement({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        sprint: false,
        reload: false,
        shoot: false,
        aim: false,
      });
      console.log("All keys reset on blur");
    };
    
    // Prevent context menu on right click
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Add event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('blur', handleBlur);

    // Clean up event listeners
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('blur', handleBlur);
    };
  }, [keyStates]);

  return movement;
}; 