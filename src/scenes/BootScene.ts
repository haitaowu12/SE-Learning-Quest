import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { IconSprites } from '../utils/iconSprites.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0xFFD23F, 1);
    bg.fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height / 2 - 52, 'HARBOUR LINE', {
      fontSize: '54px',
      fontFamily: '"Syne", sans-serif',
      color: '#121212',
      fontStyle: 'bold',
      letterSpacing: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 2, 'Preparing decision simulator', {
      fontSize: '18px',
      fontFamily: '"Space Grotesk", sans-serif',
      color: '#333333',
    }).setOrigin(0.5);

    const barWidth = Math.min(420, width * 0.42);
    const barY = height / 2 + 54;
    const box = this.add.graphics();
    box.lineStyle(2, 0x121212, 1);
    box.strokeRect((width - barWidth) / 2, barY, barWidth, 14);

    const fill = this.add.graphics();
    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(0xFF6B35, 1);
      fill.fillRect((width - barWidth) / 2 + 2, barY + 2, (barWidth - 4) * value, 10);
    });

    title.setAlpha(0.96);
  }

  create(): void {
    const gameManager = GameManager.getInstance();
    const audioManager = new AudioManager(gameManager.getSettings());
    this.registry.set('audioManager', audioManager);
    IconSprites.generateAllTextures(this);

    TransitionManager.fadeOut(this, 250, () => {
      this.scene.start('TitleScene');
    });
  }
}
