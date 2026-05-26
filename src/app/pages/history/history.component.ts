import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SqliteService } from '../../core/services/sqlite/sqlite.service';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; padding: 2rem; background: radial-gradient(circle at center, #0f172a 0%, #05070a 100%); position: relative; overflow-x: hidden;">
      
      <!-- Holographic Grid Overlay -->
      <div class="royal-pattern"></div>

      <div style="position: relative; z-index: 2; max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; align-items: center;">
        
        <header style="width: 100%; display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 1rem;">
          <a routerLink="/home" class="btn" (click)="playClick()">Volver al Mando</a>
          <h1 class="royal-title text-gold" style="margin: 0; font-size: 2.2rem; color: var(--pokedex-cyan); text-shadow: 0 0 10px var(--pokedex-cyan-glow);">Bitácora de Duelos</h1>
          <div style="width: 150px;"></div> <!-- Spacer -->
        </header>

        <!-- Resumen Global y Gráfica -->
        <div class="altar-panel" style="width: 100%; max-width: 900px; display: flex; gap: 3rem; margin-bottom: 3rem; padding: 2rem; align-items: center; justify-content: center; border-color: var(--pokedex-cyan);">
          
          <!-- Gráfica de Dona usando conic-gradient -->
          <div style="position: relative; width: 140px; height: 140px; border-radius: 50%; border: 3px solid rgba(0, 240, 255, 0.4); box-shadow: 0 0 15px rgba(0,0,0,0.8), inset 0 0 10px rgba(0,0,0,0.5);"
               [style.background]="getPieChartStyle()">
            <!-- Centro de la Dona -->
            <div style="position: absolute; top: 18px; left: 18px; right: 18px; bottom: 18px; background: #0c0d12; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: inset 0 0 10px rgba(0,0,0,0.8);">
              <div style="text-align: center;">
                <div style="font-size: 0.75rem; color: var(--pokedex-steel-light); text-transform: uppercase; font-family: var(--font-title);">Total</div>
                <div style="font-size: 1.4rem; font-weight: bold; color: #fff; font-family: var(--font-title);">{{ totalWins + totalLosses }}</div>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.8rem;">
            <div>
              <h2 class="royal-title text-gold" style="font-size: 1.4rem; margin-bottom: 0; color: #fff;">Consola de Rendimiento</h2>
              <p style="color: var(--pokedex-steel-light); font-size: 0.85rem; font-style: italic;">Auditoría de victorias y derrotas acumuladas.</p>
            </div>
            <div style="display: flex; gap: 2rem; flex-wrap: wrap;">
              <div>
                <div style="font-size: 0.75rem; color: var(--pokedex-green); text-transform: uppercase; font-family: var(--font-title); font-weight: bold;">Vs Simulador (Vic)</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: var(--pokedex-green);">{{ getOfflineWins() }}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--pokedex-cyan); text-transform: uppercase; font-family: var(--font-title); font-weight: bold;">Vs Entrenador (Vic)</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: var(--pokedex-cyan);">{{ getOnlineWins() }}</div>
              </div>
              <div>
                <div style="font-size: 0.75rem; color: var(--pokedex-red); text-transform: uppercase; font-family: var(--font-title); font-weight: bold;">Derrotas Totales</div>
                <div style="font-size: 1.3rem; font-weight: bold; color: var(--pokedex-red);">{{ totalLosses }}</div>
              </div>
            </div>
          </div>

        </div>

        <!-- Tablas de Registros -->
        <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
          
          <!-- Historial Offline -->
          <div class="altar-panel" style="padding: 1.5rem; border-color: rgba(57, 255, 20, 0.3);">
            <h2 class="royal-title" style="color: var(--pokedex-green); font-size: 1.3rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(57, 255, 20, 0.2); padding-bottom: 0.4rem; text-shadow: 0 0 5px var(--pokedex-green-glow);">
              Duelos vs Simuladores
            </h2>
            
            <div *ngIf="offlineHistory.length === 0" style="color: var(--pokedex-steel-light); text-align: center; padding: 2rem; font-style: italic;">
              El registro local está vacío. Inicia simulaciones de combate.
            </div>
            
            <div *ngFor="let match of offlineHistory" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-weight: bold; text-transform: uppercase; font-family: var(--font-title); font-size: 0.8rem; color: #fff;">Simulación: {{ match.difficulty.toUpperCase() }}</div>
                <div style="font-size: 0.75rem; color: var(--pokedex-steel-light);">{{ match.timestamp | date:'short' }}</div>
              </div>
              <div style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 900;" [style.color]="match.result === 'win' ? 'var(--pokedex-green)' : 'var(--pokedex-red)'">
                {{ match.result === 'win' ? 'VICTORIA' : 'DERROTA' }}
              </div>
            </div>
          </div>

          <!-- Historial Online -->
          <div class="altar-panel" style="padding: 1.5rem; border-color: rgba(0, 240, 255, 0.3);">
            <h2 class="royal-title text-gold" style="font-size: 1.3rem; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 0.4rem; color: var(--pokedex-cyan); text-shadow: 0 0 5px var(--pokedex-cyan-glow);">
              Duelos del Estadio (P2P)
            </h2>
            
            <div *ngIf="onlineHistory.length === 0" style="color: var(--pokedex-steel-light); text-align: center; padding: 2rem; font-style: italic;">
              No has disputado combates online en el estadio.
            </div>

            <div *ngFor="let match of onlineHistory" style="display: flex; justify-content: space-between; align-items: center; padding: 0.8rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
              <div>
                <div style="font-weight: bold; text-transform: uppercase; font-family: var(--font-title); font-size: 0.8rem; color: #fff;">Oponente: {{ match.opponentName }}</div>
                <div style="font-size: 0.75rem; color: var(--pokedex-steel-light);">{{ match.timestamp | date:'short' }}</div>
              </div>
              <div style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 900;" [style.color]="match.result === 'win' ? 'var(--pokedex-cyan)' : 'var(--pokedex-red)'">
                {{ match.result === 'win' ? 'VICTORIA' : 'DERROTA' }}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  `
})
export class HistoryComponent implements OnInit {
  offlineHistory: any[] = [];
  onlineHistory: any[] = [];

  totalWins = 0;
  totalLosses = 0;

  private sqlite = inject(SqliteService);
  private supabase = inject(SupabaseService);
  private audioService = inject(AudioService);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  async ngOnInit() {
    if (!this.isBrowser) return;

    // Cargar historial Offline de SQLite
    this.offlineHistory = await this.sqlite.getMatchHistory();
    this.offlineHistory.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    this.totalWins += this.offlineHistory.filter(m => m.result === 'win').length;
    this.totalLosses += this.offlineHistory.filter(m => m.result === 'lose').length;

    // Cargar historial Online de Supabase
    try {
      const { data: userAuth } = await this.supabase.auth.getUser();
      if (userAuth.user) {
        const { data } = await this.supabase.client
          .from('partidas')
          .select('*, jugador1:usuarios!partidas_id_jugador1_fkey(username), jugador2:usuarios!partidas_id_jugador2_fkey(username)')
          .or(`id_jugador1.eq.${userAuth.user.id},id_jugador2.eq.${userAuth.user.id}`)
          .neq('estado', 'esperando');
        
        if (data) {
          this.onlineHistory = data.map((p: any) => {
            const isJugador1 = p.id_jugador1 === userAuth.user.id;
            const u1 = p.jugador1;
            const u2 = p.jugador2;
            const u1Name = Array.isArray(u1) ? u1[0]?.username : u1?.username;
            const u2Name = Array.isArray(u2) ? u2[0]?.username : u2?.username;
            const opponentName = isJugador1 ? (u2Name || 'Entrenador Online') : (u1Name || 'Entrenador Online');
            return {
              timestamp: p.creado_en,
              result: p.ganador === userAuth.user.id ? 'win' : (p.ganador ? 'lose' : 'draw'),
              opponentName
            };
          }).filter(p => p.result !== 'draw');
 
          this.onlineHistory.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

          this.totalWins += this.onlineHistory.filter(m => m.result === 'win').length;
          this.totalLosses += this.onlineHistory.filter(m => m.result === 'lose').length;
        }
      }
    } catch(e) {
      console.error("Error reading online history:", e);
    }
    
    this.cdr.detectChanges();
  }

  playClick() {
    this.audioService.playClick();
  }

  getOfflineWins(): number {
    return this.offlineHistory.filter(m => m.result === 'win').length;
  }

  getOnlineWins(): number {
    return this.onlineHistory.filter(m => m.result === 'win').length;
  }

  getPieChartStyle(): string {
    const total = this.totalWins + this.totalLosses;
    if (total === 0) {
      return 'conic-gradient(#333 0%, #333 100%)';
    }
    
    const offlineWins = this.getOfflineWins();
    const onlineWins = this.getOnlineWins();

    const offW_pct = (offlineWins / total) * 100;
    const onW_pct = (onlineWins / total) * 100;

    // Colores: 
    // Vs IA: var(--pokedex-green) -> #39ff14
    // Vs Online: var(--pokedex-cyan) -> #00f0ff
    // Derrotas: var(--pokedex-red) -> #ff0055
    let grad = `conic-gradient(`;
    grad += `#39ff14 0% ${offW_pct}%, `;
    grad += `#00f0ff ${offW_pct}% ${offW_pct + onW_pct}%, `;
    grad += `#ff0055 ${offW_pct + onW_pct}% 100%)`;
    return grad;
  }
}
