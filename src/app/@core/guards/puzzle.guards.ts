import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PuzzleStore } from '../store/puzzle.store';

/**
 * Guard to prevent access to holographic-room if puzzle is not unlocked
 */
export const puzzleUnlockedGuard: CanActivateFn = () => {
  const store = inject(PuzzleStore);
  const router = inject(Router);

  if (store.isUnlocked()) {
    return true;
  }

  router.navigate(['/select-language']).catch();
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

  router.navigate(['/holographic-room']).catch();
  return false;
};

