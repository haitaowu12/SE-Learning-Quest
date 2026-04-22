import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import { AudioManager } from '@/components/AudioManager.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';
import { COLORS, RADIUS, FONT } from '@/utils/designTokens.ts';
import { scaledFontSize } from '@/utils/scaling.ts';
import type { ModuleMeta } from '@/types/index.ts';

const COMPETENCY_AXES = [
  { key: 'systems_thinking', label: 'Systems Thinking' },
  { key: 'requirements_engineering', label: 'Requirements' },
  { key: 'architecture_design', label: 'Architecture' },
  { key: 'verification_validation', label: 'V&V' },
  { key: 'integration_management', label: 'Integration' },
] as const;

export class MapScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private focusedIndex = 0;
  private moduleNodes: { container: Phaser.GameObjects.Container; outer: Phaser.GameObjects.Graphics; mod: ModuleMeta; pos: { x: number; y: number } }[] = [];
  private capstoneNode: { container: Phaser.GameObjects.Container; outer: Phaser.GameObjects.Graphics; pos: { x: number; y: number } } | null = null;

  constructor() {
    super({ key: 'MapScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    this.focusedIndex = 0;
    this.moduleNodes = [];
    this.capstoneNode = null;

    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 0, width, height);

    this.add.text(width / 2, 40, 'Learning Map', {
      fontSize: '36px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const overallProgress = this.gameManager.getOverallProgress();
    const barWidth = width * 0.8;
    const barHeight = 8;
    const barX = (width - barWidth) / 2;
    const barY = 70;
    const fillWidth = (barWidth * overallProgress.percentage) / 100;

    const barBg = this.add.graphics();
    barBg.fillStyle(COLORS.border, 1);
    barBg.fillRoundedRect(barX, barY, barWidth, barHeight, RADIUS.sm);

    const barFill = this.add.graphics();
    barFill.fillStyle(COLORS.primary, 1);
    barFill.fillRoundedRect(barX, barY, fillWidth, barHeight, RADIUS.sm);

    this.add.text(width / 2, barY + barHeight + 14, `${overallProgress.completedLevels}/20 Levels Complete (${overallProgress.percentage}%)`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const modules = this.levelManager.getModules(this.gameManager.getProgress());
    const allModulesCompleted = modules.every((m) => m.completed);

    const nodePositions = this.calculateNodePositions(modules, allModulesCompleted, width, height);
    const gfx = this.add.graphics();
    gfx.lineStyle(3, 0x334155, 1);
    for (let i = 0; i < nodePositions.length - 1; i++) {
      gfx.lineBetween(nodePositions[i].x, nodePositions[i].y, nodePositions[i + 1].x, nodePositions[i + 1].y);
    }

    modules.forEach((mod, index) => {
      this.renderModuleNode(mod, nodePositions[index]);
    });

    if (allModulesCompleted) {
      const capstonePos = nodePositions[nodePositions.length - 1];
      this.renderCapstoneNode(capstonePos);
    }

    const chartRadius = height < 400 ? 0 : height < 600 ? 50 : 65;
    if (chartRadius > 0) {
      this.renderCompetencyChart(width / 2, height * 0.78, chartRadius);
    }

    this.createBackButton(80, height - 40);

    this.focusFirstUnlocked();

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const totalItems = this.moduleNodes.length + (this.capstoneNode ? 1 : 0);
      if (totalItems === 0) return;

      if (event.key === 'ArrowLeft') {
        this.focusedIndex = (this.focusedIndex - 1 + totalItems) % totalItems;
        this.updateFocusVisual();
      } else if (event.key === 'ArrowRight') {
        this.focusedIndex = (this.focusedIndex + 1) % totalItems;
        this.updateFocusVisual();
      } else if (event.key === 'Enter') {
        this.activateFocused();
      } else if (event.key === 'Escape') {
        this.audioManager?.playSFX('sfx-click');
        TransitionManager.fadeOut(this, 300, () => {
          this.scene.start('TitleScene');
        });
      }
    });

    TransitionManager.fadeIn(this, 300);
  }

  private renderCompetencyChart(cx: number, cy: number, radius: number): void {
    const progress = this.gameManager.getProgress();
    const scores = COMPETENCY_AXES.map((axis) => progress.competencyScores[axis.key] ?? 0);
    const numAxes = COMPETENCY_AXES.length;
    const angleStep = (2 * Math.PI) / numAxes;
    const startAngle = -Math.PI / 2;
    const showLabels = radius >= 50;

    const sepY = cy - radius - 40;
    const sepGfx = this.add.graphics();
    sepGfx.lineStyle(1, COLORS.border, 0.4);
    sepGfx.lineBetween(cx - radius * 2, sepY, cx + radius * 2, sepY);

    const getPoint = (index: number, r: number): { x: number; y: number } => {
      const angle = startAngle + index * angleStep;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    };

    const chartGfx = this.add.graphics();

    for (const pct of [0.25, 0.5, 0.75, 1.0]) {
      const r = radius * pct;
      chartGfx.lineStyle(1, COLORS.border, 0.5);
      chartGfx.beginPath();
      for (let i = 0; i < numAxes; i++) {
        const pt = getPoint(i, r);
        if (i === 0) {
          chartGfx.moveTo(pt.x, pt.y);
        } else {
          chartGfx.lineTo(pt.x, pt.y);
        }
      }
      chartGfx.closePath();
      chartGfx.strokePath();
    }

    for (let i = 0; i < numAxes; i++) {
      const edge = getPoint(i, radius);
      chartGfx.lineStyle(1, COLORS.border, 0.4);
      chartGfx.lineBetween(cx, cy, edge.x, edge.y);
    }

    chartGfx.fillStyle(COLORS.primary, 0.25);
    chartGfx.lineStyle(2, COLORS.primary, 0.8);
    chartGfx.beginPath();
    for (let i = 0; i < numAxes; i++) {
      const value = Math.max(0, Math.min(100, scores[i])) / 100;
      const pt = getPoint(i, radius * value);
      if (i === 0) {
        chartGfx.moveTo(pt.x, pt.y);
      } else {
        chartGfx.lineTo(pt.x, pt.y);
      }
    }
    chartGfx.closePath();
    chartGfx.fillPath();
    chartGfx.strokePath();

    for (let i = 0; i < numAxes; i++) {
      const value = Math.max(0, Math.min(100, scores[i])) / 100;
      const pt = getPoint(i, radius * value);

      chartGfx.fillStyle(COLORS.primary, 1);
      chartGfx.fillCircle(pt.x, pt.y, 4);

      this.add.text(pt.x, pt.y - 12, `${Math.round(scores[i])}`, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#0ea5e9',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    for (let i = 0; i < numAxes; i++) {
      const labelOffset = 18;
      const angle = startAngle + i * angleStep;
      const labelX = cx + (radius + labelOffset) * Math.cos(angle);
      const labelY = cy + (radius + labelOffset) * Math.sin(angle);

      if (showLabels) {
        this.add.text(labelX, labelY, COMPETENCY_AXES[i].label, {
          fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
          color: '#94a3b8',
          fontFamily: FONT.family,
        }).setOrigin(0.5);
      }
    }

    this.add.text(cx, cy - radius - 30, 'Competency Profile', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);
  }

  private focusFirstUnlocked(): void {
    const unlockedIndex = this.moduleNodes.findIndex((n) => !n.mod.locked);
    this.focusedIndex = unlockedIndex >= 0 ? unlockedIndex : 0;
    this.updateFocusVisual();
  }

  private updateFocusVisual(): void {
    this.moduleNodes.forEach((node, i) => {
      const color = node.mod.locked ? 0x475569 : parseInt(node.mod.themeColor.replace('#', ''), 16);
      const isFocused = i === this.focusedIndex;
      node.outer.clear();
      node.outer.lineStyle(4, color, 1);
      node.outer.strokeCircle(0, 0, isFocused ? 55 : 50);
      if (isFocused && !node.mod.locked) {
        node.outer.lineStyle(3, 0x38bdf8, 1);
        node.outer.strokeCircle(0, 0, 58);
      }
    });

    if (this.capstoneNode) {
      const capIdx = this.moduleNodes.length;
      const isFocused = this.focusedIndex === capIdx;
      this.capstoneNode.outer.clear();
      this.capstoneNode.outer.lineStyle(4, 0xf59e0b, 1);
      this.capstoneNode.outer.strokeCircle(0, 0, isFocused ? 60 : 55);
      if (isFocused) {
        this.capstoneNode.outer.lineStyle(3, 0x38bdf8, 1);
        this.capstoneNode.outer.strokeCircle(0, 0, 63);
      }
    }
  }

  private activateFocused(): void {
    if (this.focusedIndex < this.moduleNodes.length) {
      const node = this.moduleNodes[this.focusedIndex];
      if (!node.mod.locked) {
        this.audioManager?.playSFX('sfx-click');
        TransitionManager.fadeOut(this, 300, () => {
          this.scene.start('ModuleScene', { moduleId: node.mod.id });
        });
      }
    } else if (this.capstoneNode) {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('CapstoneScene');
      });
    }
  }

  private calculateNodePositions(modules: ModuleMeta[], allModulesCompleted: boolean, width: number, height: number): { x: number; y: number }[] {
    const totalNodes = modules.length + (allModulesCompleted ? 1 : 0);
    const startX = width * 0.15;
    const endX = width * 0.85;
    const y = height * 0.38;
    const step = totalNodes > 1 ? (endX - startX) / (totalNodes - 1) : 0;
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < totalNodes; i++) {
      positions.push({ x: startX + step * i, y });
    }
    return positions;
  }

  private renderModuleNode(mod: ModuleMeta, pos: { x: number; y: number }): void {
    const container = this.add.container(pos.x, pos.y);
    const color = mod.locked ? 0x475569 : parseInt(mod.themeColor.replace('#', ''), 16);

    const outer = this.add.graphics();
    outer.lineStyle(4, color, 1);
    outer.strokeCircle(0, 0, 50);
    container.add(outer);

    const inner = this.add.graphics();
    inner.fillStyle(mod.locked ? 0x1e293b : 0x0f172a, 1);
    inner.fillCircle(0, 0, 46);
    container.add(inner);

    const label = this.add.text(0, -5, mod.locked ? '🔒' : `${mod.id}`, {
      fontSize: '28px',
      color: mod.locked ? '#64748b' : '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(label);

    const title = this.add.text(0, 65, mod.title, {
      fontSize: '14px',
      color: mod.locked ? '#64748b' : '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    container.add(title);

    if (mod.completed) {
      const completionRing = this.add.graphics();
      completionRing.lineStyle(6, color, 1);
      completionRing.strokeCircle(0, 0, 54);
      container.add(completionRing);

      const check = this.add.text(35, -35, '✓', {
        fontSize: '20px',
        color: '#10b981',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(check);
    }

    const nodeEntry = { container, outer, mod, pos };
    this.moduleNodes.push(nodeEntry);

    if (!mod.locked) {
      container.setSize(100, 100);
      container.setInteractive(new Phaser.Geom.Circle(0, 0, 50), Phaser.Geom.Circle.Contains);

      container.on('pointerover', () => {
        this.focusedIndex = this.moduleNodes.indexOf(nodeEntry);
        this.updateFocusVisual();
        this.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        this.input.setDefaultCursor('default');
      });

      container.on('pointerdown', () => {
        this.audioManager?.playSFX('sfx-click');
        TransitionManager.fadeOut(this, 300, () => {
          this.scene.start('ModuleScene', { moduleId: mod.id });
        });
      });
    }
  }

  private renderCapstoneNode(pos: { x: number; y: number }): void {
    const container = this.add.container(pos.x, pos.y);

    const outer = this.add.graphics();
    outer.lineStyle(4, 0xf59e0b, 1);
    outer.strokeCircle(0, 0, 55);
    container.add(outer);

    const inner = this.add.graphics();
    inner.fillStyle(0x0f172a, 1);
    inner.fillCircle(0, 0, 51);
    container.add(inner);

    const icon = this.add.text(0, -5, '🏆', {
      fontSize: '28px',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
    container.add(icon);

    const title = this.add.text(0, 70, 'Capstone', {
      fontSize: '14px',
      color: '#f59e0b',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(title);

    container.setSize(110, 110);
    container.setInteractive(new Phaser.Geom.Circle(0, 0, 55), Phaser.Geom.Circle.Contains);

    this.capstoneNode = { container, outer, pos };

    container.on('pointerover', () => {
      this.focusedIndex = this.moduleNodes.length;
      this.updateFocusVisual();
      this.input.setDefaultCursor('pointer');
    });

    container.on('pointerout', () => {
      this.input.setDefaultCursor('default');
    });

    container.on('pointerdown', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('CapstoneScene');
      });
    });
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
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('TitleScene');
      });
    });
  }
}
