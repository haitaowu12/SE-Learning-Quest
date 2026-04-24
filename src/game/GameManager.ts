import type {
  CampaignChapter,
  CampaignState,
  ChapterResult,
  ConsequencePayload,
  DecisionHistoryEntry,
  MatchSubgameSpec,
  MissionState,
  PrioritySubgameSpec,
  SequenceSubgameSpec,
  SubgameResult,
  TriageSubgameSpec,
} from '../types/index.ts';
import { LevelManager } from './LevelManager.ts';
import { SaveManager } from './SaveManager.ts';
import { ScoringEngine } from './ScoringEngine.ts';
import { applyMetricDelta, createMetricSnapshot } from './metricUtils.ts';

function generatePlayerId(): string {
  return `se_ops_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRecordResponse(response: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(response).sort(([left], [right]) => left.localeCompare(right)),
  );
}

export class GameManager {
  private static instance: GameManager | null = null;
  private readonly levelManager = LevelManager.getInstance();
  private state: CampaignState;

  private constructor() {
    const loadResult = SaveManager.load();
    this.state = loadResult.state ?? SaveManager.createDefaultState(generatePlayerId(), loadResult.resetNotice);
    if (!loadResult.state) {
      this.save();
    }
  }

  static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  getState(): CampaignState {
    return this.state;
  }

  getSettings() {
    return this.state.settings;
  }

  updateSettings(settings: Partial<CampaignState['settings']>): void {
    this.state = {
      ...this.state,
      settings: { ...this.state.settings, ...settings },
    };
    this.save();
  }

  clearResetNotice(): void {
    if (!this.state.resetNotice) return;
    this.state = {
      ...this.state,
      resetNotice: null,
    };
    this.save();
  }

  getAvailableChapters() {
    return this.levelManager.getChapterProgress(this.state).map((progress) => {
      const chapter = this.levelManager.getChapterById(progress.chapterId);
      return {
        ...progress,
        chapter,
        active: this.state.currentChapterId === progress.chapterId,
      };
    });
  }

  startChapter(chapterId: string): MissionState | null {
    if (!this.levelManager.isChapterUnlocked(chapterId, this.state)) {
      return null;
    }
    if (this.state.activeMission && this.state.activeMission.chapterId === chapterId) {
      return this.state.activeMission;
    }
    const chapter = this.levelManager.getChapterById(chapterId);
    if (!chapter) return null;

    const activeMission: MissionState = {
      chapterId,
      startedAt: new Date().toISOString(),
      decisionIndex: 0,
      metricsBefore: createMetricSnapshot(this.state.metrics),
      metricsCurrent: createMetricSnapshot(this.state.metrics),
      decisions: [],
      conditions: [],
      unlockedNotes: [],
      outcomeTags: [],
      criticalFlags: [],
      lastConsequenceSummary: null,
      awaitingSubgame: false,
      subgameResult: null,
    };

    this.state = {
      ...this.state,
      currentChapterId: chapterId,
      activeMission,
    };
    this.save();
    return activeMission;
  }

  getActiveChapter(): CampaignChapter | null {
    if (!this.state.currentChapterId) return null;
    return this.levelManager.getChapterById(this.state.currentChapterId) ?? null;
  }

  getActiveMission(): MissionState | null {
    return this.state.activeMission;
  }

  chooseDecisionOption(optionId: string): MissionState | null {
    const mission = this.state.activeMission;
    const chapter = this.getActiveChapter();
    if (!mission || !chapter) return null;
    const decision = chapter.decisions[mission.decisionIndex];
    if (!decision) return mission;
    const option = decision.options.find((candidate) => candidate.id === optionId);
    if (!option) return mission;

    const nextMission = this.applyConsequence(mission, decision.id, optionId, option.title, option.summary, option.rationale, option.consequence);
    const reachedLastDecision = nextMission.decisionIndex >= chapter.decisions.length;
    nextMission.awaitingSubgame = option.consequence.trigger_subgame === true || reachedLastDecision;

    this.state = {
      ...this.state,
      activeMission: nextMission,
    };
    this.save();
    return nextMission;
  }

  private applyConsequence(
    mission: MissionState,
    decisionId: string,
    optionId: string,
    optionTitle: string,
    optionSummary: string,
    rationale: string,
    consequence: ConsequencePayload,
  ): MissionState {
    const historyEntry: DecisionHistoryEntry = {
      decisionId,
      optionId,
      optionTitle,
      summary: optionSummary,
      rationale,
      metricsApplied: consequence.metrics,
      appliedAt: new Date().toISOString(),
    };

    const nextMission: MissionState = {
      ...mission,
      decisionIndex: mission.decisionIndex + 1,
      metricsCurrent: applyMetricDelta(mission.metricsCurrent, consequence.metrics),
      decisions: mission.decisions.concat(historyEntry),
      conditions: consequence.set_condition
        ? Array.from(new Set(mission.conditions.concat(consequence.set_condition)))
        : mission.conditions.slice(),
      unlockedNotes: consequence.unlock_note
        ? mission.unlockedNotes.concat(consequence.unlock_note)
        : mission.unlockedNotes.slice(),
      outcomeTags: consequence.chapter_outcome_tag
        ? mission.outcomeTags.concat(consequence.chapter_outcome_tag)
        : mission.outcomeTags.slice(),
      criticalFlags: consequence.critical_flag
        ? mission.criticalFlags.concat(consequence.critical_flag)
        : mission.criticalFlags.slice(),
      lastConsequenceSummary: consequence.summary,
      awaitingSubgame: false,
      subgameResult: mission.subgameResult,
    };

    return nextMission;
  }

  completeSubgame(response: string[] | Record<string, string>): ChapterResult | null {
    const mission = this.state.activeMission;
    const chapter = this.getActiveChapter();
    if (!mission || !chapter) return null;

    const subgameResult = this.evaluateSubgame(chapter, response);
    const updatedMission: MissionState = {
      ...mission,
      metricsCurrent: applyMetricDelta(mission.metricsCurrent, subgameResult.appliedMetrics),
      awaitingSubgame: false,
      subgameResult,
      lastConsequenceSummary: subgameResult.summary,
    };

    const chapterResult = ScoringEngine.evaluateChapter(chapter, updatedMission);
    const nextUnlocked = this.levelManager.getNextChapterId(chapter.id);
    const unlockedChapterIds = nextUnlocked && !this.state.unlockedChapterIds.includes(nextUnlocked)
      ? this.state.unlockedChapterIds.concat(nextUnlocked)
      : this.state.unlockedChapterIds.slice();
    const completedChapterIds = this.state.completedChapterIds.includes(chapter.id)
      ? this.state.completedChapterIds.slice()
      : this.state.completedChapterIds.concat(chapter.id);

    this.state = {
      ...this.state,
      currentChapterId: chapter.id,
      unlockedChapterIds,
      completedChapterIds,
      metrics: { ...updatedMission.metricsCurrent },
      activeMission: null,
      chapterResults: {
        ...this.state.chapterResults,
        [chapter.id]: chapterResult,
      },
    };
    this.save();
    return chapterResult;
  }

  private evaluateSubgame(chapter: CampaignChapter, response: string[] | Record<string, string>): SubgameResult {
    const { subgame } = chapter;
    switch (subgame.type) {
      case 'priority':
        return this.evaluatePrioritySubgame(subgame, response);
      case 'match':
        return this.evaluateMatchSubgame(subgame, response);
      case 'sequence':
        return this.evaluateSequenceSubgame(subgame, response);
      case 'triage':
        return this.evaluateTriageSubgame(subgame, response);
    }
  }

  private evaluatePrioritySubgame(spec: PrioritySubgameSpec, response: string[] | Record<string, string>): SubgameResult {
    const selections = Array.isArray(response) ? response.slice().sort() : [];
    const correct = spec.correctIds.slice().sort();
    const score = selections.filter((selection) => correct.includes(selection)).length / correct.length;
    const passed = score >= 1;
    return {
      subgameId: spec.id,
      score,
      passed,
      summary: passed ? spec.successSummary : spec.failureSummary,
      response: selections,
      appliedMetrics: passed ? spec.successMetricImpact : spec.failureMetricImpact,
    };
  }

  private evaluateMatchSubgame(spec: MatchSubgameSpec, response: string[] | Record<string, string>): SubgameResult {
    const record = Array.isArray(response) ? {} : normalizeRecordResponse(response);
    const correctPairs = new Map(spec.correctPairs.map((pair) => [pair.left, pair.right]));
    const matches = spec.leftItems.filter((item) => record[item] === correctPairs.get(item)).length;
    const score = matches / spec.leftItems.length;
    const passed = score >= 1;
    return {
      subgameId: spec.id,
      score,
      passed,
      summary: passed ? spec.successSummary : spec.failureSummary,
      response: record,
      appliedMetrics: passed ? spec.successMetricImpact : spec.failureMetricImpact,
    };
  }

  private evaluateSequenceSubgame(spec: SequenceSubgameSpec, response: string[] | Record<string, string>): SubgameResult {
    const steps = Array.isArray(response) ? response : [];
    const matches = steps.filter((step, index) => step === spec.correctOrder[index]).length;
    const score = matches / spec.correctOrder.length;
    const passed = score >= 1;
    return {
      subgameId: spec.id,
      score,
      passed,
      summary: passed ? spec.successSummary : spec.failureSummary,
      response: steps,
      appliedMetrics: passed ? spec.successMetricImpact : spec.failureMetricImpact,
    };
  }

  private evaluateTriageSubgame(spec: TriageSubgameSpec, response: string[] | Record<string, string>): SubgameResult {
    const record = Array.isArray(response) ? {} : normalizeRecordResponse(response);
    const correctCount = spec.risks.filter((risk) => record[risk.id] === spec.correctAssignments[risk.id]).length;
    const score = correctCount / spec.risks.length;
    const passed = score >= 1;
    return {
      subgameId: spec.id,
      score,
      passed,
      summary: passed ? spec.successSummary : spec.failureSummary,
      response: record,
      appliedMetrics: passed ? spec.successMetricImpact : spec.failureMetricImpact,
    };
  }

  getChapterResult(chapterId: string): ChapterResult | null {
    return this.state.chapterResults[chapterId] ?? null;
  }

  resetCampaign(): void {
    SaveManager.reset();
    this.state = SaveManager.createDefaultState(generatePlayerId());
    this.save();
  }

  private save(): void {
    SaveManager.save(this.state);
  }
}
