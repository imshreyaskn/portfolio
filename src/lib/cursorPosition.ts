// src/lib/cursorPosition.ts
// Allocation-free shared cursor state. CustomCursor writes, GravityDust reads.
// Replaces the (window as any).customCursorPos global with a typed module singleton.
export const cursorPosition = { x: 0, y: 0, active: false };

export const setCursorPosition = (x: number, y: number, active: boolean): void => {
  cursorPosition.x = x;
  cursorPosition.y = y;
  cursorPosition.active = active;
};
