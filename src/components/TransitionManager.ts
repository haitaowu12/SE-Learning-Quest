import * as Phaser from 'phaser';

export class TransitionManager {
  static fadeOut(scene: Phaser.Scene, duration = 300, callback?: () => void): void {
    const cam = scene.cameras.main;
    cam.fadeOut(duration, 0, 0, 0);
    if (callback) {
      cam.once('camerafadeoutcomplete', callback);
    }
  }

  static fadeIn(scene: Phaser.Scene, duration = 300): void {
    const cam = scene.cameras.main;
    cam.fadeIn(duration, 0, 0, 0);
  }

  static slideTransition(scene: Phaser.Scene, direction: 'left' | 'right', callback?: () => void): void {
    const cam = scene.cameras.main;
    const targetX = direction === 'left' ? -cam.width : cam.width;
    cam.pan(targetX, cam.midPoint.y, 400, 'Sine.easeInOut');
    cam.zoomTo(0.9, 400, 'Sine.easeInOut');
    if (callback) {
      cam.once('camerapancomplete', callback);
    }
  }
}
