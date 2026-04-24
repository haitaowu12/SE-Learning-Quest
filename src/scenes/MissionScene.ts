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
} from '../types/index.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';

function deltaMarkup(change: number | undefined): string {
  if (change === undefined || change === 0) return '<span class="metric-delta-neutral">0</span>';
  const className = change > 0 ? 'metric-delta-positive' : 'metric-delta-negative';
  const prefix = change > 0 ? '+' : '';
  return `<span class="${className}">${prefix}${change}</span>`;
}

function chapterAccent(chapter: CampaignChapter): number {
  return parseInt(chapter.themeColor.replace('#', ''), 16);
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
          <div class="metric-strip">
            <div class="metric-chip"><span class="metric-label">System Quality</span><span class="metric-value">${mission.metricsCurrent.system_quality}</span></div>
            <div class="metric-chip"><span class="metric-label">Stakeholder Trust</span><span class="metric-value">${mission.metricsCurrent.stakeholder_trust}</span></div>
            <div class="metric-chip"><span class="metric-label">Risk Exposure</span><span class="metric-value">${mission.metricsCurrent.risk_exposure}</span></div>
            <div class="metric-chip"><span class="metric-label">Delivery Confidence</span><span class="metric-value">${mission.metricsCurrent.delivery_confidence}</span></div>
            <div class="metric-chip"><span class="metric-label">Team Capacity</span><span class="metric-value">${mission.metricsCurrent.team_capacity}</span></div>
          </div>
          <div class="card-actions">
            <button class="button button-secondary js-map">Back to Map</button>
            <button class="button button-secondary js-toggle-drawer">${this.drawerOpen ? 'Hide Drawer' : 'Open Mission Drawer'}</button>
          </div>
          ${stage}
        </section>
        <aside class="mission-drawer panel-tight">
          ${drawerSection || `
            <div class="signal-card">
              <h4>Secondary drawer collapsed</h4>
              <p class="signal-copy">Open it for stakeholders, prep notes, unlocked notes, and standards journal entries.</p>
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
      <article class="option-card">
        <div class="card-topline">
          <div class="option-label">${option.title}</div>
          <span class="chip">${option.id.replace(/-/g, ' ')}</span>
        </div>
        <div class="option-summary">${option.summary}</div>
        <div class="small-copy">${option.rationale}</div>
        <div class="chip-row">
          <span class="chip">Quality ${deltaMarkup(option.consequence.metrics.system_quality)}</span>
          <span class="chip">Trust ${deltaMarkup(option.consequence.metrics.stakeholder_trust)}</span>
          <span class="chip">Risk ${deltaMarkup(option.consequence.metrics.risk_exposure)}</span>
          <span class="chip">Delivery ${deltaMarkup(option.consequence.metrics.delivery_confidence)}</span>
          <span class="chip">Capacity ${deltaMarkup(option.consequence.metrics.team_capacity)}</span>
        </div>
        <div class="card-actions">
          <button class="button button-primary js-pick-option" data-option-id="${option.id}">Commit this action</button>
        </div>
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
        <div class="decision-options">${options}</div>
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
      </div>
    `).join('');

    return `
      <div class="drawer-grid">
        <div class="signal-card">
          <h4>Stakeholders</h4>
          <ul class="drawer-list">${this.chapter.brief.stakeholders.map((stakeholder) => `<li>${stakeholder}</li>`).join('')}</ul>
        </div>
        <div class="signal-card">
          <h4>Mission prep</h4>
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
