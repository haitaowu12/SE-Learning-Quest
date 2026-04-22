export interface PlayerProgress {
  playerId: string;
  currentModule: number;
  modulesCompleted: number[];
  totalScore: number;
  achievements: string[];
  scenarioHistory: ScenarioRecord[];
  competencyScores: Record<string, number>;
  levelScores: Record<string, number>;
  sessionStart: string;
  lastUpdated: string;
  settings: GameSettings;
}

export interface GameSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  muted: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface ScenarioRecord {
  timestamp: string;
  module: number;
  levelId: string;
  score: number;
  hintsUsed: number;
  retries: number;
}

export interface ModuleMeta {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  themeColor: string;
  icon: string;
  levels: LevelMeta[];
  locked: boolean;
  completed: boolean;
}

export interface LevelMeta {
  id: string;
  moduleId: number;
  title: string;
  type: LevelType;
  learningObjective: string;
  standardRef: StandardRef;
  scenarioText: string;
  hints: string[];
  scoringRules: ScoringRules;
  locked: boolean;
  completed: boolean;
  bestScore: number;
}

export type LevelType =
  | 'drag-drop'
  | 'quiz'
  | 'trace'
  | 'draw'
  | 'sequence'
  | 'match'
  | 'edit'
  | 'select'
  | 'build';

export interface StandardRef {
  incose?: string;
  iso15288?: string;
  en50126?: string;
}

export interface ScoringRules {
  baseScore: number;
  hintPenalty: number;
  retryPenalty: number;
  timeBonus: number;
  perfectBonus: number;
}

export interface LevelData {
  id: string;
  moduleId: number;
  title: string;
  type: LevelType;
  learningObjective: string;
  standardRef: StandardRef;
  scenarioText: string;
  contextText?: string;
  hints: string[];
  correctAnswer: unknown;
  scoringRules: ScoringRules;
  config: Record<string, unknown>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: string;
}

export interface GameState {
  progress: PlayerProgress;
  currentScene: string;
  currentModule: number | null;
  currentLevel: string | null;
}
