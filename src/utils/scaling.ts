import * as Phaser from 'phaser';

export function getScaleFactor(scene: Phaser.Scene): number {
  return Math.min(scene.scale.width, scene.scale.height) / 768;
}

export function scaledWidth(scene: Phaser.Scene, baseWidth: number): number {
  return Math.min(baseWidth, scene.scale.width * 0.85);
}

export function scaledFontSize(scene: Phaser.Scene, baseSize: number): number {
  return Math.max(10, Math.round(baseSize * getScaleFactor(scene)));
}
