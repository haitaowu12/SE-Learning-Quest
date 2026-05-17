import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { LevelManager } from '../game/LevelManager.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';

export class TitleScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private ui!: UiLayer;

  constructor() {
    super({ key: 'TitleScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    this.audioManager?.playBGM('bgm-ambient');

    ProceduralBG.drawTitleBG(this, this.scale.width, this.scale.height);

    this.ui = new UiLayer('title');
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ui.destroy());
    TransitionManager.fadeIn(this, 250);
  }

  private render(): void {
    const manifest = this.levelManager.getManifest();
    const episode = this.levelManager.getEpisode(this.gameManager.getSelectedEpisodeId());
    const state = this.gameManager.getState();
    const completedCount = state.completedChapterIds.length;
    const hasActiveMission = Boolean(state.activeMission);
    const resumeLabel = hasActiveMission ? 'Resume Active Chapter' : completedCount > 0 ? 'Open Episode Map' : 'Start Episode';
    const scenarioLabel = episode?.scenario ?? 'Systems engineering scenario';
    const bestFor = episode?.bestFor ?? 'Applied systems engineering practice.';
    const prerequisite = episode?.prerequisite ?? 'Basic lifecycle vocabulary.';

    this.ui.render(`
      <div class="screen-shell title-screen episode-title-screen">
        <section class="title-copy panel-tight">
          <button class="text-link js-episodes">SE Learning Quest</button>
          <h1 class="display-title">${manifest.programTitle}</h1>
          <p class="body-copy">${manifest.programSummary}</p>
          <p class="episode-path-note">EP2 takes the lifecycle grammar from EP1 and adds pressure: stakeholders, interfaces, metrics, safety assurance, sequencing, and commissioning readiness.</p>
          <div class="chip-row">
            <span class="chip">Applied campaign</span>
            <span class="chip">Role: ${manifest.playerRole}</span>
            <span class="chip">${manifest.chapters.length} decision chapters</span>
            <span class="chip">${scenarioLabel}</span>
          </div>
          ${state.resetNotice ? `<p class="body-copy reset-note">${state.resetNotice}</p>` : ''}
        </section>
        <aside class="title-panel panel">
          <div>
            <div class="eyebrow">Program Status</div>
            <h2 class="section-title">Use SE judgment when every decision changes the next one.</h2>
          </div>
          <div class="metric-strip">
            <div class="metric-chip"><span class="metric-label">Completed Chapters</span><span class="metric-value">${completedCount}/${manifest.chapters.length}</span></div>
            <div class="metric-chip"><span class="metric-label">System Quality</span><span class="metric-value">${state.metrics.system_quality}</span></div>
            <div class="metric-chip"><span class="metric-label">Stakeholder Trust</span><span class="metric-value">${state.metrics.stakeholder_trust}</span></div>
            <div class="metric-chip"><span class="metric-label">Risk Exposure</span><span class="metric-value">${state.metrics.risk_exposure}</span></div>
            <div class="metric-chip"><span class="metric-label">Team Capacity</span><span class="metric-value">${state.metrics.team_capacity}</span></div>
          </div>
          <div class="signal-card">
            <h4>Campaign loop</h4>
            <p class="body-copy">Read the program situation, choose connected SE actions, complete a tactical exercise, then watch metrics and evidence change.</p>
          </div>
          <div class="signal-card">
            <h4>Best for</h4>
            <p class="body-copy">${bestFor}</p>
            <p class="small-copy">${prerequisite}</p>
          </div>
          <div class="hero-actions">
            <button class="button button-primary js-open-map">${resumeLabel}</button>
            <button class="button button-secondary js-episodes">Choose Episode</button>
            <button class="button button-secondary js-reset">Reset Episode</button>
          </div>
        </aside>
      </div>
    `);

    this.ui.on('click', '.js-open-map', () => {
      this.gameManager.clearResetNotice();
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start(hasActiveMission ? 'MissionScene' : 'OperationsMapScene');
      });
    });

    this.ui.on('click', '.js-episodes', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('EpisodeSelectScene');
      });
    });

    this.ui.on('click', '.js-reset', () => {
      this.audioManager?.playSFX('sfx-error');
      this.gameManager.resetCampaign();
      this.render();
    });
  }
}
