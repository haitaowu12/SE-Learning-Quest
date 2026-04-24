import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';
import { COLORS, RADIUS, FONT } from '@/utils/designTokens.ts';
import { scaledFontSize } from '@/utils/scaling.ts';
import type { LevelData } from '@/types/index.ts';

export class LessonScene extends Phaser.Scene {
  private levelId!: string;
  private levelData!: LevelData;

  constructor() {
    super({ key: 'LessonScene' });
  }

  init(data: { levelId: string }): void {
    this.levelId = data.levelId;
  }

  create(): void {
    const gameManager = GameManager.getInstance();
    const levelManager = LevelManager.getInstance();
    const data = levelManager.getLevelData(this.levelId);
    if (!data) {
      this.scene.start('MapScene');
      return;
    }
    this.levelData = data;

    const progress = gameManager.getProgress();
    if ((progress.levelScores[this.levelId] ?? 0) > 0) {
      this.scene.start('LevelScene', { levelId: this.levelId });
      return;
    }

    const lesson = data.lessonContent;
    if (!lesson) {
      this.scene.start('LevelScene', { levelId: this.levelId });
      return;
    }

    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.bg, COLORS.bg, COLORS.panelBg, COLORS.panelBg, 1);
    bg.fillRect(0, 0, width, height);

    const guideX = 50;
    const guideY = height / 2;
    this.drawGuideAvatar(guideX, guideY);

