import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { CoffeeLabProgressManager } from '../game/CoffeeLabProgressManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { LevelManager } from '../game/LevelManager.ts';
import { SaveManager } from '../game/SaveManager.ts';
import type { EpisodeSummary } from '../types/index.ts';
import coffeeLabCourseData from '../data/coffee-lab-course.json' with { type: 'json' };
import type { CoffeeLabCourse } from '../types/index.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';

function episodeProgress(episode: EpisodeSummary): { completed: number; total: number; label: string; hasProgress: boolean } {
  if (episode.format === 'lab') {
    const course = coffeeLabCourseData as CoffeeLabCourse;
    const progress = CoffeeLabProgressManager.load(course);
    const completed = progress.completedUnitIds.length;
    const total = course.units.length;
    return {
      completed,
      total,
      label: `${completed}/${total} artifacts`,
      hasProgress: completed > 0 || progress.visitedUnitIds.length > 1,
    };
  }

  const loadResult = SaveManager.load(episode.id);
  const state = loadResult.state;
  const manifest = LevelManager.getInstance().getManifest(episode.id);
  const completed = state?.completedChapterIds.length ?? 0;
  const total = manifest.chapters.length;
  return {
    completed,
    total,
    label: `${completed}/${total} chapters`,
    hasProgress: completed > 0 || Boolean(state?.activeMission),
  };
}

export class EpisodeSelectScene extends Phaser.Scene {
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private ui!: UiLayer;

  constructor() {
    super({ key: 'EpisodeSelectScene' });
  }

  create(): void {
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);
    this.audioManager?.playBGM('bgm-ambient');

    ProceduralBG.drawTitleBG(this, this.scale.width, this.scale.height);

    this.ui = new UiLayer('episode-select');
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ui.destroy());
    TransitionManager.fadeIn(this, 250);
  }

  private render(): void {
    const catalog = this.levelManager.getCatalog();
    const episodes = this.levelManager.getEpisodes();
    const baseUrl = import.meta.env.BASE_URL;

    const episodeCards = episodes.map((episode) => {
      const progress = episodeProgress(episode);
      const buttonLabel = progress.hasProgress ? `Continue ${episode.code}` : episode.routeLabel;
      const outcomes = episode.outcomes.slice(0, 3).map((outcome) => `<li>${outcome}</li>`).join('');
      const standards = episode.standards.map((standard) => `<span class="reference-pill">${standard.framework}</span>`).join('');
      return `
        <article class="episode-card" style="--episode-accent:${episode.accentColor}">
          <div class="episode-media">
            <img src="${baseUrl}${episode.heroImage}" alt="" />
          </div>
          <div class="episode-card-body">
            <div class="episode-card-topline">
              <span class="episode-code">${episode.code}</span>
              <span class="episode-status">${episode.difficulty}</span>
            </div>
            <h2>${episode.title}</h2>
            <p class="episode-subtitle">${episode.subtitle}</p>
            <div class="episode-progress" aria-label="${episode.title} progress">
              <span style="width:${Math.round((progress.completed / progress.total) * 100)}%"></span>
            </div>
            <button class="button button-primary js-open-episode" data-episode-id="${episode.id}">${buttonLabel}</button>
            <p class="body-copy">${episode.overview}</p>
            <div class="episode-meta">
              <span>${episode.learningMode}</span>
              <span>${episode.scenario}</span>
              <span>${episode.duration}</span>
              <span>${progress.label}</span>
            </div>
            <div class="episode-fit">
              <strong>Best for</strong>
              <p>${episode.bestFor}</p>
              <strong>Prerequisite</strong>
              <p>${episode.prerequisite}</p>
            </div>
            <ul class="episode-outcomes">${outcomes}</ul>
            <div class="reference-row">${standards}</div>
          </div>
        </article>
      `;
    }).join('');

    this.ui.render(`
      <div class="screen-shell episode-select-layout">
        <section class="platform-hero">
          <div class="platform-copy">
            <h1 class="display-title">${catalog.platformTitle}</h1>
            <p class="platform-subtitle">${catalog.platformSubtitle}</p>
            <p class="platform-path">EP1 shows how small hidden handoffs become rework. EP2 tests the same habits under rail-program pressure.</p>
            <div class="hero-actions">
              <button class="button button-primary js-open-episode" data-episode-id="ep1-coffee-lab">Start EP1</button>
              <button class="button button-secondary js-open-episode" data-episode-id="ep2-rail-quest">Enter EP2</button>
            </div>
            <div class="reference-bar">
              <a href="https://sebokwiki.org/" target="_blank" rel="noreferrer">SEBoK</a>
              <a href="https://www.incose.org/resources-publications/technical-publications/se-handbook/" target="_blank" rel="noreferrer">INCOSE SE Handbook</a>
              <a href="https://www.iso.org/standard/81702.html" target="_blank" rel="noreferrer">ISO 15288</a>
            </div>
          </div>
          <div class="platform-signal" aria-hidden="true">
            <div class="signal-node signal-node-a">Need</div>
            <div class="signal-node signal-node-b">Requirement</div>
            <div class="signal-node signal-node-c">Architecture</div>
            <div class="signal-node signal-node-d">Evidence</div>
            <svg viewBox="0 0 420 220" class="signal-lines">
              <path d="M58 62 C130 18 178 112 248 70 S350 78 375 36" />
              <path d="M66 162 C145 110 205 180 282 142 S355 122 390 165" />
              <path d="M96 88 L292 142" />
            </svg>
          </div>
        </section>
        <section class="episode-grid" aria-label="Available learning episodes">
          ${episodeCards}
        </section>
      </div>
    `);

    this.ui.on('click', '.js-open-episode', (target) => {
      const episodeId = target.dataset.episodeId;
      if (!episodeId) return;
      this.audioManager?.playSFX('sfx-click');
      const episode = this.levelManager.getEpisode(episodeId);
      TransitionManager.fadeOut(this, 250, () => {
        if (episode?.format === 'lab') {
          this.scene.start('CoffeeLabScene');
          return;
        }
        GameManager.getInstance().selectEpisode(episodeId);
        this.scene.start('TitleScene');
      });
    });
  }
}
