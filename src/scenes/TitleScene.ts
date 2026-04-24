import * as Phaser from 'phaser';
import { GameManager } from '@/game/GameManager.ts';
import { LevelManager } from '@/game/LevelManager.ts';
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

function hexColor(c: number): string {
  return `#${c.toString(16).padStart(6, '0')}`;
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
  private bgGraphics: Phaser.GameObjects.Graphics | null = null;
  private bgCircles: Phaser.GameObjects.Container | null = null;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    this.focusedIndex = 0;
    this.menuButtons = [];
    this.bgCircles = this.add.container();

    this.audioManager?.playBGM('bgm-ambient');

    const width = this.scale.width;
    const height = this.scale.height;

    this.bgGraphics = this.add.graphics();
    this.bgGraphics.fillGradientStyle(0x0c0f14, 0x0c0f14, 0x111820, 0x111820, 1);
    this.bgGraphics.fillRect(0, 0, width, height);
    this.bgGraphics.lineStyle(1, 0x3b82f6, 0.03);
    for (let x = 0; x < width; x += 60) this.bgGraphics.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 60) this.bgGraphics.lineBetween(0, y, width, y);

    for (let i = 0; i < 24; i++) {
      const cx = Phaser.Math.Between(0, width);
      const cy = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(2, 5);
      const alpha = Phaser.Math.FloatBetween(0.06, 0.2);
      const circle = this.add.circle(cx, cy, size, COLORS.primary, alpha);
      this.bgCircles.add(circle);
      this.tweens.add({
        targets: circle,
        y: cy - Phaser.Math.Between(40, 120),
        alpha: 0,
        duration: Phaser.Math.Between(3000, 5000),
        repeat: -1,
        yoyo: true,
        delay: Phaser.Math.Between(0, 3000),
        ease: 'Sine.easeInOut',
      });
    }

    const topGlow = this.add.graphics();
    topGlow.fillGradientStyle(COLORS.primaryDim, COLORS.primaryDim, COLORS.bg, COLORS.bg, 0.08);
    topGlow.fillRect(0, 0, width, height * 0.5);

    this.add.text(width / 2, height * 0.2, 'SE Learning Quest', {
      fontSize: `${scaledFontSize(this, FONT.sizes.hero)}px`,
      color: hexColor(COLORS.textBright),
      fontFamily: FONT.heading,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.2 + 55, 'Master Systems Engineering Through Play', {
      fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
      color: hexColor(COLORS.textMuted),
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    const progress = this.gameManager.getOverallProgress();
    if (progress.completedLevels > 0) {
      const pBarW = width * 0.4;
      const pBarH = 6;
      const pBarX = (width - pBarW) / 2;
      const pBarY = height * 0.35;
      const pFill = this.add.graphics();
      pFill.fillStyle(COLORS.border, 1);
      pFill.fillRoundedRect(pBarX, pBarY, pBarW, pBarH, RADIUS.xs);
      pFill.fillStyle(COLORS.primary, 1);
      pFill.fillRoundedRect(pBarX, pBarY, pBarW * progress.percentage / 100, pBarH, RADIUS.xs);

      this.add.text(width / 2, pBarY + 18, `${progress.percentage}% complete · ${progress.completedLevels}/${progress.totalLevels} levels`, {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: hexColor(COLORS.textMuted),
        fontFamily: FONT.family,
      }).setOrigin(0.5);
    }

    const btnY = height * 0.48;
    const btnSpacing = 62;

    this.createButton(width / 2, btnY, 'Start Learning', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 300, () => {
        this.scene.start('MapScene');
      });
    });

    this.createButton(width / 2, btnY + btnSpacing, 'Continue', () => {
      this.audioManager?.playSFX('sfx-click');
      const progress = this.gameManager.getProgress();
      const levelManager = LevelManager.getInstance();
      const modules = levelManager.getModules(progress);

      let targetLevelId: string | null = null;
      for (const mod of modules) {
        if (mod.locked) continue;
        for (const lvl of mod.levels) {
          if (!lvl.locked && !lvl.completed) {
            targetLevelId = lvl.id;
            break;
          }
        }
        if (targetLevelId) break;
      }

      TransitionManager.fadeOut(this, 300, () => {
        if (targetLevelId) {
          this.scene.start('LessonScene', { levelId: targetLevelId });
        } else {
          this.scene.start('MapScene');
        }
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

    this.add.text(width / 2, height - 20, 'Based on INCOSE SEHBv5 · ISO 15288 · EN 50126', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
      color: hexColor(COLORS.textDim),
      fontFamily: FONT.family,
    }).setOrigin(0.5);

    this.updateFocusVisual();

    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      if (this.achievementsPanel) {
        if (event.key === 'Escape') this.closeAchievements();
        return;
      }
      if (this.settingsPanel) {
        if (event.key === 'Escape') this.closeSettings();
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
        btn.bg.fillStyle(0x3b82f6, 0.15);
        btn.bg.fillRoundedRect(-116, -30, 232, 60, RADIUS.lg);
        btn.bg.fillGradientStyle(0x60a5fa, 0x93c5fd, 0x3b82f6, 0x60a5fa, 1);
        btn.bg.fillRoundedRect(-110, -24, 220, 48, RADIUS.md);
        btn.bg.lineStyle(2, 0x93c5fd, 0.8);
        btn.bg.strokeRoundedRect(-110, -24, 220, 48, RADIUS.md);
      } else {
        btn.bg.fillGradientStyle(0x3b82f6, 0x60a5fa, 0x2563eb, 0x3b82f6, 1);
        btn.bg.fillRoundedRect(-110, -24, 220, 48, RADIUS.md);
        btn.bg.lineStyle(1, 0x60a5fa, 0.3);
        btn.bg.strokeRoundedRect(-110, -24, 220, 48, RADIUS.md);
      }
    });
  }

  private createButton(x: number, y: number, text: string, callback: () => void): void {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x3b82f6, 0x60a5fa, 0x2563eb, 0x3b82f6, 1);
    bg.fillRoundedRect(-110, -24, 220, 48, RADIUS.md);
    bg.lineStyle(1, 0x60a5fa, 0.3);
    bg.strokeRoundedRect(-110, -24, 220, 48, RADIUS.md);

    const label = this.add.text(0, 0, text, {
      fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
      color: '#ffffff',
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    btn.add([bg, label]);
    btn.setSize(220, 48);
    btn.setInteractive(new Phaser.Geom.Rectangle(-110, -24, 220, 48), Phaser.Geom.Rectangle.Contains);

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
    const unlockedCount = this.gameManager.getProgress().achievements.length;

    this.achievementsOverlay = this.add.graphics();
    this.achievementsOverlay.fillStyle(COLORS.shadow, 0.75);
    this.achievementsOverlay.fillRect(0, 0, width, height);
    this.achievementsOverlay.setDepth(100);

    this.achievementsPanel = this.add.container(width / 2, height / 2);
    this.achievementsPanel.setDepth(101);

    const panelW = 540;
    const panelH = 500;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);
    panelBg.lineStyle(1, COLORS.border, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);

    const title = this.add.text(0, -halfH + 30, 'Achievements', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl)}px`,
      color: hexColor(COLORS.textBright),
      fontFamily: FONT.heading,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    const countText = this.add.text(0, -halfH + 56, `${unlockedCount}/${achievements.length} Unlocked`, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: unlockedCount === achievements.length ? hexColor(COLORS.success) : hexColor(COLORS.primary),
      fontFamily: FONT.family,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.achievementsPanel.add([panelBg, title, countText]);

    const cols = 3;
    const cardW = 156;
    const cardH = 84;
    const gapX = 12;
    const gapY = 10;
    const gridW = cols * cardW + (cols - 1) * gapX;
    const gridStartX = -gridW / 2;
    const gridStartY = -halfH + 82;

    achievements.forEach((ach, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cardX = gridStartX + col * (cardW + gapX) + cardW / 2;
      const cardY = gridStartY + row * (cardH + gapY) + cardH / 2;
      const isUnlocked = this.gameManager.hasAchievement(ach.id);

      const card = this.add.container(cardX, cardY);

      const cardBg = this.add.graphics();
      cardBg.fillStyle(isUnlocked ? COLORS.primarySoft : COLORS.bgAlt, 1);
      cardBg.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, RADIUS.sm);
      cardBg.lineStyle(1, isUnlocked ? COLORS.primary : COLORS.border, isUnlocked ? 1 : 0.5);
      cardBg.strokeRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, RADIUS.sm);

      const iconText = this.add.text(-cardW / 2 + 14, -cardH / 2 + 14, ach.icon, {
        fontSize: `${scaledFontSize(this, FONT.sizes.lg)}px`,
        fontFamily: FONT.family,
      }).setAlpha(isUnlocked ? 1 : 0.3);

      const titleText = this.add.text(-cardW / 2 + 14, -cardH / 2 + 40, ach.title, {
        fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
        color: isUnlocked ? hexColor(COLORS.text) : hexColor(COLORS.textDim),
        fontFamily: FONT.family,
        fontStyle: 'bold',
      });

      const descText = this.add.text(-cardW / 2 + 14, -cardH / 2 + 58, ach.description, {
        fontSize: `${scaledFontSize(this, FONT.sizes.xs)}px`,
        color: isUnlocked ? hexColor(COLORS.textMuted) : hexColor(COLORS.textDim),
        fontFamily: FONT.family,
        wordWrap: { width: cardW - 28 },
      });

      card.add([cardBg, iconText, titleText, descText]);

      if (!isUnlocked) {
        const lockOverlay = this.add.graphics();
        lockOverlay.fillStyle(COLORS.bg, 0.5);
        lockOverlay.fillRoundedRect(-cardW / 2, -cardH / 2, cardW, cardH, RADIUS.sm);
        const lockIcon = this.add.image(0, -2, 'icon-lock');
        lockIcon.setScale(0.45);
        lockIcon.setTint(COLORS.textDim);
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

    const closeBtn = this.createSmallButton(0, halfH - 36, 'Close', () => this.closeAchievements());
    this.achievementsPanel.add(closeBtn);
  }

  private closeAchievements(): void {
    if (this.achievementsOverlay) { this.achievementsOverlay.destroy(); this.achievementsOverlay = null; }
    if (this.achievementsPanel) { this.achievementsPanel.destroy(); this.achievementsPanel = null; }
  }

  private showSettings(): void {
    if (this.settingsPanel) return;

    const width = this.scale.width;
    const height = this.scale.height;

    this.settingsOverlay = this.add.graphics();
    this.settingsOverlay.fillStyle(COLORS.shadow, 0.75);
    this.settingsOverlay.fillRect(0, 0, width, height);
    this.settingsOverlay.setDepth(100);

    const panelW = 440;
    const panelH = 460;
    const panelX = width / 2;
    const panelY = height / 2;
    const halfW = panelW / 2;
    const halfH = panelH / 2;

    this.settingsPanel = this.add.container(panelX, panelY);
    this.settingsPanel.setDepth(101);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(COLORS.panelBg, 1);
    panelBg.fillRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);
    panelBg.lineStyle(1, COLORS.border, 1);
    panelBg.strokeRoundedRect(-halfW, -halfH, panelW, panelH, RADIUS.lg);

    const title = this.add.text(0, -halfH + 30, 'Settings', {
      fontSize: `${scaledFontSize(this, FONT.sizes.xl)}px`,
      color: hexColor(COLORS.textBright),
      fontFamily: FONT.heading,
      fontStyle: 'bold',
    }).setOrigin(0.5);

    this.settingsPanel.add([panelBg, title]);

    const settings = this.gameManager.getSettings();
    const applySettings = () => {
      this.gameManager.updateSettings(currentSettings);
      this.audioManager?.updateSettings(this.gameManager.getSettings());
    };
    const currentSettings = { ...settings };

    const sliderStartY = -halfH + 78;
    const sliderSpacing = 52;

    const createSlider = (labelText: string, value: number, y: number, settingKey: 'masterVolume' | 'musicVolume' | 'sfxVolume') => {
      const trackH = 10;
      const trackLeft = -halfW + 24;
      const trackRight = halfW - 24 - 44;
      const actualTrackW = trackRight - trackLeft;

      const label = this.add.text(-halfW + 24, y, labelText, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: hexColor(COLORS.textSecondary),
        fontFamily: FONT.family,
        fontStyle: '500',
      });

      const valueText = this.add.text(halfW - 24, y, `${Math.round(value * 100)}%`, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: hexColor(COLORS.primary),
        fontFamily: FONT.family,
        fontStyle: 'bold',
      }).setOrigin(1, 0);

      const trackY = y + 24;

      const track = this.add.graphics();
      track.fillStyle(COLORS.border, 1);
      track.fillRoundedRect(trackLeft, trackY, actualTrackW, trackH, RADIUS.xs);

      const fill = this.add.graphics();
      fill.fillStyle(COLORS.primary, 1);
      fill.fillRoundedRect(trackLeft, trackY, value * actualTrackW, trackH, RADIUS.xs);

      const handle = this.add.circle(trackLeft + value * actualTrackW, trackY + trackH / 2, 9, COLORS.textBright);
      handle.setStrokeStyle(2, COLORS.primary);

      const updateSlider = (fraction: number) => {
        const clamped = Phaser.Math.Clamp(fraction, 0, 1);
        currentSettings[settingKey] = clamped;
        applySettings();
        fill.clear();
        fill.fillStyle(COLORS.primary, 1);
        fill.fillRoundedRect(trackLeft, trackY, clamped * actualTrackW, trackH, RADIUS.xs);
        handle.setPosition(trackLeft + clamped * actualTrackW, trackY + trackH / 2);
        valueText.setText(`${Math.round(clamped * 100)}%`);
      };

      const trackZone = this.add.zone(trackLeft + actualTrackW / 2, trackY + trackH / 2, actualTrackW, 28);
      trackZone.setInteractive();

      trackZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const fraction = (pointer.x - trackZone.x) / (actualTrackW / 2);
        updateSlider(fraction);
      });

      handle.setInteractive({ draggable: true });
      handle.on('drag', (_pointer: Phaser.Input.Pointer, dragX: number) => {
        const fraction = (dragX - trackLeft) / actualTrackW;
        updateSlider(fraction);
      });

      this.settingsPanel!.add([label, valueText, track, fill, handle, trackZone]);
    };

    createSlider('Master Volume', currentSettings.masterVolume, sliderStartY, 'masterVolume');
    createSlider('Music Volume', currentSettings.musicVolume, sliderStartY + sliderSpacing, 'musicVolume');
    createSlider('SFX Volume', currentSettings.sfxVolume, sliderStartY + sliderSpacing * 2, 'sfxVolume');

    const toggleStartY = sliderStartY + sliderSpacing * 3 + 8;
    const toggleSpacing = 42;

    const createToggle = (labelText: string, value: boolean, y: number, settingKey: 'muted' | 'highContrast' | 'reducedMotion') => {
      const label = this.add.text(-halfW + 24, y, labelText, {
        fontSize: `${scaledFontSize(this, FONT.sizes.md)}px`,
        color: hexColor(COLORS.textSecondary),
        fontFamily: FONT.family,
        fontStyle: '500',
      });

      const toggleW = 44;
      const toggleH = 24;
      const toggleX = halfW - 24 - toggleW - 10;
      const toggleBg = this.add.graphics();
      const toggleKnob = this.add.circle(0, 0, 9, COLORS.textBright);

      const drawToggle = (isOn: boolean) => {
        toggleBg.clear();
        toggleBg.fillStyle(isOn ? COLORS.primary : COLORS.border, 1);
        toggleBg.fillRoundedRect(toggleX, y + 2, toggleW, toggleH, toggleH / 2);
        toggleKnob.setPosition(
          isOn ? toggleX + toggleW - 12 : toggleX + 12,
          y + 2 + toggleH / 2,
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

    const closeBtn = this.createSmallButton(0, halfH - 36, 'Close', () => this.closeSettings());
    this.settingsPanel.add(closeBtn);
  }

  private closeSettings(): void {
    if (this.settingsOverlay) { this.settingsOverlay.destroy(); this.settingsOverlay = null; }
    if (this.settingsPanel) { this.settingsPanel.destroy(); this.settingsPanel = null; }
  }

  private createSmallButton(x: number, y: number, text: string, callback: () => void): Phaser.GameObjects.Container {
    const btn = this.add.container(x, y);
    const bg = this.add.graphics();
    bg.fillStyle(COLORS.border, 1);
    bg.fillRoundedRect(-46, -16, 92, 32, RADIUS.sm);
    const label = this.add.text(0, 0, text, {
      fontSize: `${scaledFontSize(this, FONT.sizes.sm)}px`,
      color: hexColor(COLORS.textSecondary),
      fontFamily: FONT.family,
      fontStyle: '500',
    }).setOrigin(0.5);
    btn.add([bg, label]);
    btn.setSize(92, 32);
    btn.setInteractive(new Phaser.Geom.Rectangle(-46, -16, 92, 32), Phaser.Geom.Rectangle.Contains);
    btn.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(COLORS.borderLight, 1);
      bg.fillRoundedRect(-46, -16, 92, 32, RADIUS.sm);
    });
    btn.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(COLORS.border, 1);
      bg.fillRoundedRect(-46, -16, 92, 32, RADIUS.sm);
    });
    btn.on('pointerdown', callback);
    return btn;
  }
}
