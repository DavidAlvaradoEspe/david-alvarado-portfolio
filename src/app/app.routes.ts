import { Routes } from '@angular/router';
import { MapPuzzleComponent } from './pages/map-puzzle/map-puzzle';
import {HolographicRoomComponent} from './pages/holographic-room/holographic-room';
import { puzzleLockedGuard, puzzleUnlockedGuard, rootRedirectGuard } from './@core/guards';

export const routes: Routes = [
  {
    path: '',
    canActivate: [rootRedirectGuard],
    children: []
  },
  {
    path: 'treasure-map',
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
    canActivate: [rootRedirectGuard],
    children: []
  }
];
