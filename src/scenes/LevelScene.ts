import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import { ScoringEngine } from '@/game/ScoringEngine.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';
import { ParticleEffect } from '@/components/ParticleEffect.ts';
import { AudioManager } from '@/components/AudioManager.ts';
import { STANDARDS_REFS } from '@/utils/standardsRefs.ts';
import { scaledWidth, scaledFontSize } from '@/utils/scaling.ts';
import { COLORS, RADIUS, FONT } from '@/utils/designTokens.ts';
import { ProceduralBG } from '@/utils/proceduralBG.ts';
import type { LevelData } from '@/types/index.ts';

export class LevelScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private levelId!: string;
  private levelData!: LevelData;
  private hintsUsed = 0;
  private retries = 0;
  private startTime = 0;
  private hintTimer?: Phaser.Time.TimerEvent;
  private contentContainer!: Phaser.GameObjects.Container;
  private contentScrollY = 0;
  private maxContentScrollY = 0;
  private hintOverlay: Phaser.GameObjects.Container | null = null;
  private hintOverlayBg: Phaser.GameObjects.Graphics | null = null;
  private hintBtnContainer: Phaser.GameObjects.Container | null = null;
  private hintPulseTween: Phaser.Tweens.Tween | null = null;
  private focusedIndex = 0;
  private quizOptionBgs: Phaser.GameObjects.Graphics[] = [];
  private quizOptionContainers: Phaser.GameObjects.Container[] = [];
  private checkBtnContainer: Phaser.GameObjects.Container | null = null;
  private progressText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super({ key: 'LevelScene' });
  }

  init(data: { levelId: string }): void {
    this.levelId = data.levelId;
    this.contentScrollY = 0;
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    const data = this.levelManager.getLevelData(this.levelId);
    if (!data) {
      this.scene.start('MapScene');
      return;
    }
    this.levelData = JSON.parse(JSON.stringify(data)) as LevelData;
    this.normalizeLevelData();
    this.startTime = Date.now();
    this.hintsUsed = 0;
    this.retries = 0;
    this.hintOverlay = null;
    this.hintOverlayBg = null;
    this.hintPulseTween = null;
    this.focusedIndex = 0;
    this.quizOptionBgs = [];
    this.quizOptionContainers = [];
    this.checkBtnContainer = null;
    if (this.progressText) {
      this.progressText.destroy();
    }
    this.progressText = null;

    const width = this.scale.width;
    const height = this.scale.height;

    ProceduralBG.draw(this, this.levelData.moduleId, width, height);

    const titleBar = this.add.graphics();
    titleBar.fillStyle(COLORS.panelBg, 1);
    titleBar.fillRect(0, 0, width, 60);

    this.add.text(20, 30, `${this.levelData.title}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.lg + 2)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const streak = this.gameManager.getStreak();
    const flameIcon = this.add.image(width / 2 - 50, 30, 'icon-flame');
    flameIcon.setScale(0.4);
    if (streak < 3) flameIcon.setTint(0x94a3b8);
    this.add.text(width / 2 - 30, 30, `Streak: ${streak}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: streak >= 3 ? '#f59e0b' : '#94a3b8',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    if (streak >= 3) {
      this.add.text(width / 2, 48, 'On Fire!', {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#f59e0b',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0.5);
    }

    this.createBackButton(width - 80, 30);

    const panelY = 80;
    const panelHeight = 100;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panelBg, 0.8);
    panel.fillRoundedRect(20, panelY, width - 40, panelHeight, RADIUS.sm);
    panel.lineStyle(1, COLORS.border, 1);
    panel.strokeRoundedRect(20, panelY, width - 40, panelHeight, RADIUS.sm);
    panel.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.1, 0.1, 0, 0);
    panel.fillRect(22, panelY + 2, width - 44, 20);

    this.add.text(40, panelY + 15, this.levelData.scenarioText, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      wordWrap: { width: width - 80 },
    });

    const refText = this.buildStandardRefText(this.levelData.standardRef);
    this.add.text(40, panelY + panelHeight - 20, refText, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#0ea5e9',
      fontFamily: FONT.family,
      fontStyle: 'italic',
    });

    this.createHintButton(width - 100, panelY + panelHeight - 20);

    const contentY = panelY + panelHeight + 20;
    const contentHeight = height - contentY - 80;

    this.contentContainer = this.add.container(0, contentY);
    this.renderLevelContent(20, 0, width - 40, contentHeight);

    const clipMask = this.make.graphics({}, false);
    clipMask.fillStyle(0xffffff, 1);
    clipMask.fillRect(0, contentY, width, contentHeight);
    const mask = clipMask.createGeometryMask();
    this.contentContainer.setMask(mask);

    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _dx: number, dy: number) => {
      this.contentScrollY = Phaser.Math.Clamp(this.contentScrollY + dy * 0.5, -this.maxContentScrollY, 0);
      this.contentContainer.y = contentY - this.contentScrollY;
    });

    this.hintTimer = this.time.delayedCall(30000, () => {
      this.startHintPulse();
    });

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.hintOverlay) {
        if (event.key === 'Escape' || event.key === 'Enter') {
          this.closeHintOverlay();
        }
        return;
      }

      if (this.levelData.type === 'quiz') {
        this.handleQuizKeyboard(event);
      } else if (event.key === 'Enter' && this.checkBtnContainer) {
        this.checkBtnContainer.emit('pointerdown');
      } else if (event.key === 'Escape') {
        this.hintTimer?.remove();
        this.scene.start('ModuleScene', { moduleId: this.levelData.moduleId, newUnlock: true });
      }
    });
  }

  private normalizeLevelData(): void {
    const config = this.levelData.config as Record<string, unknown>;
    const answer = this.levelData.correctAnswer as Record<string, unknown>;
    const type = this.levelData.type;

    if (type === 'drag-drop') {
      if (!config.items && config.stakeholders) {
        const stakeholders = config.stakeholders as string[];
        config.items = stakeholders.map(s => ({ id: s.replace(/\s/g, '_'), text: s }));
        const catKeys = Object.keys(answer);
        config.categories = catKeys.map(k => ({ id: k, label: k.replace(/([A-Z])/g, ' $1').trim() }));
        const flat: Record<string, string> = {};
        for (const [cat, items] of Object.entries(answer)) {
          for (const item of items as string[]) {
            flat[item.replace(/\s/g, '_')] = cat;
          }
        }
        this.levelData.correctAnswer = flat;
      } else if (!config.items && config.stakeholderReqs && config.systemReqs) {
        config.items = (config.systemReqs as { id: string; text: string }[]).map(r => ({ id: r.id, text: r.text }));
        config.categories = (config.stakeholderReqs as { id: string; text: string }[]).map(r => ({ id: r.id, label: r.text }));
      } else if (!config.items && config.functions) {
        const functions = config.functions as string[];
        config.items = functions.map(f => ({ id: f.replace(/\s/g, '_'), text: f }));
        const subsystems = Object.keys(answer);
        config.categories = subsystems.map(s => ({ id: s, label: s }));
        const flat: Record<string, string> = {};
        for (const [subsys, funcs] of Object.entries(answer)) {
          for (const fn of funcs as string[]) {
            flat[fn.replace(/\s/g, '_')] = subsys;
          }
        }
        this.levelData.correctAnswer = flat;
      } else if (!config.items && config.risks) {
        const risks = config.risks as string[];
        config.items = risks.map(r => ({ id: r.replace(/\s/g, '_'), text: r }));
        config.categories = [
          { id: 'high_high', label: 'High P / High I' },
          { id: 'high_low', label: 'High P / Low I' },
          { id: 'low_high', label: 'Low P / High I' },
          { id: 'low_low', label: 'Low P / Low I' },
        ];
        const flat: Record<string, string> = {};
        for (const [risk, data] of Object.entries(answer)) {
          const d = data as { probability: string; impact: string };
          flat[risk.replace(/\s/g, '_')] = `${d.probability}_${d.impact}`;
        }
        this.levelData.correctAnswer = flat;
      }
    } else if (type === 'match') {
      if (!config.pairs && config.requirements && config.methods) {
        const pairs: { need: string; capability: string }[] = [];
        for (const [req, method] of Object.entries(answer)) {
          pairs.push({ need: req, capability: method as string });
        }
        config.pairs = pairs;
      }
    } else if (type === 'sequence') {
      if (!config.steps && config.nodes) {
        const loops = answer.loops as { nodes: string[]; type: string }[] | undefined;
        if (loops && loops.length > 0) {
          config.steps = config.nodes;
          this.levelData.correctAnswer = loops[0].nodes;
        }
      }
    } else if (type === 'edit') {
      if (!config.statements && config.requirements) {
        const reqs = config.requirements as { id: string; text: string }[] | string[];
        if (typeof reqs[0] === 'object') {
          const objReqs = reqs as { id: string; text: string }[];
          config.statements = objReqs.map(r => r.text);
          const ans = this.levelData.correctAnswer as Record<string, string>;
          const mapped: Record<string, string> = {};
          for (const r of objReqs) {
            if (ans[r.id] !== undefined) {
              mapped[r.text] = ans[r.id];
            }
          }
          this.levelData.correctAnswer = mapped;
        }
      }
    } else if (type === 'draw') {
      if (!config.elements && config.subsystems) {
        const subsystems = config.subsystems as string[];
        const flows = answer.flows as { from: string; to: string; type: string; label: string }[] | undefined;
        if (flows) {
          const fromSet = new Set(flows.map(f => f.from));
          config.elements = subsystems;
          this.levelData.correctAnswer = {
            inside: subsystems.filter(s => fromSet.has(s)),
            outside: subsystems.filter(s => !fromSet.has(s)),
          };
        }
      }
    } else if (type === 'select') {
      if (!config.items && config.requirements) {
        const reqs = config.requirements as { name: string; max: number; valuePerUnit: number }[] | { id: string; text: string }[];
        if (reqs.length > 0 && 'name' in reqs[0]) {
          config.items = (reqs as { name: string; max: number }[]).map(r => ({ id: r.name, text: `${r.name} (max: ${r.max})` }));
          const correctKeys = Object.entries(answer)
            .filter(([, v]) => (v as number) > 0)
            .map(([k]) => k);
          this.levelData.correctAnswer = correctKeys;
        } else if ('id' in reqs[0] && 'text' in reqs[0]) {
          config.items = reqs as { id: string; text: string }[];
        }
      } else if (config.items && !Array.isArray(this.levelData.correctAnswer)) {
        const items = config.items as { id: string; text: string }[];
        if (items.length > 0 && typeof items[0] === 'string') {
          config.items = (items as unknown as string[]).map(s => ({ id: s.replace(/\s/g, '_'), text: s }));
        }
      }
    } else if (type === 'build') {
      if (!config.stages && config.sections) {
        config.stages = config.sections;
        delete config.sections;
      }
      if (!config.methods && config.blocks) {
        config.methods = config.blocks;
        delete config.blocks;
      }
      const ans = this.levelData.correctAnswer as Record<string, unknown>;
      if (ans) {
        const firstValue = Object.values(ans)[0];
        if (Array.isArray(firstValue)) {
          const flat: Record<string, string> = {};
          for (const [stage, methods] of Object.entries(ans)) {
            flat[stage] = (methods as string[])[0] ?? '';
          }
          this.levelData.correctAnswer = flat;
        }
      }
    }
  }

  private handleQuizKeyboard(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      this.focusedIndex = (this.focusedIndex - 1 + this.quizOptionContainers.length) % this.quizOptionContainers.length;
      this.updateQuizFocusVisual();
    } else if (event.key === 'ArrowDown') {
      this.focusedIndex = (this.focusedIndex + 1) % this.quizOptionContainers.length;
      this.updateQuizFocusVisual();
    } else if (event.key === 'Enter') {
      const config = this.levelData.config as { question?: string; options?: string[]; correctIndex?: number } | undefined;
      if (config?.options && this.focusedIndex < config.options.length) {
        this.quizOptionContainers[this.focusedIndex]?.emit('pointerdown');
      }
    } else if (event.key === 'Escape') {
      this.hintTimer?.remove();
      this.scene.start('ModuleScene', { moduleId: this.levelData.moduleId, newUnlock: true });
    }
  }

  private updateQuizFocusVisual(): void {
    const w = this.scale.width - 40;
    const btnHeight = 50;
    this.quizOptionBgs.forEach((bg, i) => {
      bg.clear();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);
      if (i === this.focusedIndex) {
        bg.lineStyle(3, 0x38bdf8, 1);
      } else {
        bg.lineStyle(2, COLORS.border, 1);
      }
      bg.strokeRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);
    });
  }

  private startHintPulse(): void {
    if (!this.hintBtnContainer) return;
    this.hintPulseTween = this.tweens.add({
      targets: this.hintBtnContainer,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private stopHintPulse(): void {
    if (this.hintPulseTween) {
      this.hintPulseTween.stop();
      this.hintPulseTween = null;
    }
    if (this.hintBtnContainer) {
      this.hintBtnContainer.setScale(1, 1);
    }
  }

  private closeHintOverlay(): void {
    if (this.hintOverlay) {
      this.hintOverlay.destroy();
      this.hintOverlay = null;
    }
    if (this.hintOverlayBg) {
      this.hintOverlayBg.destroy();
      this.hintOverlayBg = null;
    }
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
      this.hintTimer?.remove();
      this.scene.start('ModuleScene', { moduleId: this.levelData.moduleId, newUnlock: true });
    });
  }

  private createHintButton(x: number, y: number): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.warning, 1);
    bg.fillRoundedRect(-40, -15, 80, 30, RADIUS.sm);
    const bulbIcon = this.add.image(-14, 0, 'icon-bulb');
    bulbIcon.setScale(0.35);
    const label = this.add.text(6, 0, 'Hint', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#0f172a',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);
    btn.add([bg, bulbIcon, label]);
    btn.setSize(80, 30);
    btn.setInteractive(new Phaser.Geom.Rectangle(-40, -15, 80, 30), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.warningHover, 1);
      bg.fillRoundedRect(-40, -15, 80, 30, RADIUS.sm);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.warning, 1);
      bg.fillRoundedRect(-40, -15, 80, 30, RADIUS.sm);
    });
    btn.on('pointerdown', () => {
      this.showHint();
    });
    this.hintBtnContainer = btn;
  }

  private showHint(): void {
    if (this.hintsUsed >= this.levelData.hints.length) return;

    this.closeHintOverlay();

    const hint = this.levelData.hints[this.hintsUsed];
    this.hintsUsed++;

    if (this.hintsUsed >= this.levelData.hints.length) {
      this.stopHintPulse();
    }

    const width = this.scale.width;
    const height = this.scale.height;

    this.hintOverlayBg = this.add.graphics();
    this.hintOverlayBg.fillStyle(0x000000, 0.6);
    this.hintOverlayBg.fillRect(0, 0, width, height);
    this.hintOverlayBg.setDepth(200);

    this.hintOverlay = this.add.container(width / 2, height / 2);
    this.hintOverlay.setDepth(201);

    const panelW = scaledWidth(this, 500);
    const panelH = 220;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);
    panelBg.lineStyle(2, COLORS.warning, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);
    panelBg.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, 0.1, 0.1, 0, 0);
    panelBg.fillRect(-halfW + 2, -halfH + 2, panelW - 4, 20);

    const totalHints = this.levelData.hints.length;
    const hintBulbIcon = this.add.image(-60, -80, 'icon-bulb');
    hintBulbIcon.setScale(0.4);
    const title = this.add.text(-40, -80, `Hint ${this.hintsUsed}/${totalHints}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.lg + 2)}px`,
      color: '#f59e0b',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const text = this.add.text(0, -10, hint, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      wordWrap: { width: panelW - 60 },
      align: 'center',
    }).setOrigin(0.5);

    const guideGfx = this.add.graphics();
    guideGfx.fillStyle(0x6366f1, 1);
    guideGfx.fillCircle(-halfW + 40, halfH - 50, 12);
    guideGfx.fillStyle(0x3b82f6, 1);
    guideGfx.fillRoundedRect(-halfW + 28, halfH - 38, 24, 22, 3);
    guideGfx.fillStyle(0xf59e0b, 1);
    guideGfx.fillRoundedRect(-halfW + 26, halfH - 52, 28, 6, 2);
    guideGfx.fillStyle(0xffffff, 1);
    guideGfx.fillCircle(-halfW + 35, halfH - 52, 1.5);
    guideGfx.fillCircle(-halfW + 45, halfH - 52, 1.5);

    const closeBtn = this.createSmallButton(0, 70, 'Got it', () => {
      this.closeHintOverlay();
    });

    this.hintOverlay.add([panelBg, hintBulbIcon, title, text, guideGfx, closeBtn]);
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.primary, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, RADIUS.sm);
    const label = this.add.text(0, 0, text, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(100, 36);
    btn.setInteractive(new Phaser.Geom.Rectangle(-50, -18, 100, 36), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.primaryHover, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, RADIUS.sm);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.primary, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, RADIUS.sm);
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
      case 'trace':
        this.renderTrace(x, y, w, h);
        break;
      default:
        this.renderQuiz(x, y, w, h);
    }
  }

  private renderQuiz(x: number, y: number, w: number, _h: number): void {
    const config = this.levelData.config as { question?: string; options?: string[]; correctIndex?: number } | undefined;

    if (!config?.question || !config?.options || config.correctIndex === undefined) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + _h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    this.quizOptionBgs = [];
    this.quizOptionContainers = [];

    this.contentContainer.add(
      this.add.text(x + w / 2, y + 20, config.question, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#f8fafc',
        fontFamily: FONT.family,
        wordWrap: { width: w - 40 },
        align: 'center',
      }).setOrigin(0.5, 0)
    );

    const startY = y + 80;
    const btnHeight = 50;
    const gap = 12;

    config.options.forEach((opt, i) => {
      const btnY = startY + i * (btnHeight + gap);
      const btn = this.add.container(x + w / 2, btnY);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);
      bg.lineStyle(2, COLORS.border, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);

      const label = this.add.text(0, 0, opt, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0.5);

      btn.add([bg, label]);
      btn.setSize(w - 40, btnHeight);
      btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight), Phaser.Geom.Rectangle.Contains);

      this.quizOptionBgs.push(bg);
      this.quizOptionContainers.push(btn);

      btn.on('pointerover', () => {
        this.focusedIndex = i;
        this.updateQuizFocusVisual();
      });

      btn.on('pointerout', () => {
      });

      btn.on('pointerdown', () => {
        const isCorrect = i === config.correctIndex;

        if (isCorrect) {
          this.quizOptionBgs[i].clear();
          this.quizOptionBgs[i].fillStyle(COLORS.success, 1);
          this.quizOptionBgs[i].fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);
        } else {
          this.quizOptionBgs[i].clear();
          this.quizOptionBgs[i].fillStyle(COLORS.error, 1);
          this.quizOptionBgs[i].fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);

          if (config.correctIndex !== undefined && config.options) {
            this.quizOptionBgs[config.correctIndex].clear();
            this.quizOptionBgs[config.correctIndex].fillStyle(COLORS.success, 1);
            this.quizOptionBgs[config.correctIndex].fillRoundedRect(-w / 2 + 20, -btnHeight / 2, w - 40, btnHeight, RADIUS.sm);

            const explanationText = this.add.text(x + w / 2, startY + config.options.length * (btnHeight + gap) + 10,
              `Correct answer: ${config.options[config.correctIndex]}`, {
              fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
              color: '#f59e0b',
              fontFamily: FONT.family,
              wordWrap: { width: w - 40 },
              align: 'center',
            }).setOrigin(0.5, 0);
            this.contentContainer.add(explanationText);
          }
        }

        this.time.delayedCall(1500, () => {
          this.checkAnswer(isCorrect);
        });
      });

      this.contentContainer.add(btn);
    });

    this.updateQuizFocusVisual();

    const totalHeight = startY + config.options.length * (btnHeight + gap) - y;
    this.maxContentScrollY = Math.max(0, totalHeight - _h);
  }

  private createDropdownSelector(
    x: number, y: number, w: number, h: number,
    options: string[], onSelect: (option: string, index: number) => void
  ): { container: Phaser.GameObjects.Container; label: Phaser.GameObjects.Text; bg: Phaser.GameObjects.Graphics; setValue: (text: string) => void } {
    const container = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.panelBg, 1);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS.sm);
    bg.lineStyle(2, COLORS.border, 1);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS.sm);

    const label = this.add.text(0, 0, 'Select...', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const arrow = this.add.text(w / 2 - 12, 0, '▼', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    container.add([bg, label, arrow]);
    container.setSize(w, h);
    container.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

    let dropdownPanel: Phaser.GameObjects.Container | null = null;

    const closeDropdown = () => {
      if (dropdownPanel) {
        dropdownPanel.destroy();
        dropdownPanel = null;
      }
    };

    container.on('pointerdown', () => {
      closeDropdown();

      dropdownPanel = this.add.container(x, y + h / 2 + 4);
      dropdownPanel.setDepth(150);
      this.contentContainer.add(dropdownPanel);

      const panelBg = this.add.graphics();
      panelBg.fillStyle(COLORS.panelBg, 1);
      const panelH = options.length * 36 + 8;
      panelBg.fillRoundedRect(-w / 2, 0, w, panelH, RADIUS.sm);
      panelBg.lineStyle(2, COLORS.primary, 1);
      panelBg.strokeRoundedRect(-w / 2, 0, w, panelH, RADIUS.sm);
      dropdownPanel.add(panelBg);

      options.forEach((opt, i) => {
        const optY = 4 + i * 36 + 18;
        const optBg = this.add.graphics();
        const optLabel = this.add.text(0, optY, opt, {
          fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
          color: '#e2e8f0',
          fontFamily: FONT.family,
        }).setOrigin(0.5);

        const optHit = this.add.zone(0, optY, w - 8, 34);
        optHit.setInteractive();
        optHit.on('pointerover', () => {
          optBg.clear();
          optBg.fillStyle(COLORS.primaryDim, 1);
          optBg.fillRoundedRect(-w / 2 + 4, optY - 17, w - 8, 34, RADIUS.xs);
        });
        optHit.on('pointerout', () => {
          optBg.clear();
        });
        optHit.on('pointerdown', () => {
          onSelect(opt, i);
          label.setText(opt);
          label.setColor('#e2e8f0');
          bg.clear();
          bg.fillStyle(COLORS.panelBg, 1);
          bg.fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS.sm);
          bg.lineStyle(2, COLORS.primary, 1);
          bg.strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS.sm);
          closeDropdown();
        });

        dropdownPanel!.add([optBg, optLabel, optHit]);
      });

      this.time.delayedCall(100, () => {
        this.input.once('pointerdown', () => {
          closeDropdown();
        });
      });
    });

    const setValue = (text: string) => {
      label.setText(text);
      label.setColor('#e2e8f0');
      bg.clear();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2, -h / 2, w, h, RADIUS.sm);
      bg.lineStyle(2, COLORS.primary, 1);
      bg.strokeRoundedRect(-w / 2, -h / 2, w, h, RADIUS.sm);
    };

    return { container, label, bg, setValue };
  }

  private renderMatch(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { pairs?: { need: string; capability: string }[] } | undefined;

    if (!config?.pairs) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const pairs = config.pairs;
    const capabilities = pairs.map((p) => p.capability);
    const shuffledCaps = [...capabilities].sort(() => Math.random() - 0.5);
    const matches: Record<string, string> = {};
    const selectionIndices: number[] = shuffledCaps.map((_, i) => i);
    const rowButtons: { bg: Phaser.GameObjects.Graphics; label: Phaser.GameObjects.Text; indicator: Phaser.GameObjects.Graphics }[] = [];
    const touchedRows = new Set<number>();

    this.progressText = this.add.text(this.scale.width / 2, 185, `Selected: 0/${pairs.length}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const col1X = x + 80;
    const col2X = x + w - 80;
    const startY = y + 40;
    const rowHeight = 60;

    const updateVisualIndicators = () => {
      rowButtons.forEach((rb, ri) => {
        const cap = shuffledCaps[selectionIndices[ri]];
        rb.label.setText(cap);
        const usedIndices = selectionIndices.slice();
        const isDuplicate = usedIndices.filter(idx => idx === selectionIndices[ri]).length > 1;
        rb.bg.clear();
        rb.bg.fillStyle(COLORS.panelBg, 1);
        rb.bg.fillRoundedRect(-100, -20, 200, 40, RADIUS.sm);
        rb.indicator.clear();
        if (isDuplicate) {
          rb.bg.lineStyle(2, COLORS.error, 1);
          rb.indicator.fillStyle(COLORS.error, 1);
        } else {
          rb.bg.lineStyle(2, COLORS.primary, 1);
          rb.indicator.fillStyle(COLORS.success, 1);
        }
        rb.bg.strokeRoundedRect(-100, -20, 200, 40, RADIUS.sm);
        rb.indicator.fillCircle(-110, 0, 5);
      });
    };

    pairs.forEach((pair, i) => {
      const rowY = startY + i * rowHeight;
      this.contentContainer.add(
        this.add.text(col1X, rowY, pair.need, {
          fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
          color: '#f8fafc',
          fontFamily: FONT.family,
        }).setOrigin(0, 0.5)
      );

      const cap = shuffledCaps[selectionIndices[i]];
      const dropdown = this.createDropdownSelector(col2X, rowY, 200, 40, shuffledCaps, (opt, idx) => {
        selectionIndices[i] = idx;
        matches[pair.need] = opt;
        touchedRows.add(i);
        if (this.progressText) {
          this.progressText.setText(`Selected: ${touchedRows.size}/${pairs.length}`);
        }
        updateVisualIndicators();
      });
      dropdown.setValue(cap);

      const indicator = this.add.graphics();
      indicator.fillStyle(COLORS.border, 1);
      indicator.fillCircle(-110, 0, 5);
      dropdown.container.add(indicator);

      rowButtons.push({ bg: dropdown.bg, label: dropdown.label, indicator });
      this.contentContainer.add(dropdown.container);
    });

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      let correctCount = 0;
      pairs.forEach((p) => {
        if (matches[p.need] === p.capability) correctCount++;
      });
      const correct = correctCount === pairs.length;

      pairs.forEach((p, ri) => {
        const isMatchCorrect = matches[p.need] === p.capability;
        rowButtons[ri].bg.clear();
        rowButtons[ri].bg.fillStyle(isMatchCorrect ? COLORS.success : COLORS.error, 1);
        rowButtons[ri].bg.fillRoundedRect(-100, -20, 200, 40, RADIUS.sm);
        if (!isMatchCorrect) {
          const correctLabel = this.add.text(col2X + 110, startY + ri * rowHeight, `→ ${p.capability}`, {
            fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
            color: '#f59e0b',
            fontFamily: FONT.family,
          }).setOrigin(0, 0.5);
          this.contentContainer.add(correctLabel);
        }
      });

      this.time.delayedCall(1500, () => {
        this.checkAnswer(correct, correctCount, pairs.length);
      });
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);

    const totalHeight = startY + pairs.length * rowHeight - y;
    this.maxContentScrollY = Math.max(0, totalHeight - h);
  }

  private renderSelect(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { items?: { id: string; text: string }[] } | undefined;
    const correctAnswer = this.levelData.correctAnswer as string[] | undefined;

    if (!config?.items || !correctAnswer) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const selected = new Set<string>();
    const itemBgs: Phaser.GameObjects.Graphics[] = [];

    const startY = y + 30;
    const itemHeight = 45;
    const gap = 8;

    config.items.forEach((item, i) => {
      const itemY = startY + i * (itemHeight + gap);
      const btn = this.add.container(x + w / 2, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
      bg.lineStyle(2, COLORS.border, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);

      const checkboxBg = this.add.graphics();
      checkboxBg.fillStyle(COLORS.border, 1);
      checkboxBg.fillRoundedRect(-w / 2 + 28, -8, 16, 16, 3);

      const label = this.add.text(-w / 2 + 60, 0, item.text, {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
        wordWrap: { width: w - 100 },
      }).setOrigin(0, 0.5);

      btn.add([bg, checkboxBg, label]);
      btn.setSize(w - 40, itemHeight);
      btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight), Phaser.Geom.Rectangle.Contains);

      itemBgs.push(bg);

      btn.on('pointerdown', () => {
        if (selected.has(item.id)) {
          selected.delete(item.id);
          checkboxBg.clear();
          checkboxBg.fillStyle(COLORS.border, 1);
          checkboxBg.fillRoundedRect(-w / 2 + 28, -8, 16, 16, 3);
        } else {
          selected.add(item.id);
          checkboxBg.clear();
          checkboxBg.fillStyle(COLORS.primary, 1);
          checkboxBg.fillRoundedRect(-w / 2 + 28, -8, 16, 16, 3);
          checkboxBg.lineStyle(2, COLORS.textBright, 1);
          checkboxBg.beginPath();
          checkboxBg.moveTo(-w / 2 + 32, -1);
          checkboxBg.lineTo(-w / 2 + 35, 3);
          checkboxBg.lineTo(-w / 2 + 41, -5);
          checkboxBg.strokePath();
        }
      });

      this.contentContainer.add(btn);
    });

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      const correctInSelection = correctAnswer.filter(id => selected.has(id)).length;
      const wrongInSelection = [...selected].filter(id => !correctAnswer.includes(id)).length;
      const correctCount = Math.max(0, correctInSelection - wrongInSelection);
      const correct = correctAnswer.every((id) => selected.has(id)) && selected.size === correctAnswer.length;

      config.items!.forEach((item, i) => {
        const isCorrectItem = correctAnswer.includes(item.id);
        const isSelected = selected.has(item.id);
        if (isSelected && isCorrectItem) {
          itemBgs[i].clear();
          itemBgs[i].fillStyle(COLORS.success, 1);
          itemBgs[i].fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
        } else if (isSelected && !isCorrectItem) {
          itemBgs[i].clear();
          itemBgs[i].fillStyle(COLORS.error, 1);
          itemBgs[i].fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
        } else if (!isSelected && isCorrectItem) {
          itemBgs[i].clear();
          itemBgs[i].fillStyle(COLORS.success, 0.5);
          itemBgs[i].fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
        }
      });

      this.time.delayedCall(1500, () => {
        this.checkAnswer(correct, correctCount, correctAnswer.length);
      });
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);

    const totalHeight = startY + config.items.length * (itemHeight + gap) - y;
    this.maxContentScrollY = Math.max(0, totalHeight - h);
  }

  private renderSequence(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { steps?: string[] } | undefined;
    const correctAnswer = this.levelData.correctAnswer as string[] | undefined;

    if (!config?.steps || !correctAnswer) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const currentOrder = [...config.steps].sort(() => Math.random() - 0.5);
    const itemContainers: Phaser.GameObjects.Container[] = [];
    const startY = y + 30;
    const itemHeight = 45;
    const gap = 8;
    let isDragging = false;

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

        const label = this.add.text(-w / 2 + 50, 0, `${i + 1}. ${step}`, {
          fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
          color: '#e2e8f0',
          fontFamily: FONT.family,
          wordWrap: { width: w - 120 },
        }).setOrigin(0, 0.5);

        const upBtn = this.add.text(w / 2 - 70, 0, '▲', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: i > 0 ? '#0ea5e9' : '#334155',
          fontFamily: FONT.family,
        }).setOrigin(0.5).setInteractive();

        upBtn.on('pointerdown', () => {
          if (i > 0) {
            [currentOrder[i], currentOrder[i - 1]] = [currentOrder[i - 1], currentOrder[i]];
            renderItems();
          }
        });

        const downBtn = this.add.text(w / 2 - 40, 0, '▼', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: i < currentOrder.length - 1 ? '#0ea5e9' : '#334155',
          fontFamily: FONT.family,
        }).setOrigin(0.5).setInteractive();

        downBtn.on('pointerdown', () => {
          if (i < currentOrder.length - 1) {
            [currentOrder[i], currentOrder[i + 1]] = [currentOrder[i + 1], currentOrder[i]];
            renderItems();
          }
        });

        btn.add([bg, label, upBtn, downBtn]);
        btn.setSize(w - 40, itemHeight);

        btn.setInteractive(new Phaser.Geom.Rectangle(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight), Phaser.Geom.Rectangle.Contains);
        this.input.setDraggable(btn);

        const dragIndex = i;

        btn.on('dragstart', () => {
          isDragging = true;
          btn.setDepth(50);
          btn.setScale(1.05);
        });

        btn.on('drag', (_pointer: Phaser.Input.Pointer, _dragX: number, dragY: number) => {
          btn.y = Phaser.Math.Clamp(
            dragY,
            startY,
            startY + (currentOrder.length - 1) * (itemHeight + gap)
          );
        });

        btn.on('dragend', () => {
          btn.setDepth(0);
          btn.setScale(1);

          const newIndex = Math.round((btn.y - startY) / (itemHeight + gap));
          const clampedIndex = Phaser.Math.Clamp(newIndex, 0, currentOrder.length - 1);

          if (clampedIndex !== dragIndex) {
            const item = currentOrder.splice(dragIndex, 1)[0];
            currentOrder.splice(clampedIndex, 0, item);
          }

          isDragging = false;
          renderItems();
        });

        itemContainers.push(btn);
        this.contentContainer.add(btn);
      });
    };

    renderItems();

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      if (isDragging) return;
      const correct = currentOrder.every((step, i) => step === correctAnswer[i]);
      this.checkAnswer(correct);
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);

    const totalHeight = startY + currentOrder.length * (itemHeight + gap) - y;
    this.maxContentScrollY = Math.max(0, totalHeight - h);
  }

  private renderDragDrop(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as {
      items?: { id: string; text: string }[];
      categories?: { id: string; label: string }[];
    } | undefined;
    const correctAnswer = this.levelData.correctAnswer as Record<string, string> | undefined;

    if (!config?.items || !config?.categories || !correctAnswer) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const items = [...config.items].sort(() => Math.random() - 0.5);
    const categories = config.categories;
    const placements: Record<string, string> = {};
    const poolY = y + 10;
    const zoneStartY = y + 130;
    const itemHeight = 36;
    const itemGap = 6;
    const zoneWidth = (w - 20) / categories.length;
    const zoneHeight = h - 180;
    const originalPositions: Record<number, { x: number; y: number }> = {};

    this.contentContainer.add(
      this.add.text(x + 20, poolY, 'Drag items to categories:', {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
      })
    );

    this.progressText = this.add.text(this.scale.width / 2, 185, `Items placed: 0/${items.length}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const poolBg = this.add.graphics();
    poolBg.fillStyle(COLORS.bg, 0.5);
    poolBg.fillRoundedRect(x + 10, poolY + 20, w - 20, 90, RADIUS.sm);
    poolBg.lineStyle(1, COLORS.border, 1);
    poolBg.strokeRoundedRect(x + 10, poolY + 20, w - 20, 90, RADIUS.sm);
    this.contentContainer.add(poolBg);

    const zoneRects: { id: string; rect: Phaser.Geom.Rectangle; bg: Phaser.GameObjects.Graphics }[] = [];
    categories.forEach((cat, ci) => {
      const zx = x + 10 + ci * zoneWidth;
      const zoneBg = this.add.graphics();
      zoneBg.fillStyle(COLORS.panelBg, 0.6);
      zoneBg.fillRoundedRect(zx + 4, zoneStartY, zoneWidth - 8, zoneHeight, RADIUS.sm);
      zoneBg.lineStyle(2, COLORS.border, 1);
      zoneBg.strokeRoundedRect(zx + 4, zoneStartY, zoneWidth - 8, zoneHeight, RADIUS.sm);

      this.contentContainer.add(zoneBg);
      this.contentContainer.add(
        this.add.text(zx + zoneWidth / 2, zoneStartY + 15, cat.label, {
          fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
          color: '#0ea5e9',
          fontFamily: FONT.family,
          fontStyle: 'bold',
        }).setOrigin(0.5)
      );

      zoneRects.push({
        id: cat.id,
        rect: new Phaser.Geom.Rectangle(zx + 4, zoneStartY, zoneWidth - 8, zoneHeight),
        bg: zoneBg,
      });
    });

    const poolItemWidth = Math.min(140, (w - 40) / items.length);
    const itemsPerRow = Math.floor((w - 30) / (poolItemWidth + 4));

    items.forEach((item, ii) => {
      const col = ii % itemsPerRow;
      const row = Math.floor(ii / itemsPerRow);
      const itemX = x + 20 + col * (poolItemWidth + 4);
      const itemY = poolY + 30 + row * (itemHeight + itemGap);

      const container = this.add.container(itemX, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.border, 1);
      bg.fillRoundedRect(0, 0, poolItemWidth - 4, itemHeight, RADIUS.sm);
      bg.lineStyle(1, COLORS.primary, 1);
      bg.strokeRoundedRect(0, 0, poolItemWidth - 4, itemHeight, RADIUS.sm);

      const label = this.add.text((poolItemWidth - 4) / 2, itemHeight / 2, item.text, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs + 1)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0.5);

      container.add([bg, label]);
      container.setSize(poolItemWidth - 4, itemHeight);

      originalPositions[ii] = { x: itemX, y: itemY };

      let isDragging = false;
      let dragStartPointerX = 0;
      let dragStartPointerY = 0;
      let dragStartItemX = 0;
      let dragStartItemY = 0;

      container.setInteractive({ useHandCursor: true });

      container.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        isDragging = true;
        container.setDepth(100);
        dragStartPointerX = pointer.x;
        dragStartPointerY = pointer.y;
        dragStartItemX = container.x;
        dragStartItemY = container.y;
        this.input.on('pointermove', onPointerMove);
      });

      const onPointerMove = (pointer: Phaser.Input.Pointer) => {
        if (!isDragging) return;
        container.x = dragStartItemX + (pointer.x - dragStartPointerX);
        container.y = dragStartItemY + (pointer.y - dragStartPointerY);
      };

      const handleDrop = () => {
        if (!isDragging) return;
        isDragging = false;
        container.setDepth(0);
        this.input.off('pointermove', onPointerMove);

        const itemCenterX = container.x + (poolItemWidth - 4) / 2;
        const itemCenterY = container.y + itemHeight / 2 + this.contentScrollY;
        const previousZone = placements[item.id];
        let placed = false;

        for (const zone of zoneRects) {
          if (Phaser.Geom.Rectangle.Contains(zone.rect, itemCenterX, itemCenterY)) {
            if (previousZone && previousZone !== zone.id) {
              const oldZone = zoneRects.find(z => z.id === previousZone);
              if (oldZone) {
                oldZone.bg.clear();
                oldZone.bg.fillStyle(COLORS.panelBg, 0.6);
                oldZone.bg.fillRoundedRect(oldZone.rect.x, oldZone.rect.y, oldZone.rect.width, oldZone.rect.height, RADIUS.sm);
                oldZone.bg.lineStyle(2, COLORS.border, 1);
                oldZone.bg.strokeRoundedRect(oldZone.rect.x, oldZone.rect.y, oldZone.rect.width, oldZone.rect.height, RADIUS.sm);
              }
            }
            delete placements[item.id];
            const zoneItemCount = Object.values(placements).filter(v => v === zone.id).length;
            const snapX = zone.rect.x + 12;
            const snapY = zone.rect.y + 35 + zoneItemCount * (itemHeight + itemGap);
            container.x = snapX;
            container.y = snapY;
            placements[item.id] = zone.id;
            placed = true;

            zone.bg.clear();
            zone.bg.fillStyle(COLORS.panelBg, 0.6);
            zone.bg.fillRoundedRect(zone.rect.x, zone.rect.y, zone.rect.width, zone.rect.height, RADIUS.sm);
            zone.bg.lineStyle(2, COLORS.primary, 1);
            zone.bg.strokeRoundedRect(zone.rect.x, zone.rect.y, zone.rect.width, zone.rect.height, RADIUS.sm);
            break;
          }
        }

        if (!placed) {
          delete placements[item.id];
          container.x = originalPositions[ii].x;
          container.y = originalPositions[ii].y;
        }
        if (this.progressText) {
          this.progressText.setText(`Items placed: ${Object.keys(placements).length}/${items.length}`);
        }
      };

      container.on('pointerup', handleDrop);
      container.on('pointerupoutside', handleDrop);

      this.contentContainer.add(container);
    });

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      let correctCount = 0;
      items.forEach(item => {
        if (placements[item.id] === correctAnswer[item.id]) correctCount++;
      });
      const correct = correctCount === items.length;
      this.checkAnswer(correct, correctCount, items.length);
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);
  }

  private renderEdit(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { statements?: string[] } | undefined;
    const correctAnswer = this.levelData.correctAnswer as Record<string, string> | undefined;

    if (!config?.statements) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const statements = config.statements;
    const inputState: { text: Phaser.GameObjects.Text; cursor: Phaser.GameObjects.Text; value: string; feedback: Phaser.GameObjects.Text; inputBg: Phaser.GameObjects.Graphics; rowY: number; placeholder: Phaser.GameObjects.Text }[] = [];
    let activeInputIndex = -1;
    let cursorTimer: Phaser.Time.TimerEvent | null = null;

    const startY = y + 30;
    const rowHeight = 100;

    statements.forEach((stmt, i) => {
      const rowY = startY + i * rowHeight;
      this.contentContainer.add(
        this.add.text(x + 20, rowY, `Original: ${stmt}`, {
          fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
          color: '#94a3b8',
          fontFamily: FONT.family,
          wordWrap: { width: w - 40 },
        })
      );

      const inputBg = this.add.graphics();
      inputBg.fillStyle(COLORS.panelBg, 1);
      inputBg.fillRoundedRect(x + 20, rowY + 25, w - 40, 35, RADIUS.sm);
      inputBg.lineStyle(2, COLORS.border, 1);
      inputBg.strokeRoundedRect(x + 20, rowY + 25, w - 40, 35, RADIUS.sm);

      const inputText = this.add.text(x + 30, rowY + 42, '', {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0, 0.5);

      const cursor = this.add.text(x + 30, rowY + 42, '|', {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#0ea5e9',
        fontFamily: FONT.family,
      }).setOrigin(0, 0.5).setVisible(false);

      const expected = correctAnswer ? (correctAnswer[stmt] || '') : '';
      const placeholderKeywords = expected.split(/[\s,;:.]+/).filter(k => k.length > 3);
      const placeholderStr = placeholderKeywords.length > 0 ? `e.g., ${placeholderKeywords.slice(0, 3).join(', ')}` : '';
      const placeholderText = this.add.text(x + 30, rowY + 42, placeholderStr, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#475569',
        fontFamily: FONT.family,
      }).setOrigin(0, 0.5).setVisible(placeholderStr.length > 0);

      const feedback = this.add.text(x + 30, rowY + 65, '', {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
        wordWrap: { width: w - 60 },
      });

      inputState.push({ text: inputText, cursor, value: '', feedback, inputBg, rowY, placeholder: placeholderText });

      this.contentContainer.add(inputBg);
      this.contentContainer.add(placeholderText);
      this.contentContainer.add(inputText);
      this.contentContainer.add(cursor);
      this.contentContainer.add(feedback);

      const hitArea = this.add.zone(x + w / 2, rowY + 42, w - 40, 35).setInteractive();
      hitArea.on('pointerdown', () => {
        if (activeInputIndex >= 0 && inputState[activeInputIndex]) {
          const prev = inputState[activeInputIndex];
          prev.cursor.setVisible(false);
          prev.inputBg.clear();
          prev.inputBg.fillStyle(COLORS.panelBg, 1);
          prev.inputBg.fillRoundedRect(x + 20, prev.rowY + 25, w - 40, 35, RADIUS.sm);
          prev.inputBg.lineStyle(2, COLORS.border, 1);
          prev.inputBg.strokeRoundedRect(x + 20, prev.rowY + 25, w - 40, 35, RADIUS.sm);
        }
        activeInputIndex = i;
        inputBg.clear();
        inputBg.fillStyle(COLORS.panelBg, 1);
        inputBg.fillRoundedRect(x + 20, rowY + 25, w - 40, 35, RADIUS.sm);
        inputBg.lineStyle(2, COLORS.primary, 1);
        inputBg.strokeRoundedRect(x + 20, rowY + 25, w - 40, 35, RADIUS.sm);
        cursor.setVisible(true);
        cursor.setPosition(x + 30 + inputText.width, rowY + 42);
        startCursorBlink();
      });
      this.contentContainer.add(hitArea);
    });

    const startCursorBlink = () => {
      if (cursorTimer) cursorTimer.remove();
      cursorTimer = this.time.addEvent({
        delay: 530,
        callback: () => {
          if (activeInputIndex >= 0 && inputState[activeInputIndex]) {
            inputState[activeInputIndex].cursor.setVisible(!inputState[activeInputIndex].cursor.visible);
          }
        },
        loop: true,
      });
    };

    const deactivateInput = () => {
      if (activeInputIndex >= 0 && inputState[activeInputIndex]) {
        const active = inputState[activeInputIndex];
        active.cursor.setVisible(false);
        active.inputBg.clear();
        active.inputBg.fillStyle(COLORS.panelBg, 1);
        active.inputBg.fillRoundedRect(x + 20, active.rowY + 25, w - 40, 35, RADIUS.sm);
        active.inputBg.lineStyle(2, COLORS.border, 1);
        active.inputBg.strokeRoundedRect(x + 20, active.rowY + 25, w - 40, 35, RADIUS.sm);
      }
      activeInputIndex = -1;
      if (cursorTimer) { cursorTimer.remove(); cursorTimer = null; }
    };

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (activeInputIndex < 0) return;
      const active = inputState[activeInputIndex];
      if (!active) return;

      if (event.key === 'Backspace') {
        active.value = active.value.slice(0, -1);
      } else if (event.key === 'Enter') {
        deactivateInput();
        return;
      } else if (event.key === 'Escape') {
        active.value = '';
        deactivateInput();
      } else if (event.key.length === 1) {
        active.value += event.key;
      }

      active.text.setText(active.value);
      active.cursor.setPosition(x + 30 + active.text.width, active.rowY + 42);
      active.cursor.setVisible(true);
      active.placeholder.setVisible(active.value.length === 0);
      active.feedback.setText('');
    });

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      if (correctAnswer) {
        let allCorrect = true;
        let totalKeywords = 0;
        let totalMatched = 0;
        statements.forEach((stmt, i) => {
          const userText = inputState[i].value.toLowerCase();
          const expected = (correctAnswer[stmt] || '').toLowerCase();
          const keywords = expected.split(/[\s,;:.]+/).filter(k => k.length > 3);
          const matched = keywords.filter(kw => {
            const userWords = userText.split(/\s+/);
            return userWords.some(uw => this.levenshteinDistance(uw.toLowerCase(), kw.toLowerCase()) <= 2);
          });
          const missing = keywords.filter(kw => !matched.includes(kw));
          totalKeywords += keywords.length;
          totalMatched += matched.length;
          if (matched.length < Math.ceil(keywords.length * 0.6)) {
            allCorrect = false;
          }
          if (missing.length > 0) {
            if (this.retries >= 2) {
              inputState[i].feedback.setText(`Missing: ${missing.join(', ')}\nExpected: ${expected}`);
            } else {
              inputState[i].feedback.setText(`Missing: ${missing.join(', ')}`);
            }
            inputState[i].feedback.setColor('#f59e0b');
          } else if (keywords.length > 0) {
            inputState[i].feedback.setText('All keywords matched');
            inputState[i].feedback.setColor('#10b981');
          }
        });
        this.checkAnswer(allCorrect, Math.round(totalMatched), totalKeywords);
      } else {
        const correct = statements.every((_, i) => inputState[i].value.length > 20);
        this.checkAnswer(correct);
      }
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);

    const totalHeight = startY + statements.length * rowHeight - y;
    this.maxContentScrollY = Math.max(0, totalHeight - h);
  }

  private renderBuild(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { stages?: string[]; methods?: string[] } | undefined;
    const correctAnswer = this.levelData.correctAnswer as Record<string, string> | undefined;

    if (!config?.stages || !config?.methods || !correctAnswer) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const stages = config.stages;
    const methods = config.methods;
    const selections: Record<string, string> = {};
    let selectedCount = 0;

    this.progressText = this.add.text(this.scale.width / 2, 185, `Selected: 0/${stages.length}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const startY = y + 30;
    const rowHeight = 60;

    stages.forEach((stage, i) => {
      const rowY = startY + i * rowHeight;
      this.contentContainer.add(
        this.add.text(x + 20, rowY, stage, {
          fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
          color: '#f8fafc',
          fontFamily: FONT.family,
        }).setOrigin(0, 0.5)
      );

      const dropdown = this.createDropdownSelector(x + w - 120, rowY, 180, 36, methods, (opt) => {
        if (!selections[stage]) selectedCount++;
        selections[stage] = opt;
        if (this.progressText) {
          this.progressText.setText(`Selected: ${selectedCount}/${stages.length}`);
        }
      });

      this.contentContainer.add(dropdown.container);
    });

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      let correctCount = 0;
      stages.forEach((stage) => {
        if (selections[stage] === correctAnswer[stage]) correctCount++;
      });
      const correct = correctCount === stages.length;

      stages.forEach((stage, i) => {
        const rowY = startY + i * rowHeight;
        if (selections[stage] !== correctAnswer[stage]) {
          const correctLabel = this.add.text(x + w - 30, rowY, `→ ${correctAnswer[stage]}`, {
            fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
            color: '#f59e0b',
            fontFamily: FONT.family,
          }).setOrigin(1, 0.5);
          this.contentContainer.add(correctLabel);
        }
      });

      this.checkAnswer(correct, correctCount, stages.length);
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);

    const totalHeight = startY + stages.length * rowHeight - y;
    this.maxContentScrollY = Math.max(0, totalHeight - h);
  }

  private renderDraw(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as { elements?: string[] } | undefined;
    const correctAnswer = this.levelData.correctAnswer as { inside?: string[]; outside?: string[] } | undefined;

    if (!config?.elements || !correctAnswer?.inside || !correctAnswer?.outside) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const elements = config.elements;
    const classifications: Record<string, 'inside' | 'outside'> = {};

    const startY = y + 30;
    const itemHeight = 45;
    const gap = 8;

    elements.forEach((el, i) => {
      const itemY = startY + i * (itemHeight + gap);
      const btn = this.add.container(x + w / 2, itemY);
      const bg = this.add.graphics();
      bg.fillStyle(COLORS.panelBg, 1);
      bg.fillRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);
      bg.lineStyle(2, COLORS.border, 1);
      bg.strokeRoundedRect(-w / 2 + 20, -itemHeight / 2, w - 40, itemHeight, RADIUS.sm);

      const label = this.add.text(-w / 2 + 40, 0, el, {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      }).setOrigin(0, 0.5);

      const status = this.add.text(w / 2 - 40, 0, '?', {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: '#94a3b8',
        fontFamily: FONT.family,
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

      this.contentContainer.add(btn);
    });

    const correctInside = correctAnswer.inside;
    const correctOutside = correctAnswer.outside;

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      let correctCount = 0;
      elements.forEach((el) => {
        if (correctInside.includes(el) && classifications[el] === 'inside') correctCount++;
        else if (correctOutside.includes(el) && classifications[el] === 'outside') correctCount++;
      });
      const insideCorrect = correctInside.every((el) => classifications[el] === 'inside');
      const outsideCorrect = correctOutside.every((el) => classifications[el] === 'outside');
      const noExtras = elements.every((el) => {
        if (correctInside.includes(el)) return classifications[el] === 'inside';
        if (correctOutside.includes(el)) return classifications[el] === 'outside';
        return true;
      });
      const correct = insideCorrect && outsideCorrect && noExtras;
      this.checkAnswer(correct, correctCount, elements.length);
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);

    const totalHeight = startY + elements.length * (itemHeight + gap) - y;
    this.maxContentScrollY = Math.max(0, totalHeight - h);
  }

  private renderTrace(x: number, y: number, w: number, h: number): void {
    const config = this.levelData.config as {
      requirement?: string;
      stages?: string[];
      activities?: string[];
    } | undefined;
    const correctAnswer = this.levelData.correctAnswer as Record<string, string> | undefined;

    if (!config?.requirement || !config?.stages || !config?.activities || !correctAnswer) {
      this.contentContainer.add(
        this.add.text(x + w / 2, y + h / 2, 'Error: Level data incomplete', {
          fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
          color: '#ef4444',
          fontFamily: FONT.family,
        }).setOrigin(0.5)
      );
      return;
    }

    const selections: Record<string, string> = {};
    const stages = config.stages;
    const activities = config.activities;
    let selectedCount = 0;

    this.progressText = this.add.text(this.scale.width / 2, 185, `Selected: 0/${stages.length}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const startY = y + 10;

    this.contentContainer.add(
      this.add.text(x + w / 2, startY, config.requirement, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md - 1)}px`,
        color: '#f8fafc',
        fontFamily: FONT.family,
        fontStyle: 'bold',
        wordWrap: { width: w - 40 },
        align: 'center',
      }).setOrigin(0.5)
    );

    const stageY = startY + 50;
    const stageWidth = w / stages.length;

    stages.forEach((stage, si) => {
      const sx = x + si * stageWidth;

      this.contentContainer.add(
        this.add.text(sx + stageWidth / 2, stageY, stage, {
          fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
          color: '#0ea5e9',
          fontFamily: FONT.family,
          fontStyle: 'bold',
          align: 'center',
          wordWrap: { width: stageWidth - 4 },
        }).setOrigin(0.5)
      );

      const dropdown = this.createDropdownSelector(sx + stageWidth / 2, stageY + 50, stageWidth - 12, 36, activities, (opt) => {
        if (!selections[stage]) selectedCount++;
        selections[stage] = opt;
        if (this.progressText) {
          this.progressText.setText(`Selected: ${selectedCount}/${stages.length}`);
        }
      });

      this.contentContainer.add(dropdown.container);
    });

    const checkBtn = this.createSmallButton(x + w / 2, y + h - 40, 'Check', () => {
      let correctCount = 0;
      stages.forEach(stage => {
        if (selections[stage] === correctAnswer[stage]) correctCount++;
      });
      const correct = correctCount === stages.length;

      stages.forEach((stage, si) => {
        if (selections[stage] !== correctAnswer[stage]) {
          const sx = x + si * stageWidth;
          const correctLabel = this.add.text(sx + stageWidth / 2, stageY + 90, `→ ${correctAnswer[stage]}`, {
            fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
            color: '#f59e0b',
            fontFamily: FONT.family,
          }).setOrigin(0.5);
          this.contentContainer.add(correctLabel);
        }
      });

      this.checkAnswer(correct, correctCount, stages.length);
    });
    this.checkBtnContainer = checkBtn;
    this.contentContainer.add(checkBtn);
  }

  private checkAnswer(correct: boolean, correctCount?: number, totalCount?: number): void {
    if (correct) {
      this.audioManager?.playSFX('sfx-success');
      this.showSuccess(1.0);
    } else if (correctCount !== undefined && totalCount !== undefined && correctCount > 0) {
      const ratio = correctCount / totalCount;
      if (ratio >= 0.5) {
        this.showSuccess(ratio);
      } else {
        this.retries++;
        this.gameManager.resetStreak();
        this.showFailure();
      }
    } else {
      this.retries++;
      this.gameManager.resetStreak();
      this.showFailure();
    }
  }

  private showSuccess(creditRatio: number = 1.0): void {
    this.audioManager?.playSFX('sfx-level-complete');

    const width = this.scale.width;
    const height = this.scale.height;

    const elapsed = (Date.now() - this.startTime) / 1000;
    const rules = this.levelData.scoringRules;
    const score = ScoringEngine.calculateScore(rules, this.hintsUsed, this.retries, Date.now() - this.startTime, creditRatio);

    this.gameManager.completeLevel(this.levelId, score, this.hintsUsed, this.retries);

    const maxPossible = rules.baseScore + rules.timeBonus + rules.perfectBonus;
    const starRatio = maxPossible > 0 ? score / maxPossible : 0;
    let stars = 1;
    if (starRatio >= 0.85) stars = 3;
    else if (starRatio >= 0.6) stars = 2;
    this.gameManager.setLevelStars(this.levelId, stars);

    const COMPETENCY_MAP: Record<number, string> = {
      1: 'systems_thinking',
      2: 'requirements_engineering',
      3: 'architecture_design',
      4: 'verification_validation',
      5: 'integration_management',
    };
    const competencyKey = COMPETENCY_MAP[this.levelData.moduleId];
    if (competencyKey) {
      this.gameManager.updateCompetency(competencyKey, score);
    }

    const completedCount = Object.values(this.gameManager.getProgress().levelScores).filter(s => s > 0).length;
    if (completedCount === 1) {
      this.gameManager.addAchievement('first_level');
    }

    if (score >= maxPossible) {
      this.gameManager.addAchievement('perfect_score');
    }

    if (elapsed < 30 && creditRatio >= 1.0) {
      this.gameManager.addAchievement('speed_demon');
    }

    if (this.hintsUsed === 0 && creditRatio >= 1.0) {
      this.gameManager.addAchievement('no_hints');
    }

    const progress = this.gameManager.getProgress();
    if (Object.keys(progress.levelScores).length >= 20) {
      const allMax = Object.entries(progress.levelScores).every(([id, s]) => {
        const lvlData = this.levelManager.getLevelData(id);
        if (!lvlData) return false;
        const max = lvlData.scoringRules.baseScore + lvlData.scoringRules.timeBonus + lvlData.scoringRules.perfectBonus;
        return s >= max;
      });
      if (allMax) {
        this.gameManager.addAchievement('se_master');
      }
    }

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

    const panelW = scaledWidth(this, 500);
    const panelH = 360;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);
    panelBg.lineStyle(3, COLORS.success, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);

    const trophyIcon = this.add.image(-80, -140, 'icon-trophy');
    trophyIcon.setScale(0.5);
    const title = this.add.text(-55, -140, 'Level Complete!', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl + 4)}px`,
      color: '#10b981',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0, 0.5);

    const scoreText = this.add.text(0, -80, `Score: ${score}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl - 4)}px`,
      color: '#f59e0b',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const starGfx = this.add.graphics();
    for (let i = 0; i < 3; i++) {
      const sx = -40 + i * 40;
      const sy = -50;
      if (i < stars) {
        starGfx.fillStyle(0xeab308, 1);
      } else {
        starGfx.fillStyle(0x334155, 1);
      }
      const outerR = 14;
      const innerR = 6;
      starGfx.beginPath();
      for (let j = 0; j < 10; j++) {
        const r = j % 2 === 0 ? outerR : innerR;
        const angle = (j * Math.PI) / 5 - Math.PI / 2;
        const px = sx + r * Math.cos(angle);
        const py = sy + r * Math.sin(angle);
        if (j === 0) starGfx.moveTo(px, py);
        else starGfx.lineTo(px, py);
      }
      starGfx.closePath();
      starGfx.fillPath();
    }

    const details = this.add.text(0, -30, `Hints used: ${this.hintsUsed} | Retries: ${this.retries}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const takeaway = this.add.text(0, 30, `Key Takeaway:\n${this.levelData.learningObjective}`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      wordWrap: { width: panelW - 100 },
      align: 'center',
    }).setOrigin(0.5);

    const streak = this.gameManager.getStreak();
    if (streak >= 3) {
      const badgeText = streak >= 10 ? 'Legendary!' : streak >= 5 ? 'Unstoppable!' : 'On Fire!';
      const badgeColor = streak >= 10 ? 0xef4444 : streak >= 5 ? 0xf59e0b : 0xfb923c;

      const badge = this.add.text(0, -110, badgeText, {
        fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
        color: `#${badgeColor.toString(16).padStart(6, '0')}`,
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(0.5);
      panel.add(badge);

      this.time.delayedCall(200, () => {
        ParticleEffect.success(this, width / 2, height / 2);
      });
    }

    const nextBtn = this.createSmallButton(0, 120, nextLevel ? 'Next Level' : 'Back to Map', () => {
      if (nextLevel) {
        this.scene.start('LevelScene', { levelId: nextLevel });
      } else {
        this.scene.start('MapScene', { newUnlock: true });
      }
    });

    panel.add([panelBg, trophyIcon, title, scoreText, starGfx, details, takeaway, nextBtn]);
  }

  private showFailure(): void {
    this.audioManager?.playSFX('sfx-failure');

    const width = this.scale.width;
    const height = this.scale.height;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    const panel = this.add.container(width / 2, height / 2);
    panel.setDepth(201);

    const showSkip = this.retries >= 1;
    const showAnswerBtn = this.retries >= 2;
    const panelW = scaledWidth(this, 400);
    const panelH = showAnswerBtn ? 300 : (showSkip ? 270 : 240);
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);
    panelBg.lineStyle(2, COLORS.error, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);

    const title = this.add.text(0, -halfH + 30, 'Not quite right', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl - 4)}px`,
      color: '#ef4444',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const msg = this.add.text(0, -halfH + 70, 'Take your time and try again.\nUse a hint if you need help!', {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      align: 'center',
    }).setOrigin(0.5);

    const elements: Phaser.GameObjects.GameObject[] = [panelBg, title, msg];

    const retryBtn = this.createSmallButton(-80, halfH - 50, 'Try Again', () => {
      this.scene.restart();
    });
    elements.push(retryBtn);

    const learnMoreBtn = this.createSmallButton(80, halfH - 50, 'Learn More', () => {
      overlay.destroy();
      panel.destroy();
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('LessonScene', { levelId: this.levelId });
      });
    });
    elements.push(learnMoreBtn);

    if (showSkip) {
      const skipBtn = this.createSmallButton(-80, halfH - 90, 'Skip Level', () => {
        this.gameManager.completeLevel(this.levelId, 0, this.hintsUsed, this.retries);
        const nextLevel = this.levelManager.getNextLevelId(this.levelId);
        if (nextLevel) {
          this.scene.start('LevelScene', { levelId: nextLevel });
        } else {
          this.scene.start('MapScene');
        }
      });
      elements.push(skipBtn);
    }

    if (showAnswerBtn) {
      const answerBtn = this.createSmallButton(80, halfH - 90, 'Show Answer', () => {
        this.showAnswerOverlay();
      });
      elements.push(answerBtn);
    }

    panel.add(elements);
  }

  private showAnswerOverlay(): void {
    const width = this.scale.width;
    const height = this.scale.height;

    const answerOverlay = this.add.graphics();
    answerOverlay.fillStyle(0x000000, 0.7);
    answerOverlay.fillRect(0, 0, width, height);
    answerOverlay.setDepth(300);

    const answerPanel = this.add.container(width / 2, height / 2);
    answerPanel.setDepth(301);

    const answerText = this.getCorrectAnswerText();
    const lineCount = answerText.split('\n').length;
    const panelW = scaledWidth(this, 440);
    const panelH = Math.max(200, 120 + lineCount * 24);
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);
    panelBg.lineStyle(2, COLORS.primary, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.md);

    const title = this.add.text(0, -halfH + 25, 'Correct Answer', {
      fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
      color: '#0ea5e9',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const answerContent = this.add.text(0, -halfH + 60, answerText, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: '#e2e8f0',
      fontFamily: FONT.family,
      align: 'left',
      wordWrap: { width: panelW - 40 },
    }).setOrigin(0.5, 0);

    const closeBtn = this.createSmallButton(0, halfH - 35, 'Close', () => {
      answerOverlay.destroy();
      answerPanel.destroy();
    });

    answerPanel.add([panelBg, title, answerContent, closeBtn]);
  }

  private getCorrectAnswerText(): string {
    const config = this.levelData.config as Record<string, unknown>;
    const correctAnswer = this.levelData.correctAnswer;
    const lines: string[] = [];

    switch (this.levelData.type) {
      case 'quiz': {
        const qConfig = config as { question?: string; options?: string[]; correctIndex?: number };
        if (qConfig.options && qConfig.correctIndex !== undefined) {
          lines.push(`Correct answer: ${qConfig.options[qConfig.correctIndex]}`);
        }
        break;
      }
      case 'drag-drop': {
        const ddConfig = config as { items?: { id: string; text: string }[]; categories?: { id: string; label: string }[] };
        const ddAnswer = correctAnswer as Record<string, string> | undefined;
        if (ddConfig.items && ddConfig.categories && ddAnswer) {
          const catLabels = Object.fromEntries(ddConfig.categories.map(c => [c.id, c.label]));
          ddConfig.items.forEach(item => {
            const cat = ddAnswer[item.id];
            lines.push(`${item.text} → ${catLabels[cat] || cat}`);
          });
        }
        break;
      }
      case 'match': {
        const mConfig = config as { pairs?: { need: string; capability: string }[] };
        if (mConfig.pairs) {
          mConfig.pairs.forEach(p => {
            lines.push(`${p.need} ↔ ${p.capability}`);
          });
        }
        break;
      }
      case 'edit': {
        const eConfig = config as { statements?: string[] };
        const eAnswer = correctAnswer as Record<string, string> | undefined;
        if (eConfig.statements && eAnswer) {
          eConfig.statements.forEach(stmt => {
            lines.push(`${stmt}: ${eAnswer[stmt] || ''}`);
          });
        }
        break;
      }
      case 'build': {
        const bConfig = config as { stages?: string[] };
        const bAnswer = correctAnswer as Record<string, string> | undefined;
        if (bConfig.stages && bAnswer) {
          bConfig.stages.forEach(stage => {
            lines.push(`${stage}: ${bAnswer[stage] || ''}`);
          });
        }
        break;
      }
      case 'trace': {
        const tConfig = config as { stages?: string[] };
        const tAnswer = correctAnswer as Record<string, string> | undefined;
        if (tConfig.stages && tAnswer) {
          tConfig.stages.forEach(stage => {
            lines.push(`${stage}: ${tAnswer[stage] || ''}`);
          });
        }
        break;
      }
      case 'sequence': {
        const sAnswer = correctAnswer as string[] | undefined;
        if (sAnswer) {
          sAnswer.forEach((step, i) => {
            lines.push(`${i + 1}. ${step}`);
          });
        }
        break;
      }
      case 'select': {
        const sConfig = config as { items?: { id: string; text: string }[] };
        const sAnswer = correctAnswer as string[] | undefined;
        if (sConfig.items && sAnswer) {
          const selectedItems = sConfig.items.filter(item => sAnswer.includes(item.id));
          lines.push(`Select: ${selectedItems.map(item => item.text).join(', ')}`);
        }
        break;
      }
      case 'draw': {
        const dAnswer = correctAnswer as { inside?: string[]; outside?: string[] } | undefined;
        if (dAnswer) {
          if (dAnswer.inside) lines.push(`Inside: ${dAnswer.inside.join(', ')}`);
          if (dAnswer.outside) lines.push(`Outside: ${dAnswer.outside.join(', ')}`);
        }
        break;
      }
      default:
        lines.push('Answer not available for this level type.');
    }

    return lines.join('\n');
  }

  private levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }
}
