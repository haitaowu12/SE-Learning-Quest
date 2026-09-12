import { useEffect } from 'react';
import * as Phaser from 'phaser';
import { GameOverlay } from './GameOverlay.tsx';
import { BootScene } from '../scenes/BootScene.ts';
import '../styles/ui.css';
import './gameOverlay.css';

export default function LegacyApp() {
  useEffect(() => {
    const game = new Phaser.Game({
      type: Phaser.AUTO, parent: 'game-container', width: window.innerWidth, height: window.innerHeight,
      backgroundColor: '#f7f8f4', scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH },
      scene: [BootScene], audio: { disableWebAudio: false },
    });
    return () => game.destroy(true);
  }, []);
  return <GameOverlay />;
}
