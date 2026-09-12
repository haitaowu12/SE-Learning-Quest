/** Original scenario content. Process names are identifiers, never licensed source excerpts. */
export type Skill = 'empathy' | 'analysis' | 'craft' | 'assurance' | 'stewardship';
export type Quality = 'strong' | 'mixed' | 'weak';
export type Metric = 'trust' | 'resilience' | 'supplies';
export type Condition = { flag: string; value: string };
export interface Choice {
  id: string;
  label: string;
  reply: string;
  feedback: string;
  tradeoff: string;
  quality: Quality;
  effects: Partial<Record<Metric, number>>;
  flag?: { key: string; value: string };
}
export interface Decision {
  id: string;
  prompt: string;
  context: string;
  when?: Condition;
  options: Choice[];
}
export interface PuzzleItem { id: string; label: string; detail?: string }
export interface Puzzle {
  id: string;
  kind: 'select' | 'match' | 'order' | 'trade';
  title: string;
  prompt: string;
  hint: string;
  success: string;
  failure: string;
  items: PuzzleItem[];
  /** select/order: item ids. match: item id -> category id. trade: one item id. */
  solution: string[] | Record<string, string>;
  categories?: PuzzleItem[];
  /** Trade matrix values are benefits: higher is better, with stated weights. */
  criteria?: { id: string; label: string; weight: number }[];
  scores?: Record<string, Record<string, number>>;
}
export interface Quest {
  id: string;
  act: number;
  title: string;
  location: string;
  speaker: string;
  brief: string;
  objective: string;
  prerequisites: string[];
  processes: string[];
  concepts: string[];
  skill: Skill;
  hint: string;
  /** Previously earned artifacts explicitly brought back into this challenge. */
  revisits: string[];
  echoes?: { when: Condition; text: string }[];
  decisions: Decision[];
  puzzle?: Puzzle;
  artifact: { id: string; title: string; body: string };
  reward: { name: string; description: string };
  conclusion: string;
}
export interface Concept { id: string; title: string; explanation: string; example: string; source: 'iso' | 'handbook' | 'sebok' }
export interface QuestRecord {
  decisions: Record<string, string>;
  puzzleAnswer: string[] | Record<string, string> | null;
  attempts: number;
  assisted: boolean;
  completed: boolean;
}
export interface Settings { textScale: 1 | 1.25 | 1.5 | 2; reducedMotion: boolean; highContrast: boolean }
export interface Save {
  version: 1;
  campaign: 'asterfall';
  contentVersion: 1;
  player: { name: string; origin: Skill };
  onboarded: boolean;
  activeQuestId: string | null;
  records: Record<string, QuestRecord>;
  talents: Skill[];
  settings: Settings;
}
export interface Derived {
  xp: number;
  level: number;
  skills: Record<Skill, number>;
  metrics: Record<Metric, number>;
  flags: Record<string, string>;
  completed: string[];
  unlocked: string[];
  concepts: string[];
  badges: string[];
  talentPoints: number;
}
