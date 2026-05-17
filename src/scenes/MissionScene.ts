import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { LevelManager } from '../game/LevelManager.ts';
import type {
  CampaignChapter,
  MatchSubgameSpec,
  MissionState,
  SequenceSubgameSpec,
  TriageSubgameSpec,
  MetricDelta,
} from '../types/index.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';

function impactLensMarkup(metrics: MetricDelta): string {
  const labels: Array<[keyof MetricDelta, string]> = [
    ['system_quality', 'system quality'],
    ['stakeholder_trust', 'stakeholder trust'],
    ['risk_exposure', 'risk reduced'],
    ['delivery_confidence', 'delivery confidence'],
    ['team_capacity', 'team capacity'],
  ];
  const protectedSignals = labels
    .filter(([key]) => metricDeltaClass(key, metrics[key]) === 'positive')
    .map(([, label]) => label);
  const pressuredSignals = labels
    .filter(([key]) => metricDeltaClass(key, metrics[key]) === 'negative')
    .map(([key, label]) => key === 'risk_exposure' ? 'risk increased' : label);
  const protectedText = protectedSignals.length > 0 ? protectedSignals.slice(0, 2).join(', ') : 'decision clarity';
  const pressureText = pressuredSignals.length > 0 ? pressuredSignals.slice(0, 2).join(', ') : 'no immediate metric pressure';
  return `
    <span class="chip">Improves ${protectedText}</span>
    <span class="chip">Watch ${pressureText}</span>
  `;
}

const METRIC_COPY: Array<[keyof MetricDelta, string]> = [
  ['system_quality', 'System quality'],
  ['stakeholder_trust', 'Stakeholder trust'],
  ['risk_exposure', 'Risk exposure'],
  ['delivery_confidence', 'Delivery confidence'],
  ['team_capacity', 'Team capacity'],
];

function metricDeltaClass(key: keyof MetricDelta, value: number | undefined): 'positive' | 'negative' | 'neutral' {
  if (!value) return 'neutral';
  if (key === 'risk_exposure') return value < 0 ? 'positive' : 'negative';
  return value > 0 ? 'positive' : 'negative';
}

function metricDeltaMeaning(key: keyof MetricDelta, value: number | undefined): string {
  if (!value) return 'No change';
  if (key === 'risk_exposure') return value < 0 ? 'Risk reduced' : 'Risk increased';
  return value > 0 ? 'Improves' : 'Weakens';
}

function metricDeltaValue(value: number | undefined): string {
  if (!value) return '0';
  return `${value > 0 ? '+' : ''}${value}`;
}

function optionScoreClass(metrics: MetricDelta): string {
  const score = METRIC_COPY.reduce((sum, [key]) => {
    const value = metrics[key] ?? 0;
    if (!value) return sum;
    const direction = metricDeltaClass(key, value);
    return sum + (direction === 'positive' ? Math.abs(value) : -Math.abs(value));
  }, 0);
  if (score >= 6) return 'option-positive';
  if (score <= -6) return 'option-risky';
  return 'option-mixed';
}

