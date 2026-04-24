export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export type MetricKey =
  | 'system_quality'
  | 'stakeholder_trust'
  | 'risk_exposure'
  | 'delivery_confidence'
  | 'team_capacity';

export interface MetricState {
  system_quality: number;
  stakeholder_trust: number;
  risk_exposure: number;
  delivery_confidence: number;
  team_capacity: number;
}

export type MetricDelta = Partial<Record<MetricKey, number>>;

export interface StandardReference {
  framework: string;
  citation: string;
  rationale: string;
}

export interface JournalReference {
  title: string;
  summary: string;
  standards: StandardReference[];
}

export interface MissionBrief {
  title: string;
  location: string;
  objective: string;
  situation: string;
  stakeholders: string[];
  successSignals: string[];
  prepNotes: string[];
  journal: JournalReference[];
}

export interface ConsequencePayload {
  summary: string;
  metrics: MetricDelta;
  unlock_note?: string;
  set_condition?: string;
  trigger_subgame?: boolean;
  chapter_outcome_tag?: string;
  critical_flag?: string;
}

export interface DecisionOption {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  consequence: ConsequencePayload;
}

export interface DecisionCard {
  id: string;
  label: string;
  prompt: string;
  context: string;
  options: DecisionOption[];
}

export interface PrioritySubgameOption {
  id: string;
  label: string;
  detail: string;
}

export interface MatchSubgamePair {
  left: string;
  right: string;
}

export interface TriageSubgameRisk {
  id: string;
  label: string;
  detail: string;
}

export interface TriageCategory {
  id: string;
  label: string;
}

export interface SubgameBase {
  id: string;
  type: 'priority' | 'match' | 'sequence' | 'triage';
  title: string;
  prompt: string;
  instructions: string;
  successSummary: string;
  failureSummary: string;
  successMetricImpact: MetricDelta;
  failureMetricImpact: MetricDelta;
}

export interface PrioritySubgameSpec extends SubgameBase {
  type: 'priority';
  maxSelections: number;
  options: PrioritySubgameOption[];
  correctIds: string[];
}

export interface MatchSubgameSpec extends SubgameBase {
  type: 'match';
  leftLabel: string;
  rightLabel: string;
  leftItems: string[];
  rightOptions: string[];
  correctPairs: MatchSubgamePair[];
}

export interface SequenceSubgameSpec extends SubgameBase {
  type: 'sequence';
  steps: string[];
  correctOrder: string[];
}

export interface TriageSubgameSpec extends SubgameBase {
  type: 'triage';
  categories: TriageCategory[];
  risks: TriageSubgameRisk[];
  correctAssignments: Record<string, string>;
}

export type SubgameSpec =
  | PrioritySubgameSpec
  | MatchSubgameSpec
  | SequenceSubgameSpec
  | TriageSubgameSpec;

export interface DebriefEntry {
  principle: string;
  strongSummary: string;
  weakSummary: string;
  journal: JournalReference[];
}

export interface CampaignChapter {
  id: string;
  order: number;
  pillar: string;
  themeColor: string;
  mapLabel: string;
  thumbnail: string;
  brief: MissionBrief;
  decisions: DecisionCard[];
  subgame: SubgameSpec;
  debrief: DebriefEntry;
}

export interface CampaignManifest {
  programTitle: string;
  programSubtitle: string;
  playerRole: string;
  programSummary: string;
  baselineMetrics: MetricState;
  chapters: CampaignChapter[];
}

export interface DecisionHistoryEntry {
  decisionId: string;
  optionId: string;
  optionTitle: string;
  summary: string;
  rationale: string;
  metricsApplied: MetricDelta;
  appliedAt: string;
}

export interface SubgameResult {
  subgameId: string;
  score: number;
  passed: boolean;
  summary: string;
  response: string[] | Record<string, string>;
  appliedMetrics: MetricDelta;
}

export interface MissionState {
  chapterId: string;
  startedAt: string;
  decisionIndex: number;
  metricsBefore: MetricState;
  metricsCurrent: MetricState;
  decisions: DecisionHistoryEntry[];
  conditions: string[];
  unlockedNotes: string[];
  outcomeTags: string[];
  criticalFlags: string[];
  lastConsequenceSummary: string | null;
  awaitingSubgame: boolean;
  subgameResult: SubgameResult | null;
}

export type ChapterRating = 'Excellent' | 'Stable' | 'Fragile' | 'At Risk';

export interface ChapterResult {
  chapterId: string;
  completedAt: string;
  rating: ChapterRating;
  headline: string;
  summary: string;
  principle: string;
  finalMetrics: MetricState;
  metricDelta: MetricDelta;
  decisionHistory: DecisionHistoryEntry[];
  unlockedNotes: string[];
  outcomeTags: string[];
  criticalFlags: string[];
  subgameResult: SubgameResult | null;
  standards: JournalReference[];
}

export interface ChapterProgress {
  chapterId: string;
  unlocked: boolean;
  completed: boolean;
  result: ChapterResult | null;
}

export interface CampaignState {
  playerId: string;
  startedAt: string;
  updatedAt: string;
  currentChapterId: string | null;
  unlockedChapterIds: string[];
  completedChapterIds: string[];
  metrics: MetricState;
  activeMission: MissionState | null;
  chapterResults: Record<string, ChapterResult>;
  resetNotice: string | null;
  settings: GameSettings;
}

export interface SaveLoadResult {
  state: CampaignState | null;
  resetNotice: string | null;
}
