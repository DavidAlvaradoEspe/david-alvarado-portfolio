import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'puzzle-state';

interface PuzzleStateStorage {
  isUnlocked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PuzzleStore {
  // Signals for state
  private readonly _isUnlocked = signal<boolean>(this.loadFromStorage().isUnlocked);
  private readonly _isLoading = signal<boolean>(true);

  // Public readonly signals
  public readonly isUnlocked = this._isUnlocked.asReadonly();
  public readonly isLoading = this._isLoading.asReadonly();

  // Load state from localStorage
  private loadFromStorage(): PuzzleStateStorage {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load puzzle state from localStorage', e);
    }
    return { isUnlocked: false };
  }

  // Save state to localStorage
  private saveToStorage(): void {
    try {
      const state: PuzzleStateStorage = {
        isUnlocked: this._isUnlocked()
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save puzzle state to localStorage', e);
    }
  }

  // Methods to update state
  unlockPuzzle(): void {
    this._isUnlocked.set(true);
    this.saveToStorage();
  }

  lockPuzzle(): void {
    this._isUnlocked.set(false);
    this.saveToStorage();
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  reset(): void {
    this._isUnlocked.set(false);
    this._isLoading.set(true);
    this.saveToStorage();
  }
}