function renderMetricConsequences(metrics: MetricDelta): string {
  return `
    <div class="consequence-grid">
      ${METRIC_COPY.map(([key, label]) => {
        const value = metrics[key];
        const deltaClass = metricDeltaClass(key, value);
        return `
          <div class="consequence-cell ${deltaClass}">
            <span>${label}</span>
            <strong>${metricDeltaValue(value)}</strong>
            <small>${metricDeltaMeaning(key, value)}</small>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function chapterAccent(chapter: CampaignChapter): number {
  return parseInt(chapter.themeColor.replace('#', ''), 16);
}

function referenceList(entry: CampaignChapter['brief']['journal'][number]): string {
  if (!entry.standards?.length) return '';
  return `
    <ul class="drawer-list">
      ${entry.standards.map((standard) => {
        const isLink = standard.citation.startsWith('https://');
        const citation = isLink
          ? `<a href="${standard.citation}" target="_blank" rel="noreferrer">${standard.citation}</a>`
          : standard.citation;
        return `<li>${standard.framework}<br /><span class="small-copy">${citation}</span></li>`;
      }).join('')}
    </ul>
  `;
}

export class MissionScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private ui!: UiLayer;
  private chapter!: CampaignChapter;
  private drawerOpen = false;
  private sequenceDraft: string[] = [];

  constructor() {
    super({ key: 'MissionScene' });
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

    const mission = this.gameManager.startChapter(chapterId);
    const chapter = this.levelManager.getChapterById(chapterId);
    if (!mission || !chapter) {
      this.scene.start('OperationsMapScene');
      return;
    }

    this.chapter = chapter;
    this.sequenceDraft = chapter.subgame.type === 'sequence'
      ? [chapter.subgame.steps[2], chapter.subgame.steps[0], chapter.subgame.steps[3], chapter.subgame.steps[1]]
      : [];

    ProceduralBG.drawMissionBG(this, this.scale.width, this.scale.height, chapterAccent(chapter));

    this.ui = new UiLayer('mission');
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ui.destroy());
    TransitionManager.fadeIn(this, 250);
  }

  private render(): void {
    const mission = this.gameManager.getActiveMission();
    if (!mission) {
      this.scene.start('OperationsMapScene');
      return;
    }

    const currentDecision = !mission.awaitingSubgame
      ? this.chapter.decisions[mission.decisionIndex] ?? null
      : null;
    const drawerSection = this.drawerOpen ? this.renderDrawer(mission) : '';
    const stage = mission.awaitingSubgame
      ? this.renderSubgame(mission)
      : this.renderDecisionStage(mission, currentDecision);
    const manifest = this.levelManager.getManifest();
    const baseUrl = import.meta.env.BASE_URL;
    const missionImage = `${baseUrl}${manifest.images?.missionAnchor ?? 'assets/learning-quest/rail-mission-anchor.webp'}`;

    this.ui.render(`
      <div class="screen-shell mission-layout">
        <section class="mission-main panel">
          <div class="eyebrow">${this.chapter.pillar}</div>
          <div>
            <h1 class="chapter-title">${this.chapter.brief.title}</h1>
            <div class="chip-row">
              <span class="objective-chip">${this.chapter.brief.location}</span>
              <span class="objective-chip">${this.chapter.brief.objective}</span>
            </div>
          </div>
          <div class="mission-context-shell">
            <picture class="mission-anchor-media" aria-hidden="true">
              <source srcset="${missionImage}" type="image/webp" />
              <img src="${baseUrl}assets/learning-quest/rail-mission-anchor.png" alt="" />
            </picture>
            <div class="mission-context-copy">
              <span class="eyebrow">Evidence workspace</span>
              <p>${this.chapter.brief.situation}</p>
            </div>
          </div>
          <div class="metric-strip">
            <div class="metric-chip"><span class="metric-label">System Quality</span><span class="metric-value">${mission.metricsCurrent.system_quality}</span></div>
            <div class="metric-chip"><span class="metric-label">Stakeholder Trust</span><span class="metric-value">${mission.metricsCurrent.stakeholder_trust}</span></div>
            <div class="metric-chip"><span class="metric-label">Risk Exposure</span><span class="metric-value">${mission.metricsCurrent.risk_exposure}</span></div>
            <div class="metric-chip"><span class="metric-label">Delivery Confidence</span><span class="metric-value">${mission.metricsCurrent.delivery_confidence}</span></div>
            <div class="metric-chip"><span class="metric-label">Team Capacity</span><span class="metric-value">${mission.metricsCurrent.team_capacity}</span></div>
          </div>
          <div class="card-actions">
            <button class="button button-secondary js-map">Back to Map</button>
            <button class="button button-secondary js-toggle-drawer">${this.drawerOpen ? 'Hide Drawer' : 'Open Lesson Drawer'}</button>
          </div>
          ${stage}
        </section>
        <aside class="mission-drawer panel-tight">
          ${drawerSection || `
            <div class="signal-card">
              <h4>Secondary drawer collapsed</h4>
              <p class="signal-copy">Open it for stakeholders, prep notes, unlocked notes, and optional reference depth.</p>
            </div>
          `}
        </aside>
      </div>
    `);

    this.bindCommonHandlers();
    if (mission.awaitingSubgame) {
      this.bindSubgameHandlers();
    } else if (currentDecision) {
      this.ui.on('click', '.js-pick-option', (target) => {
        const optionId = target.dataset.optionId;
        if (!optionId) return;
        this.audioManager?.playSFX('sfx-click');
        this.gameManager.chooseDecisionOption(optionId);
        this.render();
      });
    }
  }

  private bindCommonHandlers(): void {
    this.ui.on('click', '.js-map', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('OperationsMapScene');
      });
    });

    this.ui.on('click', '.js-toggle-drawer', () => {
      this.drawerOpen = !this.drawerOpen;
      this.render();
    });
  }

  private renderDecisionStage(mission: MissionState, currentDecision: CampaignChapter['decisions'][number] | null): string {
    if (!currentDecision) {
      return `
        <div class="mission-stage">
          <div class="signal-card">
            <h4>Decision sequence complete</h4>
            <p class="signal-copy">All decisions are logged. Move into the tactical exercise to pressure-test the chapter logic.</p>
          </div>
          <div class="card-actions">
            <button class="button button-primary js-force-subgame">Open Tactical Exercise</button>
          </div>
        </div>
      `;
    }

    const history = mission.decisions.length > 0 ? `
      <div class="signal-card">
        <h4>Latest program signal</h4>
        <p class="signal-copy">${mission.lastConsequenceSummary ?? 'No consequences logged yet.'}</p>
      </div>
    ` : '';

    const options = currentDecision.options.map((option) => `
      <article class="consequence-option ${optionScoreClass(option.consequence.metrics)}">
        <div class="consequence-choice">
          <span class="option-label">${option.title}</span>
          <p class="option-summary">${option.summary}</p>
          <p class="small-copy">${option.rationale}</p>
          <div class="chip-row">
            ${impactLensMarkup(option.consequence.metrics)}
          </div>
        </div>
        ${renderMetricConsequences(option.consequence.metrics)}
        <button class="button button-primary js-pick-option" data-option-id="${option.id}">Commit this action</button>
      </article>
    `).join('');

    return `
      <div class="mission-stage">
        ${history}
        <div class="signal-card">
          <div class="eyebrow">${currentDecision.label} · ${mission.decisionIndex + 1}/${this.chapter.decisions.length}</div>
          <h4>${currentDecision.prompt}</h4>
          <p class="signal-copy">${currentDecision.context}</p>
        </div>
        <div class="consequence-comparison">${options}</div>
      </div>
    `;
  }

  private renderDrawer(mission: MissionState): string {
    const noteList = mission.unlockedNotes.length > 0
      ? `<ul class="drawer-list">${mission.unlockedNotes.map((note) => `<li>${note}</li>`).join('')}</ul>`
      : '<p class="small-copy">No unlocked notes yet. Stronger systems decisions will add them.</p>';

    const history = mission.decisions.length > 0
      ? mission.decisions.map((entry) => `
          <div class="journal-card">
            <h4>${entry.optionTitle}</h4>
            <p class="small-copy">${entry.summary}</p>
          </div>
        `).join('')
      : '<p class="small-copy">Decision history will appear here as you commit actions.</p>';

    const journal = this.chapter.brief.journal.map((entry) => `
      <div class="journal-card">
        <h4>${entry.title}</h4>
        <p class="small-copy">${entry.summary}</p>
        ${referenceList(entry)}
      </div>
    `).join('');

    return `
      <div class="drawer-grid">
        <div class="signal-card">
          <h4>Stakeholders</h4>
          <ul class="drawer-list">${this.chapter.brief.stakeholders.map((stakeholder) => `<li>${stakeholder}</li>`).join('')}</ul>
        </div>
        <div class="signal-card">
          <h4>Lesson prep</h4>
          <ul class="drawer-list">${this.chapter.brief.prepNotes.map((note) => `<li>${note}</li>`).join('')}</ul>
        </div>
        <div class="signal-card">
          <h4>Unlocked notes</h4>
          ${noteList}
        </div>
        <div class="signal-card">
          <h4>Journal references</h4>
          ${journal}
        </div>
        <div class="signal-card">
          <h4>Decision log</h4>
          ${history}
        </div>
      </div>
    `;
  }

  private renderSubgame(_mission: MissionState): string {
    const { subgame } = this.chapter;
    let content = '';

    if (subgame.type === 'priority') {
      content = `
        <form class="subgame-form js-subgame-form" data-subgame-type="priority">
          <div class="checkbox-list">
            ${subgame.options.map((option) => `
              <label class="priority-item">
                <span><input type="checkbox" name="priority-option" value="${option.id}" /> ${option.label}</span>
                <span class="small-copy">${option.detail}</span>
              </label>
            `).join('')}
          </div>
          <div class="small-copy">Select exactly ${subgame.maxSelections}.</div>
          <div class="subgame-actions">
            <button class="button button-primary" type="submit">Submit exercise</button>
          </div>
        </form>
      `;
    } else if (subgame.type === 'match') {
      content = this.renderMatchSubgame(subgame);
    } else if (subgame.type === 'sequence') {
      content = this.renderSequenceSubgame(subgame);
    } else {
      content = this.renderTriageSubgame(subgame);
    }

    return `
      <div class="mission-stage">
        <div class="subgame-card">
          <div class="eyebrow">Tactical exercise</div>
          <h4>${subgame.title}</h4>
          <p class="body-copy">${subgame.prompt}</p>
          <p class="small-copy">${subgame.instructions}</p>
          ${content}
        </div>
      </div>
    `;
  }

  private renderMatchSubgame(subgame: MatchSubgameSpec): string {
    return `
      <form class="subgame-form js-subgame-form" data-subgame-type="match">
        <div class="assignment-grid">
          ${subgame.leftItems.map((item) => `
            <label class="assignment-item">
              <span class="small-copy">${subgame.leftLabel}</span>
              <strong>${item}</strong>
              <select name="match::${item}">
                <option value="">Select ${subgame.rightLabel.toLowerCase()}</option>
                ${subgame.rightOptions.map((option) => `<option value="${option}">${option}</option>`).join('')}
              </select>
            </label>
          `).join('')}
        </div>
        <div class="subgame-actions">
          <button class="button button-primary" type="submit">Submit exercise</button>
        </div>
      </form>
    `;
  }

  private renderSequenceSubgame(subgame: SequenceSubgameSpec): string {
    if (this.sequenceDraft.length === 0) {
      this.sequenceDraft = [subgame.steps[2], subgame.steps[0], subgame.steps[3], subgame.steps[1]];
    }

    return `
      <div class="subgame-form">
        <div class="sequence-list">
          ${this.sequenceDraft.map((step, index) => `
            <div class="sequence-item">
              <strong>${index + 1}. ${step}</strong>
              <div class="sequence-controls">
                <button class="button button-secondary tiny-button js-sequence-up" data-index="${index}" ${index === 0 ? 'disabled' : ''}>Move Up</button>
                <button class="button button-secondary tiny-button js-sequence-down" data-index="${index}" ${index === this.sequenceDraft.length - 1 ? 'disabled' : ''}>Move Down</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="subgame-actions">
          <button class="button button-primary js-submit-sequence" type="button">Submit exercise</button>
        </div>
      </div>
    `;
  }

  private renderTriageSubgame(subgame: TriageSubgameSpec): string {
    return `
      <form class="subgame-form js-subgame-form" data-subgame-type="triage">
        <div class="triage-grid">
          ${subgame.risks.map((risk) => `
            <label class="triage-item">
              <strong>${risk.label}</strong>
              <span class="small-copy">${risk.detail}</span>
              <select name="triage::${risk.id}">
                <option value="">Select response</option>
                ${subgame.categories.map((category) => `<option value="${category.id}">${category.label}</option>`).join('')}
              </select>
            </label>
          `).join('')}
        </div>
        <div class="subgame-actions">
          <button class="button button-primary" type="submit">Submit exercise</button>
        </div>
      </form>
    `;
  }

  private bindSubgameHandlers(): void {
    const { subgame } = this.chapter;

    if (subgame.type === 'sequence') {
      this.ui.on('click', '.js-sequence-up', (target) => {
        const index = Number(target.dataset.index);
        if (Number.isNaN(index) || index <= 0) return;
        [this.sequenceDraft[index - 1], this.sequenceDraft[index]] = [this.sequenceDraft[index], this.sequenceDraft[index - 1]];
        this.render();
      });

      this.ui.on('click', '.js-sequence-down', (target) => {
        const index = Number(target.dataset.index);
        if (Number.isNaN(index) || index >= this.sequenceDraft.length - 1) return;
        [this.sequenceDraft[index + 1], this.sequenceDraft[index]] = [this.sequenceDraft[index], this.sequenceDraft[index + 1]];
        this.render();
      });

      this.ui.on('click', '.js-submit-sequence', () => {
        this.finishSubgame(this.sequenceDraft.slice());
      });
      return;
    }

    this.ui.on('submit', '.js-subgame-form', (target, event) => {
      event.preventDefault();
      const form = target as HTMLFormElement;
      const formData = new FormData(form);
      if (subgame.type === 'priority') {
        const selections = formData.getAll('priority-option').map((value) => String(value));
        if (selections.length !== subgame.maxSelections) return;
        this.finishSubgame(selections);
        return;
      }

      if (subgame.type === 'match') {
        const response: Record<string, string> = {};
        subgame.leftItems.forEach((item) => {
          const value = formData.get(`match::${item}`);
          response[item] = value ? String(value) : '';
        });
        this.finishSubgame(response);
        return;
      }

      const triageSpec = subgame as TriageSubgameSpec;
      const response: Record<string, string> = {};
      triageSpec.risks.forEach((risk) => {
        const value = formData.get(`triage::${risk.id}`);
        response[risk.id] = value ? String(value) : '';
      });
      this.finishSubgame(response);
    });
  }

  private finishSubgame(response: string[] | Record<string, string>): void {
    const result = this.gameManager.completeSubgame(response);
    if (!result) return;
    this.audioManager?.playSFX(result.rating === 'At Risk' ? 'sfx-error' : 'sfx-success');
    TransitionManager.fadeOut(this, 250, () => {
      this.scene.start('DebriefScene', { chapterId: result.chapterId });
    });
  }
}
