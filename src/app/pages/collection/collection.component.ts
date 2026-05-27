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
          <p style="color: var(--pokedex-steel-light); margin-bottom: 1.5rem;">Aún no has capturado ningún Pokémon. Abre sobres de cartas en la tienda para conseguir tus primeros ejemplares.</p>
          <a routerLink="/gacha" class="btn-royal-gold" style="text-decoration: none; display: inline-block; background: linear-gradient(135deg, var(--pokedex-purple) 0%, #6b00bd 100%); border-color: #df9cff; color: #fff;" (click)="playClick()">Ir a la Tienda</a>
        </div>

        <div *ngIf="loading" style="text-align: center; padding: 4rem;">
          <h3 class="royal-title text-gold" style="animation: pulse 1s infinite; color: var(--pokedex-cyan);">Accediendo a la Base de Datos...</h3>
        </div>

        <!-- Grillas de cartas coleccionadas por rarezas -->
        <div *ngIf="!loading && cards.length > 0" style="margin-top: 1rem;">
          
          <div *ngFor="let rat of ['Legendaria', 'Épica', 'Rara', 'Infrecuente', 'Común']">
            <div *ngIf="getCardsByRarity(rat).length > 0" style="margin-bottom: 3.5rem;">
              
              <h2 class="rarity-header" [ngClass]="'title-' + rat.toLowerCase()">
                <span *ngIf="rat === 'Legendaria'">👑</span>
                <span *ngIf="rat === 'Épica'">💎</span>
                <span *ngIf="rat === 'Rara'">✨</span>
                <span *ngIf="rat === 'Infrecuente'">🌀</span>
                <span *ngIf="rat === 'Común'">🍃</span>
                Ediciones {{ rat === 'Común' ? 'Comunes' : (rat === 'Infrecuente' ? 'Infrecuentes' : rat + 's') }} ({{ getCardsByRarity(rat).length }})
              </h2>

              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 2.5rem; justify-items: center;">
                <div *ngFor="let card of getCardsByRarity(rat)" class="card-wrapper-ygo">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="[card.rarity ? (card.rarity.toLowerCase() + '-card') : 'common-card', 'type-' + (card.types[0]?.toLowerCase() || 'normal')]">
                      
                      <!-- Header -->
                      <div class="card-header-ygo" style="display: flex; flex-direction: column; align-items: flex-start; width: 100%; border-bottom: 2px solid var(--poke-dark); padding-bottom: 4px; gap: 2px;">
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                          <div class="card-name-ygo" style="font-weight: 900; font-size: 0.95rem;">{{ card.name }}</div>
                          <span *ngIf="card.level && card.level > 1" style="background: var(--poke-dark); color: #fff; font-size: 0.6rem; font-weight: 900; padding: 1px 4px; border-radius: 4px; font-family: monospace;">N.{{ card.level }}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                          <span class="rarity-badge" [ngClass]="'badge-' + (card.rarity || 'Común').toLowerCase()">{{ card.rarity || 'Común' }}</span>
                          <span style="font-size: 0.65rem;">⭐</span>
                        </div>
                      </div>

                      <!-- Image with Poké-Dex Tech border -->
                      <div class="card-image-ygo">
                        <img [src]="card.image" alt="Pokémon" style="filter: drop-shadow(0 0 5px rgba(255,255,255,0.25));">
                      </div>

                      <!-- Description -->
                      <div class="card-description-ygo" style="height: 48px; overflow-y: auto; padding: 2px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                        {{ card.description }}
                      </div>

                      <!-- Stats with numeric HP -->
                      <div class="card-stats-ygo" style="display: flex; flex-direction: column; gap: 2px; align-items: center;">
                        <div style="display: flex; gap: 12px; justify-content: center; font-weight: 900;">
                          <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                          <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
                        </div>
                        <span style="color: #16a34a; font-weight: 900; font-size: 0.8rem;">HP: {{ card.hp }}</span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .rarity-header {
      font-family: var(--font-title);
      font-weight: 900;
      font-size: 1.4rem;
      margin-top: 2.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .title-legendaria {
      color: #fbbf24;
      border-bottom: 3px solid #fbbf24;
      text-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
    }
    .title-épica {
      color: #c084fc;
      border-bottom: 3px solid #c084fc;
      text-shadow: 0 0 10px rgba(192, 132, 252, 0.4);
    }
    .title-rara {
      color: #22d3ee;
      border-bottom: 3px solid #22d3ee;
      text-shadow: 0 0 10px rgba(34, 211, 238, 0.4);
    }
    .title-infrecuente {
      color: #60a5fa;
      border-bottom: 3px solid #60a5fa;
    }
    .title-común {
      color: #94a3b8;
      border-bottom: 3px solid #94a3b8;
    }

    .legendaria-card {
      border: 4px solid #fbbf24 !important;
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.5), 6px 6px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
    }
    .épica-card {
      border: 4px solid #c084fc !important;
      box-shadow: 0 0 15px rgba(192, 132, 252, 0.5), 6px 6px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%) !important;
    }
    .rara-card {
      border: 4px solid #22d3ee !important;
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.4), 6px 6px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%) !important;
    }
    .infrecuente-card {
      border: 3px solid #60a5fa !important;
      box-shadow: 4px 4px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
    }
    .común-card {
      border: 3px solid #94a3b8 !important;
      box-shadow: 4px 4px 0px var(--poke-dark) !important;
    }
    .rarity-badge {
      font-size: 0.55rem;
      font-weight: 900;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      color: #fff;
      font-family: var(--font-title);
      box-shadow: 1px 1px 0px #000;
    }
    .badge-legendaria { background: #fbbf24; color: #000; }
    .badge-épica { background: #c084fc; }
    .badge-rara { background: #22d3ee; color: #000; }
    .badge-infrecuente { background: #60a5fa; }
    .badge-común { background: #94a3b8; }
  `]
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

  getCardsByRarity(rarity: string): PokemonCard[] {
    return this.cards.filter(c => (c.rarity || 'Común').toLowerCase() === rarity.toLowerCase());
  }

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
