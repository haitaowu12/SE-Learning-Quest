import * as Phaser from 'phaser';
import { AudioManager } from '../components/AudioManager.ts';
import { TransitionManager } from '../components/TransitionManager.ts';
import { GameManager } from '../game/GameManager.ts';
import { LevelManager } from '../game/LevelManager.ts';
import { UiLayer } from '../ui/UiLayer.ts';
import { ProceduralBG } from '../utils/proceduralBG.ts';
import { METRIC_KEYS } from '../game/metricUtils.ts';
import type { ChapterResult, MetricKey, MetricState } from '../types/index.ts';

function resultLabel(result: string | null | undefined): string {
  return result ? result : 'Ready';
}

const VEE_LEFT = [
  { id: 'concept', label: 'Concept of Operations', short: 'CON' },
  { id: 'requirements', label: 'Requirements Definition', short: 'REQ' },
  { id: 'architecture', label: 'Architecture Design', short: 'ARC' },
  { id: 'implementation', label: 'Implementation', short: 'IMPL' },
];

const VEE_RIGHT = [
  { id: 'validation', label: 'Validation', short: 'VAL' },
  { id: 'verification', label: 'Verification', short: 'VER' },
  { id: 'integration', label: 'Integration', short: 'INT' },
];

const VEE_PAIRS = [
  { left: VEE_LEFT[0], right: VEE_RIGHT[0], trace: 'ConOps ↔ Validation' },
  { left: VEE_LEFT[1], right: VEE_RIGHT[1], trace: 'Requirements ↔ Verification' },
  { left: VEE_LEFT[2], right: VEE_RIGHT[2], trace: 'Architecture ↔ Integration' },
];

const CHAPTER_VEE_MAP: Record<string, number> = {
  'chapter-1': 0,
  'chapter-2': 1,
  'chapter-3': 2,
  'chapter-4': 3,
  'chapter-5': 4,
  'chapter-6': 5,
  'chapter-7': 6,
};

const METRIC_LABELS: Record<MetricKey, string> = {
  system_quality: 'System Quality',
  stakeholder_trust: 'Stakeholder Trust',
  risk_exposure: 'Risk Exposure',
  delivery_confidence: 'Delivery Confidence',
  team_capacity: 'Team Capacity',
};

const METRIC_DESCRIPTIONS: Record<MetricKey, string> = {
  system_quality: 'How well the system meets its requirements and design specifications. Higher means fewer defects, better compliance with standards, and more robust architecture decisions.',
  stakeholder_trust: 'Confidence that stakeholders (operators, regulators, public) have in the project. Higher means smoother approvals, better cooperation, and less political resistance.',
  risk_exposure: 'The level of unresolved risk threatening the project. LOWER is better — high risk exposure means more potential for cost overruns, delays, or safety incidents.',
  delivery_confidence: 'Likelihood of delivering on time and within budget. Higher means the project is tracking well against its schedule and resource plan.',
  team_capacity: 'Available engineering bandwidth to handle emerging issues. Higher means the team can absorb unexpected work without compromising quality or schedule.',
};

const METRIC_COLORS: Record<MetricKey, string> = {
  system_quality: '#FF6B35',
  stakeholder_trust: '#22c55e',
  risk_exposure: '#ef4444',
  delivery_confidence: '#3b82f6',
  team_capacity: '#a855f7',
};

function getVeePhaseState(phaseIndex: number, completedChapterIds: string[], currentChapterId: string | null): string {
  const currentVeeIndex = currentChapterId ? (CHAPTER_VEE_MAP[currentChapterId] ?? -1) : -1;
  const completedVeeIndices = completedChapterIds.map(id => CHAPTER_VEE_MAP[id] ?? -1).filter(i => i >= 0);

  if (completedVeeIndices.includes(phaseIndex)) return 'vee-completed';
  if (phaseIndex === currentVeeIndex) return 'vee-current';
  if (phaseIndex < currentVeeIndex) return 'vee-past';
  return 'vee-future';
}

