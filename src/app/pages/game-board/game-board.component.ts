import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { SqliteService } from '../../core/services/sqlite/sqlite.service';
import { AudioService } from '../../core/services/audio/audio.service';
import { InventoryService } from '../../core/services/inventory/inventory.service';
import { PokemonCard, PokeapiService } from '../../core/services/pokeapi/pokeapi.service';

export interface FieldSlot {
  card: PokemonCard;
  position: 'ATK' | 'DEF';
  hasAttacked: boolean;
  abilityUsed: boolean;
  currentHp: number;
  currentAtk: number;
  currentDef: number;
}

@Component({
  selector: 'app-game-board',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="coliseum-bg">
      <div class="royal-pattern"></div>

      <!-- MAIN LOADER -->
      <div *ngIf="loading" class="fullscreen-overlay">
        <div class="altar-panel loader-panel" style="background: #ffffff; border-color: var(--poke-dark);">
          <h2 class="royal-title pulse-anim" style="color: var(--poke-blue); font-weight: 900;">Alineando Arena...</h2>
          <p class="loader-status" style="color: #64748b; font-weight: bold;">{{ loaderStatus }}</p>
          <div class="spinner-gold"></div>
          <button *ngIf="onlineMode" (click)="exitDuel()" class="btn btn-pink" style="margin-top: 2rem; font-weight: bold;">Desistir del Duelo</button>
        </div>
      </div>

      <!-- GAME OVER SCREEN -->
      <div *ngIf="duelEnded" class="fullscreen-overlay" style="z-index: 1000;">
        <div class="altar-panel result-panel animate-zoom" 
             [style.border-color]="isWinner ? 'var(--pokedex-green)' : 'var(--poke-red)'"
             style="background: #ffffff; padding: 2.5rem; max-width: 480px; width: 100%;">
          
          <h1 class="royal-title" style="font-size: 2.5rem; margin-bottom: 0.5rem; color: var(--poke-blue); text-shadow: 2px 2px 0 var(--poke-yellow);">
            {{ isWinner ? '¡VICTORIA!' : 'DERROTA' }}
          </h1>
          <p style="font-size: 1rem; color: #64748b; font-weight: bold; font-style: italic; margin-bottom: 1.5rem;">
            {{ duelEndReason }}
          </p>
          
          <div class="rewards-boxAltar" *ngIf="isWinner && !rewardProcessed" style="background: #f0fdf4; border: 3px solid var(--poke-dark); box-shadow: 3px 3px 0 var(--poke-dark); border-radius: 12px; margin-bottom: 1.5rem; padding: 1rem;">
            <h3 style="font-family: var(--font-title); font-weight: 900; color: #16a34a; margin-bottom: 0.25rem; text-transform: uppercase;">Recompensas Obtenidas</h3>
            <p style="font-weight: bold;">+{{ recargasEarned }} PokéCoins de Oro</p>
            <p *ngIf="packEarned" class="pulse-anim" style="color: var(--poke-blue); font-weight: 900;">¡Boleto de Safari Adicional Desbloqueado!</p>
          </div>

          <button (click)="exitDuel()" class="btn-royal-gold" style="font-size: 1.1rem; padding: 0.75rem 3rem;">
            Regresar al Menú
          </button>
        </div>
      </div>

      <!-- BATTLEFIELD STAGE -->
      <div class="battlefield-container" *ngIf="!loading">
        
        <!-- LEFT MAIN BOARD AREA -->
        <main class="board-layout">
          
          <!-- OPPONENT PORTRAIT & LIFEBAR -->
          <header class="player-hud opponent-hud" 
                  [class.can-be-targeted-direct]="isDeclaringAttack() && !enemyField[0] && !enemyField[1]"
                  (click)="tryDirectAttack()"
                  style="cursor: pointer; transition: all 0.3s; background: #ffffff;">
            <div class="hud-avatar" style="background: #ffebeb; border-color: var(--poke-red);">👹</div>
            <div class="hud-details">
              <div class="hud-name text-crimson" style="color: var(--poke-red); font-weight: 900;">{{ enemyUsername }}</div>
              <div class="hud-lp-container" style="border-color: var(--poke-dark);">
                <div class="hud-lp-bar" [style.width]="(enemyLp / 4000 * 100) + '%'"></div>
                <div class="hud-lp-value">{{ enemyLp }} / 4000 LP</div>
              </div>
              <div class="hud-sub" style="font-weight: bold;">
                <span>Mazo: {{ enemyDeck.length }} cartas</span> | <span>Cementerio: {{ enemyGraveyard.length }}</span>
                <span *ngIf="isDeclaringAttack() && !enemyField[0] && !enemyField[1]" class="blink-text" style="color: var(--poke-red); font-weight: 900; margin-left: 10px;">🎯 ¡CLIC AQUÍ PARA ATAQUE DIRECTO!</span>
              </div>
            </div>
          </header>

          <!-- COMBAT FIELD (ATK slot 0, DEF slot 1) -->
          <div class="combat-field">
            
            <!-- OPPONENT FIELD -->
            <div class="field-row opponent-row">
              
              <!-- Enemy DEF Slot (index 1) -->
              <div class="field-socket" 
                   [class.selected-target]="selectedTargetCard === 1"
                   [class.can-be-targeted]="isDeclaringAttack() && enemyField[1] !== null"
                   (click)="onEnemyFieldClick(1)">
                <span class="socket-label">Defensor Rival (DEF)</span>
                
                <div *ngIf="enemyField[1]" class="card-wrapper-ygo float-animation def-rotated">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (enemyField[1].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ enemyField[1].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ enemyField[1].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo">
                        <img [src]="enemyField[1].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="margin-top: 10px; display: flex; flex-direction: column; gap: 2px; align-items: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; font-weight: 900;">
                          <span>ATK: {{ enemyField[1].currentAtk }}</span>
                          <span style="color: var(--poke-blue);">DEF: {{ enemyField[1].currentDef }}</span>
                        </div>
                        <span style="color: #16a34a; font-weight: 900; font-size: 0.75rem;">HP: {{ enemyField[1].currentHp }} / {{ enemyField[1].card.hp }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(enemyField[1].currentHp / enemyField[1].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">DEF</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!enemyField[1]" style="font-size: 0.75rem; color: #94a3b8; font-weight: bold; font-style: italic;">DEF vacío</div>
              </div>

              <!-- Enemy ATK Slot (index 0) -->
              <div class="field-socket" 
                   [class.selected-target]="selectedTargetCard === 0"
                   [class.can-be-targeted]="isDeclaringAttack() && enemyField[0] !== null && enemyField[1] === null"
                   (click)="onEnemyFieldClick(0)">
                <span class="socket-label">Atacante Rival (ATK)</span>
                
                <div *ngIf="enemyField[0]" class="card-wrapper-ygo float-animation">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (enemyField[0].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ enemyField[0].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ enemyField[0].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo">
                        <img [src]="enemyField[0].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="margin-top: 10px; display: flex; flex-direction: column; gap: 2px; align-items: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; font-weight: 900;">
                          <span>ATK: {{ enemyField[0].currentAtk }}</span>
                          <span style="color: var(--poke-blue);">DEF: {{ enemyField[0].currentDef }}</span>
                        </div>
                        <span style="color: #16a34a; font-weight: 900; font-size: 0.75rem;">HP: {{ enemyField[0].currentHp }} / {{ enemyField[0].card.hp }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(enemyField[0].currentHp / enemyField[0].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">ATK</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!enemyField[0]" style="font-size: 0.75rem; color: #94a3b8; font-weight: bold; font-style: italic;">ATK vacío</div>
              </div>

            </div>

            <!-- CENTRAL INTERACTIVE SECTION (VS and Clickable Draw Deck) -->
            <div class="central-divider" style="padding: 0.75rem 1.5rem;">
              <div class="vs-glow" style="font-size: 0.85rem;">Liga Pokémon</div>
              
              <!-- Mazo de Reserva in middle -->
              <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="padding: 0.5rem 1.25rem; background: var(--poke-gray-bg); border: 3px dashed #cbd5e1; border-radius: 10px; font-size: 0.75rem; font-weight: 900; color: #94a3b8;">
                  🎴 Mazo de Reserva ({{ myDeck.length }})
                </div>
              </div>

              <!-- Help action instructions -->
              <div class="combat-instruction" style="color: var(--poke-dark); font-weight: 800; font-size: 0.75rem;">
                <span *ngIf="isMyTurn && (currentPhase === 'colocacion_player' || currentPhase === 'colocacion_enemy')" style="color: var(--poke-red);">🛡️ Coloca tu ATK/DEF inicial y haz clic en Confirmar Colocación.</span>
                <span *ngIf="isMyTurn && currentPhase === 'batalla' && !myField[0] && !myField[1]">💡 Coloca un Pokémon desde tu banca abajo.</span>
                <span *ngIf="isMyTurn && currentPhase === 'batalla' && myField[0] && !myField[0].hasAttacked">⚔️ Usa los botones directamente en tu carta.</span>
                <span *ngIf="!isMyTurn" style="color: var(--poke-red);">⏳ Turno del oponente: {{ opponentStatusMessage || 'Pensando...' }}</span>
              </div>
            </div>

            <!-- PLAYER FIELD (ATK slot 0, DEF slot 1) -->
            <div class="field-row player-row">
              
              <!-- Player ATK Slot (index 0) -->
              <div class="field-socket"
                   [class.selected-attacker]="selectedFieldCard === 0"
                   [class.empty-summonable]="selectedHandCard && myField[0] === null"
                   (click)="onPlayerFieldClick(0)">
                <span class="socket-label">Mi Atacante (ATK)</span>
                
                <div *ngIf="myField[0]" class="card-wrapper-ygo">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (myField[0].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ myField[0].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ myField[0].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo">
                        <img [src]="myField[0].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="margin-top: 10px; display: flex; flex-direction: column; gap: 2px; align-items: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; font-weight: 900;">
                          <span style="color: var(--poke-red);">ATK: {{ myField[0].currentAtk }}</span>
                          <span style="color: var(--poke-blue);">DEF: {{ myField[0].currentDef }}</span>
                        </div>
                        <span style="color: #16a34a; font-weight: 900; font-size: 0.75rem;">HP: {{ myField[0].currentHp }} / {{ myField[0].card.hp }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(myField[0].currentHp / myField[0].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">ATK</div>

                      <!-- ACTION BUTTONS INTEGRATED DIRECTLY ON CARD FACE -->
                      <div *ngIf="isMyTurn && currentPhase === 'batalla'" style="display: flex; gap: 4px; justify-content: center; margin-top: 8px;" (click)="$event.stopPropagation()">
                        <button *ngIf="!myField[0].hasAttacked" (click)="selectAttacker(0)" class="btn" style="padding: 0.2rem 0.35rem; font-size: 0.6rem; font-weight: bold; border-color: var(--poke-red); box-shadow: 1px 1px 0 #000; background: var(--poke-yellow);">⚔️ Atacar</button>
                      </div>

                    </div>
                  </div>
                </div>
                <div *ngIf="!myField[0]" style="font-size: 0.75rem; color: #94a3b8; font-style: italic; font-weight: bold;">Invocar ATK</div>
              </div>

              <!-- Player DEF Slot (index 1) -->
              <div class="field-socket"
                   [class.selected-attacker]="selectedFieldCard === 1"
                   [class.empty-summonable]="selectedHandCard && myField[1] === null"
                   (click)="onPlayerFieldClick(1)">
                <span class="socket-label">Mi Defensor (DEF)</span>
                
                <div *ngIf="myField[1]" class="card-wrapper-ygo def-rotated">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (myField[1].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ myField[1].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ myField[1].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo">
                        <img [src]="myField[1].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="margin-top: 10px; display: flex; flex-direction: column; gap: 2px; align-items: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; font-weight: 900;">
                          <span style="color: var(--poke-red);">ATK: {{ myField[1].currentAtk }}</span>
                          <span style="color: var(--poke-blue);">DEF: {{ myField[1].currentDef }}</span>
                        </div>
                        <span style="color: #16a34a; font-weight: 900; font-size: 0.75rem;">HP: {{ myField[1].currentHp }} / {{ myField[1].card.hp }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(myField[1].currentHp / myField[1].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">DEF</div>

                      <!-- ACTION BUTTON INTEGRATED DIRECTLY ON DEF CARD FACE -->

                    </div>
                  </div>
                </div>
                <div *ngIf="!myField[1]" style="font-size: 0.75rem; color: #94a3b8; font-style: italic; font-weight: bold;">Invocar DEF</div>
              </div>

            </div>

          </div>

          <!-- PLAYER HUD, LIFEBAR -->
          <footer class="player-hud" style="background: #ffffff;">
            <div class="hud-avatar" style="background: #e0f2fe; border-color: var(--poke-blue);">🧢</div>
            <div class="hud-details">
              <div class="hud-name" style="color: var(--poke-blue); font-weight: 900;">{{ myUsername }}</div>
              <div class="hud-lp-container" style="border-color: var(--poke-dark);">
                <div class="hud-lp-bar" [style.width]="(myLp / 4000 * 100) + '%'" style="background: linear-gradient(90deg, var(--poke-blue) 0%, #60a5fa 100%);"></div>
                <div class="hud-lp-value">{{ myLp }} / 4000 LP</div>
              </div>
              <div class="hud-sub" style="font-weight: bold;">
                <span>Mazo: {{ myDeck.length }} cartas</span> | <span>Cementerio: {{ myGraveyard.length }}</span>
              </div>
            </div>
          </footer>

          <!-- PLAYER BANCA (HAND CARDS) -->
          <section style="background: #ffffff; border: 3px solid var(--poke-dark); box-shadow: 4px 4px 0px var(--poke-dark); border-radius: 18px; padding: 0.5rem 1rem; margin-top: 0.5rem;">
            <div style="font-family: var(--font-title); font-weight: 900; font-size: 0.75rem; color: #64748b; text-transform: uppercase; margin-bottom: 0.25rem;">Tu Banca de Reserva</div>
            <div class="hand-row">
              <div *ngFor="let card of myHand; let idx = index" 
                   class="card-wrapper-ygo hand-card-item animate-draw"
                   [class.selected-hand]="selectedHandCard === card"
                   (click)="selectHandCard(card)">
                <div class="card-ygo">
                  <div class="card-face card-face-front" [ngClass]="'type-' + (card.types[0]?.toLowerCase() || 'normal')">
                    
                    <div class="card-header-ygo">
                      <div class="card-name-ygo">{{ card.name }}</div>
                      <div class="card-stars-ygo">Nv.{{ card.level || 1 }}</div>
                    </div>

                    <div class="card-image-ygo">
                      <img [src]="card.image" alt="Pokémon">
                    </div>

                    <div class="card-stats-ygo" style="margin-top: 15px; display: flex; flex-direction: column; gap: 2px; align-items: center;">
                      <div style="display: flex; gap: 12px; justify-content: center; font-weight: 900;">
                        <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                        <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
                      </div>
                      <span style="color: #16a34a; font-weight: 900; font-size: 0.75rem;">HP: {{ card.hp }}</span>
                    </div>

                    <!-- Quick Summon Buttons inside Selected Banca Card -->
                    <div *ngIf="selectedHandCard === card && isMyTurn && currentPhase === 'batalla'" style="display: flex; gap: 4px; justify-content: center; margin-top: 10px;" (click)="$event.stopPropagation()">
                      <button (click)="quickSummon(card, 0)" [disabled]="myField[0] !== null" class="btn" style="padding: 0.2rem 0.35rem; font-size: 0.55rem; font-weight: bold; border-color: var(--poke-red); box-shadow: 1px 1px 0 #000; background: var(--poke-yellow);">⚔️ ATK</button>
                      <button (click)="quickSummon(card, 1)" [disabled]="myField[1] !== null" class="btn" style="padding: 0.2rem 0.35rem; font-size: 0.55rem; font-weight: bold; border-color: var(--poke-blue); box-shadow: 1px 1px 0 #000;">🛡️ DEF</button>
                    </div>

                  </div>
                </div>
              </div>
              
              <div *ngIf="myHand.length === 0" class="empty-hand-label" style="font-weight: bold; color: #64748b;">
                Banca Vacía (Robarás cuando un Pokémon sea eliminado)
              </div>
            </div>
          </section>

        </main>

        <!-- RIGHT SIDEBAR (Logs & Actions) -->
        <aside class="game-sidebar altar-panel" style="border-radius: 20px;">
          <div style="display: flex; flex-direction: column; gap: 0.5rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
              <h2 class="royal-title" style="font-size: 1.1rem; margin: 0; color: var(--poke-blue);">Estadio</h2>
              <button class="btn" (click)="toggleMute()" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; border-color: var(--poke-dark); font-weight: bold;">
                {{ isMuted ? '🔇 Muto' : '🔊 Sonido' }}
              </button>
            </div>
            <span class="btn" style="align-self: flex-start; padding: 2px 8px; font-size: 0.65rem; font-weight: bold; cursor: default; background: var(--poke-gray-bg);">
              {{ onlineMode ? 'MODO EN LÍNEA' : 'ENTRENAMIENTO: ' + difficulty.toUpperCase() }}
            </span>
          </div>

          <!-- Turn indicator -->
          <div class="action-controls">
            <div class="turn-announcement" [ngClass]="isMyTurn ? 'my-turn-glow' : 'enemy-turn-glow'">
              {{ isMyTurn ? '🚨 ¡TU TURNO! 🚨' : 'TURNO DEL RIVAL' }}
            </div>

            <!-- Confirm placement button -->
            <button *ngIf="isMyTurn && (currentPhase === 'colocacion_player' || currentPhase === 'colocacion_enemy')" (click)="confirmarColocacion()" class="btn-royal-crimson" style="width: 100%; margin-bottom: 0.5rem; font-size: 0.85rem; background: var(--poke-red); border-color: var(--poke-dark);">
              Confirmar Colocación 🚀
            </button>

            <!-- Standby Pass Button (skip turn) -->
            <button *ngIf="isMyTurn && currentPhase === 'batalla'" (click)="forcePassTurn()" class="btn-royal-crimson" style="width: 100%; margin-bottom: 0.5rem; font-size: 0.85rem; background: var(--poke-blue); border-color: var(--poke-dark);">
              Pasar Turno ⏩
            </button>

            <button (click)="surrender()" class="btn btn-pink" style="width: 100%; font-size: 0.8rem; font-weight: bold;">
              Rendirse 🏳️
            </button>
          </div>

          <!-- Logs panel -->
          <div class="battle-logs-panel">
            <h3 class="logs-title" style="font-family: var(--font-title); font-weight: 900; color: var(--poke-dark);">Historial de Turno</h3>
            <div class="logs-scroll">
              <div *ngFor="let log of actionLog" class="log-entry">
                {{ log }}
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  `,
  styles: []
})
export class GameBoardComponent implements OnInit, OnDestroy {
  get isMyTurn(): boolean {
    return this.currentTurn === 'player';
  }
  onlineMode = false;
  matchId = '';
  myRole: 'host' | 'guest' = 'host';
  difficulty: 'facil' | 'medio' | 'dificil' = 'medio';

  loading = true;
  loaderStatus = 'Estableciendo conexión con el estadio...';
  duelEnded = false;
  isWinner = false;
  duelEndReason = '';
  rewardProcessed = false;
  recargasEarned = 0;
  packEarned = false;
  isMuted = false;

  // Game state (Exactly 2 field slots: 0=ATK, 1=DEF)
  myUsername = 'Tú';
  enemyUsername = 'Oponente Virtual';
  myLp = 4000;
  enemyLp = 4000;
  myHand: PokemonCard[] = [];
  enemyHand: PokemonCard[] = [];
  myField: (FieldSlot | null)[] = [null, null];
  enemyField: (FieldSlot | null)[] = [null, null];
  myDeck: PokemonCard[] = [];
  enemyDeck: PokemonCard[] = [];
  myGraveyard: PokemonCard[] = [];
  enemyGraveyard: PokemonCard[] = [];
  myDrawCount = 0;
  enemyDrawCount = 0;
  
  currentTurn: 'player' | 'enemy' = 'player';
  currentPhase: 'colocacion_player' | 'colocacion_enemy' | 'batalla' = 'colocacion_player';
  actionLog: string[] = [];
  opponentStatusMessage = '';

  // Interaction selectors
  selectedHandCard: PokemonCard | null = null;
  selectedFieldCard: number | null = null; // index 0 or 1
  selectedTargetCard: number | null = null;

  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private syncChannel: any = null;
  private myId = '';
  private opponentId = '';
  private winnerId: string | null = null;

  // Services
  private supabase = inject(SupabaseService);
  private sqlite = inject(SqliteService);
  private audioService = inject(AudioService);
  private inventoryService = inject(InventoryService);
  private pokeapi = inject(PokeapiService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);

  constructor() {}

  async ngOnInit() {
    if (!this.isBrowser) return;

    const params = this.route.snapshot.queryParams;
    this.onlineMode = params['online'] === 'true';
    this.matchId = params['matchId'] || '';
    this.myRole = params['role'] || 'host';
    this.difficulty = (params['difficulty'] || 'medio') as 'facil' | 'medio' | 'dificil';

    // Verify auth
    const { data: userAuth } = await this.supabase.auth.getUser();
    if (!userAuth.user) {
      this.router.navigate(['/auth']);
      return;
    }
    this.myId = userAuth.user.id;

    // Load custom profile name
    try {
      const { data: userData } = await this.supabase.client.from('usuarios').select('username').eq('id', this.myId).single();
      this.myUsername = userData?.username || userAuth.user.user_metadata?.['username'] || userAuth.user.email?.split('@')[0] || 'Entrenador';
    } catch (e) {
      this.myUsername = userAuth.user.user_metadata?.['username'] || userAuth.user.email?.split('@')[0] || 'Entrenador';
    }

    this.isMuted = this.audioService.muted;

    if (this.onlineMode) {
      await this.initOnlineDuel();
    } else {
      await this.initOfflineDuel();
    }
  }

  toggleMute() {
    this.isMuted = this.audioService.toggleMute();
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    if (this.syncChannel) {
      this.supabase.client.removeChannel(this.syncChannel);
    }
  }

  // --- GAME INITIALIZATION ---

  private async initOfflineDuel() {
    this.loaderStatus = 'Convocando oponente virtual y barajando mazos...';
    this.currentTurn = 'player';
    this.currentPhase = 'colocacion_player';
    
    // Load player active deck
    try {
      const { data, error } = await this.supabase.client
        .from('mazos')
        .select('cartas')
        .eq('id_usuario', this.myId)
        .limit(1);

      if (!error && data && data.length > 0 && data[0].cartas) {
        this.myDeck = JSON.parse(JSON.stringify(data[0].cartas));
      } else {
        this.myDeck = await this.pokeapi.getRandomPokemonCards(7);
      }
    } catch(e) {
      this.myDeck = await this.pokeapi.getRandomPokemonCards(7);
    }

    // Fill up to 7 cards if needed (using duplicates of chosen cards for fallback)
    if (this.myDeck.length < 7 && this.myDeck.length > 0) {
      const missing = 7 - this.myDeck.length;
      for (let i = 0; i < missing; i++) {
        const randomCard = this.myDeck[Math.floor(Math.random() * this.myDeck.length)];
        this.myDeck.push(JSON.parse(JSON.stringify(randomCard)));
      }
    }

    // AI deck
    this.enemyDeck = this.generateAiDeck();
    this.enemyUsername = `Entrenador Rival (${this.difficulty.toUpperCase()})`;

    // Shuffle
    this.shuffle(this.myDeck);
    this.shuffle(this.enemyDeck);

    // Initial fields empty
    this.myField = [null, null];
    this.enemyField = [null, null];

    // Draw initial 4 cards to hand
    for (let i = 0; i < 4; i++) {
      if (this.myDeck.length > 0) this.myHand.push(this.myDeck.shift()!);
      if (this.enemyDeck.length > 0) this.enemyHand.push(this.enemyDeck.shift()!);
    }

    this.actionLog.push('🏆 ¡El Duelo de Barajas Pokémon ha comenzado!');
    this.actionLog.push('🛡️ Fase de Colocación: Selecciona una carta de tu banca y colócala en ATK y otra en DEF. Luego confirma.');

    this.loading = false;
    this.cdr.detectChanges();
  }

  private async initOnlineDuel() {
    this.loaderStatus = 'Conectando con la sala de combate del estadio...';
    
    this.syncChannel = this.supabase.client.channel(`partida:${this.matchId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'partidas'
      }, (payload: any) => {
        if (payload.new && payload.new.id === this.matchId) {
          this.handleRealtimeUpdate(payload.new);
        }
      })
      .subscribe();

    const { data: match, error } = await this.supabase.client
      .from('partidas')
      .select('*')
      .eq('id', this.matchId)
      .single();

    if (error || !match) {
      alert("Error al cargar la sala de duelo.");
      this.router.navigate(['/lobby']);
      return;
    }

    if (this.myRole === 'host') {
      this.loaderStatus = 'Esperando al contrincante...';
      
      let checkCount = 0;
      const interval = setInterval(async () => {
        checkCount++;
        const { data: updatedMatch } = await this.supabase.client
          .from('partidas')
          .select('*, usuarios!partidas_id_jugador2_fkey(username)')
          .eq('id', this.matchId)
          .single();

        if (updatedMatch && updatedMatch.id_jugador2) {
          clearInterval(interval);
          this.opponentId = updatedMatch.id_jugador2;
          const u2 = updatedMatch.usuarios;
          this.enemyUsername = (Array.isArray(u2) ? u2[0]?.username : u2?.username) || 'Invitado';
          
          this.loaderStatus = 'Sincronizando mazos consagrados...';
          await this.setupInitialOnlineState(updatedMatch);
        }

        if (checkCount > 120) {
          clearInterval(interval);
          alert("El contrincante no se presentó en la arena.");
          this.exitDuel();
        }
      }, 1500);

    } else {
      this.loaderStatus = 'Esperando a que el anfitrión consagre el estado inicial...';
      this.opponentId = match.id_jugador1;
      
      const { data: u1 } = await this.supabase.client.from('usuarios').select('username').eq('id', this.opponentId).single();
      this.enemyUsername = u1?.username || 'Anfitrión';

      if (match.estado === 'en_curso' && Object.keys(match.estado_juego).length > 0) {
        this.applyOnlineState(match.estado_juego);
      }
    }
  }

  // --- ONLINE STATE SYNCING ---

  private async setupInitialOnlineState(match: any) {
    let hDeck: PokemonCard[] = [];
    const { data: hData } = await this.supabase.client.from('mazos').select('cartas').eq('id_usuario', this.myId).single();
    if (hData && hData.cartas) {
      hDeck = JSON.parse(JSON.stringify(hData.cartas));
    } else {
      hDeck = await this.pokeapi.getRandomPokemonCards(7);
    }
    if (hDeck.length < 7 && hDeck.length > 0) {
      const missing = 7 - hDeck.length;
      for (let i = 0; i < missing; i++) {
        const randomCard = hDeck[Math.floor(Math.random() * hDeck.length)];
        hDeck.push(JSON.parse(JSON.stringify(randomCard)));
      }
    }

    let gDeck: PokemonCard[] = [];
    const { data: gData } = await this.supabase.client.from('mazos').select('cartas').eq('id_usuario', this.opponentId).single();
    if (gData && gData.cartas) {
      gDeck = JSON.parse(JSON.stringify(gData.cartas));
    } else {
      gDeck = await this.pokeapi.getRandomPokemonCards(7);
    }
    if (gDeck.length < 7 && gDeck.length > 0) {
      const missing = 7 - gDeck.length;
      for (let i = 0; i < missing; i++) {
        const randomCard = gDeck[Math.floor(Math.random() * gDeck.length)];
        gDeck.push(JSON.parse(JSON.stringify(randomCard)));
      }
    }

    // Shuffle
    this.shuffle(hDeck);
    this.shuffle(gDeck);

    // Initial empty fields and draw 4 cards
    const hHand: PokemonCard[] = [];
    const gHand: PokemonCard[] = [];
    for (let i = 0; i < 4; i++) {
      if (hDeck.length > 0) hHand.push(hDeck.shift()!);
      if (gDeck.length > 0) gHand.push(gDeck.shift()!);
    }

    const state = {
      jugador1_lp: 4000,
      jugador2_lp: 4000,
      jugador1_hand: hHand,
      jugador2_hand: gHand,
      jugador1_field: [null, null],
      jugador2_field: [null, null],
      jugador1_deck: hDeck,
      jugador2_deck: gDeck,
      jugador1_graveyard: [],
      jugador2_graveyard: [],
      jugador1_draw_count: 0,
      jugador2_draw_count: 0,
      turno: 'jugador1',
      fase: 'colocacion_player',
      historial_acciones: ['¡Comienza el duelo de Barajas Pokémon!', 'Coloca tus cartas de Ataque (ATK) y Defensa (DEF) para iniciar el combate.'],
      ganador: null,
      j1_username: this.myUsername,
      j2_username: this.enemyUsername
    };

    const { error } = await this.supabase.client
      .from('partidas')
      .update({
        estado: 'en_curso',
        estado_juego: state
      })
      .eq('id', this.matchId);

    if (error) {
      alert("Error al inicializar la partida: " + error.message);
      this.exitDuel();
    }
  }

  private handleRealtimeUpdate(match: any) {
    if (match.estado === 'finalizada' && match.ganador) {
      const isWinner = match.ganador === this.myId;
      this.finishDuel(isWinner, isWinner ? '¡Has vencido en la arena online!' : 'Tu oponente ha dominado el duelo.');
      return;
    }

    if (match.estado === 'en_curso' && Object.keys(match.estado_juego).length > 0) {
      this.applyOnlineState(match.estado_juego);
    }
  }

  private applyOnlineState(state: any) {
    this.myLp = this.myRole === 'host' ? state.jugador1_lp : state.jugador2_lp;
    this.enemyLp = this.myRole === 'host' ? state.jugador2_lp : state.jugador1_lp;
    
    this.myHand = this.myRole === 'host' ? state.jugador1_hand : state.jugador2_hand;
    this.enemyHand = this.myRole === 'host' ? state.jugador2_hand : state.jugador1_hand;

    this.myField = (this.myRole === 'host' ? state.jugador1_field : state.jugador2_field).slice(0, 2);
    this.enemyField = (this.myRole === 'host' ? state.jugador2_field : state.jugador1_field).slice(0, 2);

    this.myDeck = this.myRole === 'host' ? state.jugador1_deck : state.jugador2_deck;
    this.enemyDeck = this.myRole === 'host' ? state.jugador2_deck : state.jugador1_deck;

    this.myGraveyard = this.myRole === 'host' ? state.jugador1_graveyard : state.jugador2_graveyard;
    this.enemyGraveyard = this.myRole === 'host' ? state.jugador2_graveyard : state.jugador1_graveyard;

    this.myDrawCount = this.myRole === 'host' ? (state.jugador1_draw_count || 0) : (state.jugador2_draw_count || 0);
    this.enemyDrawCount = this.myRole === 'host' ? (state.jugador2_draw_count || 0) : (state.jugador1_draw_count || 0);

    this.currentTurn = (state.turno === 'jugador1' && this.myRole === 'host') || 
                        (state.turno === 'jugador2' && this.myRole === 'guest') ? 'player' : 'enemy';

    this.currentPhase = state.fase;
    this.actionLog = state.historial_acciones;

    this.myUsername = this.myRole === 'host' ? state.j1_username : state.j2_username;
    this.enemyUsername = this.myRole === 'host' ? state.j2_username : state.j1_username;

    // Reset local selection UI
    this.selectedHandCard = null;
    this.selectedFieldCard = null;
    this.selectedTargetCard = null;

    if (this.loading) {
      this.loading = false;
      this.audioService.playSynthSound('victory');
    }

    this.cdr.detectChanges();
    this.scrollLogs();

    this.checkVictoryOfflineOnline();
  }

  private async pushOnlineState(logMessage: string) {
    if (!this.onlineMode) return;

    this.actionLog.push(logMessage);
    this.scrollLogs();

    const isJ1 = this.myRole === 'host';
    
    const state = {
      jugador1_lp: isJ1 ? this.myLp : this.enemyLp,
      jugador2_lp: isJ1 ? this.enemyLp : this.myLp,
      jugador1_hand: isJ1 ? this.myHand : this.enemyHand,
      jugador2_hand: isJ1 ? this.enemyHand : this.myHand,
      jugador1_field: isJ1 ? this.myField : this.enemyField,
      jugador2_field: isJ1 ? this.enemyField : this.myField,
      jugador1_deck: isJ1 ? this.myDeck : this.enemyDeck,
      jugador2_deck: isJ1 ? this.enemyDeck : this.myDeck,
      jugador1_graveyard: isJ1 ? this.myGraveyard : this.enemyGraveyard,
      jugador2_graveyard: isJ1 ? this.enemyGraveyard : this.myGraveyard,
      jugador1_draw_count: isJ1 ? this.myDrawCount : this.enemyDrawCount,
      jugador2_draw_count: isJ1 ? this.enemyDrawCount : this.myDrawCount,
      turno: (this.currentTurn === 'player' && isJ1) || (this.currentTurn === 'enemy' && !isJ1) ? 'jugador1' : 'jugador2',
      fase: this.currentPhase,
      historial_acciones: this.actionLog,
      ganador: this.winnerId,
      j1_username: isJ1 ? this.myUsername : this.enemyUsername,
      j2_username: isJ1 ? this.enemyUsername : this.myUsername
    };

    const updatePayload: any = { estado_juego: state };
    if (this.duelEnded && this.winnerId) {
      updatePayload.estado = 'finalizada';
      updatePayload.ganador = this.winnerId;
    }

    await this.supabase.client
      .from('partidas')
      .update(updatePayload)
      .eq('id', this.matchId);
  }

  // --- GAMEPLAY TURNS ---



  private async finalizarPorDeckOut(quienIntentoRobar: 'player' | 'enemy') {
    this.log('🚨 El mazo de reserva se ha agotado. Evaluando estado de la arena por puntos y cartas...');
    
    let playerWins = false;
    let reason = '';
    
    const myRemainingCards = this.myHand.length + this.myField.filter(z => z !== null).length;
    const enemyRemainingCards = this.enemyHand.length + this.enemyField.filter(z => z !== null).length;

    if (this.myLp > this.enemyLp) {
      playerWins = true;
      reason = `Victoria por puntos (LP). Posees ${this.myLp} LP contra ${this.enemyLp} LP del rival.`;
    } else if (this.enemyLp > this.myLp) {
      playerWins = false;
      reason = `Derrota por puntos (LP). El rival posee ${this.enemyLp} LP contra ${this.myLp} LP tuyos.`;
    } else {
      if (myRemainingCards > enemyRemainingCards) {
        playerWins = true;
        reason = `Victoria por ventaja de cartas. Tienes ${myRemainingCards} cartas en juego contra ${enemyRemainingCards} del rival.`;
      } else if (enemyRemainingCards > myRemainingCards) {
        playerWins = false;
        reason = `Derrota por ventaja de cartas. El rival tiene ${enemyRemainingCards} cartas en juego contra ${myRemainingCards} tuyas.`;
      } else {
        playerWins = quienIntentoRobar === 'enemy';
        reason = playerWins 
          ? 'Victoria por resistencia. El rival agotó su mazo primero.' 
          : 'Derrota por fatiga. Agotaste tu mazo primero.';
      }
    }
    
    await this.finishDuel(playerWins, reason);
  }

  private startTurn() {
    this.selectedHandCard = null;
    this.selectedFieldCard = null;
    this.selectedTargetCard = null;

    if (this.currentTurn === 'player') {
      this.currentPhase = 'batalla';
      this.log('⚔️ Tu turno. Puedes convocar cartas o declarar tu ataque.');
      this.cdr.detectChanges();
    } else {
      this.currentPhase = 'batalla';
      if (!this.onlineMode) {
        this.runAiTurn();
      } else {
        this.log(`Turno del oponente...`);
      }
    }
    this.cdr.detectChanges();
  }



  async forcePassTurn() {
    if (!this.isMyTurn) return;
    this.audioService.playClick();
    this.audioService.resume();
    this.log('Pansas el turno.');
    await this.autoEndTurn();
  }

  async autoEndTurn() {
    if (!this.isMyTurn) return;
    this.selectedFieldCard = null;
    this.selectedHandCard = null;
    this.selectedTargetCard = null;

    this.myField.forEach(s => { if (s) s.hasAttacked = false; });
    this.currentTurn = 'enemy';
    this.currentPhase = 'batalla';

    if (this.onlineMode) {
      await this.pushOnlineState(`Turno cedido a ${this.enemyUsername}.`);
    } else {
      setTimeout(() => this.startTurn(), 1000);
    }
    this.cdr.detectChanges();
  }

  confirmarColocacion() {
    if (!this.isMyTurn) return;
    
    if (this.myField[0] === null || this.myField[1] === null) {
      alert("Debes colocar un Pokémon en la zona de Ataque (ATK) y otro en la zona de Defensa (DEF) antes de confirmar.");
      return;
    }
    
    this.audioService.playClick();
    this.audioService.resume();
    
    if (this.onlineMode) {
      if (this.myRole === 'host') {
        this.currentTurn = 'enemy';
        this.pushOnlineState(`${this.myUsername} ha colocado sus cartas. Esperando al rival...`);
      } else {
        this.currentPhase = 'batalla';
        this.currentTurn = 'enemy'; // Host starts battle phase
        this.pushOnlineState(`${this.myUsername} ha colocado sus cartas. ¡Comienza la fase de batalla!`);
      }
    } else {
      this.currentPhase = 'colocacion_enemy';
      this.currentTurn = 'enemy';
      this.log("Has colocado tus cartas. Turno del oponente para colocar sus cartas...");
      setTimeout(() => {
        this.runAiColocacion();
      }, 1500);
    }
    this.cdr.detectChanges();
  }

  private async runAiColocacion() {
    if (this.enemyHand.length < 2) return;
    
    // Select best for ATK and DEF
    this.enemyHand.sort((a, b) => b.attack - a.attack);
    const card0 = this.enemyHand.shift()!;
    
    this.enemyHand.sort((a, b) => b.defense - a.defense);
    const card1 = this.enemyHand.shift()!;
    
    const multiplier = this.difficulty === 'facil' ? 0.7 : (this.difficulty === 'dificil' ? 1.3 : 1.0);
    
    this.enemyField[0] = {
      card: card0,
      position: 'ATK',
      hasAttacked: false,
      abilityUsed: false,
      currentHp: Math.round(card0.hp * multiplier),
      currentAtk: Math.round(card0.attack * multiplier),
      currentDef: Math.round(card0.defense * multiplier)
    };
    
    this.enemyField[1] = {
      card: card1,
      position: 'DEF',
      hasAttacked: false,
      abilityUsed: false,
      currentHp: Math.round(card1.hp * multiplier),
      currentAtk: Math.round(card1.attack * multiplier),
      currentDef: Math.round(card1.defense * multiplier)
    };
    
    this.audioService.playSynthSound('summon');
    this.log(`El rival ha colocado sus cartas de Ataque (${card0.name}) y Defensa (${card1.name}).`);
    
    this.currentPhase = 'batalla';
    this.currentTurn = 'player';
    this.log("¡Ambos jugadores han colocado sus cartas! Comienza la fase de batalla. ¡Es tu turno!");
    this.startTurn();
    this.cdr.detectChanges();
  }

  // --- ACTIONS ---

  selectHandCard(card: PokemonCard) {
    if (!this.isMyTurn || (this.currentPhase !== 'batalla' && this.currentPhase !== 'colocacion_player' && this.currentPhase !== 'colocacion_enemy')) return;
    this.audioService.playClick();
    this.audioService.resume();
    this.selectedFieldCard = null;
    this.selectedHandCard = this.selectedHandCard === card ? null : card;
    this.cdr.detectChanges();
  }

  onPlayerFieldClick(index: number) {
    if (!this.isMyTurn || (this.currentPhase !== 'batalla' && this.currentPhase !== 'colocacion_player' && this.currentPhase !== 'colocacion_enemy')) return;
    this.audioService.resume();

    const slot = this.myField[index];
    if (slot !== null) {
      this.audioService.playClick();
      this.selectedFieldCard = this.selectedFieldCard === index ? null : index;
    } else if (this.selectedHandCard) {
      this.summonCard(this.selectedHandCard, index);
    } else {
      this.selectedFieldCard = null;
    }
    this.cdr.detectChanges();
  }

  quickSummon(card: PokemonCard, index: number) {
    if (!this.isMyTurn || (this.currentPhase !== 'batalla' && this.currentPhase !== 'colocacion_player' && this.currentPhase !== 'colocacion_enemy')) return;
    this.audioService.resume();
    this.summonCard(card, index);
  }

  async summonCard(card: PokemonCard, slotIndex: number) {
    const handIdx = this.myHand.indexOf(card);
    if (handIdx === -1) return;

    this.audioService.playSynthSound('summon');
    
    this.myField[slotIndex] = {
      card,
      position: slotIndex === 0 ? 'ATK' : 'DEF',
      hasAttacked: false,
      abilityUsed: false,
      currentHp: card.hp,
      currentAtk: card.attack,
      currentDef: card.defense
    };

    this.myHand.splice(handIdx, 1);
    this.log(`Convocas a ${card.name} como ${slotIndex === 0 ? 'ATACANTE (ATK)' : 'DEFENSOR (DEF)'}.`);
    
    this.selectedHandCard = null;
    this.selectedFieldCard = null;

    if (this.onlineMode) {
      await this.pushOnlineState(`Convocación de ${card.name} en slot ${slotIndex === 0 ? 'ATK' : 'DEF'}.`);
    } else {
      this.checkVictoryOfflineOnline();
    }

    this.cdr.detectChanges();
  }

  activateAbility(slotIndex: number) {
    const slot = this.myField[slotIndex];
    if (!slot || slot.abilityUsed) return;

    slot.abilityUsed = true;
    this.selectedFieldCard = null;
    this.audioService.playSynthSound('victory');
    this.audioService.resume();

    const ability = slot.card.specialAbility;
    const firstType = slot.card.types[0]?.toLowerCase() || 'normal';

    let actionMsg = `Habilidad [${ability}] de ${slot.card.name}: `;

    if (firstType === 'fire') {
      slot.currentAtk += 300;
      actionMsg += '+300 ATK.';
    } else if (firstType === 'water') {
      slot.currentDef += 300;
      actionMsg += '+300 DEF.';
    } else if (firstType === 'grass') {
      slot.currentHp = Math.min(slot.card.hp, slot.currentHp + 400);
      actionMsg += '+400 HP sanados.';
    } else if (firstType === 'electric') {
      if (this.myDeck.length > 0) {
        const drawn = this.myDeck.shift()!;
        this.myHand.push(drawn);
        actionMsg += `Robas 1 carta (${drawn.name}).`;
      } else {
        actionMsg += 'Mazo vacío, sin efecto.';
      }
    } else if (firstType === 'psychic') {
      slot.currentAtk += 200;
      slot.currentDef += 200;
      actionMsg += '+200 ATK y +200 DEF.';
    } else {
      this.myLp = Math.min(4000, this.myLp + 500);
      actionMsg += 'Sanas +500 LP.';
    }

    this.log(actionMsg);

    if (this.onlineMode) {
      this.pushOnlineState(`Habilidad de ${slot.card.name} activada.`);
    }
    this.cdr.detectChanges();
  }

  selectAttacker(slotIndex: number) {
    const slot = this.myField[slotIndex];
    if (!slot || slot.hasAttacked) return;

    this.selectedFieldCard = slotIndex;
    this.audioService.playClick();
    this.audioService.resume();
    this.cdr.detectChanges();
  }

  isDeclaringAttack(): boolean {
    if (!this.isMyTurn || this.selectedFieldCard === null || this.currentPhase !== 'batalla') return false;
    const slot = this.myField[this.selectedFieldCard];
    return slot !== null && slot.position === 'ATK' && !slot.hasAttacked;
  }

  onEnemyFieldClick(index: number) {
    if (!this.isDeclaringAttack()) return;

    if (index === 0 && this.enemyField[1] !== null) {
      alert("¡No puedes atacar al atacante enemigo mientras tenga un defensor activo (DEF) protegiéndolo!");
      return;
    }

    this.executeAttack(this.selectedFieldCard!, index);
  }

  tryDirectAttack() {
    if (!this.isDeclaringAttack()) return;

    const hasMonsters = this.enemyField.some(z => z !== null);
    if (hasMonsters) {
      alert("Debes debilitar a los Pokémon rivales en el campo antes de atacar directamente.");
      return;
    }

    this.executeDirectAttack(this.selectedFieldCard!);
  }

  // --- COMBAT MATHEMATICS ---

  calculateDamage(attacker: FieldSlot, defender: FieldSlot): { dmg: number, multiplier: number } {
    let multiplier = 1;
    const typeA = attacker.card.types[0]?.toLowerCase();
    const typeD = defender.card.types[0]?.toLowerCase();

    // Ventajas elementales
    if (typeA === 'water' && typeD === 'fire') multiplier = 2;
    if (typeA === 'fire' && typeD === 'grass') multiplier = 2;
    if (typeA === 'grass' && typeD === 'water') multiplier = 2;
    if (typeA === 'electric' && typeD === 'water') multiplier = 2;
    if (typeA === 'psychic' && typeD === 'poison') multiplier = 2;

    // Resistencias elementales
    if (typeA === 'fire' && typeD === 'water') multiplier = 0.5;
    if (typeA === 'grass' && typeD === 'fire') multiplier = 0.5;
    if (typeA === 'water' && typeD === 'grass') multiplier = 0.5;

    let dmg = Math.floor(attacker.currentAtk * multiplier);
    if (dmg < 0) dmg = 0;

    return { dmg, multiplier };
  }

  private executeAttack(attackerIdx: number, targetIdx: number) {
    const attacker = this.myField[attackerIdx];
    const target = this.enemyField[targetIdx];

    if (!attacker || !target) return;

    attacker.hasAttacked = true;
    this.selectedFieldCard = null;

    this.audioService.playSynthSound('attack');
    this.log(`⚔️ ${attacker.card.name} arremete contra ${target.card.name}!`);

    setTimeout(() => {
      this.audioService.playSynthSound('hit');

      const { dmg, multiplier } = this.calculateDamage(attacker, target);
      target.currentHp = Math.max(0, target.currentHp - dmg);
      
      let dmgMsg = `💥 ¡${attacker.card.name} inflige ${dmg} de daño a la HP de ${target.card.name}! (HP restante: ${target.currentHp})`;
      if (multiplier === 2) dmgMsg += " (Súper Efectivo)";
      else if (multiplier === 0.5) dmgMsg += " (Poco Efectivo)";
      this.log(dmgMsg);

      if (target.currentHp <= 0) {
        this.destroyEnemyMonster(targetIdx);
      }

      this.checkVictoryOfflineOnline().then(() => {
        if (!this.duelEnded) {
          this.autoEndTurn();
        }
      });
      
      this.cdr.detectChanges();
    }, 800);
  }

  private executeDirectAttack(attackerIdx: number) {
    const attacker = this.myField[attackerIdx];
    if (!attacker) return;

    attacker.hasAttacked = true;
    this.selectedFieldCard = null;

    this.audioService.playSynthSound('attack');
    this.log(`🔥 ¡Ataque Directo! ${attacker.card.name} ataca los LP del oponente directamente.`);

    setTimeout(() => {
      this.audioService.playSynthSound('hit');
      const dmg = attacker.currentAtk;
      this.enemyLp = Math.max(0, this.enemyLp - dmg);
      this.log(`¡Impacto directo! El rival sufre ${dmg} puntos de daño directo a sus LP.`);

      this.checkVictoryOfflineOnline().then(() => {
        if (!this.duelEnded) {
          this.autoEndTurn();
        }
      });
      
      this.cdr.detectChanges();
    }, 800);
  }

  private destroyPlayerMonster(index: number) {
    const slot = this.myField[index];
    if (!slot) return;
    this.audioService.playSynthSound('faint');
    this.myGraveyard.push(slot.card);
    this.myField[index] = null;

    const lostLp = slot.card.hp;
    this.myLp = Math.max(0, this.myLp - lostLp);
    this.log(`💥 ¡Tu Pokémon ${slot.card.name} ha sido eliminado! Pierdes ${lostLp} LP.`);

    if (this.myDrawCount < 3 && this.myDeck.length > 0) {
      const drawn = this.myDeck.shift()!;
      this.myHand.push(drawn);
      this.myDrawCount++;
      this.log(`📥 Robas de tu mazo de reserva (${this.myDrawCount}/3): ${drawn.name}.`);
    } else if (this.myDrawCount >= 3) {
      this.log(`⚠️ Has alcanzado el límite máximo de 3 robos de reserva.`);
    } else {
      this.log(`⚠️ Tu mazo de reserva está vacío.`);
    }
  }

  private destroyEnemyMonster(index: number) {
    const slot = this.enemyField[index];
    if (!slot) return;
    this.audioService.playSynthSound('faint');
    this.enemyGraveyard.push(slot.card);
    this.enemyField[index] = null;

    const lostLp = slot.card.hp;
    this.enemyLp = Math.max(0, this.enemyLp - lostLp);
    this.log(`💥 ¡El Pokémon rival ${slot.card.name} ha sido eliminado! El oponente pierde ${lostLp} LP.`);

    if (this.enemyDrawCount < 3 && this.enemyDeck.length > 0) {
      const drawn = this.enemyDeck.shift()!;
      this.enemyHand.push(drawn);
      this.enemyDrawCount++;
      this.log(`📥 El rival toma una carta de su mazo de reserva (${this.enemyDrawCount}/3).`);
    } else if (this.enemyDrawCount >= 3) {
      this.log(`⚠️ El rival ha alcanzado el límite máximo de 3 robos de reserva.`);
    } else {
      this.log(`⚠️ El mazo de reserva del rival está vacío.`);
    }
  }

  // --- VICTORY LOGIC ---

  private async checkVictoryOfflineOnline() {
    if (this.duelEnded) return;

    if (this.myLp <= 0) {
      await this.finishDuel(false, 'Tus Puntos de Vida han llegado a 0.');
      return;
    }
    if (this.enemyLp <= 0) {
      await this.finishDuel(true, 'Los Puntos de Vida de tu rival han llegado a 0.');
      return;
    }

    // Si ya no quedan cartas utilizables en mano y campo, se pierde
    const myRemaining = this.myHand.length + this.myField.filter(z => z !== null).length;
    const enemyRemaining = this.enemyHand.length + this.enemyField.filter(z => z !== null).length;

    if (myRemaining === 0) {
      await this.finishDuel(false, 'Te has quedado sin cartas utilizables en mano y campo.');
      return;
    }
    if (enemyRemaining === 0) {
      await this.finishDuel(true, 'El oponente se ha quedado sin cartas utilizables en mano y campo.');
      return;
    }
  }

  private async finishDuel(playerWins: boolean, reason: string) {
    this.duelEnded = true;
    this.isWinner = playerWins;
    this.duelEndReason = reason;

    this.audioService.playSynthSound(playerWins ? 'victory' : 'defeat');

    if (this.onlineMode) {
      this.winnerId = playerWins ? this.myId : this.opponentId;
      await this.pushOnlineState(`Duelo Finalizado. Ganador: ${playerWins ? this.myUsername : this.enemyUsername}.`);
    } else {
      await this.sqlite.saveOfflineMatch({
        difficulty: this.difficulty,
        timestamp: new Date().toISOString(),
        result: playerWins ? 'win' : 'lose'
      });
    }

    if (playerWins && !this.rewardProcessed) {
      this.rewardProcessed = true;
      try {
        const rewards = await this.inventoryService.addWinRewards(this.onlineMode);
        this.recargasEarned = rewards.coinsEarned;
        this.packEarned = rewards.packEarned;
      } catch (e) {
        console.error("Error processing reward:", e);
      }
    }

    this.cdr.detectChanges();
  }

  async surrender() {
    this.audioService.playClick();
    if (confirm("¿Estás seguro de que deseas rendirte? Contará como una derrota.")) {
      await this.finishDuel(false, 'Te has rendido.');
    }
  }

  exitDuel() {
    this.audioService.playClick();
    this.router.navigate(['/home']);
  }

  // --- AI SIMULATION ---

  private async runAiTurn() {
    this.opponentStatusMessage = 'Iniciando turno...';
    this.log(`--- Turno del Rival ---`);
    await this.delay(1200);

    // AI Decision: Summon card if slot empty
    if (this.enemyField[0] === null && this.enemyHand.length > 0) {
      this.opponentStatusMessage = 'Invocando Pokémon atacante...';
      await this.delay(1000);
      // Summon to ATK
      this.enemyHand.sort((a,b) => b.attack - a.attack);
      const card = this.enemyHand.shift()!;
      const multiplier = this.difficulty === 'facil' ? 0.7 : (this.difficulty === 'dificil' ? 1.3 : 1.0);
      
      this.enemyField[0] = {
        card,
        position: 'ATK',
        hasAttacked: false,
        abilityUsed: false,
        currentHp: Math.round(card.hp * multiplier),
        currentAtk: Math.round(card.attack * multiplier),
        currentDef: Math.round(card.defense * multiplier)
      };
      this.audioService.playSynthSound('summon');
      this.log(`El rival convoca a ${card.name} como ATACANTE.`);
      await this.delay(1200);
    }
    
    if (this.enemyField[1] === null && this.enemyHand.length > 0) {
      this.opponentStatusMessage = 'Invocando Pokémon defensor...';
      await this.delay(1000);
      // Summon to DEF
      this.enemyHand.sort((a,b) => b.defense - a.defense);
      const card = this.enemyHand.shift()!;
      const multiplier = this.difficulty === 'facil' ? 0.7 : (this.difficulty === 'dificil' ? 1.3 : 1.0);
      
      this.enemyField[1] = {
        card,
        position: 'DEF',
        hasAttacked: false,
        abilityUsed: false,
        currentHp: Math.round(card.hp * multiplier),
        currentAtk: Math.round(card.attack * multiplier),
        currentDef: Math.round(card.defense * multiplier)
      };
      this.audioService.playSynthSound('summon');
      this.log(`El rival convoca a ${card.name} como DEFENSOR.`);
      await this.delay(1200);
    }

    // AI Attack
    const attacker = this.enemyField[0];
    if (attacker && attacker.position === 'ATK' && !attacker.hasAttacked) {
      attacker.hasAttacked = true;
      
      // Determine target (prefer defender, then attacker, then direct)
      let targetIdx = -1;
      if (this.myField[1] !== null) {
        targetIdx = 1;
      } else if (this.myField[0] !== null) {
        targetIdx = 0;
      }

      this.opponentStatusMessage = `Preparando ataque de ${attacker.card.name}...`;
      await this.delay(1000);
      this.audioService.playSynthSound('attack');

      if (targetIdx !== -1) {
        const pTarget = this.myField[targetIdx]!;
        this.opponentStatusMessage = `¡${attacker.card.name} ataca a tu ${pTarget.card.name}!`;
        this.log(`⚔️ Rival: ${attacker.card.name} ataca a tu ${pTarget.card.name}!`);
        await this.delay(1000);
        this.audioService.playSynthSound('hit');

        const { dmg, multiplier } = this.calculateDamage(attacker, pTarget);
        pTarget.currentHp = Math.max(0, pTarget.currentHp - dmg);
        
        let dmgMsg = `💥 ¡El rival inflige ${dmg} de daño a la HP de tu ${pTarget.card.name}! (HP restante: ${pTarget.currentHp})`;
        if (multiplier === 2) dmgMsg += " (Súper Efectivo)";
        else if (multiplier === 0.5) dmgMsg += " (Poco Efectivo)";
        this.log(dmgMsg);

        if (pTarget.currentHp <= 0) {
          this.destroyPlayerMonster(targetIdx);
        }
      } else {
        // Direct Attack
        this.opponentStatusMessage = `¡${attacker.card.name} realiza un ataque directo a tus LP!`;
        this.log(`🔥 ¡Ataque Directo del Rival! ${attacker.card.name} golpea tus LP.`);
        await this.delay(1000);
        this.audioService.playSynthSound('hit');
        this.myLp = Math.max(0, this.myLp - attacker.currentAtk);
        this.log(`Sufres ${attacker.currentAtk} puntos de daño directo.`);
      }

      await this.delay(1200);
    } else {
      this.opponentStatusMessage = 'Sin atacante disponible. Cediendo turno...';
      await this.delay(1000);
    }

    this.checkVictoryOfflineOnline();
    
    if (!this.duelEnded) {
      this.opponentStatusMessage = 'Finalizando turno...';
      await this.delay(800);
      this.log(`Rival finaliza su turno.`);
      this.currentTurn = 'player';
      this.opponentStatusMessage = '';
      this.startTurn();
    }
  }

  // --- HELPERS ---

  private shuffle(array: any[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  private generateAiDeck(): PokemonCard[] {
    return [
      {
        id: 6,
        name: 'CHARIZARD',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png',
        types: ['fire'],
        attack: 750,
        defense: 500,
        hp: 1200,
        specialAbility: 'Llamarada (+300 ATK)',
        rarity: 'Legendaria',
        description: 'Escupe fuego que es capaz de derretir rocas en segundos.'
      },
      {
        id: 9,
        name: 'BLASTOISE',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png',
        types: ['water'],
        attack: 600,
        defense: 700,
        hp: 1300,
        specialAbility: 'Cúpula Espejo (Sube DEF)',
        rarity: 'Legendaria',
        description: 'Lanza chorros de agua a alta presión desde los cañones en su caparazón.'
      },
      {
        id: 3,
        name: 'VENUSAUR',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png',
        types: ['grass'],
        attack: 550,
        defense: 600,
        hp: 1500,
        specialAbility: 'Sólida Raíz (+400 HP)',
        rarity: 'Legendaria',
        description: 'La flor de su lomo absorbe la luz del sol para canalizar energía vital.'
      },
      {
        id: 25,
        name: 'PIKACHU',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png',
        types: ['electric'],
        attack: 700,
        defense: 300,
        hp: 900,
        specialAbility: 'Sobrecarga (Roba 1 carta)',
        rarity: 'Rara',
        description: 'Acumula electricidad en sus mejillas antes de liberarla en combate.'
      },
      {
        id: 150,
        name: 'MEWTWO',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png',
        types: ['psychic'],
        attack: 900,
        defense: 500,
        hp: 1400,
        specialAbility: 'Control Mental (Sube ATK/DEF)',
        rarity: 'Legendaria',
        description: 'Creado mediante ingeniería genética para ser el Pokémon definitivo.'
      },
      {
        id: 143,
        name: 'SNORLAX',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png',
        types: ['normal'],
        attack: 500,
        defense: 500,
        hp: 2000,
        specialAbility: 'Inmunidad (Robusto)',
        rarity: 'Rara',
        description: 'Su estómago puede digerir cualquier tipo de veneno.'
      },
      {
        id: 94,
        name: 'GENGAR',
        image: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png',
        types: ['psychic'],
        attack: 750,
        defense: 450,
        hp: 1000,
        specialAbility: 'Cuerpo Maldito (Esquivar)',
        rarity: 'Rara',
        description: 'Se esconde en las sombras de la gente por la noche.'
      }
    ];
  }

  private log(message: string) {
    this.actionLog.push(message);
    this.scrollLogs();
    this.cdr.detectChanges();
  }

  private scrollLogs() {
    if (!this.isBrowser) return;
    setTimeout(() => {
      try {
        const container = document.querySelector('.logs-scroll');
        if (container) {
          container.scrollTop = container.scrollHeight;
        }
      } catch (err) {}
    }, 50);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
