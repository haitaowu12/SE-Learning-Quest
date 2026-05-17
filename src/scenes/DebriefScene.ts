import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { LevelManager } from '../game/LevelManager.ts';
import type { ChapterResult, MetricKey } from '../types/index.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';

const METRIC_LABELS: Record<MetricKey, string> = {
  system_quality: 'System Quality',
  stakeholder_trust: 'Stakeholder Trust',
  risk_exposure: 'Risk Exposure',
  delivery_confidence: 'Delivery Confidence',
  team_capacity: 'Team Capacity',
};

function deltaClass(key: MetricKey, change: number | undefined): string {
  if (!change) return 'metric-delta-neutral';
  if (key === 'risk_exposure') return change < 0 ? 'metric-delta-positive' : 'metric-delta-negative';
  return change > 0 ? 'metric-delta-positive' : 'metric-delta-negative';
}

function deltaText(change: number | undefined): string {
  if (!change) return '0';
  return `${change > 0 ? '+' : ''}${change}`;
}

function deltaMeaning(key: MetricKey, change: number | undefined): string {
  if (!change) return 'No change';
  if (key === 'risk_exposure') return change < 0 ? 'Risk reduced' : 'Risk increased';
  return change > 0 ? 'Improved' : 'Weakened';
}

function standardCitation(citation: string): string {
  if (!citation.startsWith('https://')) return citation;
  return `<a href="${citation}" target="_blank" rel="noreferrer">${citation}</a>`;
}

interface Recommendation {
  icon: string;
  text: string;
  priority: 'high' | 'medium';
}

function generateRecommendations(metrics: Record<string, number>, criticalFlags: string[], rating: string): Recommendation[] {
  const recs: Recommendation[] = [];

  if (metrics.system_quality < 50) {
    recs.push({ icon: '⚠', text: 'System quality is below threshold. Prioritize verification and design discipline in upcoming chapters.', priority: 'high' });
  }
  if (metrics.risk_exposure > 60) {
    recs.push({ icon: '🔴', text: 'Risk exposure is elevated. Address open risks before proceeding to integration activities.', priority: 'high' });
  }
  if (metrics.stakeholder_trust < 45) {
    recs.push({ icon: '👥', text: 'Stakeholder trust is eroding. Re-engage key stakeholders and make boundary decisions visible.', priority: 'high' });
  }
  if (metrics.delivery_confidence < 45) {
    recs.push({ icon: '📉', text: 'Delivery confidence is low. Strengthen evidence chains and resolve open verification gaps.', priority: 'medium' });
  }
  if (metrics.team_capacity < 40) {
    recs.push({ icon: '🔋', text: 'Team capacity is strained. Avoid scope expansion and protect core delivery resources.', priority: 'medium' });
  }

  if (criticalFlags.length > 0) {
    const flagNames = criticalFlags.map(f => f.replace(/_/g, ' ')).join(', ');
    recs.push({ icon: '🚩', text: `Active concerns: ${flagNames}. These will compound if not addressed in later chapters.`, priority: 'high' });
  }

  if (rating === 'Excellent' || rating === 'Stable') {
    if (recs.length === 0) {
      recs.push({ icon: '✅', text: 'Strong position. Maintain discipline and avoid complacency as complexity increases.', priority: 'medium' });
    }
  }

  return recs;
}

function renderEvidenceThread(result: ChapterResult): string {
  const notes = result.unlockedNotes.length > 0
    ? result.unlockedNotes
    : result.outcomeTags.map((tag) => tag.replace(/_/g, ' '));
  const thread = notes.length > 0
    ? notes.slice(0, 4).map((note) => `<li>${note}</li>`).join('')
    : '<li>No extra notes unlocked. Revisit decision rationale before the next chapter.</li>';
  return `<ul class="drawer-list evidence-thread-list">${thread}</ul>`;
}

