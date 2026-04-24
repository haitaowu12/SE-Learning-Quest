import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
import { AudioManager } from '@/components/AudioManager.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';
import { COLORS, RADIUS, FONT } from '@/utils/designTokens.ts';
import { scaledFontSize } from '@/utils/scaling.ts';
import { ProceduralBG } from '@/utils/proceduralBG.ts';
import type { LevelMeta, ModuleMeta } from '@/types/index.ts';

export class ModuleScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private moduleId!: number;
  private newUnlock = false;
  private focusedIndex = 0;
  private levelCards: { container: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; level: LevelMeta; mod: ModuleMeta }[] = [];

  constructor() {
    super({ key: 'ModuleScene' });
  }

  init(data: { moduleId: number; newUnlock?: boolean }): void {
    this.moduleId = data.moduleId;
    this.newUnlock = data.newUnlock ?? false;
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    this.focusedIndex = 0;
    this.levelCards = [];

    const width = this.scale.width;
    const height = this.scale.height;

    ProceduralBG.draw(this, this.moduleId, width, height);

    const modules = this.levelManager.getModules(this.gameManager.getProgress());
    const module = modules.find((m) => m.id === this.moduleId);
    if (!module) {
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('MapScene');
      });
      return;
    }

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

    const startY = 140;
    const cardHeight = 90;
    const gap = 16;
    module.levels.forEach((level, index) => {
      this.renderLevelCard(level, width / 2, startY + index * (cardHeight + gap), cardHeight, module);
    });

    this.createBackButton(80, height - 40);

    this.focusFirstUnlocked();

    if (this.newUnlock) {
      const completedCount = module.levels.filter(l => l.completed).length;
      const unlockedIndex = completedCount;
      if (unlockedIndex < this.levelCards.length && !this.levelCards[unlockedIndex].level.locked) {
        this.playUnlockAnimation(this.levelCards[unlockedIndex].container);
      }
    }

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.levelCards.length === 0) return;

      if (event.key === 'ArrowUp') {
        this.focusedIndex = (this.focusedIndex - 1 + this.levelCards.length) % this.levelCards.length;
        this.updateFocusVisual();
      } else if (event.key === 'ArrowDown') {
        this.focusedIndex = (this.focusedIndex + 1) % this.levelCards.length;
        this.updateFocusVisual();
      } else if (event.key === 'Enter') {
        const card = this.levelCards[this.focusedIndex];
        if (card && !card.level.locked) {
          this.audioManager?.playSFX('sfx-click');
          TransitionManager.fadeOut(this, 300, () => {
            if (card.level.completed) {
              this.scene.start('LevelScene', { levelId: card.level.id });
            } else {
              this.scene.start('LessonScene', { levelId: card.level.id });
            }
          });
        }
      } else if (event.key === 'Escape') {
        this.audioManager?.playSFX('sfx-click');
        TransitionManager.fadeOut(this, 300, () => {
          this.scene.start('MapScene');
        });
      }
    });

    TransitionManager.fadeIn(this, 300);
  }

  private focusFirstUnlocked(): void {
    const unlockedIndex = this.levelCards.findIndex((c) => !c.level.locked);
    this.focusedIndex = unlockedIndex >= 0 ? unlockedIndex : 0;
    this.updateFocusVisual();
  }

  private updateFocusVisual(): void {
    const cardWidth = 500;
    this.levelCards.forEach((card, i) => {
      const color = card.level.locked ? 0x475569 : parseInt(card.mod.themeColor.replace('#', ''), 16);
      const isFocused = i === this.focusedIndex;
      card.bg.clear();
      card.bg.fillStyle(card.level.locked ? 0x1e293b : 0x0f172a, 1);
      card.bg.fillRoundedRect(-cardWidth / 2, -45, cardWidth, 90, RADIUS.md);
      card.bg.lineStyle(isFocused ? 3 : 2, isFocused ? 0x38bdf8 : color, 1);
      card.bg.strokeRoundedRect(-cardWidth / 2, -45, cardWidth, 90, RADIUS.md);
    });
  }

  private renderLevelCard(level: LevelMeta, x: number, y: number, height: number, mod: ModuleMeta): void {
    const width = 500;
    const container = this.add.container(x, y);
    const color = level.locked ? 0x475569 : parseInt(mod.themeColor.replace('#', ''), 16);

    const bg = this.add.graphics();
    bg.fillStyle(level.locked ? 0x1e293b : 0x0f172a, 1);
    bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
    bg.lineStyle(2, color, 1);
    bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
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

    const moduleId = parseInt(level.id.split('_')[0], 10);
    let difficultyLabel: string;
    let difficultyColor: number;
    if (moduleId <= 2) {
      difficultyLabel = 'Easy';
      difficultyColor = COLORS.success;
    } else if (moduleId <= 4) {
      difficultyLabel = 'Medium';
      difficultyColor = COLORS.warning;
    } else {
      difficultyLabel = 'Hard';
      difficultyColor = COLORS.error;
    }

    const badgeBg = this.add.graphics();
    badgeBg.fillStyle(difficultyColor, 1);
    badgeBg.fillRoundedRect(-width / 2 + 20, -height / 2 + 62, 60, 18, 4);
    container.add(badgeBg);

    const badgeText = this.add.text(-width / 2 + 50, -height / 2 + 71, difficultyLabel, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);
    container.add(badgeText);

    const typeLabels: Record<string, string> = {
      'drag-drop': 'Drag & Drop',
      'match': 'Match',
      'quiz': 'Quiz',
      'edit': 'Edit',
      'sequence': 'Sequence',
      'select': 'Select',
      'draw': 'Draw',
      'build': 'Build',
      'trace': 'Trace',
    };
    const typeLabel = typeLabels[level.type] || level.type;
    const typeBadge = this.add.text(-width / 2 + 88, -height / 2 + 71, typeLabel, {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs - 1)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
      backgroundColor: '#1e293b',
      padding: { x: 4, y: 2 },
    }).setOrigin(0, 0.5);
    container.add(typeBadge);

    if (level.completed) {
      const starIcon = this.add.image(width / 2 - 60, -height / 2 + 15, 'icon-star');
      starIcon.setScale(0.4);
      container.add(starIcon);

      const scoreText = this.add.text(width / 2 - 44, -height / 2 + 15, `${level.bestScore}`, {
        fontSize: '16px',
        color: '#f59e0b',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
      }).setOrigin(0, 0.5);
      container.add(scoreText);

      const check = this.add.image(width / 2 - 20, 0, 'icon-check');
      check.setScale(0.5);
      check.setOrigin(1, 0.5);
      container.add(check);
    } else if (level.locked) {
      const lock = this.add.image(width / 2 - 20, 0, 'icon-lock');
      lock.setScale(0.5);
      lock.setTint(0x475569);
      lock.setOrigin(1, 0.5);
      container.add(lock);
    } else {
      const play = this.add.image(width / 2 - 20, 0, 'icon-play');
      play.setScale(0.5);
      play.setTint(parseInt(mod.themeColor.replace('#', ''), 16));
      play.setOrigin(1, 0.5);
      container.add(play);
    }

    const cardEntry = { container, bg, level, mod };
    this.levelCards.push(cardEntry);

    if (!level.locked) {
      container.setSize(width, height);
      container.setInteractive(new Phaser.Geom.Rectangle(-width / 2, -height / 2, width, height), Phaser.Geom.Rectangle.Contains);

      container.on('pointerover', () => {
        this.focusedIndex = this.levelCards.indexOf(cardEntry);
        this.updateFocusVisual();
        bg.clear();
        bg.fillStyle(0x3b82f6, 0.08);
        bg.fillRoundedRect(-width / 2 - 4, -height / 2 - 4, width + 8, height + 8, RADIUS.md + 2);
        bg.fillStyle(level.locked ? 0x1e293b : 0x0f172a, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
        bg.lineStyle(2, COLORS.primary, 0.6);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
        this.input.setDefaultCursor('pointer');
      });

      container.on('pointerout', () => {
        bg.clear();
        bg.fillStyle(level.locked ? 0x1e293b : 0x0f172a, 1);
        bg.fillRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
        bg.lineStyle(2, color, 1);
        bg.strokeRoundedRect(-width / 2, -height / 2, width, height, RADIUS.md);
        this.input.setDefaultCursor('default');
      });

      container.on('pointerdown', () => {
        this.audioManager?.playSFX('sfx-click');
        TransitionManager.fadeOut(this, 300, () => {
          if (level.completed) {
            this.scene.start('LevelScene', { levelId: level.id });
          } else {
            this.scene.start('LessonScene', { levelId: level.id });
          }
        });
      });
    }
  }

  private playUnlockAnimation(container: Phaser.GameObjects.Container): void {
    container.setAlpha(0);
    container.setScale(0.8);
    this.tweens.add({
      targets: container,
      alpha: 1,
      scale: 1,
      duration: 600,
      ease: 'Back.easeOut',
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
        this.scene.start('MapScene');
      });
    });
  }
}
