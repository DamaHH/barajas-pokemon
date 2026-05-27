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
            Tienda de Sobres
          </h1>
          <div style="font-family: var(--font-title); font-size: 0.95rem; font-weight: bold; color: var(--poke-dark); display: flex; align-items: center; gap: 0.5rem;">
            🪙 PokéCoins: <span style="font-size: 1.25rem; font-weight: 900; color: #d97706;">{{ inv?.recargas || 0 }}</span>
          </div>
        </header>

        <!-- Main section -->
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; width: 100%;">
          
          <!-- STATE 0: BOOSTER PACK SELECTION -->
          <div *ngIf="openingState === 0" style="width: 100%; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 1.5rem;">
            
            <div class="altar-panel" style="padding: 1.5rem; max-width: 750px; width: 100%; background: #ffffff;">
              <h2 class="royal-title" style="font-size: 1.4rem; color: var(--poke-dark); margin-bottom: 0.5rem;">
                Adquirir Nuevas Cartas
              </h2>
              <p style="color: #64748b; font-size: 0.85rem; font-weight: 600; max-width: 550px; margin: 0 auto 1rem auto; line-height: 1.5;">
                Abre sobres de expansión para obtener un lote de 5 cartas Pokémon para tu colección. Puedes usar tus sobres disponibles o comprar nuevos con PokéCoins.
              </p>
              
              <!-- Energy Gauge Pokéball Style -->
              <div style="max-width: 400px; margin: 0 auto; padding: 0.75rem 1rem; background: var(--poke-gray-bg); border: 3px solid var(--poke-dark); border-radius: 12px; box-shadow: 3px 3px 0 var(--poke-dark);">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 900; color: var(--poke-dark); margin-bottom: 0.25rem; text-transform: uppercase; letter-spacing: 0.5px;">
                  <span>Sobres Disponibles</span>
                  <span>{{ inv?.sobres_disponibles || 0 }} Disponibles</span>
                </div>
                <div class="pokeball-gauge" style="height: 14px; border-radius: 7px; border: 2px solid var(--poke-dark); background: #e2e8f0; overflow: hidden; position: relative;">
                  <div class="pokeball-gauge-fill" [style.width]="((inv?.sobres_disponibles || 0) > 0 ? 100 : 0) + '%'" style="height: 100%; background: linear-gradient(90deg, var(--poke-red) 0%, #ef4444 100%); transition: width 0.3s ease;"></div>
                </div>
              </div>
            </div>

            <!-- Beautiful Booster Pack Card -->
            <div class="booster-pack-card" (click)="abrirSobre()">
              <div class="booster-pack-shine"></div>
              <div class="booster-pack-logo">POKÉMON DUELS</div>
              <div class="booster-pack-art-container">
                <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" class="booster-pack-art" alt="Charizard Pack Art">
              </div>
              <div class="booster-pack-footer">SOBRE DE EXPANSIÓN</div>
            </div>

            <!-- Action buttons -->
            <div style="display: flex; flex-direction: column; gap: 0.75rem; align-items: center; width: 100%; max-width: 450px;">
              <button class="btn-royal-gold" 
                      [disabled]="(inv?.sobres_disponibles || 0) <= 0 || loading"
                      (click)="abrirSobre()" 
                      style="font-size: 1.1rem; padding: 0.75rem 3rem; width: 100%; box-shadow: 4px 4px 0 var(--poke-dark);">
                🔓 Abrir Sobre ({{ inv?.sobres_disponibles || 0 }} en stock)
              </button>

              <button class="btn-royal-crimson" 
                      [disabled]="(inv?.recargas || 0) < 100 || loading"
                      (click)="comprarSobre()" 
                      style="font-size: 1rem; padding: 0.6rem 2rem; width: 100%; background: var(--poke-red); border-color: var(--poke-dark); box-shadow: 4px 4px 0 var(--poke-dark);">
                🪙 Comprar Sobre (100 Coins)
              </button>
            </div>

          </div>

          <!-- STATE 1: BOOSTER PACK OPENING ANIMATION -->
          <div *ngIf="openingState === 1" style="text-align: center; padding: 3rem 1rem;">
            
            <div style="position: relative; width: 240px; height: 360px; margin: 0 auto 2.5rem auto; display: flex; align-items: center; justify-content: center;">
              <!-- Large shaking card pack -->
              <div class="booster-pack-card shaking" style="cursor: default; pointer-events: none;">
                <div class="booster-pack-logo">ABRIENDO...</div>
                <div class="booster-pack-art-container">
                  <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" class="booster-pack-art" alt="Charizard Pack Art" style="animation: none;">
                </div>
                <div class="booster-pack-footer">¡LOTE DE 5 CARTAS!</div>
              </div>
            </div>

            <h2 class="royal-title" style="font-size: 1.6rem; animation: pulse 0.8s infinite alternate; color: var(--poke-blue); text-shadow: 2px 2px 0px var(--poke-yellow);">
              ¡Abriendo sobre de cartas...!
            </h2>
            <p style="color: #64748b; font-weight: bold; font-style: italic; margin-top: 0.5rem; font-size: 0.9rem;">
              Desgarrando el empaque de aluminio y revelando Pokémon...
            </p>
          </div>

          <!-- STATE 2: CAPTURED POKÉMON REVEALED -->
          <div *ngIf="openingState === 2" style="width: 100%; display: flex; flex-direction: column; align-items: center; gap: 2rem;">
            
            <h2 class="royal-title" style="font-size: 1.6rem; color: var(--poke-blue); text-shadow: 2px 2px 0px var(--poke-yellow);">
              🎉 ¡Pokémon Obtenidos en tu Sobre!
            </h2>

            <!-- Grid of 5 Captured Cards -->
            <div style="display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; width: 100%;">
              <div *ngFor="let card of openedCards; let i = index" class="card-wrapper-ygo draw-animation" [style.animation-delay]="(i * 180) + 'ms'">
                <div class="card-ygo">
                  <div class="card-face card-face-front" [ngClass]="['type-' + (card.types[0]?.toLowerCase() || 'normal'), card.rarity ? (card.rarity.toLowerCase() + '-card') : 'common-card']">
                    
                    <!-- Header -->
                    <div class="card-header-ygo" style="display: flex; flex-direction: column; align-items: flex-start; width: 100%; border-bottom: 2px solid var(--poke-dark); padding-bottom: 4px; gap: 2px;">
                      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <div class="card-name-ygo" style="font-weight: 900; font-size: 0.95rem;">{{ card.name }}</div>
                        <span *ngIf="card.level && card.level > 1" style="background: var(--poke-dark); color: #ffffff; font-size: 0.6rem; font-weight: bold; padding: 1px 4px; border-radius: 4px; font-family: monospace;">N.{{ card.level }}</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                        <span class="rarity-badge" [ngClass]="'badge-' + (card.rarity || 'Común').toLowerCase()">{{ card.rarity || 'Común' }}</span>
                        <span style="font-size: 0.65rem;">⭐</span>
                      </div>
                    </div>

                    <!-- Image -->
                    <div class="card-image-ygo">
                      <img [src]="card.image" alt="Pokémon">
                    </div>

                    <!-- Description -->
                    <div class="card-description-ygo" style="height: 48px; overflow-y: auto; padding: 2px; border-bottom: 1px solid rgba(0,0,0,0.1);">
                      {{ card.description }}
                    </div>

                    <!-- Stats with numeric HP -->
                    <div class="card-stats-ygo" style="display: flex; flex-direction: column; gap: 2px; align-items: center; padding-top: 4px;">
                      <div style="display: flex; gap: 12px; justify-content: center; font-weight: 900;">
                        <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                        <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
                      </div>
                      <span style="color: #16a34a; font-weight: 900; font-size: 0.75rem;">HP: {{ card.hp }}</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <!-- Confirmation Action Panel -->
            <div class="altar-panel" style="padding: 1.5rem 3rem; text-align: center; background: #ffffff; width: 100%; max-width: 500px;">
              <h3 style="font-family: var(--font-title); font-weight: 900; color: var(--poke-dark); margin-bottom: 0.5rem; text-transform: uppercase;">
                Sobre Abierto
              </h3>
              <p style="color: #64748b; font-size: 0.85rem; font-weight: bold;">
                Las 5 cartas han sido incorporadas a tu colección activa.
              </p>
              <button class="btn-royal-gold" (click)="resetGacha()" style="margin-top: 1.25rem; font-size: 0.9rem; padding: 0.6rem 2.5rem;">
                Volver a la Tienda 📦
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .booster-pack-card {
      width: 240px;
      height: 360px;
      background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%);
      border: 6px solid #f59e0b;
      border-radius: 16px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3), 0 0 0 3px #000;
      position: relative;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: space-between;
      padding: 1.5rem 1rem;
    }
    .booster-pack-card:hover {
      transform: translateY(-10px) scale(1.05);
      box-shadow: 0 15px 35px rgba(59, 130, 246, 0.4), 0 0 0 3px #000;
    }
    .booster-pack-shine {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: linear-gradient(
        45deg,
        rgba(255,255,255,0) 0%,
        rgba(255,255,255,0) 40%,
        rgba(255,255,255,0.3) 50%,
        rgba(255,255,255,0) 60%,
        rgba(255,255,255,0) 100%
      );
      animation: shine 3s infinite linear;
    }
    @keyframes shine {
      0% { transform: translate(-30%, -30%) rotate(0deg); }
      100% { transform: translate(30%, 30%) rotate(0deg); }
    }
    .booster-pack-logo {
      font-family: var(--font-title);
      font-weight: 900;
      color: #fff;
      font-size: 1.2rem;
      text-shadow: 2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0px 4px 6px rgba(0,0,0,0.5);
      letter-spacing: 1px;
    }
    .booster-pack-art-container {
      width: 160px;
      height: 160px;
      background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.4) 100%);
      border-radius: 50%;
      border: 3px solid #f59e0b;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      box-shadow: inset 0 0 15px rgba(0,0,0,0.6);
    }
    .booster-pack-art {
      width: 140px;
      height: 140px;
      object-fit: contain;
      filter: drop-shadow(0 5px 10px rgba(0,0,0,0.5));
      animation: float 4s ease-in-out infinite;
    }
    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    .booster-pack-footer {
      font-family: var(--font-title);
      font-weight: bold;
      color: #f59e0b;
      font-size: 0.8rem;
      text-shadow: 1px 1px 0 #000;
      letter-spacing: 2px;
      background: #000;
      padding: 0.25rem 1rem;
      border-radius: 20px;
      border: 2px solid #f59e0b;
    }

    /* Rarity card colors */
    .legendaria-card {
      border: 4px solid #fbbf24 !important;
      box-shadow: 0 0 15px rgba(251, 191, 36, 0.5), 4px 4px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%) !important;
    }
    .épica-card {
      border: 4px solid #c084fc !important;
      box-shadow: 0 0 15px rgba(192, 132, 252, 0.5), 4px 4px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%) !important;
    }
    .rara-card {
      border: 4px solid #22d3ee !important;
      box-shadow: 0 0 12px rgba(34, 211, 238, 0.4), 4px 4px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #ecfeff 0%, #cffafe 100%) !important;
    }
    .infrecuente-card {
      border: 3px solid #60a5fa !important;
      box-shadow: 4px 4px 0px var(--poke-dark) !important;
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%) !important;
    }
    .common-card {
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

    .shaking {
      animation: shake 0.5s infinite;
    }
    @keyframes shake {
      0% { transform: translate(1px, 1px) rotate(0deg); }
      10% { transform: translate(-1px, -2px) rotate(-1deg); }
      20% { transform: translate(-3px, 0px) rotate(1deg); }
      30% { transform: translate(0px, 2px) rotate(0deg); }
      40% { transform: translate(1px, -1px) rotate(1deg); }
      50% { transform: translate(-1px, 2px) rotate(-1deg); }
      60% { transform: translate(-3px, 1px) rotate(0deg); }
      75% { transform: translate(2px, 1px) rotate(-1deg); }
      90% { transform: translate(-1px, -1px) rotate(1deg); }
      100% { transform: translate(1px, -2px) rotate(0deg); }
    }
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

  async abrirSobre() {
    if (!this.inv || this.inv.sobres_disponibles <= 0 || this.openingState !== 0) return;
    
    this.openingState = 1;
    this.audioService.playClick();
    this.audioService.resume(); // Ensure AudioContext is active
    this.cdr.detectChanges();

    // Sound of pack rip/card slide
    this.audioService.playSynthSound('draw');

    try {
      this.openedCards = await this.inventoryService.openPack();
      
      // Simulate opening (2.2 seconds)
      setTimeout(() => {
        this.audioService.playSynthSound('summon');
        this.openingState = 2;
        this.loadInventory(); // Reload in background
        this.cdr.detectChanges();
      }, 2200);

    } catch (e) {
      console.error(e);
      alert("Error al abrir el sobre: " + (e as Error).message);
      this.openingState = 0;
      this.cdr.detectChanges();
    }
  }

  async comprarSobre() {
    if (!this.inv || this.inv.recargas < 100) return;
    this.audioService.playClick();
    this.audioService.resume(); // Ensure AudioContext is active
    this.loading = true;

    try {
      await this.inventoryService.buyPackWithCoins();
      await this.loadInventory();
      alert("📦 Sobre comprado con éxito.");
    } catch(e: any) {
      alert("Error al comprar: " + e.message);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  resetGacha() {
    this.audioService.playClick();
    this.audioService.resume(); // Ensure AudioContext is active
    this.openedCards = [];
    this.openingState = 0;
    this.cdr.detectChanges();
  }
}
