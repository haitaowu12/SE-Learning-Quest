import * as Phaser from 'phaser';
import type { GameSettings } from '@/types/index.ts';

export class AudioManager {
  private scene: Phaser.Scene;
  private settings: GameSettings;
  private bgm?: Phaser.Sound.BaseSound;
  private sfxSounds: Map<string, Phaser.Sound.BaseSound> = new Map();

  constructor(scene: Phaser.Scene, settings: GameSettings) {
    this.scene = scene;
    this.settings = settings;
  }

  playBGM(key: string): void {
    if (this.settings.muted) return;
    if (this.bgm) {
      this.bgm.stop();
    }
    if (this.scene.cache.audio.exists(key)) {
      this.bgm = this.scene.sound.add(key, { loop: true, volume: this.settings.musicVolume * this.settings.masterVolume });
      this.bgm.play();
    }
  }

  stopBGM(): void {
    if (this.bgm) {
      this.bgm.stop();
      this.bgm = undefined;
    }
  }

  playSFX(key: string): void {
    if (this.settings.muted) return;
    if (!this.scene.cache.audio.exists(key)) return;
    if (!this.sfxSounds.has(key)) {
      this.sfxSounds.set(key, this.scene.sound.add(key, { volume: this.settings.sfxVolume * this.settings.masterVolume }));
    }
    const sound = this.sfxSounds.get(key);
    if (sound) {
      sound.play();
    }
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    if (this.bgm) {
      const vol = this.settings.musicVolume * this.settings.masterVolume;
      (this.bgm as Phaser.Sound.WebAudioSound).setVolume(vol);
      if (this.settings.muted) {
        this.bgm.pause();
      } else {
        this.bgm.resume();
      }
    }
  }
}
