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
          <h2 class="royal-title text-gold pulse-anim" style="color: var(--poke-blue);">Alineando los Astros...</h2>
          <p class="loader-status" style="color: #64748b;">{{ loaderStatus }}</p>
          <div class="spinner-gold"></div>
          <button *ngIf="onlineMode" (click)="exitDuel()" class="btn btn-pink" style="margin-top: 2rem;">Desistir del Duelo</button>
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
            <h3 style="font-family: var(--font-title); font-weight: 900; color: #16a34a; margin-bottom: 0.25rem;">Recompensas Obtenidas</h3>
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
                <span>Mazo: {{ enemyDeck.length }} cartas restantes</span> | <span>Cementerio: {{ enemyGraveyard.length }}</span>
                <span *ngIf="isDeclaringAttack() && !enemyField[0] && !enemyField[1]" class="blink-text" style="color: var(--poke-red); font-weight: 900; margin-left: 10px;">🎯 ¡HAZ CLIC AQUÍ PARA ATACAR DIRECTAMENTE!</span>
              </div>
            </div>
          </header>

          <!-- COMBAT FIELD (Exactly 2 Slots per side: ATK and DEF) -->
          <div class="combat-field">
            
            <!-- OPPONENT FIELD (ATK slot 0, DEF slot 1) -->
            <div class="field-row opponent-row">
              
              <!-- Enemy DEF Slot (index 1) -->
              <div class="field-socket" 
                   [class.selected-target]="selectedTargetCard === 1"
                   [class.can-be-targeted]="isDeclaringAttack() && enemyField[1] !== null"
                   (click)="onEnemyFieldClick(1)">
                <span class="socket-label">Defensor (DEF)</span>
                
                <div *ngIf="enemyField[1]" class="card-wrapper-ygo float-animation def-rotated">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (enemyField[1].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ enemyField[1].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ enemyField[1].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo" style="height: 50px;">
                        <img [src]="enemyField[1].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="font-size: 0.5rem; padding-top: 1px;">
                        <span>ATK: {{ enemyField[1].currentAtk }}</span>
                        <span>DEF: {{ enemyField[1].currentDef }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(enemyField[1].currentHp / enemyField[1].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">DEF</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!enemyField[1]" style="font-size: 0.75rem; color: #cbd5e1; font-weight: bold;">VACÍO</div>
              </div>

              <!-- Enemy ATK Slot (index 0) -->
              <div class="field-socket" 
                   [class.selected-target]="selectedTargetCard === 0"
                   [class.can-be-targeted]="isDeclaringAttack() && enemyField[0] !== null"
                   (click)="onEnemyFieldClick(0)">
                <span class="socket-label">Atacante (ATK)</span>
                
                <div *ngIf="enemyField[0]" class="card-wrapper-ygo float-animation">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (enemyField[0].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ enemyField[0].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ enemyField[0].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo" style="height: 50px;">
                        <img [src]="enemyField[0].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="font-size: 0.5rem; padding-top: 1px;">
                        <span>ATK: {{ enemyField[0].currentAtk }}</span>
                        <span>DEF: {{ enemyField[0].currentDef }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(enemyField[0].currentHp / enemyField[0].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">ATK</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!enemyField[0]" style="font-size: 0.75rem; color: #cbd5e1; font-weight: bold;">VACÍO</div>
              </div>

            </div>

            <!-- CENTRAL INSTRUCTIONS BAR -->
            <div class="central-divider">
              <div class="vs-glow">Liga de Barajas Pokémon</div>
              
              <!-- Combat helper texts -->
              <div class="combat-instruction" *ngIf="isMyTurn" style="color: var(--poke-dark); font-weight: bold;">
                <span *ngIf="myHand.length > 0 && !myField[0] && !myField[1]">💡 Haz clic en una carta de tu mano y convócala como Atacante o Defensor.</span>
                <span *ngIf="myField[0] && !myField[0].hasAttacked">⚔️ ¡Tienes un atacante listo! Haz clic en él para atacar al rival.</span>
                <span *ngIf="myField[1] && !myField[0]">🛡️ Tu defensor está listo. El turno avanzará automáticamente al pasar.</span>
              </div>
              <div class="combat-instruction text-crimson" *ngIf="!isMyTurn" style="font-weight: bold; color: var(--poke-red);">
                ⏳ Esperando movimiento del rival...
              </div>
            </div>

            <!-- PLAYER FIELD (ATK slot 0, DEF slot 1) -->
            <div class="field-row player-row">
              
              <!-- Player ATK Slot (index 0) -->
              <div class="field-socket"
                   [class.selected-attacker]="selectedFieldCard === 0"
                   [class.empty-summonable]="selectedHandCard && myField[0] === null"
                   (click)="onPlayerFieldClick(0)">
                <span class="socket-label">Atacante (ATK)</span>
                
                <div *ngIf="myField[0]" class="card-wrapper-ygo">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (myField[0].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ myField[0].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ myField[0].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo" style="height: 50px;">
                        <img [src]="myField[0].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="font-size: 0.5rem; padding-top: 1px;">
                        <span>ATK: {{ myField[0].currentAtk }}</span>
                        <span>DEF: {{ myField[0].currentDef }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(myField[0].currentHp / myField[0].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">ATK</div>
                    </div>
                  </div>
                  
                  <!-- Popover Menus -->
                  <div class="card-actions-popover" *ngIf="isMyTurn && selectedFieldCard === 0">
                    <button *ngIf="!myField[0].hasAttacked" (click)="selectAttacker(0); $event.stopPropagation();" class="popover-btn" style="border-color: var(--poke-red); color: var(--poke-red);">
                      ⚔️ Atacar
                    </button>
                    <button *ngIf="!myField[0].abilityUsed" (click)="activateAbility(0); $event.stopPropagation();" class="popover-btn" style="border-color: var(--poke-blue); color: var(--poke-blue);">
                      ✨ Habilidad
                    </button>
                  </div>
                </div>
                <div *ngIf="!myField[0]" style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">Invocar Aquí</div>
              </div>

              <!-- Player DEF Slot (index 1) -->
              <div class="field-socket"
                   [class.selected-attacker]="selectedFieldCard === 1"
                   [class.empty-summonable]="selectedHandCard && myField[1] === null"
                   (click)="onPlayerFieldClick(1)">
                <span class="socket-label">Defensor (DEF)</span>
                
                <div *ngIf="myField[1]" class="card-wrapper-ygo def-rotated">
                  <div class="card-ygo">
                    <div class="card-face card-face-front" [ngClass]="'type-' + (myField[1].card.types[0]?.toLowerCase() || 'normal')">
                      <div class="card-header-ygo">
                        <div class="card-name-ygo">{{ myField[1].card.name }}</div>
                        <div class="card-stars-ygo">Nv.{{ myField[1].card.level || 1 }}</div>
                      </div>
                      <div class="card-image-ygo" style="height: 50px;">
                        <img [src]="myField[1].card.image" alt="pokemon">
                      </div>
                      <div class="card-stats-ygo" style="font-size: 0.5rem; padding-top: 1px;">
                        <span>ATK: {{ myField[1].currentAtk }}</span>
                        <span>DEF: {{ myField[1].currentDef }}</span>
                      </div>
                      <div class="card-hp-bar-ygo">
                        <div class="hp-fill" [style.width]="(myField[1].currentHp / myField[1].card.hp * 100) + '%'"></div>
                      </div>
                      <div class="card-status-badge">DEF</div>
                    </div>
                  </div>
                  
                  <!-- Popover Menus -->
                  <div class="card-actions-popover" *ngIf="isMyTurn && selectedFieldCard === 1">
                    <button *ngIf="!myField[1].abilityUsed" (click)="activateAbility(1); $event.stopPropagation();" class="popover-btn" style="border-color: var(--poke-blue); color: var(--poke-blue);">
                      ✨ Habilidad
                    </button>
                  </div>
                </div>
                <div *ngIf="!myField[1]" style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">Invocar Aquí</div>
              </div>

            </div>

          </div>

          <!-- PLAYER HUD, LIFEBAR & HAND -->
          <footer class="player-hud" style="background: #ffffff;">
            <div class="hud-avatar" style="background: #e0f2fe; border-color: var(--poke-blue);">🧢</div>
            <div class="hud-details">
              <div class="hud-name" style="color: var(--poke-blue); font-weight: 900;">{{ myUsername }}</div>
              <div class="hud-lp-container" style="border-color: var(--poke-dark);">
                <div class="hud-lp-bar" [style.width]="(myLp / 4000 * 100) + '%'" style="background: linear-gradient(90deg, var(--poke-blue) 0%, #60a5fa 100%);"></div>
                <div class="hud-lp-value">{{ myLp }} / 4000 LP</div>
              </div>
              <div class="hud-sub" style="font-weight: bold;">
                <span>Mazo: {{ myDeck.length }} cartas restantes</span> | <span>Cementerio: {{ myGraveyard.length }}</span>
              </div>
            </div>
          </footer>

          <!-- PLAYER HAND CARDS -->
          <section class="hand-row">
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

                  <div class="card-stats-ygo" style="margin-top: 15px;">
                    <span style="color: var(--poke-red);">ATK: {{ card.attack }}</span>
                    <span style="color: var(--poke-blue);">DEF: {{ card.defense }}</span>
                  </div>

                  <!-- Quick Summon Buttons inside Selected Hand Card -->
                  <div *ngIf="selectedHandCard === card && isMyTurn" style="display: flex; gap: 4px; justify-content: center; margin-top: 12px;" (click)="$event.stopPropagation()">
                    <button (click)="quickSummon(card, 0)" [disabled]="myField[0] !== null" class="btn" style="padding: 0.25rem 0.4rem; font-size: 0.6rem; font-weight: bold; border-color: var(--poke-red);">⚔️ ATK</button>
                    <button (click)="quickSummon(card, 1)" [disabled]="myField[1] !== null" class="btn" style="padding: 0.25rem 0.4rem; font-size: 0.6rem; font-weight: bold; border-color: var(--poke-blue);">🛡️ DEF</button>
                  </div>

                </div>
              </div>
            </div>
            
            <div *ngIf="myHand.length === 0" class="empty-hand-label" style="font-weight: bold; color: #64748b;">
              Mano Vacía (Robarás al inicio del siguiente turno)
            </div>
          </section>

        </main>

        <!-- RIGHT SIDEBAR (Logs & Actions) -->
        <aside class="game-sidebar altar-panel">
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

          <!-- Active turn alert -->
          <div class="action-controls">
            <div class="turn-announcement" [ngClass]="isMyTurn ? 'my-turn-glow' : 'enemy-turn-glow'">
              {{ isMyTurn ? '🚨 ¡TU TURNO! 🚨' : 'TURNO DEL RIVAL' }}
            </div>

            <!-- Standby Pass Button (if they cannot attack or place card, they can pass) -->
            <button *ngIf="isMyTurn" (click)="forcePassTurn()" class="btn-royal-crimson" style="width: 100%; margin-bottom: 0.5rem; font-size: 0.85rem; background: var(--poke-blue); border-color: var(--poke-dark);">
              Pasar Turno ⏩
            </button>

            <button (click)="surrender()" class="btn btn-pink" style="width: 100%; font-size: 0.8rem; font-weight: bold;">
              Rendirse 🏳️
            </button>
          </div>

          <!-- Logs -->
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
  
  currentTurn: 'player' | 'enemy' = 'player';
  currentPhase: 'robo' | 'batalla' = 'robo';
  actionLog: string[] = [];

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
    this.currentTurn = Math.random() > 0.5 ? 'player' : 'enemy';
    
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
        this.myDeck = await this.pokeapi.getRandomPokemonCards(5);
      }
    } catch(e) {
      this.myDeck = await this.pokeapi.getRandomPokemonCards(5);
    }

    // AI deck
    this.enemyDeck = this.generateAiDeck();
    this.enemyUsername = `Entrenador Rival (${this.difficulty.toUpperCase()})`;

    // Shuffle
    this.shuffle(this.myDeck);
    this.shuffle(this.enemyDeck);

    // Draw initial: 4 cards
    for (let i = 0; i < 4; i++) {
      if (this.myDeck.length > 0) this.myHand.push(this.myDeck.shift()!);
      if (this.enemyDeck.length > 0) this.enemyHand.push(this.enemyDeck.shift()!);
    }

    this.actionLog.push('🏆 ¡El Duelo de Barajas Pokémon ha comenzado!');
    this.actionLog.push(`Mano inicial robada (4 cartas cada uno).`);
    this.actionLog.push(`Primer turno asignado a: ${this.currentTurn === 'player' ? 'TÚ' : 'RIVAL'}`);

    this.loading = false;
    this.cdr.detectChanges();

    this.startTurn();
  }

  private async initOnlineDuel() {
    this.loaderStatus = 'Conectando con la sala de combate del estadio...';
    
    // Setup channel subscription with local table checking for reliability
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

    // Query match info
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
      hDeck = await this.pokeapi.getRandomPokemonCards(5);
    }

    let gDeck: PokemonCard[] = [];
    const { data: gData } = await this.supabase.client.from('mazos').select('cartas').eq('id_usuario', this.opponentId).single();
    if (gData && gData.cartas) {
      gDeck = JSON.parse(JSON.stringify(gData.cartas));
    } else {
      gDeck = await this.pokeapi.getRandomPokemonCards(5);
    }

    // Shuffle
    this.shuffle(hDeck);
    this.shuffle(gDeck);

    // Initial hands
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
      jugador1_field: [null, null], // length 2
      jugador2_field: [null, null], // length 2
      jugador1_deck: hDeck,
      jugador2_deck: gDeck,
      jugador1_graveyard: [],
      jugador2_graveyard: [],
      turno: Math.random() > 0.5 ? 'jugador1' : 'jugador2',
      fase: 'robo',
      historial_acciones: ['¡Comienza el duelo de Barajas Pokémon!', 'Se reparten 4 cartas iniciales a cada entrenador.'],
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

    // Safety: slice if length > 2
    this.myField = (this.myRole === 'host' ? state.jugador1_field : state.jugador2_field).slice(0, 2);
    this.enemyField = (this.myRole === 'host' ? state.jugador2_field : state.jugador1_field).slice(0, 2);

    this.myDeck = this.myRole === 'host' ? state.jugador1_deck : state.jugador2_deck;
    this.enemyDeck = this.myRole === 'host' ? state.jugador2_deck : state.jugador1_deck;

    this.myGraveyard = this.myRole === 'host' ? state.jugador1_graveyard : state.jugador2_graveyard;
    this.enemyGraveyard = this.myRole === 'host' ? state.jugador2_graveyard : state.jugador1_graveyard;

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

  get isMyTurn(): boolean {
    return this.currentTurn === 'player';
  }

  private startTurn() {
    this.selectedHandCard = null;
    this.selectedFieldCard = null;
    this.selectedTargetCard = null;

    if (this.currentTurn === 'player') {
      this.currentPhase = 'robo';
      this.audioService.playSynthSound('draw');
      
      // Auto Draw Phase
      setTimeout(async () => {
        if (this.myDeck.length > 0) {
          const drawn = this.myDeck.shift()!;
          this.myHand.push(drawn);
          this.log(`Robas una carta del mazo: ${drawn.name}`);
        } else if (this.myGraveyard.length > 0) {
          // If deck empty but graveyard has cards, recycle them
          this.myDeck = [...this.myGraveyard];
          this.myGraveyard = [];
          this.shuffle(this.myDeck);
          const drawn = this.myDeck.shift()!;
          this.myHand.push(drawn);
          this.log(`Mazo reciclado. Robas carta: ${drawn.name}`);
        } else {
          this.log('Mazo y cementerio vacíos. No puedes robar.');
        }
        
        this.currentPhase = 'batalla';
        this.audioService.playClick();
        
        if (this.onlineMode) {
          await this.pushOnlineState(`Robo automático de ${this.myUsername}.`);
        }
        this.cdr.detectChanges();
      }, 1000);

    } else {
      this.currentPhase = 'robo';
      if (!this.onlineMode) {
        this.runAiTurn();
      } else {
        this.log(`Turno del contrincante...`);
      }
    }
    this.cdr.detectChanges();
  }

  async forcePassTurn() {
    if (!this.isMyTurn) return;
    this.audioService.playClick();
    this.log('Pansas el turno voluntariamente.');
    await this.autoEndTurn();
  }

  async autoEndTurn() {
    if (!this.isMyTurn) return;
    this.selectedFieldCard = null;
    this.selectedHandCard = null;
    this.selectedTargetCard = null;

    this.myField.forEach(s => { if (s) s.hasAttacked = false; });
    this.currentTurn = 'enemy';
    this.currentPhase = 'robo';

    if (this.onlineMode) {
      await this.pushOnlineState(`Turno cedido a ${this.enemyUsername}.`);
    } else {
      setTimeout(() => this.startTurn(), 1000);
    }
    this.cdr.detectChanges();
  }

  // --- ACTIONS ---

  selectHandCard(card: PokemonCard) {
    if (!this.isMyTurn) return;
    this.audioService.playClick();
    this.selectedFieldCard = null;
    this.selectedHandCard = this.selectedHandCard === card ? null : card;
    this.cdr.detectChanges();
  }

  onPlayerFieldClick(index: number) {
    if (!this.isMyTurn) return;

    // Click on active slot to select for action menu
    const slot = this.myField[index];
    if (slot !== null) {
      this.audioService.playClick();
      this.selectedFieldCard = this.selectedFieldCard === index ? null : index;
    } else if (this.selectedHandCard) {
      // Summon to index click
      this.summonCard(this.selectedHandCard, index);
    } else {
      this.selectedFieldCard = null;
    }
    this.cdr.detectChanges();
  }

  quickSummon(card: PokemonCard, index: number) {
    if (!this.isMyTurn) return;
    this.summonCard(card, index);
  }

  async summonCard(card: PokemonCard, slotIndex: number) {
    const handIdx = this.myHand.indexOf(card);
    if (handIdx === -1) return;

    this.audioService.playSynthSound('summon');
    
    // Create slot state
    this.myField[slotIndex] = {
      card,
      position: slotIndex === 0 ? 'ATK' : 'DEF',
      hasAttacked: false,
      abilityUsed: false,
      currentHp: card.hp,
      currentAtk: card.attack,
      currentDef: card.defense
    };

    // Remove from hand
    this.myHand.splice(handIdx, 1);
    
    this.log(`Convocas a ${card.name} como ${slotIndex === 0 ? 'ATACANTE (ATK)' : 'DEFENSOR (DEF)'}.`);
    
    this.selectedHandCard = null;
    this.selectedFieldCard = null;

    if (this.onlineMode) {
      await this.pushOnlineState(`Convocación de ${card.name} en slot ${slotIndex === 0 ? 'ATK' : 'DEF'}.`);
    } else {
      this.checkVictoryOfflineOnline();
    }

    // Auto-End Turn if we summoned a defender and have no attackers that can declare combat
    const canAttackNow = this.myField[0] !== null && !this.myField[0].hasAttacked;
    if (!canAttackNow) {
      setTimeout(() => this.autoEndTurn(), 1200);
    }

    this.cdr.detectChanges();
  }

  activateAbility(slotIndex: number) {
    const slot = this.myField[slotIndex];
    if (!slot || slot.abilityUsed) return;

    slot.abilityUsed = true;
    this.selectedFieldCard = null;
    this.audioService.playSynthSound('victory');

    const ability = slot.card.specialAbility;
    const firstType = slot.card.types[0]?.toLowerCase() || 'normal';

    let actionMsg = `Habilidad [${ability}] de ${slot.card.name}: `;

    if (firstType === 'fire') {
      slot.currentAtk += 300;
      actionMsg += '+300 de poder de ataque.';
    } else if (firstType === 'water') {
      slot.currentDef += 300;
      actionMsg += '+300 puntos de defensa.';
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
      actionMsg += 'Sanas +500 LP de salud general.';
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
    this.cdr.detectChanges();
  }

  isDeclaringAttack(): boolean {
    if (!this.isMyTurn || this.selectedFieldCard === null) return false;
    const slot = this.myField[this.selectedFieldCard];
    return slot !== null && slot.position === 'ATK' && !slot.hasAttacked;
  }

  onEnemyFieldClick(index: number) {
    if (!this.isDeclaringAttack()) return;
    this.executeAttack(this.selectedFieldCard!, index);
  }

  tryDirectAttack() {
    if (!this.isDeclaringAttack()) return;

    // Direct attack allowed ONLY if opponent has NO active cards on field
    const hasMonsters = this.enemyField.some(z => z !== null);
    if (hasMonsters) {
      alert("Debes debilitar a los Pokémon rivales en el campo antes de atacar sus LP directamente.");
      return;
    }

    this.executeDirectAttack(this.selectedFieldCard!);
  }

  // --- COMBAT MATHEMATICS ---

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

      // Target is in ATK position vs DEF position
      if (target.position === 'ATK') {
        const diff = attacker.currentAtk - target.currentAtk;

        if (diff > 0) {
          this.log(`¡Ganaste la batalla! ${target.card.name} es debilitado. Daño al oponente: ${diff} LP`);
          this.enemyLp = Math.max(0, this.enemyLp - diff);
          this.destroyEnemyMonster(targetIdx);
        } else if (diff < 0) {
          const absDiff = Math.abs(diff);
          this.log(`¡Derrota! Tu Pokémon es debilitado. Recibes ${absDiff} de daño a tus LP`);
          this.myLp = Math.max(0, this.myLp - absDiff);
          this.destroyPlayerMonster(attackerIdx);
        } else {
          this.log(`¡Combate recíproco! Ambos Pokémon se debilitan mutuamente.`);
          this.destroyEnemyMonster(targetIdx);
          this.destroyPlayerMonster(attackerIdx);
        }

      } else {
        // Target is in DEF position
        const diff = attacker.currentAtk - target.currentDef;

        if (diff > 0) {
          this.log(`¡Defensa rota! El defensor rival ${target.card.name} es debilitado.`);
          this.destroyEnemyMonster(targetIdx);
        } else if (diff < 0) {
          const absDiff = Math.abs(diff);
          this.log(`¡Defensa inquebrantable! Tu golpe rebota y sufres ${absDiff} daño de contragolpe LP.`);
          this.myLp = Math.max(0, this.myLp - absDiff);
        } else {
          this.log(`Empate táctico. Ningún escudo cede.`);
        }
      }

      this.checkVictoryOfflineOnline().then(() => {
        if (!this.duelEnded) {
          // AUTO-END TURN AFTER ATTACK
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
          // AUTO-END TURN AFTER ATTACK
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
  }

  private destroyEnemyMonster(index: number) {
    const slot = this.enemyField[index];
    if (!slot) return;
    this.audioService.playSynthSound('faint');
    this.enemyGraveyard.push(slot.card);
    this.enemyField[index] = null;
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

    // Defeat if no cards left in hand, field, and deck
    const myRemaining = this.myHand.length + this.myField.filter(z => z !== null).length + this.myDeck.length;
    const enemyRemaining = this.enemyHand.length + this.enemyField.filter(z => z !== null).length + this.enemyDeck.length;

    if (myRemaining === 0) {
      await this.finishDuel(false, 'Te has quedado sin cartas disponibles en la partida.');
      return;
    }
    if (enemyRemaining === 0) {
      await this.finishDuel(true, 'Tu rival se ha quedado sin cartas disponibles.');
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

    // Process win rewards
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
    this.log(`--- Turno del Rival (Fase de Robo) ---`);
    await this.delay(1000);

    // Draw
    if (this.enemyDeck.length > 0) {
      const drawn = this.enemyDeck.shift()!;
      this.enemyHand.push(drawn);
      this.log(`El rival roba una carta.`);
    } else if (this.enemyGraveyard.length > 0) {
      this.enemyDeck = [...this.enemyGraveyard];
      this.enemyGraveyard = [];
      this.shuffle(this.enemyDeck);
      const drawn = this.enemyDeck.shift()!;
      this.enemyHand.push(drawn);
      this.log(`El rival recicla cementerio y roba.`);
    }

    await this.delay(1200);

    // AI Decision: Summon card if slot empty
    // If slot 0 (ATK) empty, summon best ATK card. If slot 1 (DEF) empty, summon best DEF card.
    let summoned = false;
    
    if (this.enemyField[0] === null && this.enemyHand.length > 0) {
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
      summoned = true;
      await this.delay(1200);
    }
    
    if (this.enemyField[1] === null && this.enemyHand.length > 0) {
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
      summoned = true;
      await this.delay(1200);
    }

    // AI Skill activation
    for (let i = 0; i < 2; i++) {
      const slot = this.enemyField[i];
      if (slot && !slot.abilityUsed && Math.random() > 0.4) {
        slot.abilityUsed = true;
        this.audioService.playSynthSound('victory');
        const firstType = slot.card.types[0]?.toLowerCase() || 'normal';
        let aiMsg = `Habilidad de ${slot.card.name} rival: `;
        if (firstType === 'fire') { slot.currentAtk += 300; aiMsg += '+300 ATK.'; }
        else if (firstType === 'water') { slot.currentDef += 300; aiMsg += '+300 DEF.'; }
        else if (firstType === 'grass') { slot.currentHp += 400; aiMsg += '+400 HP.'; }
        else if (firstType === 'electric') { if(this.enemyDeck.length>0) this.enemyHand.push(this.enemyDeck.shift()!); aiMsg += 'Robó 1 carta.'; }
        else { this.enemyLp = Math.min(4000, this.enemyLp + 500); aiMsg += '+500 LP.'; }
        this.log(aiMsg);
        await this.delay(1200);
      }
    }

    // AI Attack
    const attacker = this.enemyField[0];
    if (attacker && attacker.position === 'ATK' && !attacker.hasAttacked) {
      attacker.hasAttacked = true;
      
      // Determine target (prefer defender, then attacker, then direct)
      let targetIdx = -1;
      if (this.myField[1] !== null) {
        targetIdx = 1; // attack defender
      } else if (this.myField[0] !== null) {
        targetIdx = 0; // attack attacker
      }

      this.audioService.playSynthSound('attack');

      if (targetIdx !== -1) {
        const pTarget = this.myField[targetIdx]!;
        this.log(`⚔️ Rival: ${attacker.card.name} ataca a tu ${pTarget.card.name}!`);
        await this.delay(800);
        this.audioService.playSynthSound('hit');

        if (pTarget.position === 'ATK') {
          const diff = attacker.currentAtk - pTarget.currentAtk;
          if (diff > 0) {
            this.log(`¡Tu ${pTarget.card.name} es debilitado! Sufres ${diff} daño a LP.`);
            this.myLp = Math.max(0, this.myLp - diff);
            this.destroyPlayerMonster(targetIdx);
          } else if (diff < 0) {
            const absDiff = Math.abs(diff);
            this.log(`¡Contraataque! Pokémon rival es debilitado. Rival sufre ${absDiff} daño LP.`);
            this.enemyLp = Math.max(0, this.enemyLp - absDiff);
            this.destroyEnemyMonster(0);
          } else {
            this.log(`Ambas cartas se destruyen en combate.`);
            this.destroyPlayerMonster(targetIdx);
            this.destroyEnemyMonster(0);
          }
        } else {
          // target is DEF
          const diff = attacker.currentAtk - pTarget.currentDef;
          if (diff > 0) {
            this.log(`¡Tu defensor ${pTarget.card.name} es debilitado!`);
            this.destroyPlayerMonster(targetIdx);
          } else if (diff < 0) {
            const absDiff = Math.abs(diff);
            this.log(`¡Defensa exitosa! El rival sufre ${absDiff} daño de contragolpe a sus LP.`);
            this.enemyLp = Math.max(0, this.enemyLp - absDiff);
          }
        }
      } else {
        // Direct Attack
        this.log(`🔥 ¡Ataque Directo del Rival! ${attacker.card.name} golpea tus LP.`);
        await this.delay(800);
        this.audioService.playSynthSound('hit');
        this.myLp = Math.max(0, this.myLp - attacker.currentAtk);
        this.log(`Sufres ${attacker.currentAtk} puntos de daño directo.`);
      }

      await this.delay(1200);
    }

    this.checkVictoryOfflineOnline();
    
    // AI passes turn back to player automatically
    if (!this.duelEnded) {
      this.log(`Rival finaliza su turno.`);
      await this.delay(800);
      this.currentTurn = 'player';
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
