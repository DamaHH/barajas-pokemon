import { Component, inject, OnInit, PLATFORM_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InventoryService } from '../../core/services/inventory/inventory.service';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { PokemonCard } from '../../core/services/pokeapi/pokeapi.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-deck-builder',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; padding: 2rem; background: radial-gradient(circle at center, #0f172a 0%, #05070a 100%); position: relative; overflow-x: hidden;">
      
      <!-- Holographic Grid Overlay -->
      <div class="royal-pattern"></div>

      <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column;">
        
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 1rem;">
          <div style="display: flex; gap: 1rem; align-items: center;">
            <a routerLink="/home" class="btn" (click)="playClick()">Volver al Mando</a>
            <button class="btn" (click)="toggleMute()" style="padding: 0.35rem 0.75rem; border-color: rgba(0,240,255,0.2);">
              {{ isMuted ? '🔇 Mutear' : '🔊 Silenciar' }}
            </button>
          </div>
          <h1 class="royal-title text-gold" style="margin: 0; font-size: 2.2rem; color: var(--pokedex-cyan); text-shadow: 0 0 10px var(--pokedex-cyan-glow);">Terminal de Forja de Mazo</h1>
          <button class="btn-royal-gold" [disabled]="deck.length !== 5 || saving" (click)="saveDeck()" style="font-size: 0.9rem; padding: 0.5rem 1.5rem;">
            {{ saving ? 'Sincronizando...' : 'Guardar Mazo (5/5)' }}
          </button>
        </header>

        <div style="display: grid; grid-template-columns: 1fr 1.3fr; gap: 2rem;">
          
          <!-- Lado Izquierdo: Mazo Activo (Exactly 5 cards) -->
          <div class="altar-panel" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-color: var(--pokedex-cyan);">
            <h2 class="royal-title text-gold" style="font-size: 1.2rem; text-align: center; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 0.5rem; margin-bottom: 1rem; color: var(--pokedex-cyan);">
              Mazo Seleccionado ({{ deck.length }} / 5)
            </h2>
            
            <div *ngIf="deck.length === 0" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 250px; border: 1px dashed rgba(0, 240, 255, 0.2); border-radius: 8px; color: var(--pokedex-steel-light);">
              <div style="font-size: 2.5rem; margin-bottom: 1rem;">🛡️</div>
              <p style="font-style: italic; text-align: center; font-size: 0.9rem; padding: 0 1rem;">Mazo vacío. Haz clic en las tarjetas de tu base de datos a la derecha para equipar 5 Pokémon.</p>
            </div>

            <!-- Listado horizontal/vertical de cartas en el mazo -->
            <div *ngIf="deck.length > 0" style="display: flex; flex-wrap: wrap; gap: 1rem; justify-content: center;">
              <div *ngFor="let card of deck; let idx = index" (click)="removeFromDeck(idx)" class="card-wrapper-ygo" style="cursor: pointer;">
                <div class="card-ygo">
                  <div class="card-face card-face-front" [ngClass]="'type-' + (card.types[0]?.toLowerCase() || 'normal')">
                    
                    <div class="card-header-ygo">
                      <div class="card-name-ygo">{{ card.name }}</div>
                      <div class="card-stars-ygo">
                        <span style="background: var(--pokedex-cyan); color: #000; font-size: 0.65rem; font-weight: 900; padding: 2px 5px; border-radius: 4px; font-family: monospace;">N.{{ card.level || 1 }}</span>
                      </div>
                    </div>

                    <div class="card-image-ygo">
                      <img [src]="card.image" alt="Pokémon">
                    </div>

                    <div class="card-description-ygo">
                      {{ card.description }}
                    </div>

                    <div class="card-stats-ygo">
                      <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                      <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            
            <div *ngIf="deck.length > 0 && deck.length < 5" style="color: var(--pokedex-red); font-size: 0.8rem; text-align: center; font-style: italic; font-weight: bold; margin-top: 1rem; text-shadow: 0 0 5px var(--pokedex-red-glow);">
              * Se requieren exactamente 5 cartas para poder combatir *
            </div>
          </div>

          <!-- Lado Derecho: Colección completa para elegir -->
          <div class="altar-panel" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-color: rgba(0, 240, 255, 0.2);">
            <h2 class="royal-title text-gold" style="font-size: 1.2rem; text-align: center; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 0.5rem; margin-bottom: 1rem; color: #fff;">
              Base de Datos Disponible
            </h2>

            <div *ngIf="collection.length === 0" style="text-align: center; padding: 4rem; color: var(--pokedex-steel-light);">
              <p>No se detectan Pokémon registrados. Escanea la Hierba Alta para capturar.</p>
            </div>

            <!-- Scrollable list of cards in collection -->
            <div *ngIf="collection.length > 0" style="max-height: 70vh; overflow-y: auto; display: flex; flex-wrap: wrap; gap: 1.5rem; justify-content: center; padding: 0.5rem;">
              <div *ngFor="let card of collection" (click)="addToDeck(card)" 
                   class="card-wrapper-ygo" style="cursor: pointer; transition: all 0.3s;"
                   [style.opacity]="isInDeck(card) ? 0.25 : 1"
                   [style.pointer-events]="isInDeck(card) ? 'none' : 'auto'">
                
                <div class="card-ygo">
                  <div class="card-face card-face-front" [ngClass]="'type-' + (card.types[0]?.toLowerCase() || 'normal')">
                    
                    <div class="card-header-ygo">
                      <div class="card-name-ygo">{{ card.name }}</div>
                      <div class="card-stars-ygo">
                        <span style="background: var(--pokedex-cyan); color: #000; font-size: 0.65rem; font-weight: 900; padding: 2px 5px; border-radius: 4px; font-family: monospace;">N.{{ card.level || 1 }}</span>
                      </div>
                    </div>

                    <div class="card-image-ygo">
                      <img [src]="card.image" alt="Pokémon">
                    </div>

                    <div class="card-description-ygo">
                      {{ card.description }}
                    </div>

                    <div class="card-stats-ygo">
                      <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                      <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
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
})
export class DeckBuilderComponent implements OnInit {
  collection: PokemonCard[] = [];
  deck: PokemonCard[] = [];
  saving = false;
  isMuted = false;

