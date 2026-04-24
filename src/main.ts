import * as Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { TitleScene } from './scenes/TitleScene.ts';
import { MapScene } from './scenes/MapScene.ts';
import { ModuleScene } from './scenes/ModuleScene.ts';
import { LevelScene } from './scenes/LevelScene.ts';
import { CapstoneScene } from './scenes/CapstoneScene.ts';
import { LessonScene } from './scenes/LessonScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#0f172a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, TitleScene, MapScene, ModuleScene, LessonScene, LevelScene, CapstoneScene],
  audio: {
    disableWebAudio: false,
  },
};

new Phaser.Game(config);
