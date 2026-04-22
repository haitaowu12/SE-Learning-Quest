import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import type { LevelMeta, ModuleMeta } from '@/types/index.ts';

export class ModuleScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private moduleId!: number;

  constructor() {
    super({ key: 'ModuleScene' });
  }

  init(data: { moduleId: number }): void {
    this.moduleId = data.moduleId;
  }

  create(): void {
    this.gameManager = new GameManager();
    this.levelManager = new LevelManager();

    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 0, width, height);

    const modules = this.levelManager.getModules(this.gameManager.getProgress());
    const module = modules.find((m) => m.id === this.moduleId);
    if (!module) {
      this.scene.start('MapScene');
      return;
    }

    // Title
    this.add.text(width / 2, 40, module.title, {
      fontSize: '36px',
      color: module.themeColor,
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, 80, module.description, {
      fontSize: '16px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // Level cards
    const startY = 140;
    const cardHeight = 90;
    const gap = 16;
    module.levels.forEach((level, index) => {
      this.renderLevelCard(level, width / 2, startY + index * (cardHeight + gap), cardHeight, module);
    });

    // Back button
    this.createBackButton(80, height - 40);
  }

  private renderLevelCard(level: LevelMeta, x: number, y: number, height: number, mod: ModuleMeta): void {
    const width = 500;
    const container = this.add.container(x, y);
    const color = level.locked ? 0x475569 : parseInt(mod.themeColor.replace('#', ''), 16);

    const bg = this.add.graphics();
    bg.fillStyle(level.locked ? 0x1e293b : 0x0f172a, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
    bg.lineStyle(2, color, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
    container.add(bg);

    const title = this.add.text(-width / 2 + 20, -height / 2 + 15, `${level.id.split('_')[1]}. ${level.title}`, {
      fontSize: '18px',
      color: level.locked ? '#64748b' : '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    });
    container.add(title);

    const objective = this.add.text(-width / 2 + 20, -height / 2 + 42, level.learningObjective, {
      fontSize: '13px',
      color: level.locked ? '#475569' : '#94a3b8',
      fontFamily: 'sans-serif',
    });
    container.add(objective);

    if (level.completed) {
      const scoreText = this.add.text(width / 2 - 20, -height / 2 + 15, `★ ${level.bestScore}`, {
        fontSize: '16px',
        color: '#f59e0b',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(1, 0);
      container.add(scoreText);

      const check = this.add.text(width / 2 - 20, 0, '✓', {
        fontSize: '24px',
        color: '#10b981',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(1, 0.5);
      container.add(check);
    } else if (level.locked) {
      const lock = this.add.text(width / 2 - 20, 0, '🔒', {
        fontSize: '20px',
        color: '#475569',
        fontFamily: 'sans-serif',
      }).setOrigin(1, 0.5);
      container.add(lock);
    } else {
      const play = this.add.text(width / 2 - 20, 0, '▶', {
        fontSize: '20px',
        color: mod.themeColor,
        fontFamily: 'sans-serif',
      }).setOrigin(1, 0.5);
      container.add(play);
    }

    if (!level.locked) {
      container.setSize(width, height);
      container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

      container.on('pointerover', () => {
        bg.clear();
        bg.fillStyle(0x1e293b, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        bg.lineStyle(3, color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        this.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(0x0f172a, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, 12);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, 12);
        this.input.setDefaultCursor('default');
      });

      container.on('pointerdown', () => {
        this.scene.start('LevelScene', { levelId: level.id });
      });
    }
  }

  private createBackButton(x: number, y: number): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x475569, 1);
    bg.fillRoundedRect(-60, -20, 120, 40, 8);
    const label = this.add.text(0, 0, '← Back', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(120, 40);
    btn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x64748b, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, 8);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x475569, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, 8);
    });
    btn.on('pointerdown', () => {
      this.scene.start('MapScene');
    });
  }
}