  private inventoryService = inject(InventoryService);
  private supabase = inject(SupabaseService);
  private audioService = inject(AudioService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    if (!this.isBrowser) return;

    this.isMuted = this.audioService.muted;
    this.cdr.detectChanges();

    try {
      const inv = await this.inventoryService.getInventory();
      this.collection = inv.cartas || [];
      this.cdr.detectChanges();

      // Cargar mazo guardado
      const { data: userAuth } = await this.supabase.auth.getUser();
      if (userAuth.user) {
        const { data, error } = await this.supabase.client
          .from('mazos')
          .select('cartas')
          .eq('id_usuario', userAuth.user.id)
          .limit(1);

        if (!error && data && data.length > 0 && data[0].cartas) {
          const savedDeck: any[] = data[0].cartas;
          // Sincronizar niveles y estadísticas actuales con el inventario
          this.deck = savedDeck.map(savedCard => {
            const current = this.collection.find(c => c.name.toLowerCase() === savedCard.name.toLowerCase());
            return current ? { ...current } : savedCard;
          });
        }
      }
      this.cdr.detectChanges();
    } catch(e) {
      console.error("Error loading deck configuration:", e);
    }
  }

  playClick() {
    this.audioService.playClick();
  }

  toggleMute() {
    this.isMuted = this.audioService.toggleMute();
    this.cdr.detectChanges();
  }

  isInDeck(card: PokemonCard): boolean {
    return this.deck.some(c => c.name.toLowerCase() === card.name.toLowerCase());
  }

  addToDeck(card: PokemonCard) {
    if (this.deck.length >= 5) {
      alert("Tu mazo ya posee el límite de 5 combatientes.");
      return;
    }
    if (this.isInDeck(card)) return;

    this.audioService.playClick();
    this.deck.push({ ...card });
    this.cdr.detectChanges();
  }

  removeFromDeck(index: number) {
    this.audioService.playClick();
    this.deck.splice(index, 1);
    this.cdr.detectChanges();
  }

  async saveDeck() {
    if (this.deck.length !== 5) return;
    this.audioService.playClick();
    this.saving = true;
    this.cdr.detectChanges();

    try {
      const { data: userAuth } = await this.supabase.auth.getUser();
      if (!userAuth.user) throw new Error("No autenticado");

      // Consultar si ya existe una entrada para este usuario para decidir entre insert o update
      const { data: existing, error: checkError } = await this.supabase.client
        .from('mazos')
        .select('id_usuario')
        .eq('id_usuario', userAuth.user.id)
        .limit(1);

      if (checkError) throw checkError;

      let dbError;
      if (existing && existing.length > 0) {
        // Si ya existe, actualizamos
        const { error } = await this.supabase.client
          .from('mazos')
          .update({ cartas: this.deck })
          .eq('id_usuario', userAuth.user.id);
        dbError = error;
      } else {
        // Si no existe, insertamos
        const { error } = await this.supabase.client
          .from('mazos')
          .insert({
            id_usuario: userAuth.user.id,
            cartas: this.deck
          });
        dbError = error;
      }

      if (dbError) throw dbError;
      
      this.audioService.playSynthSound('victory');
      alert("¡Tu mazo ha sido sincronizado exitosamente en la base de datos!");
    } catch (e: any) {
      console.error(e);
      alert("Error al guardar mazo: " + e.message);
    } finally {
      this.saving = false;
      this.cdr.detectChanges();
    }
  }
}
