import * as Phaser from 'phaser';

function drawGrid(gfx: Phaser.GameObjects.Graphics, width: number, height: number, color: number = 0x121212, alpha: number = 0.06, step: number = 60): void {
  gfx.lineStyle(1, color, alpha);
  for (let x = 0; x <= width; x += step) gfx.lineBetween(x, 0, x, height);
  for (let y = 0; y <= height; y += step) gfx.lineBetween(0, y, width, y);
}

function drawCorridorLine(gfx: Phaser.GameObjects.Graphics, width: number, height: number, color: number): void {
  const points = [
    new Phaser.Math.Vector2(width * 0.08, height * 0.75),
    new Phaser.Math.Vector2(width * 0.22, height * 0.6),
    new Phaser.Math.Vector2(width * 0.38, height * 0.54),
    new Phaser.Math.Vector2(width * 0.53, height * 0.42),
    new Phaser.Math.Vector2(width * 0.68, height * 0.45),
    new Phaser.Math.Vector2(width * 0.85, height * 0.28),
  ];

  gfx.lineStyle(8, color, 0.18);
  for (let index = 0; index < points.length - 1; index += 1) {
    gfx.lineBetween(points[index].x, points[index].y, points[index + 1].x, points[index + 1].y);
  }

  gfx.fillStyle(color, 0.18);
  points.forEach((point, index) => {
    gfx.fillCircle(point.x, point.y, index === points.length - 1 ? 16 : 12);
    gfx.lineStyle(2, color, 0.45);
    gfx.strokeCircle(point.x, point.y, index === points.length - 1 ? 22 : 18);
  });
}

function drawAccentRects(gfx: Phaser.GameObjects.Graphics, width: number, height: number, accent: number = 0xFF6B35): void {
  gfx.lineStyle(3, accent, 0.2);
  gfx.strokeRect(width * 0.08, height * 0.12, width * 0.34, height * 0.24);
  gfx.strokeRect(width * 0.55, height * 0.18, width * 0.24, height * 0.18);
  gfx.fillStyle(accent, 0.04);
  gfx.fillRect(width * 0.08, height * 0.12, width * 0.34, height * 0.24);
}

function drawDiagonal(gfx: Phaser.GameObjects.Graphics, width: number, height: number, color: number = 0x121212): void {
  gfx.lineStyle(2, color, 0.08);
  gfx.lineBetween(0, 0, width, height);
  gfx.lineBetween(width, 0, 0, height);
}

export class ProceduralBG {
  static drawTitleBG(scene: Phaser.Scene, width: number, height: number): void {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xFFD23F, 1);
    gfx.fillRect(0, 0, width, height);
    drawGrid(gfx, width, height);
    drawDiagonal(gfx, width, height);
    drawCorridorLine(gfx, width, height, 0x121212);
    drawAccentRects(gfx, width, height);
  }

  static drawOperationsMap(scene: Phaser.Scene, width: number, height: number): void {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xFFD23F, 1);
    gfx.fillRect(0, 0, width, height);
    drawGrid(gfx, width, height);
    drawCorridorLine(gfx, width, height, 0x121212);

    gfx.lineStyle(3, 0xFF6B35, 0.15);
    gfx.strokeRect(width * 0.1, height * 0.14, width * 0.22, height * 0.12);
    gfx.strokeRect(width * 0.68, height * 0.54, width * 0.18, height * 0.15);
  }

  static drawMissionBG(scene: Phaser.Scene, width: number, height: number, accent: number): void {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xFFD23F, 1);
    gfx.fillRect(0, 0, width, height);
    drawGrid(gfx, width, height);

    gfx.lineStyle(3, accent, 0.2);
    gfx.strokeRect(width * 0.08, height * 0.14, width * 0.32, height * 0.24);
    gfx.strokeRect(width * 0.52, height * 0.2, width * 0.24, height * 0.18);
    gfx.strokeRect(width * 0.42, height * 0.52, width * 0.28, height * 0.18);

    gfx.lineStyle(4, accent, 0.16);
    gfx.lineBetween(width * 0.24, height * 0.38, width * 0.54, height * 0.29);
    gfx.lineBetween(width * 0.64, height * 0.38, width * 0.56, height * 0.52);
    gfx.lineBetween(width * 0.3, height * 0.56, width * 0.52, height * 0.61);

    gfx.fillStyle(accent, 0.18);
    [0.24, 0.54, 0.64, 0.56, 0.3, 0.52].forEach((_value, index, values) => {
      if (index % 2 === 0) {
        gfx.fillCircle(width * values[index], height * values[index + 1], 9);
      }
    });
  }

  static drawDebriefBG(scene: Phaser.Scene, width: number, height: number, accent: number): void {
    const gfx = scene.add.graphics();
    gfx.fillStyle(0xFFD23F, 1);
    gfx.fillRect(0, 0, width, height);
    drawGrid(gfx, width, height);

    gfx.lineStyle(3, accent, 0.2);
    gfx.strokeRect(width * 0.08, height * 0.18, width * 0.26, height * 0.2);
    gfx.strokeRect(width * 0.58, height * 0.16, width * 0.2, height * 0.22);

    gfx.lineStyle(5, accent, 0.2);
    gfx.strokeCircle(width * 0.76, height * 0.66, width * 0.1);
    gfx.strokeCircle(width * 0.76, height * 0.66, width * 0.16);
    gfx.lineBetween(width * 0.12, height * 0.76, width * 0.46, height * 0.58);
    gfx.lineBetween(width * 0.46, height * 0.58, width * 0.62, height * 0.68);
  }
}
