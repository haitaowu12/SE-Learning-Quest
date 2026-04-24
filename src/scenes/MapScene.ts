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
  private newUnlock = false;
  private focusedIndex = 0;
  private moduleNodes: { container: Phaser.GameObjects.Container; outer: Phaser.GameObjects.Graphics; mod: ModuleMeta; pos: { x: number; y: number } }[] = [];
  private capstoneNode: { container: Phaser.GameObjects.Container; outer: Phaser.GameObjects.Graphics; pos: { x: number; y: number } } | null = null;

  constructor() {
    super({ key: 'MapScene' });
  }

  init(data: { newUnlock?: boolean }): void {
    this.newUnlock = data.newUnlock ?? false;
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
    gfx.lineStyle(8, 0x334155, 0.3);
    gfx.beginPath();
    for (let i = 0; i < nodePositions.length; i++) {
      if (i === 0) gfx.moveTo(nodePositions[i].x, nodePositions[i].y);
      else gfx.lineTo(nodePositions[i].x, nodePositions[i].y);
    }
    gfx.strokePath();
    gfx.lineStyle(3, 0x475569, 1);
    gfx.beginPath();
    for (let i = 0; i < nodePositions.length; i++) {
      if (i === 0) gfx.moveTo(nodePositions[i].x, nodePositions[i].y);
      else gfx.lineTo(nodePositions[i].x, nodePositions[i].y);
    }
    gfx.strokePath();

    const moduleColors = [0x0ea5e9, 0x6366f1, 0xf59e0b, 0x10b981, 0xef4444];
    modules.forEach((_mod, index) => {
      const pos = nodePositions[index];
      const regionGfx = this.add.graphics();
      regionGfx.fillStyle(moduleColors[index % moduleColors.length], 0.04);
      regionGfx.fillCircle(pos.x, pos.y, 80);
      regionGfx.lineStyle(1, moduleColors[index % moduleColors.length], 0.08);
      regionGfx.strokeCircle(pos.x, pos.y, 80);
    });

    const currentModule = this.gameManager.getProgress().currentModule;
    const avatarIndex = Math.min(currentModule - 1, nodePositions.length - 1);
    if (avatarIndex >= 0 && avatarIndex < nodePositions.length) {
      const avatarPos = nodePositions[avatarIndex];
      const avatar = this.add.graphics();
      avatar.fillStyle(0x38bdf8, 1);
      avatar.fillCircle(0, 0, 8);
      avatar.fillStyle(0xffffff, 0.8);
      avatar.fillCircle(0, 0, 4);
      avatar.setPosition(avatarPos.x, avatarPos.y + 60);
      this.tweens.add({
        targets: avatar,
        alpha: 0.6,
        duration: 1000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    modules.forEach((mod, index) => {
      this.renderModuleNode(mod, nodePositions[index]);
    });

    if (allModulesCompleted) {
      const capstonePos = nodePositions[nodePositions.length - 1];
      this.renderCapstoneNode(capstonePos);
    }

    if (this.newUnlock) {
      const lastUnlocked = this.moduleNodes.findLastIndex(n => !n.mod.locked);
      if (lastUnlocked >= 0) {
        const node = this.moduleNodes[lastUnlocked];
        this.playModuleUnlockAnimation(node.pos.x, node.pos.y, node.container);
      }
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
    const startX = width * 0.12;
    const endX = width * 0.88;
    const baseY = height * 0.38;
    const amplitude = height * 0.12;
    const positions: { x: number; y: number }[] = [];

    for (let i = 0; i < totalNodes; i++) {
      const t = totalNodes > 1 ? i / (totalNodes - 1) : 0.5;
      const x = startX + t * (endX - startX);
      const y = baseY + Math.sin(t * Math.PI * 2) * amplitude;
      positions.push({ x, y });
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

    if (mod.locked) {
      const lockIcon = this.add.image(0, -5, 'icon-lock');
      lockIcon.setScale(0.6);
      lockIcon.setTint(0x64748b);
      container.add(lockIcon);
    } else {
      const idLabel = this.add.text(0, -5, `${mod.id}`, {
        fontSize: '28px',
        color: '#ffffff',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0.5);
      container.add(idLabel);
    }

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

      const check = this.add.image(35, -35, 'icon-check');
      check.setScale(0.5);
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
        inner.clear();
        inner.fillStyle(0x3b82f6, 0.06);
        inner.fillCircle(0, 0, 52);
        inner.fillStyle(mod.locked ? 0x1e293b : 0x0f172a, 1);
        inner.fillCircle(0, 0, 46);
        this.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        inner.clear();
        inner.fillStyle(mod.locked ? 0x1e293b : 0x0f172a, 1);
        inner.fillCircle(0, 0, 46);
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

    const icon = this.add.image(0, -5, 'icon-trophy');
    icon.setScale(0.6);
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

  private playModuleUnlockAnimation(x: number, y: number, nodeContainer: Phaser.GameObjects.Container): void {
    const ring = this.add.graphics();
    ring.lineStyle(3, 0x3b82f6, 1);
    ring.strokeCircle(x, y, 20);
    ring.setAlpha(1);
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scaleX: 3,
      scaleY: 3,
      duration: 1000,
      ease: 'Power2',
      onComplete: () => ring.destroy(),
    });
    this.tweens.add({
      targets: nodeContainer,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 200,
      yoyo: true,
      ease: 'Quad.easeInOut',
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
