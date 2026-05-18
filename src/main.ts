import * as Phaser from 'phaser';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { GameOverlay } from './app/GameOverlay.tsx';
import './styles/ui.css';
import './app/gameOverlay.css';
import { BootScene } from './scenes/BootScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#f7f8f4',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene],
  audio: {
    disableWebAudio: false,
  },
};

new Phaser.Game(config);

const uiRoot = document.getElementById('ui-root');
if (!uiRoot) {
  throw new Error('Missing #ui-root mount point');
}

createRoot(uiRoot).render(createElement(GameOverlay));
