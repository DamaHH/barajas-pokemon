import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../core/services/inventory/inventory.service';
import { PokemonCard } from '../../core/services/pokeapi/pokeapi.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-collection',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; padding: 2rem; background: radial-gradient(circle at center, #0f172a 0%, #05070a 100%); position: relative; overflow-x: hidden;">
      
      <!-- Holographic Grid Overlay -->
      <div class="royal-pattern"></div>

      <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto;">
        
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 1rem;">
          <a routerLink="/home" class="btn" (click)="playClick()">Volver al Mando</a>
          <h1 class="royal-title text-gold" style="margin: 0; font-size: 2.2rem; color: var(--pokedex-cyan); text-shadow: 0 0 10px var(--pokedex-cyan-glow);">Base de Datos Poké-Dex</h1>
          <div style="font-family: var(--font-title); font-size: 0.95rem; color: #fff; display: flex; align-items: center; gap: 1rem;">
            <button class="btn" (click)="toggleMute()" style="padding: 0.35rem 0.75rem; border-color: rgba(0,240,255,0.2);">
              {{ isMuted ? '🔇 Mutear' : '🔊 Silenciar' }}
            </button>
            <div>
              Registrados: <span style="font-size: 1.3rem; font-weight: bold; color: var(--pokedex-green); text-shadow: 0 0 5px var(--pokedex-green-glow);">{{ cards.length }}</span> Pokémon
            </div>
          </div>
        </header>

        <!-- Mensaje si no tiene cartas -->
        <div *ngIf="cards.length === 0 && !loading" class="altar-panel" style="padding: 4rem; text-align: center; max-width: 600px; margin: 2rem auto; border-color: var(--pokedex-purple);">
          <div style="font-size: 3rem; margin-bottom: 1rem;">📱</div>
          <h3 class="royal-title text-gold" style="font-size: 1.2rem; margin-bottom: 1rem; color: var(--pokedex-purple);">Registro de Datos Vacío</h3>
          <p style="color: var(--pokedex-steel-light); margin-bottom: 1.5rem;">Aún no has capturado ningún Pokémon. Escanea la Hierba Alta para registrar tus primeros ejemplares.</p>
          <a routerLink="/gacha" class="btn-royal-gold" style="text-decoration: none; display: inline-block; background: linear-gradient(135deg, var(--pokedex-purple) 0%, #6b00bd 100%); border-color: #df9cff; color: #fff;" (click)="playClick()">Ir al Safari</a>
        </div>

        <div *ngIf="loading" style="text-align: center; padding: 4rem;">
          <h3 class="royal-title text-gold" style="animation: pulse 1s infinite; color: var(--pokedex-cyan);">Accediendo a la Base de Datos...</h3>
        </div>

        <!-- Grilla de cartas coleccionadas (Holographic Tech Cards) -->
        <div *ngIf="!loading && cards.length > 0" 
             style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 2rem; justify-items: center; margin-top: 1rem;">
          
          <div *ngFor="let card of cards" class="card-wrapper-ygo">
            <div class="card-ygo" style="transform: none;">
              <div class="card-face card-face-front" [ngClass]="'type-' + (card.types[0]?.toLowerCase() || 'normal')">
                
                <!-- Header -->
                <div class="card-header-ygo" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 6px;">
                  <div class="card-name-ygo" style="font-family: var(--font-title); font-size: 0.85rem; font-weight: bold; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 90px;">{{ card.name }}</div>
                  <div class="card-stars-ygo" style="display: flex; align-items: center;">
                    <span *ngIf="card.level && card.level > 1" style="background: var(--pokedex-cyan); color: #000; font-size: 0.6rem; font-weight: 900; padding: 1px 4px; border-radius: 3px; font-family: monospace;">N.{{ card.level }}</span>
                    <span *ngIf="!card.level || card.level === 1" style="font-size: 0.65rem;">⭐</span>
                  </div>
                </div>

                <!-- Image with Poké-Dex Tech border -->
                <div class="card-image-ygo" style="width: 100%; height: 100px; background: rgba(0,0,0,0.4); border-radius: 6px; border: 1px solid rgba(0,240,255,0.1); display: flex; align-items: center; justify-content: center; overflow: hidden; margin-bottom: 6px; position: relative;">
                  <img [src]="card.image" alt="Pokémon" style="max-width: 90%; max-height: 90%; object-fit: contain; filter: drop-shadow(0 0 5px rgba(255,255,255,0.25));">
                </div>

                <!-- Description -->
                <div class="card-description-ygo" style="font-size: 0.55rem; color: #94a3b8; height: 35px; overflow-y: auto; line-height: 1.3; margin-bottom: 6px; padding: 2px;">
                  {{ card.description }}
                </div>

                <!-- Stats with neon bars -->
                <div class="card-stats-ygo" style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 4px; display: flex; justify-content: space-between; font-size: 0.65rem; font-family: monospace; font-weight: bold; color: var(--pokedex-cyan);">
                  <span>ATK: {{ card.attack }}</span>
                  <span style="color: var(--pokedex-green);">DEF: {{ card.defense }}</span>
                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class CollectionComponent implements OnInit {
  cards: PokemonCard[] = [];
  loading = true;
  isMuted = false;

  private inventoryService = inject(InventoryService);
  private audioService = inject(AudioService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    if (!this.isBrowser) {
      this.loading = false;
      return;
    }
    this.isMuted = this.audioService.muted;
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const inv = await this.inventoryService.getInventory();
      this.cards = inv.cartas || [];
      this.cdr.detectChanges();
    } catch(e) {
      console.error(e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  playClick() {
    this.audioService.playClick();
  }

  toggleMute() {
    this.isMuted = this.audioService.toggleMute();
    this.cdr.detectChanges();
  }
}
