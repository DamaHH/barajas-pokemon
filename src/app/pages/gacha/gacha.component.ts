import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService, Inventory } from '../../core/services/inventory/inventory.service';
import { PokemonCard } from '../../core/services/pokeapi/pokeapi.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-gacha',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; padding: 2rem; background: #cbd5e1; position: relative; overflow-x: hidden; display: flex; flex-direction: column; align-items: center;">
      
      <!-- Decorative background lines -->
      <div class="royal-pattern"></div>

      <div style="position: relative; z-index: 2; width: 100%; max-width: 1000px; display: flex; flex-direction: column; align-items: center; flex: 1;">
        
        <!-- Header -->
        <header class="altar-panel" style="width: 100%; padding: 1.25rem 2rem; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; background: #ffffff;">
          <div style="display: flex; gap: 1rem; align-items: center;">
            <a routerLink="/home" class="btn" (click)="playClick()" style="border-color: var(--poke-dark); font-weight: bold;">
              ⬅️ Volver al Menú
            </a>
            <button class="btn" (click)="toggleMute()" style="border-color: var(--poke-dark); font-weight: bold;">
              {{ isMuted ? '🔇 Muto' : '🔊 Sonido' }}
            </button>
          </div>
          <h1 class="royal-title" style="margin: 0; font-size: 1.8rem; color: var(--poke-blue); text-shadow: 2px 2px 0px var(--poke-yellow);">
            Safari de Captura
          </h1>
          <div style="font-family: var(--font-title); font-size: 0.95rem; font-weight: bold; color: var(--poke-dark); display: flex; align-items: center; gap: 0.5rem;">
            🪙 PokéCoins: <span style="font-size: 1.25rem; font-weight: 900; color: #d97706;">{{ inv?.recargas || 0 }}</span>
          </div>
        </header>

        <!-- Main section -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; width: 100%;">
          
          <!-- STATE 0: TALL GRASS SELECTION -->
          <div *ngIf="openingState === 0" style="width: 100%; text-align: center;">
            
            <div class="altar-panel" style="padding: 2rem; max-width: 750px; margin: 0 auto 2rem auto; background: #ffffff;">
              <h2 class="royal-title" style="font-size: 1.4rem; color: var(--poke-dark); margin-bottom: 0.5rem;">
                Zona de Hierba Alta
              </h2>
              <p style="color: #64748b; font-size: 0.85rem; font-weight: 600; max-width: 550px; margin: 0 auto 1.5rem auto; line-height: 1.5;">
                Selecciona uno de los matorrales para enviar a tu Pokémon a buscar especímenes salvajes. Capturarás un lote de 5 cartas usando tus cargas de Safari.
              </p>
              
              <!-- Energy Gauge Pokéball Style -->
              <div style="max-width: 400px; margin: 0 auto; padding: 1rem; background: var(--poke-gray-bg); border: 3px solid var(--poke-dark); border-radius: 12px; box-shadow: 3px 3px 0 var(--poke-dark);">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 900; color: var(--poke-dark); margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <span>Cargas de Safari</span>
                  <span>{{ inv?.sobres_disponibles || 0 }} / 3 Disponibles</span>
                </div>
                <div class="pokeball-gauge" style="height: 16px; border-radius: 8px;">
                  <div class="pokeball-gauge-fill" [style.width]="((inv?.sobres_disponibles || 0) / 3 * 100) + '%'"></div>
                </div>
              </div>
            </div>

            <!-- Three Interactive Grass Patches (Safari Grid) -->
            <div class="safari-field">
              
              <!-- Matorral A -->
              <div class="grass-patch" 
                   [class.shaking]="shakingPatch === 'A'"
                   (click)="seleccionarMatorral('A')">
                <span class="grass-emoji">🌾</span>
                <span class="grass-label">Matorral Pradera</span>
              </div>

              <!-- Matorral B -->
              <div class="grass-patch" 
                   [class.shaking]="shakingPatch === 'B'"
                   (click)="seleccionarMatorral('B')">
                <span class="grass-emoji">🌿</span>
                <span class="grass-label">Matorral Espeso</span>
              </div>

              <!-- Matorral C -->
              <div class="grass-patch" 
                   [class.shaking]="shakingPatch === 'C'"
                   (click)="seleccionarMatorral('C')">
                <span class="grass-emoji">🌾</span>
                <span class="grass-label">Matorral Rocoso</span>
              </div>

            </div>

            <!-- Recharge Shop panel -->
            <div class="altar-panel" style="padding: 1.25rem 2rem; max-width: 500px; margin: 0 auto; background: #ffffff; display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
              <span style="font-size: 0.8rem; font-weight: bold; color: #64748b; text-align: left;">
                ¿Sin cargas de Safari? Recarga una celda de energía para seguir buscando.
              </span>
              <button class="btn-royal-gold" 
                      [disabled]="(inv?.recargas || 0) < 100 || (inv?.sobres_disponibles || 0) >= 3 || loading"
                      (click)="comprarCarga()" 
                      style="font-size: 0.8rem; padding: 0.5rem 1rem; white-space: nowrap;">
                🔌 Recargar (100 Coins)
              </button>
            </div>

          </div>

          <!-- STATE 1: SHAKING & RUSTLING IN GRASS (Loading/Catching) -->
          <div *ngIf="openingState === 1" style="text-align: center; padding: 3rem 1rem;">
            
            <div style="position: relative; width: 180px; height: 180px; margin: 0 auto 2.5rem auto; display: flex; align-items: center; justify-content: center;">
              <!-- Large shaking grass bush -->
              <div class="shaking" style="font-size: 8rem; filter: drop-shadow(4px 4px 0px rgba(0,0,0,0.1));">
                {{ shakingPatch === 'B' ? '🌿' : '🌾' }}
              </div>
              
              <!-- Floating Pokéballs flying around -->
              <div class="poke-ball-fly" style="position: absolute; font-size: 2rem; animation: orbit 1.5s infinite linear;">🔴</div>
            </div>

            <h2 class="royal-title" style="font-size: 1.6rem; animation: pulse 0.8s infinite alternate; color: var(--poke-blue); text-shadow: 2px 2px 0px var(--poke-yellow);">
              ¡Buscando en la hierba...!
            </h2>
            <p style="color: #64748b; font-weight: bold; font-style: italic; margin-top: 0.5rem; font-size: 0.9rem;">
              Sacudiendo las hojas y lanzando Safari Balls...
            </p>
          </div>

          <!-- STATE 2: CAPTURED POKÉMON REVEALED -->
          <div *ngIf="openingState === 2" style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2rem;">
            
            <h2 class="royal-title" style="font-size: 1.6rem; color: var(--poke-blue); text-shadow: 2px 2px 0px var(--poke-yellow);">
              🎉 ¡Pokémon Registrados en el Poké-Dex!
            </h2>

            <!-- Grid of 5 Captured Cards -->
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; width: 100%;">
              <div *ngFor="let card of openedCards; let i = index" class="card-wrapper-ygo draw-animation" [style.animation-delay]="(i * 180) + 'ms'">
                <div class="card-ygo">
                  <div class="card-face card-face-front" [ngClass]="'type-' + (card.types[0]?.toLowerCase() || 'normal')">
                    
                    <!-- Header -->
                    <div class="card-header-ygo">
                      <div class="card-name-ygo">{{ card.name }}</div>
                      <div class="card-stars-ygo">
                        <span *ngIf="card.level && card.level > 1" style="background: var(--poke-dark); color: #ffffff; font-size: 0.6rem; font-weight: bold; padding: 1px 4px; border-radius: 4px; font-family: monospace;">N.{{ card.level }}</span>
                        <span *ngIf="!card.level || card.level === 1">⭐</span>
                      </div>
                    </div>

                    <!-- Image -->
                    <div class="card-image-ygo">
                      <img [src]="card.image" alt="Pokémon">
                    </div>

                    <!-- Description -->
                    <div class="card-description-ygo">
                      {{ card.description }}
                    </div>

                    <!-- Stats -->
                    <div class="card-stats-ygo">
                      <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                      <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Confirmation Action Panel -->
            <div class="altar-panel" style="padding: 1.5rem 3rem; text-align: center; background: #ffffff; width: 100%; max-width: 500px;">
              <h3 style="font-family: var(--font-title); font-weight: 900; color: var(--poke-dark); margin-bottom: 0.5rem; text-transform: uppercase;">
                Captura Completada
              </h3>
              <p style="color: #64748b; font-size: 0.85rem; font-weight: bold;">
                Los 5 Pokémon han sido incorporados a tu colección activa.
              </p>
              <button class="btn-royal-gold" (click)="resetGacha()" style="margin-top: 1.25rem; font-size: 0.9rem; padding: 0.6rem 2.5rem;">
                Volver a Buscar 🌾
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes orbit {
      0% { transform: rotate(0deg) translateX(70px) rotate(0deg); }
      100% { transform: rotate(360deg) translateX(70px) rotate(-360deg); }
    }
    @keyframes pulse {
      0% { transform: scale(0.98); }
      100% { transform: scale(1.02); }
    }
  `]
})
export class GachaComponent implements OnInit {
  inv: Inventory | null = null;
  openedCards: PokemonCard[] = [];
  openingState = 0; // 0 = default, 1 = scanning, 2 = revealed
  shakingPatch = ''; // 'A' | 'B' | 'C'
  loading = false;
  isMuted = false;

  private inventoryService = inject(InventoryService);
  private audioService = inject(AudioService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  async ngOnInit() {
    if (!this.isBrowser) return;
    this.isMuted = this.audioService.muted;
    await this.loadInventory();
  }

  toggleMute() {
    this.isMuted = this.audioService.toggleMute();
    this.cdr.detectChanges();
  }

  async loadInventory() {
    this.loading = true;
    try {
      this.inv = await this.inventoryService.getInventory();
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

  async seleccionarMatorral(patch: 'A' | 'B' | 'C') {
    if (!this.inv || this.inv.sobres_disponibles <= 0 || this.openingState !== 0) return;
    
    this.shakingPatch = patch;
    this.openingState = 1;
    this.audioService.playClick();
    this.cdr.detectChanges();

    // Play shaking sounds or grass rustle
    this.audioService.playSynthSound('draw');

    try {
      this.openedCards = await this.inventoryService.openPack();
      
      // Simulate searching the bush (2.2 seconds)
      setTimeout(() => {
        this.audioService.playSynthSound('summon');
        this.openingState = 2;
        this.shakingPatch = '';
        this.loadInventory(); // Reload in background
        this.cdr.detectChanges();
      }, 2200);

    } catch (e) {
      console.error(e);
      alert("Error al explorar el matorral: " + (e as Error).message);
      this.openingState = 0;
      this.shakingPatch = '';
      this.cdr.detectChanges();
    }
  }

  async comprarCarga() {
    if (!this.inv || this.inv.recargas < 100 || this.inv.sobres_disponibles >= 3) return;
    this.audioService.playClick();
    this.loading = true;

    try {
      await this.inventoryService.buyPackWithCoins();
      await this.loadInventory();
      alert("🔌 Carga de Safari recargada correctamente.");
    } catch(e: any) {
      alert("Error al recargar: " + e.message);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  resetGacha() {
    this.audioService.playClick();
    this.openedCards = [];
    this.openingState = 0;
    this.shakingPatch = '';
    this.cdr.detectChanges();
  }
}
