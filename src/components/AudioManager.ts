import * as Phaser from 'phaser';
import type { GameSettings } from '../types/index.ts';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private settings: GameSettings;
  private bgmGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmGainNodes: GainNode[] = [];
  private bgmPlaying = false;
  private bgmLoopId: number | null = null;

  constructor(settings: GameSettings) {
    this.settings = settings;
  }

  private getContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  generateSFX(key: string): void {
    const ctx = this.getContext();
    if (!ctx) return;
    if (this.settings.muted) return;

    const volume = this.settings.sfxVolume * this.settings.masterVolume;
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.value = volume;

    const now = ctx.currentTime;

    switch (key) {
      case 'sfx-click': {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = 300;
        osc.connect(gain);
        gain.gain.setValueAtTime(volume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'sfx-blip': {
        // High-tech typewriter blip
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1200 + Math.random() * 200; // slight variation
        osc.connect(gain);
        gain.gain.setValueAtTime(volume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        osc.start(now);
        osc.stop(now + 0.03);
        break;
      }
      case 'sfx-correct':
      case 'sfx-success': {
        // High-tech success chime
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 523.25; // C5
        osc1.connect(gain);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.setValueAtTime(volume, now + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.start(now);
        osc1.stop(now + 0.1);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        gain2.connect(ctx.destination);
        gain2.gain.value = volume;
        osc2.type = 'sine';
        osc2.frequency.value = 783.99; // G5
        osc2.connect(gain2);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(volume, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.4);
        break;
      }
      case 'sfx-wrong':
      case 'sfx-error': {
        // High-tech error buzz
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.value = 150;
        osc1.connect(gain);
        gain.gain.setValueAtTime(volume * 0.5, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc1.start(now);
        osc1.stop(now + 0.2);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        gain2.connect(ctx.destination);
        gain2.gain.value = volume * 0.5;
        osc2.type = 'square';
        osc2.frequency.value = 100;
        osc2.connect(gain2);
        gain2.gain.setValueAtTime(volume * 0.5, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.3);
        break;
      }
      case 'sfx-level-complete': {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteGain.connect(ctx.destination);
          noteGain.gain.value = volume;
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(noteGain);
          const start = now + i * 0.15;
          noteGain.gain.setValueAtTime(0.001, start);
          noteGain.gain.setValueAtTime(volume * 0.8, start + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
          osc.start(start);
          osc.stop(start + 0.5);
        });
        break;
      }
      case 'sfx-failure': {
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 440;
        osc.connect(gain);
        gain.gain.setValueAtTime(volume * 0.4, now);
        osc.frequency.linearRampToValueAtTime(220, now + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
        break;
      }
      case 'sfx-unlock': {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteGain.connect(ctx.destination);
        noteGain.gain.value = volume;
        osc.type = 'triangle';
        osc.frequency.value = 880;
        osc.connect(noteGain);
        noteGain.gain.setValueAtTime(volume, now);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
        break;
      }
    }
  }

  playSFX(key: string): void {
    this.generateSFX(key);
  }

  playBGM(_key: string): void {
    if (this.bgmPlaying) return;
    const ctx = this.getContext();
    if (!ctx) return;
    // BGM is disabled by default for now unless settings.musicVolume is explicitly handled.
    // The user prefers a non-intrusive BGM.
    if (this.settings.muted) return;

    this.bgmGain = ctx.createGain();
    this.bgmGain.connect(ctx.destination);
    
    // Master volume for BGM. Start at 0 for fade in.
    const targetVol = this.settings.musicVolume * this.settings.masterVolume * 0.08;
    this.bgmGain.gain.setValueAtTime(0, ctx.currentTime);
    this.bgmGain.gain.linearRampToValueAtTime(targetVol, ctx.currentTime + 2.0);

    this.bgmPlaying = true;
    
    // Chords: Am7, Fmaj7, Cmaj7, G (frequencies in Hz)
    const chords = [
      [220.00, 261.63, 329.63, 392.00], // Am7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [196.00, 246.94, 293.66, 392.00]  // G
    ];
    
    let currentChordIdx = 0;
    
    const playNextChord = () => {
      if (!this.bgmPlaying || !this.bgmGain) return;
      const now = ctx.currentTime;
      const chord = chords[currentChordIdx];
      
      chord.forEach(freq => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        // ADSR Envelope
        noteGain.gain.setValueAtTime(0, now);
        // Attack
        noteGain.gain.linearRampToValueAtTime(1.0 / chord.length, now + 0.5);
        // Sustain & Release over 4 seconds
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + 4.0);
        
        osc.connect(noteGain);
        noteGain.connect(this.bgmGain!);
        
        osc.onended = () => {
          this.bgmOscillators = this.bgmOscillators.filter(o => o !== osc);
          this.bgmGainNodes = this.bgmGainNodes.filter(g => g !== noteGain);
        };
        
        osc.start(now);
        osc.stop(now + 4.0);
        
        this.bgmOscillators.push(osc);
        this.bgmGainNodes.push(noteGain);
      });
      
      currentChordIdx = (currentChordIdx + 1) % chords.length;
      
      // Schedule next chord
      this.bgmLoopId = window.setTimeout(playNextChord, 4000);
    };
    
    playNextChord();
  }

  stopBGM(): void {
    this.bgmPlaying = false;
    if (this.bgmLoopId !== null) {
      window.clearTimeout(this.bgmLoopId);
      this.bgmLoopId = null;
    }
    
    const ctx = this.audioContext;
    const now = ctx ? ctx.currentTime : 0;
    
    this.bgmGainNodes.forEach(gain => {
      try {
        if (ctx) {
          gain.gain.cancelScheduledValues(now);
          gain.gain.linearRampToValueAtTime(0, now + 0.1);
        }
      } catch { /* ignore */ }
    });
    
    setTimeout(() => {
      this.bgmOscillators.forEach(osc => {
        try { osc.stop(); osc.disconnect(); } catch { /* already stopped */ }
      });
      this.bgmGainNodes.forEach(gain => {
        try { gain.disconnect(); } catch { /* ignore */ }
      });
      this.bgmOscillators = [];
      this.bgmGainNodes = [];
      if (this.bgmGain) {
        try { this.bgmGain.disconnect(); } catch {}
        this.bgmGain = null;
      }
    }, 150);
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    if (this.bgmGain) {
      const vol = settings.muted ? 0 : settings.musicVolume * settings.masterVolume * 0.15;
      this.bgmGain.gain.value = vol;
    }
    if (settings.muted && this.bgmPlaying) {
      this.stopBGM();
    }
  }

  static fromRegistry(scene: Phaser.Scene): AudioManager | null {
    return scene.registry.get('audioManager') as AudioManager | null;
  }
}
