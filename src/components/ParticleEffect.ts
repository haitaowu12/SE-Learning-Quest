import * as Phaser from 'phaser';

export class ParticleEffect {
  static burst(scene: Phaser.Scene, x: number, y: number, color: number, count = 20): void {
    for (let i = 0; i < count; i++) {
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(100, 300);
      const size = Phaser.Math.FloatBetween(3, 8);
      const particle = scene.add.circle(x, y, size, color, 0.8);

      scene.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scale: 0,
        duration: Phaser.Math.Between(600, 1000),
        ease: 'Power2',
        onComplete: () => particle.destroy(),
      });
    }
  }

  static success(scene: Phaser.Scene, x: number, y: number): void {
    this.burst(scene, x, y, 0x10b981, 30);
    this.burst(scene, x, y, 0x0ea5e9, 15);
  }

  static failure(scene: Phaser.Scene, x: number, y: number): void {
    this.burst(scene, x, y, 0xef4444, 15);
  }
}
