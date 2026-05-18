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

export interface EpisodeSummary {
  id: string;
  format: 'lab' | 'campaign';
  code: string;
  title: string;
  subtitle: string;
  scenario: string;
  audience: string;
  difficulty: string;
  duration: string;
  status: 'available' | 'coming-soon';
  routeLabel: string;
  accentColor: string;
  heroImage: string;
  overview: string;
  learningMode: string;
  bestFor: string;
  prerequisite: string;
  nextEpisodeId?: string;
  outcomes: string[];
  standards: StandardReference[];
}

export type EpisodeManifest = EpisodeSummary;

export interface EpisodeCatalog {
  platformTitle: string;
  platformSubtitle: string;
  publicUrl: string;
  episodes: EpisodeSummary[];
}

export interface CoffeeLabReference {
  label: string;
  url: string;
  note: string;
}

export interface CoffeeLabTerm {
  term: string;
  plain: string;
  example: string;
}

export interface CoffeeLabPractice {
  title: string;
  activityType: 'sort' | 'rewrite' | 'allocate' | 'inspect' | 'sequence' | 'audit' | 'triage' | 'recommend';
  why: string;
  prompt: string;
  steps: string[];
  checklist: string[];
  artifact: string;
}

export type PracticeActivity = CoffeeLabPractice;

export interface CoffeeLabUnit {
  id: string;
  order: number;
  cluster: string;
  title: string;
  plainQuestion: string;
  lifecycleFocus: string;
  diagram: 'lifecycle' | 'boundary' | 'trace' | 'requirements' | 'architecture' | 'analysis' | 'rams' | 'implementation' | 'integration' | 'proof' | 'operate' | 'gate' | 'retirement';
  processes: string[];
  supportingPractices: string[];
  learningGoal: string;
  story: string;
  concept: string;
  keyActivities: string[];
  keyConsiderations: string[];
  artifacts: string[];
  terms: CoffeeLabTerm[];
  practice: CoffeeLabPractice;
  references: CoffeeLabReference[];
}

export interface CoffeeLabCourse {
  id: string;
  title: string;
  subtitle: string;
  overview: string;
  role: string;
  duration: string;
  finalOutcome: string;
  units: CoffeeLabUnit[];
}

export interface CoffeeLabProgressState {
  version: number;
  courseId: string;
  currentUnitId: string;
  visitedUnitIds: string[];
  completedUnitIds: string[];
  artifactNotes: Record<string, string>;
  updatedAt: string;
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

export interface CampaignImages {
  title: string;
  map: string;
  missionAnchor: string;
  debriefReadiness: string;
}

export interface CampaignManifest {
  programTitle: string;
  programSubtitle: string;
  playerRole: string;
  programSummary: string;
  images?: Partial<CampaignImages>;
  baselineMetrics: MetricState;
  chapters: CampaignChapter[];
}

export interface LearnerProgress {
  version: number;
  activeEpisodeId: string;
  coffeeLab: CoffeeLabProgressState;
  campaign: CampaignState;
  examResults: Record<string, ExamResult>;
  updatedAt: string;
}

export interface AssetManifestEntry {
  key: string;
  path: string;
  fallbackPath: string;
  width: number;
  height: number;
  priority: 'critical' | 'standard';
}

export interface AssetManifest {
  version: number;
  assets: AssetManifestEntry[];
}

export type VeePhase =
  | 'frame'
  | 'requirements'
  | 'architecture'
  | 'realize'
  | 'integrate'
  | 'verify'
  | 'validate';

export interface VeeModelNode {
  chapterId: string;
  phase: VeePhase;
  label: string;
  concept: string;
  learnerQuestion: string;
  x: number;
  y: number;
  evidenceLinkIds: string[];
}

export interface ExamTask {
  id: string;
  type: 'trace' | 'classify' | 'triage' | 'recommend';
  prompt: string;
  options: string[];
  correct: string[];
  feedback: string;
}

export interface ExamManifest {
  id: string;
  episodeId: string;
  title: string;
  scenario: string;
  passingScore: number;
  tasks: ExamTask[];
}

export interface ExamResult {
  examId: string;
  score: number;
  passed: boolean;
  completedAt: string;
  responses: Record<string, string>;
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
  episodeId: string;
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
