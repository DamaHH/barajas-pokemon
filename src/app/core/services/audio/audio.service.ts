import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class AudioService {
  private audioCtx: AudioContext | null = null;
  private platformId = inject(PLATFORM_ID);
  private isBrowser: boolean;
  private isMuted = false;

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    if (this.isBrowser) {
      this.isMuted = localStorage.getItem('pokedex_audio_muted') === 'true';
    }
  }

  get muted(): boolean {
    return this.isMuted;
  }

  setMute(state: boolean) {
    this.isMuted = state;
    if (this.isBrowser) {
      localStorage.setItem('pokedex_audio_muted', state ? 'true' : 'false');
    }
  }

  toggleMute(): boolean {
    this.setMute(!this.isMuted);
    return this.isMuted;
  }

  private getAudioContext(): AudioContext | null {
    if (!this.isBrowser || typeof window === 'undefined' || this.isMuted) return null;
    
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    
    return this.audioCtx;
  }

  playClick() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      
      // Sonido de clic sutil y agradable
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.08);
      
      gain.gain.setValueAtTime(0.04, now); // Volumen muy bajo y agradable
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      
      osc.start(now);
      osc.stop(now + 0.09);
    } catch (e) {
      console.warn(e);
    }
  }

  playDraw() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      
      // Deslizamiento suave de carta
      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(1000, now + 0.1);
      
      gain.gain.setValueAtTime(0.02, now); // Muy suave
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      
      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {
      console.warn(e);
    }
  }

  playSummon() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const notes = [130, 196, 261]; // Acorde mayor más suave
      
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.type = 'sine'; // Cambiado de sawtooth a sine para evitar zumbidos
        osc.frequency.setValueAtTime(freq, now);
        osc.frequency.linearRampToValueAtTime(freq + 5, now + 0.3);
        
        gain.gain.setValueAtTime(0.03, now); // Muy suave
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        
        osc.start(now);
        osc.stop(now + 0.32);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  playSynthSound(type: 'attack' | 'hit' | 'faint' | 'victory' | 'defeat' | 'draw' | 'summon') {
    if (this.isMuted) return;
    if (type === 'draw') {
      this.playDraw();
      return;
    }
    if (type === 'summon') {
      this.playSummon();
      return;
    }

    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;

      if (type === 'attack') {
        // Ataque sutil
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.15);
        
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.17);
      } else if (type === 'hit') {
        // Impacto sutil sin ruidos molestos
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.linearRampToValueAtTime(80, now + 0.2);
        
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === 'faint') {
        // Debilitado
        osc.type = 'sine';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.exponentialRampToValueAtTime(60, now + 0.5);
        
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.52);
      } else if (type === 'victory') {
        // Fanfarria corta y melódica suave
        const notes = [261.63, 329.63, 392.00, 523.25];
        notes.forEach((freq, index) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + index * 0.08);
          g.gain.setValueAtTime(0.03, now + index * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);
          o.start(now + index * 0.08);
          o.stop(now + index * 0.08 + 0.35);
        });
      } else if (type === 'defeat') {
        // Derrota corta suave
        const notes = [293.66, 261.63, 220.00];
        notes.forEach((freq, index) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, now + index * 0.12);
          g.gain.setValueAtTime(0.03, now + index * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, now + index * 0.12 + 0.4);
          o.start(now + index * 0.12);
          o.stop(now + index * 0.12 + 0.45);
        });
      }
    } catch (e) {
      console.warn("Synth sound error:", e);
    }
  }
}