function getImplState(completedChapterIds: string[]): string {
  const completedVeeIndices = completedChapterIds.map(id => CHAPTER_VEE_MAP[id] ?? -1).filter(i => i >= 0);
  const hasImplComplete = completedVeeIndices.some(i => i === 3);
  if (hasImplComplete) return 'vee-completed';
  const hasLeftComplete = completedVeeIndices.some(i => i <= 2);
  if (hasLeftComplete) return 'vee-current';
  return 'vee-future';
}

function buildVeeDiagram(completedChapterIds: string[], currentChapterId: string | null, chapterResults: Record<string, ChapterResult>): string {
  const svgW = 540;
  const svgH = 310;
  const nodeW = 72;
  const nodeH = 26;

  const phases = [
    { ...VEE_LEFT[0], phaseIndex: 0, x: 80,  y: 55  },
    { ...VEE_LEFT[1], phaseIndex: 1, x: 125, y: 115 },
    { ...VEE_LEFT[2], phaseIndex: 2, x: 170, y: 175 },
    { ...VEE_RIGHT[2], phaseIndex: 4, x: 370, y: 175 },
    { ...VEE_RIGHT[1], phaseIndex: 5, x: 415, y: 115 },
    { ...VEE_RIGHT[0], phaseIndex: 6, x: 460, y: 55  },
  ];

  const implX = 270;
  const implY = 250;

  const stateColors: Record<string, string> = {
    'vee-completed': '#FF6B35',
    'vee-current': '#fbbf24',
    'vee-past': '#40916C',
    'vee-future': '#2D6A4F',
  };
  const stateTextColors: Record<string, string> = {
    'vee-completed': '#121212',
    'vee-current': '#121212',
    'vee-past': '#FFFFFF',
    'vee-future': '#A7C4B5',
  };

  const labelTextColor = '#FFFFFF';

  const vPath = `M80,55 L125,115 L170,175 L${implX},${implY} L370,175 L415,115 L460,55`;

  const nodeSvgs = phases.map(p => {
    const stateClass = getVeePhaseState(p.phaseIndex, completedChapterIds, currentChapterId);
    const fill = stateColors[stateClass] || '#2D6A4F';
    const textFill = stateTextColors[stateClass] || '#A7C4B5';
    const isCurrent = stateClass === 'vee-current';
    const result = chapterResults[completedChapterIds.find(id => (CHAPTER_VEE_MAP[id] ?? -1) === p.phaseIndex) ?? '']?.rating;
    return `
      <g class="vee-svg-node" data-phase="${p.id}">
        <rect x="${p.x - nodeW / 2}" y="${p.y - nodeH / 2}" width="${nodeW}" height="${nodeH}"
              fill="${fill}" stroke="#121212" stroke-width="2.5" rx="2"
              ${isCurrent ? 'filter="url(#glow)"' : ''} />
        <text x="${p.x}" y="${p.y + 1}" text-anchor="middle" dominant-baseline="middle"
              fill="${textFill}" font-size="11" font-weight="800" font-family="Syne, sans-serif"
              letter-spacing="0.5">${p.short}</text>
        <text x="${p.x}" y="${p.y + nodeH / 2 + 12}" text-anchor="middle"
              fill="${labelTextColor}" font-size="8" font-weight="600"
              font-family="Space Grotesk, sans-serif" opacity="0.9">${p.label}</text>
        ${result ? `<text x="${p.x}" y="${p.y - nodeH / 2 - 5}" text-anchor="middle"
              fill="#FF6B35" font-size="8" font-weight="700"
              font-family="Space Grotesk, sans-serif">${result}</text>` : ''}
      </g>
    `;
  }).join('');

  const traceLines = VEE_PAIRS.map((pair, i) => {
    const leftNode = phases[i];
    const rightNode = phases[5 - i];
    const x1 = leftNode.x + nodeW / 2 + 4;
    const x2 = rightNode.x - nodeW / 2 - 4;
    const y = leftNode.y;
    const midX = (x1 + x2) / 2;
    return `
      <line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"
            stroke="#A7C4B5" stroke-width="1" stroke-dasharray="4,4" opacity="0.5" />
      <text x="${midX}" y="${y - 5}" text-anchor="middle"
            fill="#A7C4B5" font-size="7" font-weight="500"
            font-family="Space Grotesk, sans-serif" opacity="0.6">${pair.trace}</text>
    `;
  }).join('');

  const implStateClass = getImplState(completedChapterIds);
  const implFill = stateColors[implStateClass] || '#2D6A4F';
  const implTextFill = stateTextColors[implStateClass] || '#A7C4B5';

  return `
    <div class="vee-container">
      <div class="eyebrow">Vee Lifecycle Position</div>
      <svg class="vee-svg" viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="xMidYMid meet" width="100%">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <text x="80" y="32" text-anchor="start" fill="#A7C4B5" font-size="8.5"
              font-weight="700" font-family="Syne, sans-serif" letter-spacing="1.2">DECOMPOSITION ▼</text>
        <text x="460" y="32" text-anchor="end" fill="#A7C4B5" font-size="8.5"
              font-weight="700" font-family="Syne, sans-serif" letter-spacing="1.2">▲ INTEGRATION</text>
        <path d="${vPath}" fill="none" stroke="#121212" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
        <path d="${vPath}" fill="none" stroke="#40916C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" opacity="0.5" />
        ${traceLines}
        <rect x="${implX - nodeW / 2 - 4}" y="${implY - nodeH / 2 - 4}" width="${nodeW + 8}" height="${nodeH + 8}"
              fill="${implFill}" stroke="#121212" stroke-width="2.5" rx="2" />
        <text x="${implX}" y="${implY + 1}" text-anchor="middle" dominant-baseline="middle"
              fill="${implTextFill}" font-size="10" font-weight="800"
              font-family="Syne, sans-serif" letter-spacing="0.5">IMPL</text>
        <text x="${implX}" y="${implY + nodeH / 2 + 12}" text-anchor="middle"
              fill="${labelTextColor}" font-size="8" font-weight="600"
              font-family="Space Grotesk, sans-serif" opacity="0.9">Implementation</text>
        ${nodeSvgs}
      </svg>
    </div>
  `;
}

