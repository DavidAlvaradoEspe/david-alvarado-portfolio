import { Routes } from '@angular/router';
import { puzzleLockedGuard, puzzleUnlockedGuard } from './@core/guards';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/language-select/language-select.component').then(m => m.LanguageSelectComponent),
    title: 'David Alvarado - Select Language',
    canActivate: [puzzleLockedGuard]
  },
  {
    path: 'select-language',
    loadComponent: () => import('./pages/language-select/language-select.component').then(m => m.LanguageSelectComponent),
    title: 'David Alvarado - Select Language',
    canActivate: [puzzleLockedGuard]
  },
  {
    path: 'map-puzzle',
    loadComponent: () => import('./pages/map-puzzle/map-puzzle').then(m => m.MapPuzzleComponent),
    title: 'David Alvarado - Map Puzzle',
    canActivate: [puzzleLockedGuard]
  },
  {
    path: 'holographic-room',
    loadComponent: () => import('./pages/holographic-room/holographic-room').then(m => m.HolographicRoomComponent),
    title: 'David Alvarado - Holographic Room',
    canActivate: [puzzleUnlockedGuard]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
