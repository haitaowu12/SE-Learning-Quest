import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { IconSprites } from '../utils/iconSprites.ts';

export class BootScene extends Phaser.Scene {
  private bg?: Phaser.GameObjects.Graphics;
  private route?: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    const { width, height } = this.scale;
    const bg = this.add.graphics();
    bg.fillStyle(0xf7f8f4, 1);
    bg.fillRect(0, 0, width, height);

    const title = this.add.text(width / 2, height / 2 - 52, 'SE LEARNING QUEST', {
      fontSize: '54px',
      fontFamily: '"Syne", sans-serif',
      color: '#17211c',
      fontStyle: 'bold',
      letterSpacing: 8,
    }).setOrigin(0.5);

    this.add.text(width / 2, height / 2 + 2, 'Preparing episode selector', {
      fontSize: '18px',
      fontFamily: '"Space Grotesk", sans-serif',
      color: '#4d5c54',
    }).setOrigin(0.5);

    const barWidth = Math.min(420, width * 0.42);
    const barY = height / 2 + 54;
    const box = this.add.graphics();
    box.lineStyle(2, 0x121212, 1);
    box.strokeRect((width - barWidth) / 2, barY, barWidth, 14);

    const fill = this.add.graphics();
    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(0xb8642a, 1);
      fill.fillRect((width - barWidth) / 2 + 2, barY + 2, (barWidth - 4) * value, 10);
    });

    title.setAlpha(0.96);
  }

  create(): void {
    const gameManager = GameManager.getInstance();
    const audioManager = new AudioManager(gameManager.getSettings());
    this.registry.set('audioManager', audioManager);
    IconSprites.generateAllTextures(this);

    this.drawShell();
    this.scale.on(Phaser.Scale.Events.RESIZE, this.drawShell, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off(Phaser.Scale.Events.RESIZE, this.drawShell, this);
    });
  }

  private drawShell(): void {
    const { width, height } = this.scale;
    this.bg?.destroy();
    this.route?.destroy();

    this.bg = this.add.graphics();
    this.bg.fillStyle(0xf7f8f4, 1);
    this.bg.fillRect(0, 0, width, height);

    this.bg.lineStyle(1, 0x17211c, 0.05);
    const step = Math.max(46, Math.min(80, Math.round(width / 18)));
    for (let x = 0; x <= width; x += step) this.bg.lineBetween(x, 0, x, height);
    for (let y = 0; y <= height; y += step) this.bg.lineBetween(0, y, width, y);

    this.route = this.add.graphics();
    this.route.lineStyle(Math.max(4, width * 0.005), 0x183d31, 0.12);
    const points = [
      [width * 0.04, height * 0.78],
      [width * 0.22, height * 0.58],
      [width * 0.38, height * 0.64],
      [width * 0.56, height * 0.42],
      [width * 0.72, height * 0.52],
      [width * 0.92, height * 0.24],
    ];
    for (let index = 0; index < points.length - 1; index += 1) {
      const [x1, y1] = points[index];
      const [x2, y2] = points[index + 1];
      this.route.lineBetween(x1, y1, x2, y2);
    }
    this.route.fillStyle(0xb8642a, 0.12);
    points.forEach(([x, y]) => {
      this.route?.fillCircle(x, y, Math.max(10, width * 0.01));
    });
  }
}