function buildProjectHealth(state: { metrics: MetricState; completedChapterIds: string[]; chapterResults: Record<string, ChapterResult> }): string {
  const completedCount = state.completedChapterIds.length;
  const totalChapters = 7;

  const ratings = state.completedChapterIds.map(id => state.chapterResults[id]?.rating).filter(Boolean) as string[];
  const excellentCount = ratings.filter(r => r === 'Excellent').length;
  const fragileCount = ratings.filter(r => r === 'Fragile' || r === 'At Risk').length;

  const avgMetric = METRIC_KEYS.reduce((sum, key) => sum + state.metrics[key], 0) / METRIC_KEYS.length;
  const healthPct = Math.round(avgMetric);

  let healthLabel = 'Critical';
  let healthClass = 'health-critical';
  if (healthPct >= 70) { healthLabel = 'Strong'; healthClass = 'health-strong'; }
  else if (healthPct >= 50) { healthLabel = 'Moderate'; healthClass = 'health-moderate'; }
  else if (healthPct >= 35) { healthLabel = 'Caution'; healthClass = 'health-caution'; }

  const progressPct = Math.round((completedCount / totalChapters) * 100);

  return `
    <div class="health-container">
      <div class="eyebrow">Project Health</div>
      <div class="health-overview">
        <div class="health-gauge ${healthClass}">
          <span class="health-value">${healthPct}</span>
          <span class="health-unit">/100</span>
        </div>
        <div class="health-details">
          <span class="health-label ${healthClass}">${healthLabel}</span>
          <span class="health-stat">${completedCount}/${totalChapters} chapters complete</span>
          <span class="health-stat">${excellentCount} excellent, ${fragileCount} at risk</span>
        </div>
      </div>
      <div class="health-bar-track">
        <div class="health-bar-fill" style="width:${progressPct}%"></div>
      </div>
      <div class="health-ratings">
        ${state.completedChapterIds.map(id => {
          const result = state.chapterResults[id];
          if (!result) return '';
          const ratingClass = result.rating === 'Excellent' ? 'rating-excellent' :
            result.rating === 'Stable' ? 'rating-stable' :
            result.rating === 'Fragile' ? 'rating-fragile' : 'rating-atrisk';
          return `<span class="health-rating-chip ${ratingClass}">${result.rating}</span>`;
        }).join('')}
      </div>
    </div>
  `;
}

