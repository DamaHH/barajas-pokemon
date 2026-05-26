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
      const now = ctx.currentTime;

      // 1. Transient click noise burst
      const bufferSize = ctx.sampleRate * 0.015; // 15ms burst
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(3500, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.015, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      noiseSource.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseSource.start(now);

      // 2. High-pitch chime glide beep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.02);

      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch (e) {
      console.warn(e);
    }
  }

  playDraw() {
    if (this.isMuted) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const duration = 0.16;

      // Premium card slide effect using twin detuned triangle waves with sweeping filters
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc1.type = 'triangle';
      osc2.type = 'triangle';
      
      // Sweep pitch upwards
      osc1.frequency.setValueAtTime(380, now);
      osc1.frequency.exponentialRampToValueAtTime(1100, now + duration);
      osc2.frequency.setValueAtTime(385, now); // Detuned
      osc2.frequency.exponentialRampToValueAtTime(1112, now + duration);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, now);
      filter.frequency.exponentialRampToValueAtTime(1200, now + duration);
      filter.Q.setValueAtTime(1.5, now);

      gain.gain.setValueAtTime(0.03, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
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
      
      // Sci-fi digital chime arpeggio: C5, E5, G5, C6 with delay simulation
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const delayTime = 0.05; // 50ms between notes
      
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + index * delayTime);
        
        gain.gain.setValueAtTime(0.02, now + index * delayTime);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * delayTime + 0.22);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now + index * delayTime);
        osc.stop(now + index * delayTime + 0.25);
        
        // Echo effect
        const echoOsc = ctx.createOscillator();
        const echoGain = ctx.createGain();
        echoOsc.type = 'sine';
        echoOsc.frequency.setValueAtTime(freq, now + index * delayTime + 0.08);
        
        echoGain.gain.setValueAtTime(0.006, now + index * delayTime + 0.08);
        echoGain.gain.exponentialRampToValueAtTime(0.001, now + index * delayTime + 0.08 + 0.15);
        
        echoOsc.connect(echoGain);
        echoGain.connect(ctx.destination);
        echoOsc.start(now + index * delayTime + 0.08);
        echoOsc.stop(now + index * delayTime + 0.08 + 0.18);
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
      const now = ctx.currentTime;

      if (type === 'attack') {
        // Sci-Fi laser blast with vibrato LFO
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);

        // LFO for vibrato
        lfo.frequency.value = 25; // 25Hz vibrato
        lfoGain.gain.value = 80;  // 80Hz pitch swing

        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        gain.gain.setValueAtTime(0.015, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(ctx.destination);

        lfo.start(now);
        osc.start(now);
        lfo.stop(now + 0.2);
        osc.stop(now + 0.21);
      } else if (type === 'hit') {
        // Realistic 8-bit crash using filtered white noise
        const duration = 0.25;
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noiseSource = ctx.createBufferSource();
        noiseSource.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(900, now);
        filter.frequency.exponentialRampToValueAtTime(80, now + duration);
        filter.Q.setValueAtTime(2.0, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        
        noiseSource.start(now);

        // Low pitch sub support
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'triangle';
        subOsc.frequency.setValueAtTime(120, now);
        subOsc.frequency.linearRampToValueAtTime(30, now + 0.15);
        subGain.gain.setValueAtTime(0.04, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(now);
        subOsc.stop(now + 0.17);
      } else if (type === 'faint') {
        // Detuned sliding pulse waves with tremolo
        const duration = 0.45;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const tremolo = ctx.createOscillator();
        const tremoloGain = ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(440, now);
        osc1.frequency.linearRampToValueAtTime(60, now + duration);
        osc2.frequency.setValueAtTime(443, now); // Detuned by 3Hz
        osc2.frequency.linearRampToValueAtTime(61, now + duration);

        // Tremolo LFO
        tremolo.frequency.value = 16; // 16Hz volume wobble
        tremoloGain.gain.value = 0.5;

        // Modulate volume
        const mainGainNode = ctx.createGain();
        mainGainNode.gain.setValueAtTime(0.015, now);
        mainGainNode.gain.linearRampToValueAtTime(0.001, now + duration);

        tremolo.connect(tremoloGain);
        
        // Connect to a node that shapes output
        osc1.connect(mainGainNode);
        osc2.connect(mainGainNode);
        mainGainNode.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      } else if (type === 'victory') {
        // Triumphant 8-bit major arpeggiated loop
        const duration = 0.65;
        const notes = [392.00, 493.88, 587.33, 783.99, 987.77, 1174.66, 1567.98]; // G4, B4, D5, G5, B5, D6, G6
        const step = 0.06;

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'square';
          osc.frequency.setValueAtTime(freq, now + idx * step);

          gain.gain.setValueAtTime(0.012, now + idx * step);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * step + 0.15);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + idx * step);
          osc.stop(now + idx * step + 0.18);
        });

        // Triumphant final G6 vibrato hold
        const holdOsc = ctx.createOscillator();
        const holdGain = ctx.createGain();
        const holdLfo = ctx.createOscillator();
        const holdLfoGain = ctx.createGain();

        holdOsc.type = 'square';
        holdOsc.frequency.setValueAtTime(1567.98, now + notes.length * step);

        holdLfo.frequency.value = 8; // 8Hz vibrato
        holdLfoGain.gain.value = 15; // pitch swing
        
        holdLfo.connect(holdLfoGain);
        holdLfoGain.connect(holdOsc.frequency);

        holdGain.gain.setValueAtTime(0.01, now + notes.length * step);
        holdGain.gain.exponentialRampToValueAtTime(0.001, now + notes.length * step + 0.35);

        holdOsc.connect(holdGain);
        holdGain.connect(ctx.destination);

        holdLfo.start(now + notes.length * step);
        holdOsc.start(now + notes.length * step);
        holdLfo.stop(now + notes.length * step + 0.35);
        holdOsc.stop(now + notes.length * step + 0.36);
      } else if (type === 'defeat') {
        // Melodramatic falling slide with detuned oscillators
        const duration = 0.6;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'square';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(260, now);
        osc1.frequency.exponentialRampToValueAtTime(65, now + duration);
        osc2.frequency.setValueAtTime(257, now);
        osc2.frequency.exponentialRampToValueAtTime(64, now + duration);

        gain.gain.setValueAtTime(0.018, now);
        gain.gain.linearRampToValueAtTime(0.001, now + duration);

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      }
    } catch (e) {
      console.warn("Synth sound error:", e);
    }
  }
}
