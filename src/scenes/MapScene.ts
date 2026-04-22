import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import type { ModuleMeta } from '@/types/index.ts';

export class MapScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;

  constructor() {
    super({ key: 'MapScene' });
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

    // Title
    this.add.text(width / 2, 40, 'Learning Map', {
      fontSize: '36px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const modules = this.levelManager.getModules(this.gameManager.getProgress());

    // Draw connection lines
    const nodePositions = this.calculateNodePositions(modules, width, height);
    const gfx = this.add.graphics();
    gfx.lineStyle(3, 0x334155, 1);
    for (let i = 0; i < nodePositions.length - 1; i++) {
      gfx.lineBetween(nodePositions[i].x, nodePositions[i].y, nodePositions[i + 1].x, nodePositions[i + 1].y);
    }

    // Draw module nodes
    modules.forEach((mod, index) => {
      this.renderModuleNode(mod, nodePositions[index]);
    });

    // Back button
    this.createBackButton(80, height - 40);
  }

  private calculateNodePositions(modules: ModuleMeta[], width: number, height: number): { x: number; y: number }[] {
    const startX = width * 0.15;
    const endX = width * 0.85;
    const y = height * 0.55;
    const step = modules.length > 1 ? (endX - startX) / (modules.length - 1) : 0;
    return modules.map((_, i) => ({ x: startX + step * i, y }));
  }

  private renderModuleNode(mod: ModuleMeta, pos: { x: number; y: number }): void {
    const container = this.add.container(pos.x, pos.y);
    const color = mod.locked ? 0x475569 : parseInt(mod.themeColor.replace('#', ''), 16);

    // Outer ring
    const outer = this.add.graphics();
    outer.lineStyle(4, color, 1);
    outer.strokeCircle(0, 0, 50);
    container.add(outer);

    // Inner fill
    const inner = this.add.graphics();
    inner.fillStyle(mod.locked ? 0x1e293b : 0x0f172a, 1);
    inner.fillCircle(0, 0, 46);
    container.add(inner);

    // Icon / number
    const label = this.add.text(0, -5, mod.locked ? '🔒' : `${mod.id}`, {
      fontSize: '28px',
      color: mod.locked ? '#64748b' : '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    // Module title
    const title = this.add.text(0, 65, mod.title, {
      fontSize: '14px',
      color: mod.locked ? '#64748b' : '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    container.add(title);

    // Completion indicator
    if (mod.completed) {
      const check = this.add.text(35, -35, '✓', {
        fontSize: '20px',
        color: '#10b981',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(check);
    }

    if (!mod.locked) {
      container.setSize(100, 100);
      container.setInteractive(new Phaser.Geom.Circle(0, 0, 50), Phaser.Geom.Circle.Contains);

      container.on('pointerover', () => {
        outer.clear();
        outer.lineStyle(4, color, 1);
        outer.strokeCircle(0, 0, 55);
        this.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        outer.clear();
        outer.lineStyle(4, color, 1);
        outer.strokeCircle(0, 0, 50);
        this.input.setDefaultCursor('default');
      });

      container.on('pointerdown', () => {
        this.scene.start('ModuleScene', { moduleId: mod.id });
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
      this.scene.start('TitleScene');
    });
  }
}
