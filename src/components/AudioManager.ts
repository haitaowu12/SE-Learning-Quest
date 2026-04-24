import * as Phaser from 'phaser';
import type { GameSettings } from '@/types/index.ts';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private settings: GameSettings;
  private bgmGain: GainNode | null = null;
  private bgmOscillators: OscillatorNode[] = [];
  private bgmPlaying = false;

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
        osc.type = 'sine';
        osc.frequency.value = 440;
        osc.connect(gain);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
        break;
      }
      case 'sfx-correct': {
        const osc1 = ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 523;
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
        osc2.frequency.value = 659;
        osc2.connect(gain2);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(volume, now + 0.1);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc2.start(now + 0.1);
        osc2.stop(now + 0.2);
        break;
      }
      case 'sfx-wrong': {
        const osc1 = ctx.createOscillator();
        osc1.type = 'square';
        osc1.frequency.value = 330;
        osc1.connect(gain);
        gain.gain.setValueAtTime(volume * 0.5, now);
        gain.gain.setValueAtTime(volume * 0.5, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc1.start(now);
        osc1.stop(now + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        gain2.connect(ctx.destination);
        gain2.gain.value = volume * 0.5;
        osc2.type = 'square';
        osc2.frequency.value = 220;
        osc2.connect(gain2);
        gain2.gain.setValueAtTime(0.001, now);
        gain2.gain.setValueAtTime(volume * 0.5, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.3);
        break;
      }
      case 'sfx-success': {
        const notes = [523, 659, 784];
        notes.forEach((freq, i) => {
          const osc = ctx.createOscillator();
          const noteGain = ctx.createGain();
          noteGain.connect(ctx.destination);
          noteGain.gain.value = volume;
          osc.type = 'sine';
          osc.frequency.value = freq;
          osc.connect(noteGain);
          const start = now + i * 0.12;
          noteGain.gain.setValueAtTime(0.001, start);
          noteGain.gain.setValueAtTime(volume, start + 0.02);
          noteGain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
          osc.start(start);
          osc.stop(start + 0.3);
        });
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
    if (this.settings.muted) return;

    this.bgmGain = ctx.createGain();
    this.bgmGain.connect(ctx.destination);
    const vol = this.settings.musicVolume * this.settings.masterVolume * 0.15;
    this.bgmGain.gain.value = vol;

    const droneFreqs = [65.41, 98.0, 130.81];
    droneFreqs.forEach((freq) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      osc.connect(this.bgmGain!);
      osc.start();
      this.bgmOscillators.push(osc);
    });

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 2;
    lfo.connect(lfoGain);
    lfoGain.connect(this.bgmOscillators[0].frequency);
    lfo.start();
    this.bgmOscillators.push(lfo);

    const shimmer = ctx.createOscillator();
    shimmer.type = 'triangle';
    shimmer.frequency.value = 261.63;
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = vol * 0.3;
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmer.start();
    this.bgmOscillators.push(shimmer);

    const shimmerLfo = ctx.createOscillator();
    shimmerLfo.type = 'sine';
    shimmerLfo.frequency.value = 0.05;
    const shimmerLfoGain = ctx.createGain();
    shimmerLfoGain.gain.value = vol * 0.15;
    shimmerLfo.connect(shimmerLfoGain);
    shimmerLfoGain.connect(shimmerGain.gain);
    shimmerLfo.start();
    this.bgmOscillators.push(shimmerLfo);

    this.bgmPlaying = true;
  }

  stopBGM(): void {
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    this.bgmOscillators = [];
    this.bgmGain = null;
    this.bgmPlaying = false;
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
