import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { InventoryService } from '../../core/services/inventory/inventory.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f3f6fa; position: relative; overflow-x: hidden;">
      
      <!-- Ornamental background patterns -->
      <div class="royal-pattern"></div>

      <!-- Main container -->
      <div style="position: relative; z-index: 2; width: 100%; max-width: 1100px; display: flex; flex-direction: column; gap: 2rem;">
        
        <!-- Header Banner (Pokéball aesthetic) -->
        <header class="altar-panel" style="background: linear-gradient(135deg, var(--poke-red) 0%, #d32f2f 100%); border-color: var(--poke-dark); padding: 1.5rem 2rem; display: flex; flex-direction: row; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; color: #ffffff;">
          <div>
            <h1 class="royal-title" style="font-size: 2.2rem; color: #ffffff; text-shadow: 2px 2px 0px var(--poke-dark); margin: 0;">
              Barajas Pokémon
            </h1>
            <p style="font-size: 0.9rem; font-weight: bold; color: var(--poke-yellow); text-shadow: 1px 1px 0px rgba(0,0,0,0.4); margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 1px;">
              Entrenador Activo: {{ username || 'Cargando...' }}
            </p>
          </div>
          
          <!-- Quick controls -->
          <div style="display: flex; gap: 0.75rem; align-items: center;">
            <button class="btn" style="border-color: var(--poke-dark); font-weight: bold;" (click)="showGuide = true; playClickSound()">
              📖 Reglas
            </button>
            <button class="btn" (click)="toggleMute()" style="border-color: var(--poke-dark); font-weight: bold;">
              {{ isMuted ? '🔇 Mudo' : '🔊 Sonido' }}
            </button>
            <button class="btn btn-pink" (click)="startTutorial(); playClickSound()" style="font-weight: bold;">
              ❓ Guía
            </button>
          </div>
        </header>

        <!-- Main Dashboard Split Layout (Completely rearranged) -->
        <div style="display: grid; grid-template-columns: 320px 1fr; gap: 2rem; align-items: start;">
          
          <!-- LEFT SIDEBAR: Profile Card & Safari Hunt Energy -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <!-- Trainer Profile Panel -->
            <div class="altar-panel" style="padding: 1.5rem; text-align: center;">
              <div style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid var(--poke-dark); background: var(--poke-yellow); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem auto; font-size: 2.5rem; box-shadow: 3px 3px 0 var(--poke-dark);">
                🧢
              </div>
              <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1.2rem; text-transform: uppercase;">
                {{ username || 'Entrenador' }}
              </h3>
              <p style="font-size: 0.75rem; color: #64748b; font-weight: bold; margin-bottom: 1rem;">ID Liga: {{ userId ? userId.substring(0,8).toUpperCase() : '' }}</p>
              
              <div style="border-top: 2px solid #e2e8f0; padding-top: 1rem; text-align: left; display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-weight: bold; color: #64748b;">PokéCoins:</span>
                  <span style="font-weight: 900; color: #d97706;">🪙 {{ inv?.recargas || 0 }}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-weight: bold; color: #64748b;">Cartas en Poké-Dex:</span>
                  <span style="font-weight: 900; color: var(--poke-blue);">🎴 {{ totalCartasCount }}</span>
                </div>
              </div>
            </div>

            <!-- Tall Grass Safari Tracker Panel -->
            <div class="altar-panel" style="padding: 1.5rem; border-color: var(--poke-blue); box-shadow: 6px 6px 0px var(--poke-blue);">
              <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1rem; color: var(--poke-blue); text-transform: uppercase; margin-bottom: 0.75rem; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">
                Capturas en Safari
              </h3>
              
              <div *ngIf="loading" style="font-size: 0.8rem; color: #64748b; text-align: center; padding: 1rem;">
                Sincronizando radar...
              </div>
              
              <div *ngIf="!loading" style="text-align: center;">
                <div style="font-size: 0.9rem; margin-bottom: 0.75rem; font-weight: bold;">
                  Safari Balls listos: <span style="font-weight: 900; color: var(--poke-red); font-size: 1.25rem;">{{ inv?.sobres_disponibles || 0 }}</span>
                </div>
                
                <button class="btn-royal-crimson" *ngIf="(inv?.sobres_disponibles || 0) > 0" (click)="goTo('/gacha')" 
                        style="width: 100%; font-size: 0.85rem; padding: 0.65rem; background: var(--poke-red); border-color: var(--poke-dark);">
                  🌾 Ir a la Hierba Alta
                </button>
                <button class="btn" *ngIf="(inv?.sobres_disponibles || 0) === 0" style="width: 100%; cursor: not-allowed;" disabled>
                  Sin Energía de Safari
                </button>

                <!-- Pokéball styled energy progress -->
                <div style="margin-top: 1.25rem; text-align: left;">
                  <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: bold; color: #64748b; margin-bottom: 0.4rem;">
                    <span>Cargas del Safari</span>
                    <span>{{ inv?.sobres_disponibles || 0 }} / 3</span>
                  </div>
                  <div class="pokeball-gauge" style="height: 12px; border-radius: 6px;">
                    <div class="pokeball-gauge-fill" [style.width]="((inv?.sobres_disponibles || 0) / 3 * 100) + '%'"></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Logout button -->
            <button class="btn btn-pink" style="width: 100%; font-weight: bold;" (click)="logout()">
              🚪 Cerrar Sesión
            </button>
          </div>

          <!-- RIGHT SIDE: Symmetric 2x2 Menu Grid -->
          <div style="display: flex; flex-direction: column; gap: 1.5rem;">
            
            <h2 class="royal-title" style="font-size: 1.4rem; margin-bottom: 0.2rem;">
              Estación de Combate y Colección
            </h2>

            <div class="menu-grid">
              
              <!-- 1. SIMULADOR AI -->
              <div class="menu-card menu-card-red" (click)="goToSimulator()">
                <div class="menu-icon" style="color: var(--poke-red);">🤖</div>
                <div class="menu-details">
                  <h3 class="menu-title">Simulador IA</h3>
                  <p class="menu-desc">Entrena contra un oponente virtual. Elige nivel de dificultad: Fácil, Medio o Difícil.</p>
                  
                  <!-- Dropdown options overlay to prevent immediate routing if chosen -->
                  <div style="display: flex; gap: 0.35rem; margin-top: 0.75rem;" (click)="$event.stopPropagation()">
                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: bold;" (click)="goTo('/game?difficulty=facil')">🟢 Fácil</button>
                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: bold;" (click)="goTo('/game?difficulty=medio')">🟡 Medio</button>
                    <button class="btn" style="padding: 0.25rem 0.5rem; font-size: 0.7rem; font-weight: bold;" (click)="goTo('/game?difficulty=dificil')">🔴 Difícil</button>
                  </div>
                </div>
              </div>

              <!-- 2. LOBBY MULTIJUGADOR -->
              <div class="menu-card menu-card-blue" (click)="goTo('/lobby')">
                <div class="menu-icon" style="color: var(--poke-blue);">🌐</div>
                <div class="menu-details">
                  <h3 class="menu-title">Combates en Línea</h3>
                  <p class="menu-desc">Enfréntate a otros entrenadores reales en tiempo real a través de Supabase Realtime.</p>
                </div>
              </div>

              <!-- 3. COLECCIÓN -->
              <div class="menu-card" (click)="goTo('/collection')">
                <div class="menu-icon" style="color: #64748b;">🎴</div>
                <div class="menu-details">
                  <h3 class="menu-title">Mi Colección</h3>
                  <p class="menu-desc">Revisa tus fichas de Pokémon capturados, analiza sus estadísticas de ataque y defensa y su descripción.</p>
                </div>
              </div>

              <!-- 4. FORJA DE MAZO -->
              <div class="menu-card" style="border-color: var(--poke-yellow); box-shadow: 6px 6px 0px var(--poke-yellow);" (click)="goTo('/deck-builder')">
                <div class="menu-icon" style="color: #d97706;">⚙️</div>
                <div class="menu-details">
                  <h3 class="menu-title">Forjar Mazo Activo</h3>
                  <p class="menu-desc">Selecciona exactamente 5 cartas de tu colección para preparar tu mazo reglamentario de combate.</p>
                </div>
              </div>

            </div>

            <!-- History Logs at bottom -->
            <div class="altar-panel" style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between;" (click)="goTo('/history')">
              <div style="display: flex; align-items: center; gap: 1rem;">
                <span style="font-size: 1.75rem;">📊</span>
                <div>
                  <h4 style="font-family: var(--font-title); font-weight: 900; margin: 0; font-size: 1rem; text-transform: uppercase;">Bitácora de Batallas</h4>
                  <p style="font-size: 0.75rem; color: #64748b; margin: 0;">Historial de tus encuentros simulados y online.</p>
                </div>
              </div>
              <button class="btn" style="font-size: 0.75rem; font-weight: bold; border-color: var(--poke-dark);">Ver Logs</button>
            </div>

          </div>

        </div>

      </div>

      <!-- Tutorial Dialog Overlay -->
      <div *ngIf="tutorialActive" style="position: fixed; inset: 0; z-index: 10000; background: rgba(5,5,10,0.4); pointer-events: none;"></div>

      <div *ngIf="tutorialActive" style="position: fixed; bottom: 2rem; right: 2rem; width: 90%; max-width: 450px; z-index: 10010; pointer-events: auto;">
        <div class="altar-panel" style="padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; border-color: var(--poke-blue); box-shadow: 5px 5px 0px var(--poke-blue); background: #ffffff;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem;">
            <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1.1rem; color: var(--poke-blue); display: flex; align-items: center; gap: 0.5rem;">
              🎓 Asistente de la Arena
            </h3>
            <span style="font-size: 0.75rem; font-weight: bold; color: #64748b;">Paso {{ tutorialStep }}/5</span>
          </div>

          <div style="font-size: 0.85rem; line-height: 1.5; color: var(--poke-dark); min-height: 65px;">
            <p *ngIf="tutorialStep === 1">¡Hola, te doy la bienvenida a <strong>Barajas Pokémon</strong>! Soy tu asistente virtual. Te daré un breve recorrido para que aprendas a jugar rápidamente.</p>
            <p *ngIf="tutorialStep === 2">En la derecha tienes el <strong>Simulador IA</strong> y los <strong>Combates en Línea</strong>. El simulador te permite pelear localmente con la máquina. "Combates en Línea" te conecta con jugadores en tiempo real.</p>
            <p *ngIf="tutorialStep === 3"><strong>¡Punto clave!</strong> Antes de batallar, entra a <strong>Forjar Mazo Activo</strong> para elegir las 5 cartas que usarás. Es requisito indispensable tener un mazo guardado para poder iniciar.</p>
            <p *ngIf="tutorialStep === 4">Para obtener más cartas, ve al recuadro de la izquierda: <strong>Búsqueda en Safari</strong>. Utiliza tus Safari Balls disponibles para sacudir los matorrales de la hierba alta y capturar nuevos Pokémon.</p>
            <p *ngIf="tutorialStep === 5">Finalmente, en <strong>Mi Colección</strong> podrás ver todo tu catálogo de cartas obtenidas y en <strong>Bitácora</strong> auditar tus estadísticas de victorias. ¡Mucha suerte en la arena!</p>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.5rem;">
            <button class="btn" style="font-size: 0.75rem; padding: 0.25rem 0.8rem; border-color: #cbd5e1; font-weight: bold;" (click)="skipTutorial(); playClickSound()">Omitir</button>
            <button class="btn-royal-gold" style="font-size: 0.75rem; padding: 0.35rem 1.2rem; background: var(--poke-yellow); border-color: var(--poke-dark);" (click)="nextTutorialStep(); playClickSound()">
              {{ tutorialStep === 5 ? '¡Entendido!' : 'Siguiente' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Manual de Reglas Dialog Modal -->
      <div *ngIf="showGuide" style="position: fixed; inset: 0; z-index: 10000; background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); padding: 2rem;">
        <div class="altar-panel" style="width: 100%; max-width: 650px; max-height: 85vh; overflow-y: auto; padding: 2rem; background: #ffffff;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; border-bottom: 3px solid var(--poke-dark); padding-bottom: 0.75rem;">
            <h2 class="royal-title" style="font-size: 1.5rem; margin: 0; color: var(--poke-blue);">Reglamento de Combate</h2>
            <button class="btn btn-pink" style="padding: 0.35rem 0.85rem; font-size: 0.8rem; font-weight: bold;" (click)="closeGuide(); playClickSound()">Cerrar</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: 1.5rem; font-size: 0.9rem; color: var(--poke-dark); line-height: 1.5;">
            <div>
              <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1rem; color: var(--poke-red); margin-bottom: 0.3rem;">1. Puntos de Vida (4000 LP)</h3>
              <p>El objetivo es debilitar los LP del rival a 0. Ambos jugadores inician con 4000 LP de salud general.</p>
            </div>

            <div>
              <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1rem; color: var(--poke-red); margin-bottom: 0.3rem;">2. Estructura de Turno Automática</h3>
              <p>Tu turno se divide en Robo y Acción. Cuando robas carta, puedes invocarla en tus casillas del campo o atacar. <strong>Una vez que atacas o convocas, el turno finaliza automáticamente</strong> para acelerar el ritmo del juego.</p>
            </div>

            <div>
              <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1rem; color: var(--poke-red); margin-bottom: 0.3rem;">3. Ranura Atacante (ATK) vs Defensora (DEF)</h3>
              <p>Tienes 2 casillas en el campo. Puedes colocar un Pokémon como Atacante (combate con el ataque) y otro como Defensor (combate con la defensa). Si te matan a tus Pokémon, puedes reponerlos invocando desde tu mano robada.</p>
            </div>

            <div>
              <h3 style="font-family: var(--font-title); font-weight: 900; font-size: 1rem; color: var(--poke-red); margin-bottom: 0.3rem;">4. Ganar Cartas</h3>
              <p>Usa tus celdas de Safari en la Hierba Alta para buscar Pokémon. Al ganar duelos se te premiará con PokéCoins y más celdas para seguir capturando.</p>
            </div>
          </div>

          <div style="margin-top: 2rem; text-align: center;">
            <button class="btn-royal-gold" style="font-size: 0.95rem; padding: 0.6rem 2.5rem;" (click)="closeGuide(); playClickSound()">Aceptar</button>
          </div>
        </div>
      </div>

    </div>
  `
})
export class HomeComponent implements OnInit {
  inv: any = null;
  username = '';
  userId = '';
  loading = true;
  showGuide = false;
  isMuted = false;
  totalCartasCount = 0;
  
  tutorialActive = false;
  tutorialStep = 0;

  private supabase = inject(SupabaseService);
  private inventoryService = inject(InventoryService);
  private audioService = inject(AudioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  async ngOnInit() {
    if (!this.isBrowser) return;
    this.isMuted = this.audioService.muted;
    this.loading = true;
    this.cdr.detectChanges();

    try {
      const { data: userAuth } = await this.supabase.auth.getUser();
      if (userAuth.user) {
        this.userId = userAuth.user.id;
        
        // 1. Intentar cargar el nombre guardado en usuarios
        const { data: userData } = await this.supabase.client
          .from('usuarios')
          .select('username')
          .eq('id', this.userId)
          .single();
        
        if (userData && userData.username) {
          this.username = userData.username;
        } else {
          // 2. Si no hay registro de usuario pero tenemos username en metadata del registro, lo creamos
          const metaUsername = userAuth.user.user_metadata?.['username'];
          const defaultName = metaUsername || userAuth.user.email?.split('@')[0] || 'Entrenador';
          
          await this.supabase.client.from('usuarios').upsert({
            id: this.userId,
            username: defaultName
          });
          
          this.username = defaultName;
        }

        // Determinar si es la primera vez para mostrar tutorial
        const tutorialSeen = localStorage.getItem('damaris_tutorial_seen_' + this.userId);
        if (!tutorialSeen) {
          this.startTutorial();
        }
      }
      
      // Obtener el inventario
      this.inv = await this.inventoryService.getInventory();
      if (this.inv && this.inv.cartas) {
        this.totalCartasCount = this.inv.cartas.length;
      }
    } catch(e) {
      console.error(e);
    }

    this.loading = false;
    this.cdr.detectChanges();
  }

  playClickSound() {
    this.audioService.playClick();
  }

  startTutorial() {
    this.tutorialActive = true;
    this.tutorialStep = 1;
    this.cdr.detectChanges();
  }

  nextTutorialStep() {
    this.tutorialStep++;
    if (this.tutorialStep > 5) {
      this.endTutorial();
    }
    this.cdr.detectChanges();
  }

  skipTutorial() {
    this.endTutorial();
  }

  async endTutorial() {
    this.tutorialActive = false;
    this.tutorialStep = 0;
    if (this.isBrowser) {
      localStorage.setItem('damaris_tutorial_seen_' + this.userId, 'true');
    }
    this.cdr.detectChanges();
  }

  closeGuide() {
    this.showGuide = false;
    this.cdr.detectChanges();
  }

  goTo(path: string) {
    this.playClickSound();
    setTimeout(() => {
      this.router.navigateByUrl(path);
    }, 120);
  }

  goToSimulator() {
    this.playClickSound();
  }

  async logout() {
    this.playClickSound();
    await this.supabase.auth.signOut();
    this.router.navigate(['/auth']);
  }

  toggleMute() {
    this.isMuted = this.audioService.toggleMute();
    this.cdr.detectChanges();
  }
}
