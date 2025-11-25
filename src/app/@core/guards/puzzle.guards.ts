import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PuzzleStore } from '../store/puzzle.store';

/**
 * Guard for root route - redirects based on puzzle state
 */
export const rootRedirectGuard: CanActivateFn = () => {
  const store = inject(PuzzleStore);
  const router = inject(Router);

  // Redirect to holographic-room if puzzle is already unlocked
  if (store.isUnlocked()) {
    router.navigate(['/holographic-room']);
    return false;
  }

  // Otherwise redirect to map-puzzle
  router.navigate(['/treasure-map']);
  return false;
};

/**
 * Guard to prevent access to holographic-room if puzzle is not unlocked
 */
export const puzzleUnlockedGuard: CanActivateFn = () => {
  const store = inject(PuzzleStore);
  const router = inject(Router);

  if (store.isUnlocked()) {
    return true;
  }

  // Redirect to map-puzzle if not unlocked
  router.navigate(['/map-puzzle']);
  return false;
};

/**
 * Guard to prevent access to map-puzzle if puzzle is already unlocked
 */
export const puzzleLockedGuard: CanActivateFn = () => {
  const store = inject(PuzzleStore);
  const router = inject(Router);

  if (!store.isUnlocked()) {
    return true;
  }

  // Redirect to holographic-room if already unlocked
  router.navigate(['/holographic-room']);
  return false;
};

