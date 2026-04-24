import * as Phaser from 'phaser';
import { COLORS } from './designTokens.ts';

export class IconSprites {
  static drawLock(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.textOnPanel): void {
    const s = size;
    const hw = s * 0.4;
    const hh = s * 0.3;
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - hw, y - hh * 0.2, hw * 2, hh * 1.5, s * 0.05);
    gfx.lineStyle(s * 0.08, color, 1);
    gfx.strokeRoundedRect(x - hw * 0.6, y - hh * 1.1, hw * 1.2, hh * 1.0, s * 0.15);
  }

  static drawCheckmark(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.success): void {
    gfx.lineStyle(size * 0.12, color, 1);
    gfx.beginPath();
    gfx.moveTo(x - size * 0.3, y);
    gfx.lineTo(x - size * 0.05, y + size * 0.25);
    gfx.lineTo(x + size * 0.35, y - size * 0.25);
    gfx.strokePath();
  }

  static drawTrophy(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.gold): void {
    const s = size;
    gfx.fillStyle(color, 1);
    gfx.fillRoundedRect(x - s * 0.25, y - s * 0.3, s * 0.5, s * 0.4, s * 0.05);
    gfx.lineStyle(s * 0.06, color, 1);
    gfx.strokeRoundedRect(x - s * 0.4, y - s * 0.25, s * 0.15, s * 0.25, s * 0.05);
    gfx.strokeRoundedRect(x + s * 0.25, y - s * 0.25, s * 0.15, s * 0.25, s * 0.05);
    gfx.fillStyle(color, 1);
    gfx.fillRect(x - s * 0.05, y + s * 0.1, s * 0.1, s * 0.15);
    gfx.fillRoundedRect(x - s * 0.2, y + s * 0.25, s * 0.4, s * 0.08, s * 0.02);
  }

  static drawLightbulb(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.warning): void {
    const s = size;
    gfx.fillStyle(color, 1);
    gfx.fillCircle(x, y - s * 0.1, s * 0.25);
    gfx.fillStyle(COLORS.textMuted, 1);
    gfx.fillRoundedRect(x - s * 0.12, y + s * 0.1, s * 0.24, s * 0.12, s * 0.03);
    gfx.lineStyle(s * 0.03, color, 0.6);
    for (let i = 0; i < 5; i++) {
      const angle = -Math.PI / 2 + (i - 2) * Math.PI / 6;
      gfx.lineBetween(
        x + Math.cos(angle) * s * 0.3,
        y - s * 0.1 + Math.sin(angle) * s * 0.3,
        x + Math.cos(angle) * s * 0.42,
        y - s * 0.1 + Math.sin(angle) * s * 0.42
      );
    }
  }

  static drawFlame(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = 0xf59e0b): void {
    const s = size;
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(x, y - s * 0.4);
    gfx.lineTo(x + s * 0.12, y - s * 0.2);
    gfx.lineTo(x + s * 0.2, y);
    gfx.lineTo(x + s * 0.15, y + s * 0.15);
    gfx.lineTo(x + s * 0.05, y + s * 0.25);
    gfx.lineTo(x, y + s * 0.25);
    gfx.lineTo(x - s * 0.05, y + s * 0.25);
    gfx.lineTo(x - s * 0.15, y + s * 0.15);
    gfx.lineTo(x - s * 0.2, y);
    gfx.lineTo(x - s * 0.12, y - s * 0.2);
    gfx.lineTo(x, y - s * 0.4);
    gfx.fillPath();
    gfx.fillStyle(0xfbbf24, 1);
    gfx.beginPath();
    gfx.moveTo(x, y - s * 0.2);
    gfx.lineTo(x + s * 0.07, y - s * 0.05);
    gfx.lineTo(x + s * 0.07, y + s * 0.1);
    gfx.lineTo(x, y + s * 0.15);
    gfx.lineTo(x - s * 0.07, y + s * 0.1);
    gfx.lineTo(x - s * 0.07, y - s * 0.05);
    gfx.lineTo(x, y - s * 0.2);
    gfx.fillPath();
  }

  static drawStar(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.gold): void {
    const outerR = size * 0.4;
    const innerR = size * 0.18;
    const points = 5;
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + r * Math.cos(angle);
      const py = y + r * Math.sin(angle);
      if (i === 0) gfx.moveTo(px, py);
      else gfx.lineTo(px, py);
    }
    gfx.closePath();
    gfx.fillPath();
  }

  static drawPlay(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.accent): void {
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(x - size * 0.15, y - size * 0.25);
    gfx.lineTo(x + size * 0.25, y);
    gfx.lineTo(x - size * 0.15, y + size * 0.25);
    gfx.closePath();
    gfx.fillPath();
  }

  static drawArrowUp(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.textOnPanel): void {
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(x, y - size * 0.25);
    gfx.lineTo(x + size * 0.2, y + size * 0.05);
    gfx.lineTo(x + size * 0.08, y + size * 0.05);
    gfx.lineTo(x + size * 0.08, y + size * 0.25);
    gfx.lineTo(x - size * 0.08, y + size * 0.25);
    gfx.lineTo(x - size * 0.08, y + size * 0.05);
    gfx.lineTo(x - size * 0.2, y + size * 0.05);
    gfx.closePath();
    gfx.fillPath();
  }

  static drawArrowDown(gfx: Phaser.GameObjects.Graphics, x: number, y: number, size: number, color: number = COLORS.textOnPanel): void {
    gfx.fillStyle(color, 1);
    gfx.beginPath();
    gfx.moveTo(x, y + size * 0.25);
    gfx.lineTo(x + size * 0.2, y - size * 0.05);
    gfx.lineTo(x + size * 0.08, y - size * 0.05);
    gfx.lineTo(x + size * 0.08, y - size * 0.25);
    gfx.lineTo(x - size * 0.08, y - size * 0.25);
    gfx.lineTo(x - size * 0.08, y - size * 0.05);
    gfx.lineTo(x - size * 0.2, y - size * 0.05);
    gfx.closePath();
    gfx.fillPath();
  }

  static generateAllTextures(scene: Phaser.Scene): void {
    const icons = [
      { key: 'icon-lock', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawLock(g, x, y, 40) },
      { key: 'icon-check', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawCheckmark(g, x, y, 40) },
      { key: 'icon-trophy', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawTrophy(g, x, y, 40) },
      { key: 'icon-bulb', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawLightbulb(g, x, y, 40) },
      { key: 'icon-flame', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawFlame(g, x, y, 40) },
      { key: 'icon-star', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawStar(g, x, y, 40) },
      { key: 'icon-star-empty', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawStar(g, x, y, 40, COLORS.textOnPanelMuted) },
      { key: 'icon-play', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawPlay(g, x, y, 40) },
      { key: 'icon-arrow-up', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawArrowUp(g, x, y, 30) },
      { key: 'icon-arrow-down', draw: (g: Phaser.GameObjects.Graphics, x: number, y: number) => IconSprites.drawArrowDown(g, x, y, 30) },
    ];

    icons.forEach(({ key, draw }) => {
      if (scene.textures.exists(key)) return;
      const gfx = scene.make.graphics({ x: 0, y: 0 });
      draw(gfx, 20, 20);
      gfx.generateTexture(key, 40, 40);
      gfx.destroy();
    });
  }
}
