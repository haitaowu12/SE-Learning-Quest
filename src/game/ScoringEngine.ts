import type { ScoringRules } from '@/types/index.ts';

const TIME_THRESHOLD_MS = 60000;

export class ScoringEngine {
  static calculateScore(
    rules: ScoringRules,
    hintsUsed: number,
    retries: number,
    elapsedMs: number,
  ): number {
    const timeBonus = elapsedMs <= TIME_THRESHOLD_MS ? rules.timeBonus : 0;
    const perfectBonus = hintsUsed === 0 && retries === 0 ? rules.perfectBonus : 0;
    const score = rules.baseScore
      - (hintsUsed * rules.hintPenalty)
      - (retries * rules.retryPenalty)
      + timeBonus
      + perfectBonus;
    return Math.max(0, Math.min(score, rules.baseScore + rules.timeBonus + rules.perfectBonus));
  }
}