    const bubbleGfx = this.add.graphics();
    bubbleGfx.fillStyle(COLORS.panelBg, 1);
    bubbleGfx.fillRoundedRect(70, guideY - 30, 20, 20, 4);
    bubbleGfx.fillStyle(COLORS.panelBg, 1);
    bubbleGfx.fillRoundedRect(80, guideY - 80, 200, 100, RADIUS.md);
    bubbleGfx.lineStyle(1, COLORS.border, 1);
    bubbleGfx.strokeRoundedRect(80, guideY - 80, 200, 100, RADIUS.md);
    this.add.text(90, guideY - 70, 'Let me explain\nthis concept!', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      wordWrap: { width: 180 },
    });

    const titleBar = this.add.graphics();
    titleBar.fillStyle(COLORS.panelBg, 1);
    titleBar.fillRect(0, 0, width, 60);

    this.add.text(20, 30, `Lesson: ${data.title}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.lg + 2)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const contentY = 80;
    let currentY = contentY + 20;

    this.add.text(40, currentY, lesson.conceptTitle, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl)}px`,
      color: '#0ea5e9',
      fontFamily: FONT.heading,
      fontStyle: 'bold',
      wordWrap: { width: width - 80 },
    }).setOrigin(0);
    currentY += 50;

    if (lesson.keyPoints && lesson.keyPoints.length > 0) {
      this.add.text(40, currentY, 'Key Concepts', {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0);
      currentY += 30;

      lesson.keyPoints.forEach((point) => {
        const bullet = this.add.graphics();
        bullet.fillStyle(COLORS.primary, 1);
        bullet.fillCircle(52, currentY + 10, 4);

        this.add.text(64, currentY, point, {
          fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
          color: '#e2e8f0',
          fontFamily: FONT.family,
          wordWrap: { width: width - 120 },
        }).setOrigin(0);
        currentY += 40;
      });
    }

    if (lesson.example) {
      currentY += 10;
      const exampleBg = this.add.graphics();
      exampleBg.fillStyle(COLORS.primarySoft, 1);
      exampleBg.fillRoundedRect(40, currentY, width - 80, 80, RADIUS.md);
      exampleBg.lineStyle(1, COLORS.primary, 0.5);
      exampleBg.strokeRoundedRect(40, currentY, width - 80, 80, RADIUS.md);

      this.add.text(60, currentY + 10, 'Example', {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#0ea5e9',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0);

      this.add.text(60, currentY + 32, lesson.example, {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
        wordWrap: { width: width - 140 },
      }).setOrigin(0);
      currentY += 100;
    }

    if (lesson.diagramType) {
      currentY += 10;
      this.add.text(40, currentY, 'Visual Overview', {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0);
      currentY += 30;

      this.renderDiagram(40, currentY, width - 80, 150, lesson.diagramType);
      currentY += 170;
    }

    const btnY = height - 80;
    const btn = this.add.container(width / 2, btnY);
    const btnBg = this.add.graphics();
    btnBg.fillStyle(COLORS.success, 1);
    btnBg.fillRoundedRect(-140, -24, 280, 48, RADIUS.md);
    const btnLabel = this.add.text(0, 0, 'I understand, let me try!', {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([btnBg, btnLabel]);
    btn.setSize(280, 48);
    btn.setInteractive(new Phaser.Geom.Rectangle(-140, -24, 280, 48), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(COLORS.successSoft, 1);
      btnBg.fillRoundedRect(-140, -24, 280, 48, RADIUS.md);
    });
    btn.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(COLORS.success, 1);
      btnBg.fillRoundedRect(-140, -24, 280, 48, RADIUS.md);
    });
    btn.on('pointerdown', () => {
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('LevelScene', { levelId: this.levelId });
      });
    });

    this.createBackButton(width - 80, 30);

    TransitionManager.fadeIn(this, 300);
  }

  private drawGuideAvatar(x: number, y: number): Phaser.GameObjects.Graphics {
    const gfx = this.add.graphics();
    gfx.fillStyle(0x6366f1, 1);
    gfx.fillCircle(x, y - 20, 16);
    gfx.fillStyle(0x3b82f6, 1);
    gfx.fillRoundedRect(x - 12, y - 4, 24, 30, 4);
    gfx.fillStyle(0xf59e0b, 1);
    gfx.fillRoundedRect(x - 14, y - 38, 28, 8, 2);
    gfx.fillStyle(0xffffff, 1);
    gfx.fillCircle(x - 5, y - 22, 2);
    gfx.fillCircle(x + 5, y - 22, 2);
    return gfx;
  }

  private renderDiagram(x: number, y: number, w: number, h: number, type: string): void {
    const gfx = this.add.graphics();
    gfx.fillStyle(COLORS.panelBg, 0.6);
    gfx.fillRoundedRect(x, y, w, h, RADIUS.md);
    gfx.lineStyle(1, COLORS.border, 1);
    gfx.strokeRoundedRect(x, y, w, h, RADIUS.md);

    switch (type) {
      case 'flowchart':
        this.renderFlowchartDiagram(x, y, w, h, gfx);
        break;
      case 'matrix':
        this.renderMatrixDiagram(x, y, w, h, gfx);
        break;
      case 'hierarchy':
        this.renderHierarchyDiagram(x, y, w, h, gfx);
        break;
      case 'sequence':
        this.renderSequenceDiagram(x, y, w, h, gfx);
        break;
    }
  }

  private renderFlowchartDiagram(x: number, y: number, w: number, h: number, gfx: Phaser.GameObjects.Graphics): void {
    const steps = ['Input', 'Process', 'Decision', 'Output'];
    const boxW = 80;
    const boxH = 36;
    const gap = (w - steps.length * boxW) / (steps.length + 1);

    steps.forEach((step, i) => {
      const bx = x + gap + i * (boxW + gap);
      const by = y + (h - boxH) / 2;
      gfx.fillStyle(COLORS.primarySoft, 1);
      gfx.fillRoundedRect(bx, by, boxW, boxH, RADIUS.sm);
      gfx.lineStyle(1, COLORS.primary, 1);
      gfx.strokeRoundedRect(bx, by, boxW, boxH, RADIUS.sm);

      this.add.text(bx + boxW / 2, by + boxH / 2, step, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0.5);

      if (i < steps.length - 1) {
        const arrowStartX = bx + boxW;
        const arrowEndX = bx + boxW + gap;
        const arrowY = by + boxH / 2;
        gfx.lineStyle(2, COLORS.primary, 1);
        gfx.lineBetween(arrowStartX, arrowY, arrowEndX, arrowY);
        gfx.fillStyle(COLORS.primary, 1);
        gfx.fillTriangle(arrowEndX, arrowY, arrowEndX - 6, arrowY - 4, arrowEndX - 6, arrowY + 4);
      }
    });
  }

  private renderMatrixDiagram(x: number, y: number, w: number, h: number, gfx: Phaser.GameObjects.Graphics): void {
    const labels = ['High/Low', 'High/High', 'Low/Low', 'Low/High'];
    const cellW = (w - 60) / 2;
    const cellH = (h - 60) / 2;
    const startX = x + 40;
    const startY = y + 40;

    this.add.text(x + 10, y + h / 2, 'Power', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5).setAngle(-90);
    this.add.text(x + w / 2, y + 15, 'Interest', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const colors = [0x1e3a5f, 0x0f172a, 0x1a2230, 0x162d4a];
    labels.forEach((label, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const cx = startX + col * cellW;
      const cy = startY + row * cellH;
      gfx.fillStyle(colors[i], 1);
      gfx.fillRoundedRect(cx + 2, cy + 2, cellW - 4, cellH - 4, RADIUS.xs);
      gfx.lineStyle(1, COLORS.border, 1);
      gfx.strokeRoundedRect(cx + 2, cy + 2, cellW - 4, cellH - 4, RADIUS.xs);
      this.add.text(cx + cellW / 2, cy + cellH / 2, label, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
    });
  }

  private renderHierarchyDiagram(x: number, y: number, w: number, _h: number, gfx: Phaser.GameObjects.Graphics): void {
    const topX = x + w / 2;
    const topY = y + 20;
    const boxW = 80;
    const boxH = 30;

    gfx.fillStyle(COLORS.primarySoft, 1);
    gfx.fillRoundedRect(topX - boxW / 2, topY, boxW, boxH, RADIUS.sm);
    gfx.lineStyle(1, COLORS.primary, 1);
    gfx.strokeRoundedRect(topX - boxW / 2, topY, boxW, boxH, RADIUS.sm);
    this.add.text(topX, topY + boxH / 2, 'System', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const children = ['Sub A', 'Sub B', 'Sub C'];
    const childY = topY + 70;
    const childGap = (w - 60) / children.length;

    children.forEach((label, i) => {
      const cx = x + 30 + childGap * i + childGap / 2;
      gfx.lineStyle(2, COLORS.border, 1);
      gfx.lineBetween(topX, topY + boxH, cx, childY);
      gfx.fillStyle(COLORS.panelBgAlt, 1);
      gfx.fillRoundedRect(cx - boxW / 2, childY, boxW, boxH, RADIUS.sm);
      gfx.lineStyle(1, COLORS.border, 1);
      gfx.strokeRoundedRect(cx - boxW / 2, childY, boxW, boxH, RADIUS.sm);
      this.add.text(cx, childY + boxH / 2, label, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
    });
  }

  private renderSequenceDiagram(x: number, y: number, w: number, h: number, gfx: Phaser.GameObjects.Graphics): void {
    const steps = ['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4'];
    const stepW = (w - 40) / steps.length;

    gfx.lineStyle(2, COLORS.primary, 1);
    gfx.lineBetween(x + 20, y + h / 2, x + w - 20, y + h / 2);

    steps.forEach((step, i) => {
      const sx = x + 20 + stepW * i + stepW / 2;
      gfx.fillStyle(COLORS.primary, 1);
      gfx.fillCircle(sx, y + h / 2, 12);
      gfx.fillStyle(COLORS.bg, 1);
      gfx.fillCircle(sx, y + h / 2, 8);
      this.add.text(sx, y + h / 2 - 24, step, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
      this.add.text(sx, y + h / 2, `${i + 1}`, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#3b82f6',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    });
  }

  private createBackButton(x: number, y: number): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.borderLight, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, RADIUS.sm);
    const label = this.add.text(0, 0, '← Back', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(100, 36);
    btn.setInteractive(new Phaser.Geom.Rectangle(-50, -18, 100, 36), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.borderHover, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, RADIUS.sm);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.borderLight, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, RADIUS.sm);
    });
    btn.on('pointerdown', () => {
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('ModuleScene', { moduleId: this.levelData.moduleId });
      });
    });
  }
}
