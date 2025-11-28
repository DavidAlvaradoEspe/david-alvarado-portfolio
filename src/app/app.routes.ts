import { Routes } from '@angular/router';
import { MapPuzzleComponent } from './pages/map-puzzle/map-puzzle';
import { HolographicRoomComponent } from './pages/holographic-room/holographic-room';
import { puzzleLockedGuard, puzzleUnlockedGuard } from './@core/guards';
import {LanguageSelectComponent} from '@app/pages/language-select/language-select.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/language-select/language-select.component').then(m => m.LanguageSelectComponent),
    title: 'David Alvarado - Select Language'
  },
  {
    path: 'select-language',
    component: LanguageSelectComponent,
    title: 'David Alvarado - Select Language'
  },
  {
    path: 'map-puzzle',
    component: MapPuzzleComponent,
    title: 'David Alvarado - Map Puzzle',
    canActivate: [puzzleLockedGuard]
  },
  {
    path: 'holographic-room',
    component: HolographicRoomComponent,
    title: 'David Alvarado - Holographic Room',
    canActivate: [puzzleUnlockedGuard]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
