import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';

export class TitleScene extends Phaser.Scene {
  private gameManager!: GameManager;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.gameManager = new GameManager();
    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 0, width, height);

    // Decorative particles
    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 6);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
      const circle = this.add.circle(x, y, size, 0x0ea5e9, alpha);
      this.tweens.add({
        targets: circle,
        y: y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    // Title
    this.add.text(width / 2, height * 0.25, 'SE Learning Quest', {
      fontSize: '64px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.25 + 60, 'Master Systems Engineering Through Play', {
      fontSize: '24px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // Progress summary
    const progress = this.gameManager.getOverallProgress();
    if (progress.completedLevels > 0) {
      this.add.text(width / 2, height * 0.4, `Progress: ${progress.percentage}% (${progress.completedLevels}/${progress.totalLevels} levels)`, {
        fontSize: '18px',
        color: '#0ea5e9',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    }

    // Buttons
    const btnY = height * 0.55;
    const btnSpacing = 70;

    this.createButton(width / 2, btnY, 'Start Learning', () => {
      this.scene.start('MapScene');
    });

    this.createButton(width / 2, btnY + btnSpacing, 'Continue', () => {
      this.scene.start('MapScene');
    });

    this.createButton(width / 2, btnY + btnSpacing * 2, 'Settings', () => {
      this.showSettings();
    });

    // Footer
    this.add.text(width / 2, height - 30, 'Based on INCOSE SEHBv5, ISO 15288, EN 50126', {
      fontSize: '12px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0ea5e9, 1);
    bg.fillRoundedRect(-120, -25, 240, 50, 12);

    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(240, 50);

    btn.setInteractive(new Phaser.Geom.Rectangle(-120, -25, 240, 50), Phaser.Geom.Rectangle.Contains);

    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x0284c7, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 12);
      this.input.setDefaultCursor('pointer');
    });

    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0ea5e9, 1);
      bg.fillRoundedRect(-120, -25, 240, 50, 12);
      this.input.setDefaultCursor('default');
    });

    btn.on('pointerdown', callback);
  }

  private showSettings(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(100);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(101);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 1);
    panelBg.fillRoundedRect(-200, -150, 400, 300, 16);
    panelBg.lineStyle(2, 0x0ea5e9, 1);
    panelBg.strokeRoundedRect(-200, -150, 400, 300, 16);

    const title = this.add.text(0, -120, 'Settings', {
      fontSize: '28px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const settings = this.gameManager.getSettings();

    const muteText = this.add.text(-120, -60, `Sound: ${settings.muted ? 'OFF' : 'ON'}`, {
      fontSize: '18px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    });

    const muteBtn = this.createSmallButton(120, -60, 'Toggle', () => {
      this.gameManager.updateSettings({ muted: !this.gameManager.getSettings().muted });
      muteText.setText(`Sound: ${this.gameManager.getSettings().muted ? 'OFF' : 'ON'}`);
    });

    const resetText = this.add.text(-120, 0, 'Reset Progress', {
      fontSize: '18px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    });

    const resetBtn = this.createSmallButton(120, 0, 'Reset', () => {
      this.gameManager.reset();
      this.scene.restart();
    });

    const closeBtn = this.createSmallButton(0, 80, 'Close', () => {
      overlay.destroy();
      panel.destroy();
    });

    panel.add([panelBg, title, muteText, muteBtn, resetText, resetBtn, closeBtn]);
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x475569, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, 8);
    const label = this.add.text(0, 0, text, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(100, 36);
    btn.setInteractive(new Phaser.Geom.Rectangle(-50, -18, 100, 36), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x64748b, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 8);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x475569, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 8);
    });
    btn.on('pointerdown', callback);
    return btn;
  }
}
