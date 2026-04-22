import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import { STANDARDS_REFS } from '@/utils/standardsRefs.ts';
import type { LevelData } from '@/types/index.ts';

export class LevelScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private levelId!: string;
  private levelData!: LevelData;
  private hintsUsed = 0;
  private retries = 0;
  private startTime = 0;
  private hintTimer?: Phaser.Time.TimerEvent;

  constructor() {
    super({ key: 'LevelScene' });
  }

  init(data: { levelId: string }): void {
    this.levelId = data.levelId;
  }

  create(): void {
    this.gameManager = new GameManager();
    this.levelManager = new LevelManager();
    const data = this.levelManager.getLevelData(this.levelId);
    if (!data) {
      this.scene.start('MapScene');
      return;
    }
    this.levelData = data;
    this.startTime = Date.now();
    this.hintsUsed = 0;
    this.retries = 0;

    const width = this.scale.width;
    const height = this.scale.height;

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 0, width, height);

    // Title bar
    const titleBar = this.add.graphics();
    titleBar.fillStyle(0x1e293b, 1);
    titleBar.fillRect(0, 0, width, 60);

    this.add.text(20, 30, `${this.levelData.title}`, {
      fontSize: '22px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    // Back button
    this.createBackButton(width - 80, 30);

    // Scenario panel
    const panelY = 80;
    const panelHeight = 100;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e293b, 0.8);
    panel.fillRoundedRect(20, panelY, width - 40, panelHeight, 8);
    panel.lineStyle(1, 0x334155, 1);
    panel.strokeRoundedRect(20, panelY, width - 40, panelHeight, 8);

    this.add.text(40, panelY + 15, this.levelData.scenarioText, {
      fontSize: '15px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      wordWrap: { width: width - 80 },
    });

    // Standard reference badge
    const refText = this.buildStandardRefText(this.levelData.standardRef);
    this.add.text(40, panelY + panelHeight - 20, refText, {
      fontSize: '11px',
      color: '#0ea5e9',
      fontFamily: 'sans-serif',
      fontStyle: 'italic',
    });

    // Hint button
    this.createHintButton(width - 100, panelY + panelHeight - 20);

    // Level content area
    const contentY = panelY + panelHeight + 20;
    const contentHeight = height - contentY - 80;
    this.renderLevelContent(20, contentY, width - 40, contentHeight);

    // Hint timer
    this.hintTimer = this.time.delayedCall(30000, () => {
      this.showHint();
    });
  }

  private buildStandardRefText(refs: LevelData['standardRef']): string {
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

  private createBackButton(x: number, y: number): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x475569, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, 8);
    const label = this.add.text(0, 0, '← Back', {
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
    btn.on('pointerdown', () => {
      this.hintTimer?.remove();
      this.scene.start('ModuleScene', { moduleId: this.levelData.moduleId });
    });
  }

  private createHintButton(x: number, y: number): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0xf59e0b, 1);
    bg.fillRoundedRect(-40, -15, 80, 30, 6);
    const label = this.add.text(0, 0, '💡 Hint', {
      fontSize: '13px',
      color: '#0f172a',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(80, 30);
    btn.setInteractive(new Phaser.Geom.Rectangle(-40, -15, 80, 30), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(0xd97706, 1);
      bg.fillRoundedRect(-40, -15, 80, 30, 6);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0xf59e0b, 1);
      bg.fillRoundedRect(-40, -15, 80, 30, 6);
    });
    btn.on('pointerdown', () => {
      this.showHint();
    });
  }

  private showHint(): void {
    if (this.hintsUsed >= this.levelData.hints.length) return;
    const hint = this.levelData.hints[this.hintsUsed];
    this.hintsUsed++;

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
    panelBg.fillRoundedRect(-250, -100, 500, 200, 12);
    panelBg.lineStyle(2, 0xf59e0b, 1);
    panelBg.strokeRoundedRect(-250, -100, 500, 200, 12);

    const title = this.add.text(0, -70, '💡 Hint', {
      fontSize: '22px',
      color: '#f59e0b',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const text = this.add.text(0, 0, hint, {
      fontSize: '16px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      wordWrap: { width: 440 },
      align: 'center',
    }).setOrigin(0.5);

    const closeBtn = this.createSmallButton(0, 60, 'Got it', () => {
      overlay.destroy();
      panel.destroy();
    });

    panel.add([panelBg, title, text, closeBtn]);
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x0ea5e9, 1);
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
      bg.fillStyle(0x0284c7, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 8);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x0ea5e9, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 8);
    });
    btn.on('pointerdown', callback);
    return btn;
  }

  private renderLevelContent(x: number, y: number, w: number, h: number): void {
    switch (this.levelData.type) {
      case 'quiz':
        this.renderQuiz(x, y, w, h);
        break;
      case 'match':
        this.renderMatch(x, y, w, h);
        break;
      case 'select':
        this.renderSelect(x, y, w, h);
        break;
      case 'sequence':
        this.renderSequence(x, y, w, h);
        break;
      case 'drag-drop':
        this.renderDragDrop(x, y, w, h);
        break;
      case 'edit':
        this.renderEdit(x, y, w, h);
        break;
      case 'build':
        this.renderBuild(x, y, w, h);
        break;
      case 'draw':
        this.renderDraw(x, y, w, h);
        break;
      default:
        this.renderQuiz(x, y, w, h);
    }
  }

  private renderQuiz(x: number, y: number, w: number, _h: number): void {
    const config = this.levelData.config as { question: string; options: string[]; correctIndex: number };
    let selectedIndex = -1;

    this.add.text(x + w / 2, y + 20, config.question, {
      fontSize: '18px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      wordWrap: { width: w - 40 },
      align: 'center',
    }).setOrigin(0.5, 0);

    const startY = y + 80;
    const btnHeight = 50;
    const gap = 12;

    config.options.forEach((opt, i) => {
      const btnY = startY + i * (btnHeight + gap);
      const btn = this.add.container(x + w / 2, btnY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, 8);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, 8);

      const label = this.add.text(0, 0, opt, {
        fontSize: '16px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);

      btn.add([bg, label]);
      btn.setSize(w - 40, btnHeight);
      btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight), Phaser.Geom.Rectangle.Contains);

      btn.on('pointerover', () => {
        if (selectedIndex !== i) {
          bg.clear();
          bg.fillStyle(0x334155, 1);
          bg.fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, 8);
          bg.lineStyle(2, 0x0ea5e9, 1);
          bg.strokeRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, 8);
        }
      });

      btn.on('pointerout', () => {
        if (selectedIndex !== i) {
          bg.clear();
          bg.fillStyle(0x1e293b, 1);
          bg.fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, 8);
          bg.lineStyle(2, 0x334155, 1);
          bg.strokeRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, 8);
        }
      });

      btn.on('pointerdown', () => {
        selectedIndex = i;
        this.checkAnswer(selectedIndex === config.correctIndex);
      });
    });
  }

  private renderMatch(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { pairs: { need: string; capability: string }[] };
    const shuffledCaps = [...config.pairs.map((p) => p.capability)].sort(() => Math.random() - 0.5);
    const matches: Record<string, string> = {};

    const col1X = x + 80;
    const col2X = x + w - 80;
    const startY = y + 40;
    const rowHeight = 60;

    config.pairs.forEach((pair, i) => {
      const rowY = startY + i * rowHeight;
      this.add.text(col1X, rowY, pair.need, {
        fontSize: '15px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const cap = shuffledCaps[i];
      const btn = this.add.container(col2X, rowY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-100, -20, 200, 40, 6);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-100, -20, 200, 40, 6);
      const label = this.add.text(0, 0, cap, {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      btn.add([bg, label]);
      btn.setSize(200, 40);
      btn.setInteractive(new Phaser.Geom.Rectangle(-100, -20, 200, 40), Phaser.Geom.Rectangle.Contains);

      let currentIndex = i;
      btn.on('pointerdown', () => {
        currentIndex = (currentIndex + 1) % shuffledCaps.length;
        label.setText(shuffledCaps[currentIndex]);
      });

      matches[pair.need] = cap;
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const correct = config.pairs.every((p) => matches[p.need] === p.capability);
      this.checkAnswer(correct);
    });
  }

  private renderSelect(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { items: { id: string; text: string }[] };
    const correctAnswer = this.levelData.correctAnswer as string[];
    const selected = new Set<string>();

    const startY = y + 30;
    const itemHeight = 45;
    const gap = 8;

    config.items.forEach((item, i) => {
      const itemY = startY + i * (itemHeight + gap);
      const btn = this.add.container(x + w / 2, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 6);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 6);

      const checkbox = this.add.text(-w / 2 + 35, 0, '☐', {
        fontSize: '18px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const label = this.add.text(-w / 2 + 60, 0, item.text, {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
        wordWrap: { width: w - 100 },
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

    this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const correct = correctAnswer.every((id) => selected.has(id)) && selected.size === correctAnswer.length;
      this.checkAnswer(correct);
    });
  }

  private renderSequence(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { steps: string[] };
    const correctAnswer = this.levelData.correctAnswer as string[];
    const currentOrder = [...config.steps].sort(() => Math.random() - 0.5);

    const startY = y + 30;
    const itemHeight = 45;
    const gap = 8;
    const itemContainers: Phaser.GameObjects.Container[] = [];

    const renderItems = () => {
      itemContainers.forEach((c) => c.destroy());
      itemContainers.length = 0;

      currentOrder.forEach((step, i) => {
        const itemY = startY + i * (itemHeight + gap);
        const btn = this.add.container(x + w / 2, itemY);
        const bg = this.add.graphics();
        bg.fillStyle(0x1e293b, 1);
        bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 6);
        bg.lineStyle(2, 0x334155, 1);
        bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 6);

        const label = this.add.text(0, 0, `${i + 1}. ${step}`, {
          fontSize: '14px',
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

    this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const correct = currentOrder.every((step, i) => step === correctAnswer[i]);
      this.checkAnswer(correct);
    });
  }

  private renderDragDrop(x: number, y: number, w: number, h: number): void {
    // Simplified drag-drop: use select-style for MVP
    this.renderSelect(x, y, w, h);
  }

  private renderEdit(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { statements: string[] };
    const inputs: Record<string, Phaser.GameObjects.Text> = {};

    const startY = y + 30;
    const rowHeight = 80;

    config.statements.forEach((stmt, i) => {
      const rowY = startY + i * rowHeight;
      this.add.text(x + 20, rowY, `Original: ${stmt}`, {
        fontSize: '13px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
        wordWrap: { width: w - 40 },
      });

      const inputBg = this.add.graphics();
      inputBg.fillStyle(0x1e293b, 1);
      inputBg.fillRoundedRect(x + 20, rowY + 25, w - 40, 35, 6);
      inputBg.lineStyle(2, 0x334155, 1);
      inputBg.strokeRoundedRect(x + 20, rowY + 25, w - 40, 35, 6);

      const inputText = this.add.text(x + 30, rowY + 42, 'Click to edit...', {
        fontSize: '14px',
        color: '#64748b',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      inputs[stmt] = inputText;

      const hitArea = this.add.zone(x + w / 2, rowY + 42, w - 40, 35).setInteractive();
      hitArea.on('pointerdown', () => {
        const userInput = window.prompt(`Edit requirement:`, inputText.text === 'Click to edit...' ? '' : inputText.text);
        if (userInput !== null) {
          inputText.setText(userInput || 'Click to edit...');
          inputText.setColor(userInput ? '#e2e8f0' : '#64748b');
        }
      });
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const correct = config.statements.every((stmt) => {
        const userText = inputs[stmt].text;
        return userText !== 'Click to edit...' && userText.length > 20;
      });
      this.checkAnswer(correct);
    });
  }

  private renderBuild(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { stages: string[]; methods: string[] };
    const correctAnswer = this.levelData.correctAnswer as Record<string, string>;
    const selections: Record<string, string> = {};

    const startY = y + 30;
    const rowHeight = 60;

    config.stages.forEach((stage, i) => {
      const rowY = startY + i * rowHeight;
      this.add.text(x + 20, rowY, stage, {
        fontSize: '15px',
        color: '#f8fafc',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const btn = this.add.container(x + w - 120, rowY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-90, -18, 180, 36, 6);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-90, -18, 180, 36, 6);
      const label = this.add.text(0, 0, 'Select...', {
        fontSize: '13px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);
      btn.add([bg, label]);
      btn.setSize(180, 36);
      btn.setInteractive(new Phaser.Geom.Rectangle(-90, -18, 180, 36), Phaser.Geom.Rectangle.Contains);

      let methodIndex = 0;
      btn.on('pointerdown', () => {
        methodIndex = (methodIndex + 1) % config.methods.length;
        const method = config.methods[methodIndex];
        label.setText(method);
        label.setColor('#e2e8f0');
        selections[stage] = method;
      });
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const correct = config.stages.every((stage) => selections[stage] === correctAnswer[stage]);
      this.checkAnswer(correct);
    });
  }

  private renderDraw(x: number, y: number, w: number, h: number): void {
    // Simplified draw: classify elements as inside/outside
    const config = this.levelData.config as { elements: string[] };
    const correctAnswer = this.levelData.correctAnswer as { inside: string[]; outside: string[] };
    const classifications: Record<string, 'inside' | 'outside'> = {};

    const startY = y + 30;
    const itemHeight = 45;
    const gap = 8;

    config.elements.forEach((el, i) => {
      const itemY = startY + i * (itemHeight + gap);
      const btn = this.add.container(x + w / 2, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(0x1e293b, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 6);
      bg.lineStyle(2, 0x334155, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, 6);

      const label = this.add.text(-w / 2 + 40, 0, el, {
        fontSize: '14px',
        color: '#e2e8f0',
        fontFamily: 'sans-serif',
      }).setOrigin(0, 0.5);

      const status = this.add.text(w / 2 - 40, 0, '?', {
        fontSize: '14px',
        color: '#94a3b8',
        fontFamily: 'sans-serif',
      }).setOrigin(1, 0.5);

      btn.add([bg, label, status]);
      btn.setSize(w - 40, itemHeight);
      btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight), Phaser.Geom.Rectangle.Contains);

      btn.on('pointerdown', () => {
        const current = classifications[el];
        if (current === 'inside') {
          classifications[el] = 'outside';
          status.setText('Outside');
          status.setColor('#ef4444');
        } else if (current === 'outside') {
          delete classifications[el];
          status.setText('?');
          status.setColor('#94a3b8');
        } else {
          classifications[el] = 'inside';
          status.setText('Inside');
          status.setColor('#10b981');
        }
      });
    });

    this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const insideCorrect = correctAnswer.inside.every((el) => classifications[el] === 'inside');
      const outsideCorrect = correctAnswer.outside.every((el) => classifications[el] === 'outside');
      const noExtras = config.elements.every((el) => {
        if (correctAnswer.inside.includes(el)) return classifications[el] === 'inside';
        if (correctAnswer.outside.includes(el)) return classifications[el] === 'outside';
        return true;
      });
      this.checkAnswer(insideCorrect && outsideCorrect && noExtras);
    });
  }

  private checkAnswer(correct: boolean): void {
    if (correct) {
      this.showSuccess();
    } else {
      this.retries++;
      this.showFailure();
    }
  }

  private showSuccess(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const rules = this.levelData.scoringRules;
    let score = rules.baseScore;
    score -= this.hintsUsed * rules.hintPenalty;
    score -= this.retries * rules.retryPenalty;
    if (elapsed < 60) score += rules.timeBonus;
    if (this.hintsUsed === 0 && this.retries === 0) score += rules.perfectBonus;
    score = Math.max(0, score);

    this.gameManager.completeLevel(this.levelId, score, this.hintsUsed, this.retries);
    const nextLevel = this.levelManager.getNextLevelId(this.levelId);
    if (nextLevel && !nextLevel.startsWith(`${this.levelData.moduleId}_`)) {
      this.gameManager.advanceModule(this.levelData.moduleId);
    }

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(201);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 1);
    panelBg.fillRoundedRect(-250, -180, 500, 360, 16);
    panelBg.lineStyle(3, 0x10b981, 1);
    panelBg.strokeRoundedRect(-250, -180, 500, 360, 16);

    const title = this.add.text(0, -140, '🎉 Level Complete!', {
      fontSize: '32px',
      color: '#10b981',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const scoreText = this.add.text(0, -80, `Score: ${score}`, {
      fontSize: '24px',
      color: '#f59e0b',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const details = this.add.text(0, -30, `Hints used: ${this.hintsUsed} | Retries: ${this.retries}`, {
      fontSize: '14px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const takeaway = this.add.text(0, 30, `Key Takeaway:\n${this.levelData.learningObjective}`, {
      fontSize: '14px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      wordWrap: { width: 400 },
      align: 'center',
    }).setOrigin(0.5);

    const nextBtn = this.createSmallButton(0, 120, nextLevel ? 'Next Level' : 'Back to Map', () => {
      if (nextLevel) {
        this.scene.start('LevelScene', { levelId: nextLevel });
      } else {
        this.scene.start('MapScene');
      }
    });

    panel.add([panelBg, title, scoreText, details, takeaway, nextBtn]);
  }

  private showFailure(): void {
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
    panelBg.fillRoundedRect(-200, -100, 400, 200, 12);
    panelBg.lineStyle(2, 0xef4444, 1);
    panelBg.strokeRoundedRect(-200, -100, 400, 200, 12);

    const title = this.add.text(0, -60, 'Not quite right', {
      fontSize: '24px',
      color: '#ef4444',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const msg = this.add.text(0, -10, 'Take your time and try again.\nUse a hint if you need help!', {
      fontSize: '14px',
      color: '#e2e8f0',
      fontFamily: 'sans-serif',
      align: 'center',
    }).setOrigin(0.5);

    const retryBtn = this.createSmallButton(0, 50, 'Try Again', () => {
      overlay.destroy();
      panel.destroy();
    });

    panel.add([panelBg, title, msg, retryBtn]);
  }
}
