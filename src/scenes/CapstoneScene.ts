import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { STANDARDS_REFS } from '@/utils/standardsRefs.ts';

export class CapstoneScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private phase = 0;
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
    this.gameManager = new GameManager();

    // Check if all modules completed
    const allCompleted = [1, 2, 3, 4, 5].every((m) => this.gameManager.isModuleCompleted(m));
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

    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 0, width, height);

    if (!this.capstoneData || this.phase >= this.capstoneData.phases.length) {
      this.showCertificate();
      return;
    }

    const phaseData = this.capstoneData.phases[this.phase];

    // Title bar
    const titleBar = this.add.graphics();
    titleBar.fillStyle(0x1e293b, 1);
    titleBar.fillRect(0, 0, width, 60);

    this.add.text(20, 30, `Capstone — ${phaseData.title}`, {
      fontSize: '20px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    this.add.text(width - 20, 30, `Phase ${this.phase + 1}/4`, {
      fontSize: '14px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(1, 0.5);

    // Scenario
    const panelY = 80;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.8);
    panel.fillRoundedRect(20, panelY, width - 40, 100, 8);
    panel.lineStyle(1, 0x334155, 1);
    panel.strokeRoundedRect(20, panelY, width - 40, 100, 8);

    this.add.text(40, panelY + 15, phaseData.scenario, {
      fontSize: '14px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      wordWrap: { width: width - 80 },
    });

    const refText = this.buildStandardRefText(phaseData.standardRef);
    this.add.text(40, panelY + 85, refText, {
      fontSize: '11px',
      color: '#0ea5e9',
      fontFamily: 'sans-serif',
      fontStyle: 'italic',
    });

    // Phase content
    const contentY = panelY + 120;
    const contentHeight = height - contentY - 80;
    this.renderPhaseContent(20, contentY, width - 40, contentHeight, phaseData);
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
    const config = phaseData.config as { items: { id: string; text: string }[] };
    const correctAnswer = phaseData.correctAnswer as string[];
    const selected = new Set<string>();

    const startY = y + 20;
    const itemHeight = 50;
    const gap = 10;

    config.items.forEach((item, i) => {
      const itemY = startY + i * (itemHeight + gap);
      const btn = this.add.container(x + w / 2, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 8);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 8);

      const checkbox = this.add.text(-w / 2 + 40, 0, '☐', {
        fontSize: '20px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const label = this.add.text(-w / 2 + 70, 0, item.text, {
        fontSize: '15px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        wordWrap: { width: w - 120 },
      }).setOrigin(0, 0.5);

      btn.add([bg, checkbox, label]);
      btn.setSize(w - 40, itemHeight);
      btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight), Phaser.Geom.Rectangle.Contains);

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

  private renderBuildPhase(x: number, y: number, w: number, h: number, phaseData: { config: Record<string, unknown>; correctAnswer: unknown }): void {
    const config = phaseData.config as { stages: string[]; methods: string[] };
    const correctAnswer = phaseData.correctAnswer as Record<string, string>;
    const selections: Record<string, string> = {};

    const startY = y + 20;
    const rowHeight = 70;

    config.stages.forEach((stage, i) => {
      const rowY = startY + i * rowHeight;
      this.add.text(x + 20, rowY, stage, {
        fontSize: '16px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const btn = this.add.container(x + w - 120, rowY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-100, -20, 200, 40, 8);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, 8);
      const label = this.add.text(0, 0, 'Select...', {
        fontSize: '14px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      btn.add([bg, label]);
      btn.setSize(200, 40);
      btn.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);

      let methodIndex = 0;
      btn.on('pointerdown', () => {
        methodIndex = (methodIndex + 1) % config.methods.length;
        const method = config.methods[methodIndex];
        label.setText(method);
        label.setColor('#e2e8f0');
        selections[stage] = method;
      });
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Submit', () => {
      const correct = config.stages.every((stage) => selections[stage] === correctAnswer[stage]);
      if (correct) {
        this.phase++;
        this.renderPhase();
      } else {
        this.showRetry();
      }
    });
  }

  private renderSequencePhase(x: number, y: number, w: number, h: number, phaseData: { config: Record<string, unknown>; correctAnswer: unknown }): void {
    const config = phaseData.config as { steps: string[] };
    const correctAnswer = phaseData.correctAnswer as string[];
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
        bg.fillStyle(0x1e293b, 1);
        bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 8);
        bg.lineStyle(2, 0x334155, 1);
        bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 8);

        const label = this.add.text(0, 0, `${i + 1}. ${step}`, {
          fontSize: '15px',
          color: '#e2e8f0',
          fontFamily: 'sans-serif',
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
    bg.fillStyle(0x0ea5e9, 1);
    bg.fillRoundedRect(-60, -20, 120, 40, 8);
    const label = this.add.text(0, 0, text, {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(120, 40);
    btn.setInteractive(new Phaser.Geom.Rectangle(-60, -20, 120, 40), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0x0284c7, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, 8);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0ea5e9, 1);
      bg.fillRoundedRect(-60, -20, 120, 40, 8);
    });
    btn.on('pointerdown', callback);
    return btn;
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

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 1);
    panelBg.fillRoundedRect(-200, -80, 400, 160, 12);
    panelBg.lineStyle(2, 0xef4444, 1);
    panelBg.strokeRoundedRect(-200, -80, 400, 160, 12);

    const title = this.add.text(0, -40, 'Not quite right', {
      fontSize: '22px',
      color: '#ef4444',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const msg = this.add.text(0, 0, 'Review your choices and try again.', {
      fontSize: '14px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
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

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 1);
    panelBg.fillRoundedRect(-300, -250, 600, 500, 16);
    panelBg.lineStyle(4, 0xf59e0b, 1);
    panelBg.strokeRoundedRect(-300, -250, 600, 500, 16);

    const title = this.add.text(0, -200, '🏆 Congratulations!', {
      fontSize: '36px',
      color: '#f59e0b',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const subtitle = this.add.text(0, -150, 'You have completed the SE Learning Quest', {
      fontSize: '18px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const scoreText = this.add.text(0, -100, `Total Score: ${progress.totalScore}`, {
      fontSize: '24px',
      color: '#0ea5e9',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const completed = this.add.text(0, -60, `Levels Completed: ${Object.values(progress.levelScores).filter((s) => s > 0).length}/20`, {
      fontSize: '16px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const achievements = this.add.text(0, -20, `Achievements: ${progress.achievements.length}`, {
      fontSize: '16px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const certText = this.add.text(0, 40, 'Certificate of Completion\nSystems Engineering Fundamentals', {
      fontSize: '16px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      align: 'center',
    }).setOrigin(0.5);

    const dateText = this.add.text(0, 100, `Completed: ${new Date().toLocaleDateString()}`, {
      fontSize: '14px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const mapBtn = this.createSmallButton(0, 160, 'Back to Map', () => {
      this.scene.start('MapScene');
    });

    panel.add([panelBg, title, subtitle, scoreText, completed, achievements, certText, dateText, mapBtn]);

    // Award capstone achievement
    this.gameManager.addAchievement('capstone_complete');
  }
}
