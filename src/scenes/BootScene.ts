import * as Phaser from 'phaser';
import { AudioManager } from '@/components/AudioManager.ts';
import { GameManager } from '@/game/GameManager.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';
import { IconSprites } from '@/utils/iconSprites.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillStyle(0x0f172a, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, height / 2 - 40, 'SE Learning Quest', {
      fontSize: '48px',
      color: '#0ea5e9',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const barWidth = 400;
    const barHeight = 20;
    const barX = (width - barWidth) / 2;
    const barY = height / 2 + 40;

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1e293b, 1);
    progressBox.fillRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 4);

    const loadingText = this.add.text(width / 2, barY + 30, 'Loading...', {
      fontSize: '18px',
      color: '#94a3b8',
    }).setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0x0ea5e9, 1);
      progressBar.fillRoundedRect(barX, barY, barWidth * value, barHeight, 4);
      loadingText.setText(`Loading... ${Math.round(value * 100)}%`);
    });

    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
    });

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Asset load error: ${file.key}, generating placeholder`);
      this.createPlaceholderTexture(file.key, file.type);
    });
  }

  create(): void {
    const gameManager = GameManager.getInstance();
    const audioManager = new AudioManager(gameManager.getSettings());
    this.registry.set('audioManager', audioManager);

    IconSprites.generateAllTextures(this);

    const placeholders = [
      { key: 'title-bg', type: 'image' },
      { key: 'map-bg', type: 'image' },
      { key: 'btn-start', type: 'image' },
      { key: 'btn-settings', type: 'image' },
      { key: 'btn-back', type: 'image' },
      { key: 'particle', type: 'image' },
      { key: 'avatar-player', type: 'image' },
      { key: 'avatar-guide', type: 'image' },
    ];
    placeholders.forEach(p => {
      if (!this.textures.exists(p.key)) {
        this.createPlaceholderTexture(p.key, p.type);
      }
    });

    TransitionManager.fadeOut(this, 300, () => {
      this.scene.start('TitleScene');
    });
  }

  private createPlaceholderTexture(key: string, type: string): void {
    if (type === 'image') {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      let w = 16, h = 16;
      if (key.includes('bg')) {
        gfx.fillStyle(0x1e293b, 1);
        gfx.fillRect(0, 0, 1920, 1080);
        w = 1920; h = 1080;
      } else if (key.includes('btn')) {
        gfx.fillStyle(0x0ea5e9, 1);
        gfx.fillRoundedRect(0, 0, 200, 60, 8);
        w = 200; h = 60;
      } else if (key.includes('avatar')) {
        gfx.fillStyle(0x6366f1, 1);
        gfx.fillCircle(32, 32, 32);
        w = 64; h = 64;
      } else {
        gfx.fillStyle(0x0ea5e9, 1);
        gfx.fillCircle(8, 8, 8);
        w = 16; h = 16;
      }
      gfx.generateTexture(key, w, h);
      gfx.destroy();
    }
  }
}
