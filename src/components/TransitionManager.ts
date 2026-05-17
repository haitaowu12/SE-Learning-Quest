import * as Phaser from 'phaser';

export class TransitionManager {
  private static transitioning = false;

  static isTransitioning(): boolean {
    return TransitionManager.transitioning;
  }

  static fadeOut(scene: Phaser.Scene, duration = 300, callback?: () => void): void {
    if (TransitionManager.transitioning) return;
    TransitionManager.transitioning = true;
    document.getElementById('ui-root')?.classList.add('ui-fading-out');
    scene.input.enabled = false;
    const cam = scene.cameras.main;
    cam.fadeOut(duration, 0, 0, 0);
    if (callback) {
      cam.once('camerafadeoutcomplete', () => {
        TransitionManager.transitioning = false;
        document.getElementById('ui-root')?.classList.remove('ui-fading-out');
        callback();
      });
    } else {
      cam.once('camerafadeoutcomplete', () => {
        TransitionManager.transitioning = false;
        document.getElementById('ui-root')?.classList.remove('ui-fading-out');
      });
    }
  }

  static fadeIn(scene: Phaser.Scene, duration = 300): void {
    const cam = scene.cameras.main;
    const root = document.getElementById('ui-root');
    root?.classList.add('ui-fading-in');
    cam.fadeIn(duration, 0, 0, 0);
    cam.once('camerafadeincomplete', () => {
      root?.classList.remove('ui-fading-in');
    });
    scene.input.enabled = true;
  }

  static slideTransition(scene: Phaser.Scene, direction: 'left' | 'right', callback?: () => void): void {
    if (TransitionManager.transitioning) return;
    TransitionManager.transitioning = true;
    const cam = scene.cameras.main;
    const targetX = direction === 'left' ? -cam.width : cam.width;
    cam.pan(targetX, cam.midPoint.y, 400, 'Sine.easeInOut');
    cam.zoomTo(0.9, 400, 'Sine.easeInOut');
    if (callback) {
      cam.once('camerapancomplete', () => {
        TransitionManager.transitioning = false;
        callback();
      });
    } else {
      cam.once('camerapancomplete', () => {
        TransitionManager.transitioning = false;
      });
    }
  }
}
