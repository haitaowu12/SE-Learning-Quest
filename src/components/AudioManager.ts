import * as Phaser from 'phaser';
import type { GameSettings } from '@/types/index.ts';

export class AudioManager {
  private audioContext: AudioContext | null = null;
  private settings: GameSettings;

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
    }
  }

  playSFX(key: string): void {
    this.generateSFX(key);
  }

  playBGM(_key: string): void {
  }

  stopBGM(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }

  static fromRegistry(scene: Phaser.Scene): AudioManager | null {
    return scene.registry.get('audioManager') as AudioManager | null;
  }
}
