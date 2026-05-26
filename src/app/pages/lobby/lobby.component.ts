import { Component, inject, OnInit, ChangeDetectorRef, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase/supabase.service';
import { AudioService } from '../../core/services/audio/audio.service';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div style="min-height: 100vh; padding: 2rem; background: radial-gradient(circle at center, #0f172a 0%, #05070a 100%); position: relative; overflow-x: hidden;">
      
      <!-- Holographic Grid Overlay -->
      <div class="royal-pattern"></div>

      <div style="position: relative; z-index: 2; max-width: 1000px; margin: 0 auto;">
        
        <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3rem; border-bottom: 1px solid rgba(0, 240, 255, 0.2); padding-bottom: 1rem;">
          <h1 class="royal-title text-gold" style="margin: 0; font-size: 2rem;">Terminal de Enlace Online</h1>
          <a routerLink="/home" class="btn" (click)="playClick()">Volver al Mando</a>
        </header>

        <!-- Controles de creación -->
        <div class="altar-panel" style="display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; margin-bottom: 2rem; border-color: var(--pokedex-cyan);">
          <div>
            <h2 class="royal-title text-gold" style="font-size: 1.1rem; margin-bottom: 0.2rem;">Escáner de Señales</h2>
            <p style="color: var(--pokedex-steel-light); font-size: 0.8rem; font-style: italic;">Encuentra un canal de batalla activo en la red.</p>
          </div>
          <button (click)="createGame()" [disabled]="creating || loading" class="btn-royal-crimson" style="font-size: 0.9rem; padding: 0.6rem 2rem; background: linear-gradient(135deg, var(--pokedex-cyan) 0%, #0099ab 100%); border-color: #7cffff; color: #000;">
            {{ creating ? 'Estableciendo Canal...' : 'Crear Nueva Sala' }}
          </button>
        </div>

        <!-- Cargando -->
        <div *ngIf="loading" style="text-align: center; padding: 4rem;">
          <h3 class="royal-title text-gold" style="font-size: 1.2rem; animation: pulse 1s infinite; color: var(--pokedex-cyan);">Escaneando Frecuencias...</h3>
        </div>

        <!-- Sin salas -->
        <div *ngIf="!loading && partidas.length === 0" class="altar-panel" style="text-align: center; padding: 4rem; border-style: dashed; border-color: rgba(0,240,255,0.2); color: var(--pokedex-steel-light);">
          <p style="font-size: 1.1rem; margin-bottom: 0.5rem; font-style: italic;">No se detectan salas activas.</p>
          <p style="font-size: 0.8rem;">Funda una sala para esperar a otros entrenadores.</p>
        </div>

        <!-- Grilla de salas activas -->
        <div *ngIf="!loading && partidas.length > 0" 
             style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
          
          <div *ngFor="let p of partidas" class="altar-panel" style="padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-color: rgba(0,240,255,0.3);">
            <div style="margin-bottom: 1.5rem;">
              <div style="font-size: 0.75rem; color: var(--pokedex-steel-light); margin-bottom: 0.5rem; font-family: monospace;">CANAL ID: {{ p.id.substring(0,8).toUpperCase() }}</div>
              <div style="font-family: var(--font-title); font-size: 1.2rem; font-weight: bold; color: #fff; margin-bottom: 0.5rem;">
                Entrenador: <span class="text-gold" style="color: var(--pokedex-cyan); text-shadow: 0 0 5px var(--pokedex-cyan-glow);">{{ p.host_username || 'Entrenador' }}</span>
              </div>
              <span style="display: inline-block; background: rgba(57,255,20,0.1); border: 1px solid var(--pokedex-green); color: var(--pokedex-green); padding: 4px 10px; border-radius: 4px; font-size: 0.7rem; font-family: var(--font-title); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                📡 CANAL DISPONIBLE
              </span>
            </div>
            
            <button (click)="joinGame(p.id)" [disabled]="joining" class="btn-royal-gold" style="width: 100%; font-size: 0.85rem; padding: 0.6rem;">
              Enlazar a Combate
            </button>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(1.03); opacity: 1; }
    }
  `]
})
export class LobbyComponent implements OnInit {
  partidas: any[] = [];
  loading = true;
  creating = false;
  joining = false;
  myId = '';

  private supabase = inject(SupabaseService);
  private audioService = inject(AudioService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  async ngOnInit() {
    if (!this.isBrowser) return;

    const { data: userAuth } = await this.supabase.auth.getUser();
    if (!userAuth.user) {
      this.router.navigate(['/auth']);
      return;
    }
    this.myId = userAuth.user.id;
    this.loadGames();

    // Suscribir a cambios en tiempo real
    this.supabase.client.channel('public:partidas')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partidas' }, () => {
        this.loadGames();
      })
      .subscribe();
  }

  playClick() {
    this.audioService.playClick();
  }

  async loadGames() {
    this.loading = true;
    try {
      const { data, error } = await this.supabase.client
        .from('partidas')
        .select('*, usuarios!partidas_id_jugador1_fkey(username)')
        .eq('estado', 'esperando');
      
      if (!error && data) {
        this.partidas = data.map(p => {
          const u = p.usuarios;
          const host_username = Array.isArray(u) ? u[0]?.username : u?.username;
          return {
            ...p,
            host_username: host_username || 'Entrenador'
          };
        });
      }
    } catch(e) {
      console.error(e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  async createGame() {
    this.creating = true;
    this.audioService.playClick();
    
    try {
      const { data: userAuth } = await this.supabase.auth.getUser();
      if (!userAuth.user) throw new Error("No autenticado");

      // Cargar o asegurar perfil SIN sobreescribir el nombre real del entrenador
      const { data: userData } = await this.supabase.client.from('usuarios').select('username').eq('id', this.myId).single();
      if (!userData || !userData.username) {
        const defaultName = userAuth.user.email?.split('@')[0] || 'Entrenador';
        await this.supabase.client.from('usuarios').insert({
          id: this.myId,
          username: defaultName
        });
      }

      const { data, error } = await this.supabase.client
        .from('partidas')
        .insert({
          id_jugador1: this.myId,
          estado: 'esperando',
          estado_juego: {}
        })
        .select()
        .single();
      
      if (error) throw error;
      
      this.router.navigate(['/game'], { queryParams: { online: true, matchId: data.id, role: 'host' } });
    } catch (e: any) {
      alert("Error al fundar sala: " + e.message);
    } finally {
      this.creating = false;
    }
  }

  async joinGame(matchId: string) {
    this.joining = true;
    this.audioService.playClick();

    try {
      const { data: userAuth } = await this.supabase.auth.getUser();
      if (userAuth.user) {
        const { data: userData } = await this.supabase.client.from('usuarios').select('username').eq('id', this.myId).single();
        if (!userData || !userData.username) {
          const defaultName = userAuth.user.email?.split('@')[0] || 'Entrenador';
          await this.supabase.client.from('usuarios').insert({
            id: this.myId,
            username: defaultName
          });
        }
      }

      const { error } = await this.supabase.client
        .from('partidas')
        .update({
          id_jugador2: this.myId,
          estado: 'en_curso'
        })
        .eq('id', matchId);

      if (error) throw error;

      this.router.navigate(['/game'], { queryParams: { online: true, matchId, role: 'guest' } });
    } catch (e: any) {
      alert("Error al unirse al coliseo: " + e.message);
    } finally {
      this.joining = false;
    }
  }
}
