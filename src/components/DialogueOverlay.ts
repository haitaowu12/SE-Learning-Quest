import * as Phaser from 'phaser';
import { COLORS, RADIUS, FONT } from '../utils/designTokens.ts';
import { scaledFontSize } from '../utils/scaling.ts';
import { AudioManager } from './AudioManager.ts';

export interface DialogueNode {
  speaker: string;
  text: string;
}

export class DialogueOverlay extends Phaser.GameObjects.Container {
  private bgGraphics: Phaser.GameObjects.Graphics;
  private avatarImage: Phaser.GameObjects.Image;
  private nameText: Phaser.GameObjects.Text;
  private dialogueText: Phaser.GameObjects.Text;
  private continueText: Phaser.GameObjects.Text;
  
  private dialogueQueue: DialogueNode[] = [];
  private currentText = '';
  private currentTypeIndex = 0;
  private typeTimer: Phaser.Time.TimerEvent | null = null;
  private isTyping = false;
  
  private audioManager: AudioManager | null;
  public onComplete: () => void = () => {};

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number) {
    super(scene, x, y);
    scene.add.existing(this);
    this.audioManager = AudioManager.fromRegistry(scene);
    
    // Dim background overlay (interactive to block touches to puzzle)
    const overlay = scene.add.graphics();
    overlay.fillStyle(0x020617, 0.85);
    overlay.fillRect(-x, -y, scene.scale.width, scene.scale.height);
    overlay.setInteractive(new Phaser.Geom.Rectangle(-x, -y, scene.scale.width, scene.scale.height), Phaser.Geom.Rectangle.Contains);
    this.add(overlay);

    // Dialogue Box
    this.bgGraphics = scene.add.graphics();
    this.bgGraphics.fillStyle(COLORS.panelBg, 0.95);
    this.bgGraphics.fillRoundedRect(0, 0, width, height, RADIUS.md);
    this.bgGraphics.lineStyle(2, COLORS.primary, 1);
    this.bgGraphics.strokeRoundedRect(0, 0, width, height, RADIUS.md);
    this.add(this.bgGraphics);

    // Avatar
    this.avatarImage = scene.add.image(60, height / 2, 'avatar-pm');
    this.avatarImage.setScale(80 / this.avatarImage.width);
    const maskShape = scene.make.graphics({});
    maskShape.fillCircle(x + 60, y + height / 2, 40);
    this.avatarImage.setMask(maskShape.createGeometryMask());
    this.add(this.avatarImage);
    
    const avatarRing = scene.add.graphics();
    avatarRing.lineStyle(2, COLORS.primary, 1);
    avatarRing.strokeCircle(60, height / 2, 40);
    this.add(avatarRing);

    // Name
    this.nameText = scene.add.text(120, 20, 'Project Manager', {
      fontSize: `${scaledFontSize(scene, FONT.sizes.md)}px`,
      color: '#38bdf8',
      fontFamily: FONT.heading,
      fontStyle: 'bold'
    });
    this.add(this.nameText);

    // Text
    this.dialogueText = scene.add.text(120, 50, '', {
      fontSize: `${scaledFontSize(scene, FONT.sizes.sm)}px`,
      color: '#f8fafc',
      fontFamily: FONT.family,
      wordWrap: { width: width - 140 }
    });
    this.add(this.dialogueText);

    // Continue prompt
    this.continueText = scene.add.text(width - 20, height - 20, 'Click to continue ▼', {
      fontSize: `${scaledFontSize(scene, FONT.sizes.xs)}px`,
      color: '#94a3b8',
      fontFamily: FONT.family,
      fontStyle: 'italic'
    }).setOrigin(1, 1);
    this.add(this.continueText);
    
    // Tween continue text
    scene.tweens.add({
      targets: this.continueText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Interaction
    overlay.on('pointerdown', this.advanceDialogue, this);
    
    this.setAlpha(0);
    this.setVisible(false);
  }

  public startDialogue(queue: DialogueNode[]): void {
    if (!queue || queue.length === 0) {
      this.onComplete();
      return;
    }
    
    this.dialogueQueue = [...queue];
    this.setVisible(true);
    this.scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 300,
      onComplete: () => {
        this.showNext();
      }
    });
  }

  private advanceDialogue(): void {
    if (this.isTyping) {
      // Skip typing
      if (this.typeTimer) this.typeTimer.remove();
      this.dialogueText.setText(this.currentText);
      this.isTyping = false;
    } else {
      // Next node
      this.showNext();
    }
  }

  private showNext(): void {
    if (this.dialogueQueue.length === 0) {
      this.finish();
      return;
    }

    const node = this.dialogueQueue.shift()!;
    this.avatarImage.setTexture(node.speaker);
    this.nameText.setText(node.speaker === 'avatar-lead' ? 'Lead Architect' : 'Project Manager');
    this.nameText.setColor(node.speaker === 'avatar-lead' ? '#06b6d4' : '#38bdf8');
    
    this.avatarImage.setScale(80 / this.avatarImage.width);

    this.currentText = node.text;
    this.dialogueText.setText('');
    this.currentTypeIndex = 0;
    this.isTyping = true;
    
    if (this.typeTimer) this.typeTimer.remove();
    this.typeTimer = this.scene.time.addEvent({
      delay: 25, 
      callback: this.typeCharacter,
      callbackScope: this,
      loop: true
    });
  }

  private typeCharacter(): void {
    if (this.currentTypeIndex < this.currentText.length) {
      this.dialogueText.setText(this.dialogueText.text + this.currentText[this.currentTypeIndex]);
      this.currentTypeIndex++;
      
      if (this.currentTypeIndex % 3 === 0) {
        this.audioManager?.playSFX('sfx-blip'); 
      }
    } else {
      this.isTyping = false;
      if (this.typeTimer) this.typeTimer.remove();
    }
  }

  private finish(): void {
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        this.setVisible(false);
        this.onComplete();
      }
    });
  }
}