function buildSparklineSVG(values: number[], color: string): string {
  const svgW = 180;
  const svgH = 48;
  const padding = 6;
  const maxVal = Math.max(...values, 1);
  const minVal = Math.min(...values, 0);
  const range = maxVal - minVal || 1;

  const points = values.map((val, i) => {
    const x = padding + (i / Math.max(values.length - 1, 1)) * (svgW - padding * 2);
    const y = svgH - padding - ((val - minVal) / range) * (svgH - padding * 2);
    return `${x},${y}`;
  });

  const linePoints = points.join(' ');
  const areaPoints = `${padding},${svgH - padding} ${linePoints} ${svgW - padding},${svgH - padding}`;

  return `
    <svg viewBox="0 0 ${svgW} ${svgH}" preserveAspectRatio="none" width="100%" height="100%">
      <polygon points="${areaPoints}" fill="${color}" fill-opacity="0.15" />
      <polyline points="${linePoints}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      ${values.map((val, i) => {
        const x = padding + (i / Math.max(values.length - 1, 1)) * (svgW - padding * 2);
        const y = svgH - padding - ((val - minVal) / range) * (svgH - padding * 2);
        return `<circle cx="${x}" cy="${y}" r="3.5" fill="${color}" />`;
      }).join('')}
    </svg>
  `;
}

function buildMetricStripWithTooltips(baselineMetrics: MetricState, currentMetrics: MetricState, chapterResults: Record<string, ChapterResult>, completedChapterIds: string[]): string {
  const sortedIds = [...completedChapterIds].sort((a, b) => {
    const ra = chapterResults[a];
    const rb = chapterResults[b];
    if (!ra || !rb) return 0;
    return new Date(ra.completedAt).getTime() - new Date(rb.completedAt).getTime();
  });

  const chips = METRIC_KEYS.map(key => {
    const values: number[] = [baselineMetrics[key]];
    for (const id of sortedIds) {
      const result = chapterResults[id];
      if (result) values.push(result.finalMetrics[key]);
    }
    values.push(currentMetrics[key]);

    const delta = currentMetrics[key] - baselineMetrics[key];
    const deltaSign = delta > 0 ? '+' : '';
    const deltaClass = key === 'risk_exposure'
      ? (delta < 0 ? 'metric-delta-positive' : delta > 0 ? 'metric-delta-negative' : 'metric-delta-neutral')
      : (delta > 0 ? 'metric-delta-positive' : delta < 0 ? 'metric-delta-negative' : 'metric-delta-neutral');

    const sparkline = buildSparklineSVG(values, METRIC_COLORS[key]);
    const historyRows = values.map((val, i) => {
      const label = i === 0 ? 'Baseline' : i === values.length - 1 ? 'Current' : `Ch.${i}`;
      return `<div class="tooltip-history-row"><span class="tooltip-history-label">${label}</span><span class="tooltip-history-value">${val}</span></div>`;
    }).join('');

    return `
      <div class="metric-chip metric-tooltip-trigger" data-metric="${key}">
        <span class="metric-label">${METRIC_LABELS[key]}</span>
        <span class="metric-value">${currentMetrics[key]}</span>
        <span class="metric-delta ${deltaClass}">${deltaSign}${delta}</span>
        <div class="metric-tooltip">
          <div class="tooltip-header">
            <span class="tooltip-title" style="color:${METRIC_COLORS[key]}">${METRIC_LABELS[key]}</span>
            <span class="tooltip-current">${currentMetrics[key]}</span>
          </div>
          <div class="tooltip-description">${METRIC_DESCRIPTIONS[key]}</div>
          <div class="tooltip-sparkline">${sparkline}</div>
          <div class="tooltip-history">${historyRows}</div>
        </div>
      </div>
    `;
  });

  return `<div class="metric-strip">${chips.join('')}</div>`;
}

export class OperationsMapScene extends Phaser.Scene {
  private gameManager!: GameManager;
  private levelManager!: LevelManager;
  private audioManager!: AudioManager | null;
  private ui!: UiLayer;

