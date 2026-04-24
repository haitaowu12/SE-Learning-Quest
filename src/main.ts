import * as Phaser from 'phaser';
import './styles/ui.css';
import { BootScene } from './scenes/BootScene.ts';
import { TitleScene } from './scenes/TitleScene.ts';
import { OperationsMapScene } from './scenes/OperationsMapScene.ts';
import { MissionScene } from './scenes/MissionScene.ts';
import { DebriefScene } from './scenes/DebriefScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#FFD23F',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, OperationsMapScene, MissionScene, DebriefScene],
  audio: {
    disableWebAudio: false,
  },
};

new Phaser.Game(config);
