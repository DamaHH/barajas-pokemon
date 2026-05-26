import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: 'auth', loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent) },
  { path: 'home', loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent) },
  { path: 'lobby', loadComponent: () => import('./pages/lobby/lobby.component').then(m => m.LobbyComponent) },
  { path: 'game', loadComponent: () => import('./pages/game-board/game-board.component').then(m => m.GameBoardComponent) },
  { path: 'gacha', loadComponent: () => import('./pages/gacha/gacha.component').then(m => m.GachaComponent) },
  { path: 'collection', loadComponent: () => import('./pages/collection/collection.component').then(m => m.CollectionComponent) },
  { path: 'deck-builder', loadComponent: () => import('./pages/deck-builder/deck-builder.component').then(m => m.DeckBuilderComponent) },
  { path: 'history', loadComponent: () => import('./pages/history/history.component').then(m => m.HistoryComponent) },
  { path: '**', redirectTo: 'auth' }
];
