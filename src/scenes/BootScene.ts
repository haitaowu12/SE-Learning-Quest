import * as Phaser from 'phaser';
import { AudioManager } from '@/components/AudioManager.ts';
import { GameManager } from '@/game/GameManager.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';

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

    this.load.image('title-bg', 'assets/backgrounds/title.png');
    this.load.image('map-bg', 'assets/backgrounds/map.png');
    this.load.image('btn-start', 'assets/ui/btn-start.png');
    this.load.image('btn-settings', 'assets/ui/btn-settings.png');
    this.load.image('btn-back', 'assets/ui/btn-back.png');
    this.load.image('particle', 'assets/ui/particle.png');
    this.load.image('avatar-player', 'assets/sprites/avatar-player.png');
    this.load.image('avatar-guide', 'assets/sprites/avatar-guide.png');

    this.load.on('loaderror', (file: Phaser.Loader.File) => {
      console.warn(`Asset load error: ${file.key}, generating placeholder`);
      this.createPlaceholderTexture(file.key, file.type);
    });
  }

  create(): void {
    const gameManager = GameManager.getInstance();
    const audioManager = new AudioManager(gameManager.getSettings());
    this.registry.set('audioManager', audioManager);

    TransitionManager.fadeOut(this, 300, () => {
      this.scene.start('TitleScene');
    });
  }

  private createPlaceholderTexture(key: string, type: string): void {
    if (type === 'image') {
      const gfx = this.make.graphics({ x: 0, y: 0 });
      if (key.includes('bg')) {
        gfx.fillStyle(0x1e293b, 1);
        gfx.fillRect(0, 0, 1920, 1080);
      } else if (key.includes('btn')) {
        gfx.fillStyle(0x0ea5e9, 1);
        gfx.fillRoundedRect(0, 0, 200, 60, 8);
      } else if (key.includes('avatar')) {
        gfx.fillStyle(0x6366f1, 1);
        gfx.fillCircle(32, 32, 32);
      } else {
        gfx.fillStyle(0x0ea5e9, 1);
        gfx.fillCircle(16, 16, 16);
      }
      gfx.generateTexture(key, 1920, 1080);
    }
  }
}