  constructor() {
    super({ key: 'OperationsMapScene' });
  }

  create(): void {
    this.gameManager = GameManager.getInstance();
    this.levelManager = LevelManager.getInstance();
    this.audioManager = AudioManager.fromRegistry(this);

    ProceduralBG.drawOperationsMap(this, this.scale.width, this.scale.height);

    this.ui = new UiLayer('operations-map');
    this.render();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.ui.destroy());
    TransitionManager.fadeIn(this, 250);
  }

  private render(): void {
    const manifest = this.levelManager.getManifest();
    const state = this.gameManager.getState();
    const chapters = this.gameManager.getAvailableChapters();
    const activeMission = this.gameManager.getActiveMission();

    const chapterCards = chapters.map((entry) => {
      const chapter = entry.chapter;
      if (!chapter) return '';
      const buttonLabel = entry.completed ? 'Replay Chapter' : entry.active ? 'Resume Mission' : 'Open Chapter';
      const statusText = entry.completed ? resultLabel(entry.result?.rating) : !entry.unlocked ? 'Locked' : 'Unlocked';
      return `
        <article class="chapter-card ${!entry.unlocked ? 'locked' : ''} ${entry.active ? 'active' : ''}">
          <div class="card-topline">
            <div>
              <div class="eyebrow">${chapter.pillar}</div>
              <h4>${chapter.brief.title}</h4>
            </div>
            <span class="chip">${statusText}</span>
          </div>
          <p class="card-copy">${chapter.brief.objective}</p>
          <div class="chip-row">
            <span class="chip">${chapter.mapLabel}</span>
            <span class="chip">${chapter.thumbnail}</span>
          </div>
          <div class="card-actions">
            <button class="button ${!entry.unlocked ? 'button-secondary' : 'button-primary'} js-open-chapter" data-chapter-id="${chapter.id}" ${!entry.unlocked ? 'disabled' : ''}>${buttonLabel}</button>
          </div>
        </article>
      `;
    }).join('');

    const veeDiagram = buildVeeDiagram(state.completedChapterIds, state.currentChapterId, state.chapterResults);
    const projectHealth = buildProjectHealth(state);
    const metricStrip = buildMetricStripWithTooltips(manifest.baselineMetrics, state.metrics, state.chapterResults, state.completedChapterIds);

    this.ui.render(`
      <div class="screen-shell map-layout">
        <section class="map-rail panel">
          <div class="eyebrow">Operations map</div>
          <h1 class="section-title">${manifest.programTitle}</h1>
          <p class="body-copy">Seven chapters. One rail modernization program. Each completed chapter changes the campaign state you carry into the next decision space.</p>
          ${metricStrip}
          ${veeDiagram}
          ${projectHealth}
          <div class="signal-card">
            <h4>Program posture</h4>
            <p class="signal-copy">${activeMission ? `Mission in progress: ${this.levelManager.getChapterById(activeMission.chapterId)?.brief.title ?? 'Unknown chapter'}.` : 'No mission active. Choose the next chapter to brief, decide, and debrief.'}</p>
          </div>
          <div class="hero-actions">
            <button class="button button-secondary js-title">Back to Title</button>
            ${activeMission ? '<button class="button button-primary js-resume">Resume Active Mission</button>' : ''}
          </div>
        </section>
        <aside class="panel mission-drawer">
          <div class="eyebrow">Chapter queue</div>
          <div class="chapter-list">${chapterCards}</div>
        </aside>
      </div>
    `);

    this.ui.on('click', '.js-open-chapter', (target) => {
      const chapterId = target.dataset.chapterId;
      if (!chapterId) return;
      this.audioManager?.playSFX('sfx-click');
      this.gameManager.startChapter(chapterId);
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('MissionScene', { chapterId });
      });
    });

    this.ui.on('click', '.js-resume', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('MissionScene');
      });
    });

    this.ui.on('click', '.js-title', () => {
      this.audioManager?.playSFX('sfx-click');
      TransitionManager.fadeOut(this, 250, () => {
        this.scene.start('TitleScene');
      });
    });
  }
}
