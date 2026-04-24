import * as Phaser from 'phaser';
import { COLORS } from './designTokens.ts';

export class ProceduralBG {
  static draw(scene: Phaser.Scene, moduleId: number, width: number, height: number): Phaser.GameObjects.Graphics {
    const gfx = scene.add.graphics();

    gfx.fillGradientStyle(COLORS.bg, COLORS.bg, COLORS.panelBg, COLORS.panelBg, 1);
    gfx.fillRect(0, 0, width, height);

    switch (moduleId) {
      case 1: ProceduralBG.drawBlueprint(gfx, width, height, 0x0ea5e9); break;
      case 2: ProceduralBG.drawCircuit(gfx, width, height, 0x6366f1); break;
      case 3: ProceduralBG.drawArchitecture(gfx, width, height, 0xf59e0b); break;
      case 4: ProceduralBG.drawTestLab(gfx, width, height, 0x10b981); break;
      case 5: ProceduralBG.drawMissionControl(gfx, width, height, 0xef4444); break;
    }

    return gfx;
  }

  private static drawBlueprint(gfx: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
    gfx.lineStyle(1, color, 0.06);
    for (let x = 0; x < w; x += 40) gfx.lineBetween(x, 0, x, h);
    for (let y = 0; y < h; y += 40) gfx.lineBetween(0, y, w, y);
    gfx.fillStyle(color, 0.1);
    for (let x = 0; x < w; x += 80) {
      for (let y = 0; y < h; y += 80) {
        gfx.fillCircle(x, y, 3);
      }
    }
    gfx.lineStyle(1, color, 0.08);
    for (let i = 0; i < 8; i++) {
      const x1 = Math.floor(Math.random() * w / 80) * 80;
      const y1 = Math.floor(Math.random() * h / 80) * 80;
      const x2 = Math.floor(Math.random() * w / 80) * 80;
      const y2 = Math.floor(Math.random() * h / 80) * 80;
      gfx.lineBetween(x1, y1, x2, y2);
    }
  }

  private static drawCircuit(gfx: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
    gfx.lineStyle(1, color, 0.05);
    for (let y = 20; y < h; y += 60) {
      const startX = Math.random() * w * 0.3;
      const endX = startX + w * 0.3 + Math.random() * w * 0.4;
      gfx.lineBetween(startX, y, endX, y);
      if (Math.random() > 0.5) {
        gfx.lineBetween(endX, y, endX, y + 60);
      }
    }
    gfx.fillStyle(color, 0.08);
    for (let i = 0; i < 15; i++) {
      const cx = Math.random() * w;
      const cy = Math.random() * h;
      gfx.fillRoundedRect(cx - 8, cy - 4, 16, 8, 2);
    }
  }

  private static drawArchitecture(gfx: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
    gfx.lineStyle(1, color, 0.06);
    const layers = 5;
    const layerH = h / (layers + 1);
    for (let i = 1; i <= layers; i++) {
      const y = i * layerH;
      gfx.lineBetween(40, y, w - 40, y);
      gfx.fillStyle(color, 0.04);
      const boxCount = 2 + Math.floor(Math.random() * 3);
      const boxW = (w - 120) / boxCount;
      for (let j = 0; j < boxCount; j++) {
        gfx.fillRoundedRect(60 + j * boxW, y - 15, boxW - 20, 30, 4);
      }
    }
  }

  private static drawTestLab(gfx: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
    gfx.lineStyle(1, color, 0.04);
    for (let x = 0; x < w; x += 20) gfx.lineBetween(x, 0, x, h);
    for (let y = 0; y < h; y += 20) gfx.lineBetween(0, y, w, y);
    gfx.lineStyle(2, color, 0.08);
    for (let i = 0; i < 6; i++) {
      const cx = 100 + Math.random() * (w - 200);
      const cy = 100 + Math.random() * (h - 200);
      gfx.beginPath();
      gfx.moveTo(cx - 10, cy);
      gfx.lineTo(cx - 2, cy + 8);
      gfx.lineTo(cx + 12, cy - 8);
      gfx.strokePath();
    }
  }

  private static drawMissionControl(gfx: Phaser.GameObjects.Graphics, w: number, h: number, color: number): void {
    const cx = w * 0.7;
    const cy = h * 0.6;
    for (let r = 40; r < 200; r += 40) {
      gfx.lineStyle(1, color, 0.05);
      gfx.strokeCircle(cx, cy, r);
    }
    gfx.lineBetween(cx - 200, cy, cx + 200, cy);
    gfx.lineBetween(cx, cy - 200, cx, cy + 200);
    gfx.fillStyle(color, 0.06);
    for (let i = 0; i < 4; i++) {
      gfx.fillRoundedRect(30, 30 + i * 50, 150, 30, 4);
    }
  }

  static drawTitleBG(scene: Phaser.Scene, width: number, height: number): void {
    const gfx = scene.add.graphics();
    gfx.fillGradientStyle(0x0c0f14, 0x0c0f14, 0x111820, 0x111820, 1);
    gfx.fillRect(0, 0, width, height);
    gfx.lineStyle(1, COLORS.primary, 0.03);
    for (let x = 0; x < width; x += 60) gfx.lineBetween(x, 0, x, height);
    for (let y = 0; y < height; y += 60) gfx.lineBetween(0, y, width, y);
    gfx.lineStyle(1, COLORS.primary, 0.05);
    for (let i = 0; i < 6; i++) {
      const hx = 100 + Math.random() * (width - 200);
      const hy = 100 + Math.random() * (height - 200);
      const r = 30 + Math.random() * 40;
      gfx.beginPath();
      for (let j = 0; j < 6; j++) {
        const angle = (j * Math.PI) / 3;
        const px = hx + r * Math.cos(angle);
        const py = hy + r * Math.sin(angle);
        if (j === 0) gfx.moveTo(px, py);
        else gfx.lineTo(px, py);
      }
      gfx.closePath();
      gfx.strokePath();
    }
  }
}