export class DebriefScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private ui!: UiLayer;
  private result!: ChapterResult;

  constructor() {
    super({ key: 'DebriefScene' });
  }

  create(data: { chapterId?: string } = {}): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);

    const chapterId = data.chapterId ?? this.gameManager.getState().currentChapterId;
    if (!chapterId) {
      this.scene.start('OperationsMapScene');
      return;
    }

    const result = this.gameManager.getChapterResult(chapterId);
    const chapter = this.levelManager.getChapterById(chapterId);
    if (!result || !chapter) {
      this.scene.start('OperationsMapScene');
      return;
    }
    this.result = result;

    ProceduralBG.drawDebriefBG(this, this.scale.width, this.scale.height, parseInt(chapter.themeColor.replace('#', ''), 16));

    this.ui = new UiLayer('debrief');
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ui.destroy());
    TransitionManager.fadeIn(this, 250);
  }

  private render(): void {
    const chapter = this.levelManager.getChapterById(this.result.chapterId);
    if (!chapter) return;
    const manifest = this.levelManager.getManifest();
    const baseUrl = import.meta.env.BASE_URL;
    const debriefImage = `${baseUrl}${manifest.images?.debriefReadiness ?? 'assets/learning-quest/rail-debrief-readiness.webp'}`;
    const recommendations = generateRecommendations(
      Object.fromEntries(Object.entries(this.result.finalMetrics)) as Record<string, number>,
      this.result.criticalFlags,
      this.result.rating
    );
    const nextRisk = recommendations.find((rec) => rec.priority === 'high') ?? recommendations[0];

    const deltas = Object.entries(this.result.metricDelta).map(([key, value]) => `
      <div class="delta-card">
        <span class="metric-label">${METRIC_LABELS[key as MetricKey]}</span>
        <span class="metric-value ${deltaClass(key as MetricKey, value)}">${deltaText(value)}</span>
        <small>${deltaMeaning(key as MetricKey, value)}</small>
      </div>
    `).join('');

    const history = this.result.decisionHistory.map((entry) => `
      <div class="history-item">
        <strong>${entry.optionTitle}</strong>
        <p class="small-copy">${entry.summary}</p>
      </div>
    `).join('');

    const standards = this.result.standards.map((journal) => `
      <div class="journal-card">
        <h4>${journal.title}</h4>
        <p class="small-copy">${journal.summary}</p>
        <ul class="drawer-list">${journal.standards.map((standard) => `<li>${standard.framework} · ${standardCitation(standard.citation)}<br /><span class="small-copy">${standard.rationale}</span></li>`).join('')}</ul>
      </div>
    `).join('');

    this.ui.render(`
      <div class="screen-shell debrief-layout">
        <section class="debrief-main panel">
          <div class="eyebrow">${chapter.pillar}</div>
          <div>
            <h1 class="chapter-title">${chapter.brief.title}</h1>
            <p class="result-rating">${this.result.rating}</p>
          </div>
          <div class="debrief-what-changed">
            <picture class="debrief-anchor-media" aria-hidden="true">
              <source srcset="${debriefImage}" type="image/webp" />
              <img src="${baseUrl}assets/learning-quest/rail-debrief-readiness.png" alt="" />
            </picture>
            <div>
              <span class="eyebrow">What changed</span>
              <h4>${this.result.headline}</h4>
              <p class="signal-copy">${this.result.summary}</p>
            </div>
          </div>
          <div class="delta-grid">${deltas || '<div class="delta-card"><span class="metric-label">Metric change</span><span class="metric-value">0</span><small>No change</small></div>'}</div>
          <div class="signal-card recommendations-card">
            <h4>Next risk to control</h4>
            <p class="signal-copy">${nextRisk?.text ?? 'Maintain discipline and watch metric drift before the next chapter.'}</p>
          </div>
          <div class="signal-card">
            <h4>Evidence thread</h4>
            ${renderEvidenceThread(this.result)}
          </div>
          <div class="signal-card">
            <h4>SE principle reinforced</h4>
            <p class="signal-copy">${this.result.principle}</p>
          </div>
          <div class="signal-card recommendations-card">
            <h4>Recommendations for next chapter</h4>
            <ul class="recommendation-list">${recommendations.map(rec => `
              <li class="recommendation-item priority-${rec.priority}">
                <span class="rec-icon">${rec.icon}</span>
                <span class="rec-text">${rec.text}</span>
              </li>
            `).join('')}</ul>
          </div>
          <div class="result-actions">
            <button class="button button-secondary js-map">Back to Map</button>
            <button class="button button-primary js-replay">Replay Chapter</button>
          </div>
        </section>
        <aside class="debrief-side panel-tight">
          <div class="signal-card">
            <h4>Decision history</h4>
            <div class="decision-history">${history}</div>
          </div>
          ${this.result.subgameResult ? `
            <div class="signal-card">
              <h4>Tactical exercise</h4>
              <p class="small-copy">${this.result.subgameResult.summary}</p>
              <p class="small-copy">Score: ${Math.round(this.result.subgameResult.score * 100)}%</p>
            </div>
          ` : ''}
          ${standards}
        </aside>
      </div>
    `);

    this.ui.on('click', '.js-map', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('OperationsMapScene');
      });
    });

    this.ui.on('click', '.js-replay', () => {
      this.audioManager?.playSFX('sfx-click');
      this.gameManager.startChapter(this.result.chapterId);
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('MissionScene', { chapterId: this.result.chapterId });
      });
    });
  }
}
