import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { AudioManager } from '@/components/AudioManager.ts';
import { TransitionManager } from '@/components/TransitionManager.ts';
import { COLORS, RADIUS, FONT } from '@/utils/designTokens.ts';
import { scaledFontSize } from '@/utils/scaling.ts';
import achievementsData from '@/data/achievements.json';

interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export class TitleScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private audioManager!: AudioManager | null;
  private focusedIndex = 0;
  private menuButtons: { container: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Graphics; callback: () => void }[] = [];
  private settingsOverlay: Phaser.GameObjects.Graphics | null = null;
  private settingsPanel: Phaser.GameObjects.Container | null = null;
  private achievementsOverlay: Phaser.GameObjects.Graphics | null = null;
  private achievementsPanel: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    this.focusedIndex = 0;
    this.menuButtons = [];

    const width = this.scale.width;
    const height = this.scale.height;

    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0f172a, 0x0f172a, 0x1e293b, 0x1e293b, 1);
    bg.fillRect(0, 0, width, height);

    for (let i = 0; i < 30; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 6);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
      const circle = this.add.circle(x, y, size, 0x0ea5e9, alpha);
      this.tweens.add({
        targets: circle,
        y: y - Phaser.Math.Between(50, 150),
        alpha: 0,
        duration: Phaser.Math.Between(2000, 4000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 2000),
      });
    }

    this.add.text(width / 2, height * 0.25, 'SE Learning Quest', {
      fontSize: '64px',
      color: '#f8fafc',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.25 + 60, 'Master Systems Engineering Through Play', {
      fontSize: '24px',
      color: '#94a3b8',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const progress = this.gameManager.getOverallProgress();
    if (progress.completedLevels > 0) {
      this.add.text(width / 2, height * 0.4, `Progress: ${progress.percentage}% (${progress.completedLevels}/${progress.totalLevels} levels)`, {
        fontSize: '18px',
        color: '#0ea5e9',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5);
    }

    const btnY = height * 0.55;
    const btnSpacing = 70;

    this.createButton(width / 2, btnY, 'Start Learning', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('MapScene');
      });
    });

    this.createButton(width / 2, btnY + btnSpacing, 'Continue', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('MapScene');
      });
    });

    this.createButton(width / 2, btnY + btnSpacing * 2, 'Achievements', () => {
      this.audioManager?.playSFX('sfx-click');
      this.showAchievements();
    });

    this.createButton(width / 2, btnY + btnSpacing * 3, 'Settings', () => {
      this.audioManager?.playSFX('sfx-click');
      this.showSettings();
    });

    this.add.text(width / 2, height - 30, 'Based on INCOSE SEHBv5, ISO 15288, EN 50126', {
      fontSize: '12px',
      color: '#64748b',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.updateFocusVisual();

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.achievementsPanel) {
        if (event.key === 'Escape') {
          this.closeAchievements();
        }
        return;
      }

      if (this.settingsPanel) {
        if (event.key === 'Escape') {
          this.closeSettings();
        }
        return;
      }

      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
        this.focusedIndex = (this.focusedIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
        this.updateFocusVisual();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
        this.focusedIndex = (this.focusedIndex + 1) % this.menuButtons.length;
        this.updateFocusVisual();
      } else if (event.key === 'Enter') {
        this.menuButtons[this.focusedIndex]?.callback();
      } else if (event.key === 'Escape') {
        this.showSettings();
      }
    });

    TransitionManager.fadeIn(this, 300);
  }

  private updateFocusVisual(): void {
    this.menuButtons.forEach((btn, i) => {
      btn.bg.clear();
      if (i === this.focusedIndex) {
        btn.bg.fillStyle(0x0284c7, 1);
        btn.bg.fillRoundedRect(-120, -25, 240, 50, 12);
        btn.bg.lineStyle(3, 0x38bdf8, 1);
        btn.bg.strokeRoundedRect(-120, -25, 240, 50, 12);
      } else {
        btn.bg.fillStyle(0x0ea5e9, 1);
        btn.bg.fillRoundedRect(-120, -25, 240, 50, 12);
      }
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const btn = this.add.container(x, y);

    const bg = this.add.graphics();
    bg.fillStyle(0x0ea5e9, 1);
    bg.fillRoundedRect(-120, -25, 240, 50, 12);

    const label = this.add.text(0, 0, text, {
      fontSize: '20px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(240, 50);

    btn.setInteractive(new Phaser.Geom.Rectangle(-120, -25, 240, 50), Phaser.Geom.Rectangle.Contains);

    const entry = { container: btn, bg, callback };
    this.menuButtons.push(entry);

    btn.on('pointerover', () => {
      this.focusedIndex = this.menuButtons.indexOf(entry);
      this.updateFocusVisual();
      this.input.setDefaultCursor('pointer');
    });

    btn.on('pointerout', () => {
      this.input.setDefaultCursor('default');
    });

    btn.on('pointerdown', callback);
  }

  private showAchievements(): void {
    if (this.achievementsPanel) return;

    const width = this.scale.width;
    const height = this.scale.height;
    const achievements = achievementsData as AchievementDef[];
    const unlockedIds = this.gameManager.getProgress().achievements;
    const unlockedCount = unlockedIds.length;

    this.achievementsOverlay = this.add.graphics();
    this.achievementsOverlay.fillStyle(0x000000, 0.7);
    this.achievementsOverlay.fillRect(0, 0, width, height);
    this.achievementsOverlay.setDepth(100);

    this.achievementsPanel = this.add.container(width / 2, height / 2);
    this.achievementsPanel.setDepth(101);

    const panelW = 560;
    const panelH = 540;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);
    panelBg.lineStyle(2, COLORS.primary, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);

    const title = this.add.text(0, -halfH + 30, 'Achievements', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const countText = this.add.text(0, -halfH + 58, `${unlockedCount}/${achievements.length} Unlocked`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: unlockedCount === achievements.length ? '#10b981' : '#0ea5e9',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const cols = 3;
    const cardW = 164;
    const cardH = 88;
    const gapX = 12;
    const gapY = 10;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gridStartX = -gridW / 2;
    const gridStartY = -halfH + 85;

    achievements.forEach((ach, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardX = gridStartX + col * (cardW + gapX) + cardW / 2;
      const cardY = gridStartY + row * (cardH + gapY) + cardH / 2;
      const isUnlocked = this.gameManager.hasAchievement(ach.id);

      const card = this.add.container(cardX, cardY);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(isUnlocked ? 0x1e3a5f : 0x1a2332, 1);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, RADIUS.md);
      cardBg.lineStyle(1, isUnlocked ? COLORS.primary : COLORS.border, isUnlocked ? 1 : 0.6);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, RADIUS.md);

      const iconText = this.add.text(-cardW / 2 + 14, -cardH / 2 + 14, ach.icon, {
        fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
        fontFamily: FONT.family,
      }).setAlpha(isUnlocked ? 1 : 0.35);

      const titleText = this.add.text(-cardW / 2 + 14, -cardH / 2 + 40, ach.title, {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: isUnlocked ? '#f8fafc' : '#64748b',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      });

      const descText = this.add.text(-cardW / 2 + 14, -cardH / 2 + 58, ach.description, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: isUnlocked ? '#94a3b8' : '#475569',
        fontFamily: FONT.family,
        wordWrap: { width: cardW - 28 },
      });

      card.add([cardBg, iconText, titleText, descText]);

      if (!isUnlocked) {
        const lockOverlay = this.add.graphics();
        lockOverlay.fillStyle(0x0f172a, 0.45);
        lockOverlay.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, RADIUS.md);

        const lockIcon = this.add.text(0, -2, '🔒', {
          fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
          fontFamily: FONT.family,
        }).setOrigin(0.5);

        card.add([lockOverlay, lockIcon]);
      }

      if (isUnlocked) {
        const badge = this.add.graphics();
        badge.fillStyle(COLORS.gold, 1);
        badge.fillCircle(cardW / 2 - 12, -cardH / 2 + 12, 5);
        card.add(badge);
      }

      this.achievementsPanel!.add(card);
    });

    const closeBtn = this.createSmallButton(0, halfH - 40, 'Close', () => {
      this.closeAchievements();
    });

    this.achievementsPanel.add([panelBg, title, countText, closeBtn]);
  }

  private closeAchievements(): void {
    if (this.achievementsOverlay) {
      this.achievementsOverlay.destroy();
      this.achievementsOverlay = null;
    }
    if (this.achievementsPanel) {
      this.achievementsPanel.destroy();
      this.achievementsPanel = null;
    }
  }

  private showSettings(): void {
    if (this.settingsPanel) return;

    const width = this.scale.width;
    const height = this.scale.height;

    this.settingsOverlay = this.add.graphics();
    this.settingsOverlay.fillStyle(0x000000, 0.7);
    this.settingsOverlay.fillRect(0, 0, width, height);
    this.settingsOverlay.setDepth(100);

    this.settingsPanel = this.add.container(width / 2, height / 2);
    this.settingsPanel.setDepth(101);

    const panelW = 460;
    const panelH = 480;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x1e293b, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, 16);
    panelBg.lineStyle(2, 0x0ea5e9, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, 16);

    const title = this.add.text(0, -halfH + 30, 'Settings', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const settings = this.gameManager.getSettings();

    const applySettings = () => {
      this.gameManager.updateSettings(currentSettings);
      this.audioManager?.updateSettings(this.gameManager.getSettings());
    };

    const currentSettings = { ...settings };

    const sliderStartY = -halfH + 80;
    const sliderSpacing = 55;
    const sliderTrackW = 240;
    const sliderTrackH = 12;
    const sliderLabelX = -halfW + 30;
    const sliderTrackX = 40;
    const sliderValueX = halfW - 40;

    const createSlider = (labelText: string, value: number, y: number, settingKey: 'masterVolume' | 'musicVolume' | 'sfxVolume') => {
      const displayValue = Math.round(value * 100);

      const label = this.add.text(sliderLabelX, y, labelText, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      });

      const valueText = this.add.text(sliderValueX, y, `${displayValue}`, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#0ea5e9',
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      const trackY = y + 25;
      const track = this.add.graphics();
      track.fillStyle(0x334155, 1);
      track.fillRoundedRect(sliderTrackX, trackY, sliderTrackW, sliderTrackH, 6);

      const fill = this.add.graphics();
      const fillW = value * sliderTrackW;
      fill.fillStyle(0x0ea5e9, 1);
      fill.fillRoundedRect(sliderTrackX, trackY, fillW, sliderTrackH, 6);

      const handleX = sliderTrackX + value * sliderTrackW;
      const handle = this.add.circle(handleX, trackY + sliderTrackH / 2, 10, 0xf8fafc);
      handle.setStrokeStyle(2, 0x0ea5e9);

      const updateSlider = (newValue: number) => {
        const clamped = Phaser.Math.Clamp(newValue, 0, 1);
        currentSettings[settingKey] = clamped;
        applySettings();

        fill.clear();
        fill.fillStyle(0x0ea5e9, 1);
        fill.fillRoundedRect(sliderTrackX, trackY, clamped * sliderTrackW, sliderTrackH, 6);

        handle.setX(sliderTrackX + clamped * sliderTrackW);
        valueText.setText(`${Math.round(clamped * 100)}`);
      };

      handle.setInteractive({ draggable: true });

      const sliderHitArea = this.add.zone(sliderTrackX + sliderTrackW / 2, trackY + sliderTrackH / 2, sliderTrackW, sliderTrackH + 10);
      sliderHitArea.setInteractive();

      sliderHitArea.on('pointerdown', (_pointer: Phaser.Input.Pointer) => {
        const localX = _pointer.x - (width / 2) - sliderTrackX;
        updateSlider(Phaser.Math.Clamp(localX / sliderTrackW, 0, 1));
      });

      handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
        const localX = dragX - (width / 2) - sliderTrackX;
        updateSlider(Phaser.Math.Clamp(localX / sliderTrackW, 0, 1));
      });

      this.settingsPanel!.add([label, valueText, track, fill, handle, sliderHitArea]);
    };

    createSlider('Master Volume', currentSettings.masterVolume, sliderStartY, 'masterVolume');
    createSlider('Music Volume', currentSettings.musicVolume, sliderStartY + sliderSpacing, 'musicVolume');
    createSlider('SFX Volume', currentSettings.sfxVolume, sliderStartY + sliderSpacing * 2, 'sfxVolume');

    const toggleStartY = sliderStartY + sliderSpacing * 3 + 10;
    const toggleSpacing = 45;

    const createToggle = (labelText: string, value: boolean, y: number, settingKey: 'muted' | 'highContrast' | 'reducedMotion') => {
      const label = this.add.text(sliderLabelX, y, labelText, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: '#e2e8f0',
        fontFamily: FONT.family,
      });

      const toggleX = halfW - 70;
      const toggleW = 50;
      const toggleH = 26;
      const toggleBg = this.add.graphics();
      const toggleKnob = this.add.circle(0, 0, 10, 0xf8fafc);

      const drawToggle = (isOn: boolean) => {
        toggleBg.clear();
        toggleBg.fillStyle(isOn ? 0x0ea5e9 : 0x475569, 1);
        toggleBg.fillRoundedRect(toggleX, y + 2, toggleW, toggleH, 13);
        toggleKnob.setPosition(
          isOn ? toggleX + toggleW - 13 : toggleX + 13,
          y + 2 + toggleH / 2
        );
      };
      drawToggle(value);

      const toggleHit = this.add.zone(toggleX + toggleW / 2, y + 2 + toggleH / 2, toggleW + 10, toggleH + 10);
      toggleHit.setInteractive();
      toggleHit.on('pointerdown', () => {
        currentSettings[settingKey] = !currentSettings[settingKey];
        applySettings();
        drawToggle(currentSettings[settingKey]);
      });

      this.settingsPanel!.add([label, toggleBg, toggleKnob, toggleHit]);
    };

    createToggle('Muted', currentSettings.muted, toggleStartY, 'muted');
    createToggle('High Contrast', currentSettings.highContrast, toggleStartY + toggleSpacing, 'highContrast');
    createToggle('Reduced Motion', currentSettings.reducedMotion, toggleStartY + toggleSpacing * 2, 'reducedMotion');

    const closeBtn = this.createSmallButton(0, halfH - 40, 'Close', () => {
      this.closeSettings();
    });

    this.settingsPanel.add([panelBg, title, closeBtn]);
  }

  private closeSettings(): void {
    if (this.settingsOverlay) {
      this.settingsOverlay.destroy();
      this.settingsOverlay = null;
    }
    if (this.settingsPanel) {
      this.settingsPanel.destroy();
      this.settingsPanel = null;
    }
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(0x475569, 1);
    bg.fillRoundedRect(-50, -18, 100, 36, 8);
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
      bg.fillStyle(0x64748b, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 8);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(0x475569, 1);
      bg.fillRoundedRect(-50, -18, 100, 36, 8);
    });
    btn.on('pointerdown', callback);
    return btn;
  }
}
