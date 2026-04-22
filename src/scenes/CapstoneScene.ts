import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import { STANDARDS_REFS } from '@/utils/standardsRefs.ts';
import { scaledWidth, scaledFontSize } from '@/utils/scaling.ts';
import { COLORS, RADIUS, FONT } from '@/utils/designTokens.ts';

export class CapstoneScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private phase = 0;
  private focusedIndex = 0;
  private capstoneData: {
    title: string;
    description: string;
    phases: {
      title: string;
      scenario: string;
      type: string;
      config: Record<string, unknown>;
      correctAnswer: unknown;
      standardRef: { incose?: string; iso15288?: string; en50126?: string };
      learningObjective: string;
    }[];
  } | null = null;

  constructor() {
    super({ key: 'CapstoneScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.focusedIndex = 0;

    const moduleCount = this.levelManager.getModuleCount();
    const allCompleted = Array.from({ length: moduleCount }, (_, i) => i + 1).every((m) => this.gameManager.isModuleCompleted(m));
    if (!allCompleted) {
      this.scene.start('MapScene');
      return;
    }

    this.capstoneData = this.loadCapstoneData();
    this.renderPhase();
  }

  private loadCapstoneData() {
    return {
      title: 'The SE Challenge: Railway Signaling Subsystem',
      description: 'Apply everything you have learned to design a railway signaling subsystem.',
      phases: [
        {
          title: 'Phase 1: Stakeholders & Requirements',
          scenario: 'You are the lead SE for a new CBTC (Communications-Based Train Control) system. Identify stakeholders, define SMART requirements, and build a traceability matrix.',
          type: 'select',
          config: {
            items: [
              { id: 'sh1', text: 'Define stakeholder power/interest matrix' },
              { id: 'sh2', text: 'Write SMART performance requirements' },
              { id: 'sh3', text: 'Build stakeholder-to-requirement traceability' },
              { id: 'sh4', text: 'Select verification methods for safety requirements' },
            ],
          },
          correctAnswer: ['sh1', 'sh2', 'sh3', 'sh4'],
          standardRef: { incose: 'stakeholder_requirements', iso15288: 'stakeholder_requirements' },
          learningObjective: 'Integrate stakeholder analysis and requirements engineering',
        },
        {
          title: 'Phase 2: Architecture & Trade-offs',
          scenario: 'Decompose the CBTC system into subsystems, define interfaces, and allocate your budget across performance, safety, and maintainability.',
          type: 'build',
          config: {
            stages: ['Subsystem Decomposition', 'Interface Definition', 'Resource Allocation'],
            methods: ['N² Diagram', 'IDEF0', 'Trade-off Study', 'Risk Analysis'],
          },
          correctAnswer: { 'Subsystem Decomposition': 'N² Diagram', 'Interface Definition': 'IDEF0', 'Resource Allocation': 'Trade-off Study' },
          standardRef: { incose: 'architecture_design', iso15288: 'architecture' },
          learningObjective: 'Apply architecture design and trade-off analysis',
        },
        {
          title: 'Phase 3: V&V & Compliance',
          scenario: 'Plan verification and validation for the CBTC system. Ensure compliance with EN 50126 RAMS requirements.',
          type: 'sequence',
          config: {
            steps: ['Hazard Analysis', 'Safety Case Development', 'Independent Safety Assessment', 'Operational Validation'],
          },
          correctAnswer: ['Hazard Analysis', 'Safety Case Development', 'Independent Safety Assessment', 'Operational Validation'],
          standardRef: { incose: 'verification', iso15288: 'verification', en50126: 'verification_validation' },
          learningObjective: 'Plan V&V and ensure RAMS compliance',
        },
        {
          title: 'Phase 4: Integration & Risk Management',
          scenario: 'Plan the integration sequence, assess risks, and assemble the SEMP for the CBTC project.',
          type: 'select',
          config: {
            items: [
              { id: 'int1', text: 'Bottom-up integration with hardware-in-the-loop' },
              { id: 'int2', text: 'Risk assessment with SIL allocation' },
              { id: 'int3', text: 'Configuration management plan' },
              { id: 'int4', text: 'SEMP with tailored lifecycle processes' },
            ],
          },
          correctAnswer: ['int1', 'int2', 'int3', 'int4'],
          standardRef: { incose: 'integration', iso15288: 'integration', en50126: 'risk_analysis' },
          learningObjective: 'Integrate systems and manage project risks',
        },
      ],
    };
  }

  private renderPhase(): void {
    this.children.removeAll();
    this.focusedIndex = 0;

    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(COLORS.bg, COLORS.bg, COLORS.panelBg, COLORS.panelBg, 1);
    bg.fillRect(0, 0, width, height);

    this.createBackButton(80, height - 40);

    if (!this.capstoneData || this.phase >= this.capstoneData.phases.length) {
      this.showCertificate();
      return;
    }

    const phaseData = this.capstoneData.phases[this.phase];

    const titleBar = this.add.graphics();
    titleBar.fillStyle(COLORS.panelBg, 1);
    titleBar.fillRect(0, 0, width, 60);

    this.add.text(20, 30, `Capstone — ${phaseData.title}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(width - 20, 30, `Phase ${this.phase + 1}/4`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(1, 0.5);

    const panelY = 80;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panelBg, 0.8);
    panel.fillRoundedRect(20, panelY, width - 40, 100, RADIUS.sm);
    panel.lineStyle(1, COLORS.border, 1);
    panel.strokeRoundedRect(20, panelY, width - 40, 100, RADIUS.sm);

    this.add.text(40, panelY + 15, phaseData.scenario, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      wordWrap: { width: width - 80 },
    });

    const refText = this.buildStandardRefText(phaseData.standardRef);
    this.add.text(40, panelY + 85, refText, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#0ea5e9',
      fontFamily: FONT.family,
      fontStyle: 'italic',
    });

    const contentY = panelY + 120;
    const contentHeight = height - contentY - 80;
    this.renderPhaseContent(20, contentY, width - 40, contentHeight, phaseData);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        this.scene.start('MapScene');
      }
    });
  }

  private buildStandardRefText(refs: { incose?: string; iso15288?: string; en50126?: string }): string {
    const parts: string[] = [];
    if (refs.incose) {
      const key = refs.incose as keyof typeof STANDARDS_REFS.incose;
      parts.push(STANDARDS_REFS.incose[key] ?? refs.incose);
    }
    if (refs.iso15288) {
      const key = refs.iso15288 as keyof typeof STANDARDS_REFS.iso15288;
      parts.push(STANDARDS_REFS.iso15288[key] ?? refs.iso15288);
    }
    if (refs.en50126) {
      const key = refs.en50126 as keyof typeof STANDARDS_REFS.en50126;
      parts.push(STANDARDS_REFS.en50126[key] ?? refs.en50126);
    }
    return parts.join(' | ');
  }

  private renderPhaseContent(x: number, y: number, w: number, h: number, phaseData: { type: string; config: Record<string, unknown>; correctAnswer: unknown }): void {
    switch (phaseData.type) {
      case 'select':
        this.renderSelectPhase(x, y, w, h, phaseData);
        break;
      case 'build':
        this.renderBuildPhase(x, y, w, h, phaseData);
        break;
      case 'sequence':
        this.renderSequencePhase(x, y, w, h, phaseData);
        break;
      default:
        this.renderSelectPhase(x, y, w, h, phaseData);
    }
  }

  private renderSelectPhase(x: number, y: number, w: number, h: number, phaseData: { config: Record<string, unknown>; correctAnswer: unknown }): void {
    const config = phaseData.config as { items?: { id: string; text: string }[] } | undefined;
    const correctAnswer = phaseData.correctAnswer as string[] | undefined;

    if (!config?.items || !correctAnswer) {
      this.add.text(x + w / 2, y + h / 2, 'Error: Phase data incomplete', {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#ef4444',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
      return;
    }

    const selected = new Set<string>();
    const itemBgs: Phaser.GameObjects.Graphics[] = [];

    const startY = y + 20;
    const itemHeight = 50;
    const gap = 10;

    config.items.forEach((item, i) => {
      const itemY = startY + i * (itemHeight + gap);
      const btn = this.add.container(x + w / 2, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
      bg.lineStyle(2, COLORS.border, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);

      const checkbox = this.add.text(-w / 2 + 40, 0, '☐', {
        fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
      }).setOrigin(0, 0.5);

      const label = this.add.text(-w / 2 + 70, 0, item.text, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
        wordWrap: { width: w - 120 },
      }).setOrigin(0, 0.5);

      btn.add([bg, checkbox, label]);
      btn.setSize(w - 40, itemHeight);
      btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight), Phaser.Geom.Rectangle.Contains);

      itemBgs.push(bg);

      btn.on('pointerdown', () => {
        if (selected.has(item.id)) {
          selected.delete(item.id);
          checkbox.setText('☐');
          checkbox.setColor('#94a3b8');
        } else {
          selected.add(item.id);
          checkbox.setText('☑');
          checkbox.setColor('#0ea5e9');
        }
      });
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        this.focusedIndex = (this.focusedIndex - 1 + config.items!.length) % config.items!.length;
        this.updateSelectFocusVisual(itemBgs, config.items!.length);
      } else if (event.key === 'ArrowDown') {
        this.focusedIndex = (this.focusedIndex + 1) % config.items!.length;
        this.updateSelectFocusVisual(itemBgs, config.items!.length);
      } else if (event.key === 'Enter') {
        const item = config.items![this.focusedIndex];
        if (item) {
          if (selected.has(item.id)) {
            selected.delete(item.id);
          } else {
            selected.add(item.id);
          }
        }
      }
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Submit', () => {
      const correct = correctAnswer.every((id) => selected.has(id)) && selected.size === correctAnswer.length;
      if (correct) {
        this.phase++;
        this.renderPhase();
      } else {
        this.showRetry();
      }
    });
  }

  private updateSelectFocusVisual(itemBgs: Phaser.GameObjects.Graphics[], _count: number): void {
    const w = this.scale.width - 40;
    const itemHeight = 50;
    itemBgs.forEach((bg, i) => {
      bg.clear();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
      bg.lineStyle(i === this.focusedIndex ? 3 : 2, i === this.focusedIndex ? 0x38bdf8 : COLORS.border, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
    });
  }

  private renderBuildPhase(x: number, y: number, w: number, h: number, phaseData: { config: Record<string, unknown>; correctAnswer: unknown }): void {
    const config = phaseData.config as { stages?: string[]; methods?: string[] } | undefined;
    const correctAnswer = phaseData.correctAnswer as Record<string, string> | undefined;

    if (!config?.stages || !config?.methods || !correctAnswer) {
      this.add.text(x + w / 2, y + h / 2, 'Error: Phase data incomplete', {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#ef4444',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
      return;
    }

    const stages = config.stages;
    const methods = config.methods;
    const selections: Record<string, string> = {};

    const startY = y + 20;
    const rowHeight = 70;

    stages.forEach((stage, i) => {
      const rowY = startY + i * rowHeight;
      this.add.text(x + 20, rowY, stage, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#f8fafc',
        fontFamily: FONT.family,
      }).setOrigin(0, 0.5);

      const btn = this.add.container(x + w - 120, rowY);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-100, -20, 200, 40, RADIUS.sm);
      bg.lineStyle(2, COLORS.border, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, RADIUS.sm);
      const label = this.add.text(0, 0, 'Select...', {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
      btn.add([bg, label]);
      btn.setSize(200, 40);
      btn.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);

      let methodIndex = -1;
      btn.on('pointerdown', () => {
        methodIndex = (methodIndex + 1) % methods.length;
        const method = methods[methodIndex];
        label.setText(method);
        label.setColor('#e2e8f0');
        selections[stage] = method;
      });
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        this.focusedIndex = (this.focusedIndex - 1 + stages.length) % stages.length;
      } else if (event.key === 'ArrowDown') {
        this.focusedIndex = (this.focusedIndex + 1) % stages.length;
      }
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Submit', () => {
      const correct = stages.every((stage) => selections[stage] === correctAnswer[stage]);
      if (correct) {
        this.phase++;
        this.renderPhase();
      } else {
        this.showRetry();
      }
    });
  }

  private renderSequencePhase(x: number, y: number, w: number, h: number, phaseData: { config: Record<string, unknown>; correctAnswer: unknown }): void {
    const config = phaseData.config as { steps?: string[] } | undefined;
    const correctAnswer = phaseData.correctAnswer as string[] | undefined;

    if (!config?.steps || !correctAnswer) {
      this.add.text(x + w / 2, y + h / 2, 'Error: Phase data incomplete', {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#ef4444',
        fontFamily: FONT.family,
      }).setOrigin(0.5);
      return;
    }

    const currentOrder = [...config.steps].sort(() => Math.random() - 0.5);
    const itemContainers: Phaser.GameObjects.Container[] = [];

    const startY = y + 20;
    const itemHeight = 50;
    const gap = 10;

    const renderItems = () => {
      itemContainers.forEach((c) => c.destroy());
      itemContainers.length = 0;

      currentOrder.forEach((step, i) => {
        const itemY = startY + i * (itemHeight + gap);
        const btn = this.add.container(x + w / 2, itemY);
        const bg = this.add.graphics();
        bg.fillStyle(COLORS.panelBg, 1);
        bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
        bg.lineStyle(2, COLORS.border, 1);
        bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);

        const label = this.add.text(0, 0, `${i + 1}. ${step}`, {
          fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
          color: '#e2e8f0',
          fontFamily: FONT.family,
        }).setOrigin(0.5);

        btn.add([bg, label]);
        btn.setSize(w - 40, itemHeight);
        btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight), Phaser.Geom.Rectangle.Contains);

        btn.on('pointerdown', () => {
          if (i > 0) {
            [currentOrder[i], currentOrder[i - 1]] = [currentOrder[i - 1], currentOrder[i]];
            renderItems();
          }
        });

        itemContainers.push(btn);
      });
    };

    renderItems();

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        this.focusedIndex = (this.focusedIndex - 1 + currentOrder.length) % currentOrder.length;
      } else if (event.key === 'ArrowDown') {
        this.focusedIndex = (this.focusedIndex + 1) % currentOrder.length;
      } else if (event.key === 'Enter') {
        if (this.focusedIndex > 0) {
          [currentOrder[this.focusedIndex], currentOrder[this.focusedIndex - 1]] = [currentOrder[this.focusedIndex - 1], currentOrder[this.focusedIndex]];
          renderItems();
        }
      }
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Submit', () => {
      const correct = currentOrder.every((step, i) => step === correctAnswer[i]);
      if (correct) {
        this.phase++;
        this.renderPhase();
      } else {
        this.showRetry();
      }
    });
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.primary, 1);
    bg.fillRoundedRect(-60, -20, 120, 40, RADIUS.sm);
    const label = this.add.text(0, 0, text, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(120, 40);
    btn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.primaryHover, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, RADIUS.sm);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.primary, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, RADIUS.sm);
    });
    btn.on('pointerdown', callback);

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !this.capstoneData) return;
    });

    return btn;
  }

  private createBackButton(x: number, y: number): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.borderLight, 1);
    bg.fillRoundedRect(-60, -20, 120, 40, RADIUS.sm);
    const label = this.add.text(0, 0, '← Map', {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(120, 40);
    btn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.borderHover, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, RADIUS.sm);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.borderLight, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, RADIUS.sm);
    });
    btn.on('pointerdown', () => {
      this.scene.start('MapScene');
    });
  }

  private showRetry(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(201);

    const panelW = scaledWidth(this, 400);
    const panelH = 160;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);
    panelBg.lineStyle(2, COLORS.error, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);

    const title = this.add.text(0, -40, 'Not quite right', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl - 6)}px`,
      color: '#ef4444',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const msg = this.add.text(0, 0, 'Review your choices and try again.', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      align: 'center',
    }).setOrigin(0.5);

    const retryBtn = this.createSmallButton(0, 40, 'Try Again', () => {
      overlay.destroy();
      panel.destroy();
    });

    panel.add([panelBg, title, msg, retryBtn]);
  }

  private showCertificate(): void {
    const width = this.scale.width;
    const height = this.scale.height;
    const progress = this.gameManager.getProgress();

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.8);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(201);

    const panelW = scaledWidth(this, 600);
    const panelH = 500;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);
    panelBg.lineStyle(4, COLORS.warning, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);

    const title = this.add.text(0, -200, '🏆 Congratulations!', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl + 8)}px`,
      color: '#f59e0b',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -150, 'You have completed the SE Learning Quest', {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const scoreText = this.add.text(0, -100, `Total Score: ${progress.totalScore}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl - 4)}px`,
      color: '#0ea5e9',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const completed = this.add.text(0, -60, `Levels Completed: ${Object.values(progress.levelScores).filter((s) => s > 0).length}/20`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const achievements = this.add.text(0, -20, `Achievements: ${progress.achievements.length}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const certText = this.add.text(0, 40, 'Certificate of Completion\nSystems Engineering Fundamentals', {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      align: 'center',
    }).setOrigin(0.5);

    const dateText = this.add.text(0, 100, `Completed: ${new Date().toLocaleDateString()}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#64748b',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const downloadBtn = this.add.container(0, 160);
    const dlBg = this.add.graphics();
    dlBg.fillStyle(COLORS.primary, 1);
    dlBg.fillRoundedRect(-100, -20, 200, 40, RADIUS.sm);
    const dlLabel = this.add.text(0, 0, 'Download Certificate', {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    downloadBtn.add([dlBg, dlLabel]);
    downloadBtn.setSize(200, 40);
    downloadBtn.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);
    downloadBtn.on('pointerover', () => {
      dlBg.clear();
      dlBg.fillStyle(COLORS.primaryHover, 1);
      dlBg.fillRoundedRect(-100, -20, 200, 40, RADIUS.sm);
    });
    downloadBtn.on('pointerout', () => {
      dlBg.clear();
      dlBg.fillStyle(COLORS.primary, 1);
      dlBg.fillRoundedRect(-100, -20, 200, 40, RADIUS.sm);
    });
    downloadBtn.on('pointerdown', () => {
      this.downloadCertificate(progress.totalScore, Object.values(progress.levelScores).filter((s) => s > 0).length);
    });

    const mapBtn = this.createSmallButton(0, 210, 'Back to Map', () => {
      this.scene.start('MapScene');
    });

    panel.add([panelBg, title, subtitle, scoreText, completed, achievements, certText, dateText, downloadBtn, mapBtn]);

    this.gameManager.addAchievement('capstone_complete');

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter') {
        this.scene.start('MapScene');
      }
    });
  }

  private downloadCertificate(totalScore: number, levelsCompleted: number): void {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, 600);
    gradient.addColorStop(0, '#0f172a');
    gradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(20, 20, 760, 560, 20);
    ctx.stroke();

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(35, 35, 730, 530, 14);
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Certificate of Completion', 400, 130);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '26px sans-serif';
    ctx.fillText('Systems Engineering Fundamentals', 400, 185);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px sans-serif';
    ctx.fillText('This certifies successful completion of the', 400, 260);
    ctx.fillText('SE Learning Quest program', 400, 288);

    ctx.fillStyle = '#0ea5e9';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`Total Score: ${totalScore}`, 400, 350);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '20px sans-serif';
    ctx.fillText(`Levels Completed: ${levelsCompleted}/20`, 400, 390);

    ctx.fillStyle = '#64748b';
    ctx.font = '16px sans-serif';
    ctx.fillText(`Date: ${new Date().toLocaleDateString()}`, 400, 450);

    ctx.fillStyle = '#475569';
    ctx.font = '14px sans-serif';
    ctx.fillText('SE Learning Quest', 400, 540);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'SE_Learning_Quest_Certificate.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      const feedback = this.add.text(this.scale.width / 2, this.scale.height / 2 + 240, 'Certificate downloaded!', {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#22c55e',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0.5).setDepth(300);
      this.time.delayedCall(2000, () => feedback.destroy());
    }, 'image/png');
  }
}
