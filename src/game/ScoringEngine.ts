import type { ScoringRules } from '@/types/index.ts';

const TIME_THRESHOLD_MS = 60000;

export class ScoringEngine {
  static calculateScore(
    rules: ScoringRules,
    hintsUsed: number,
    retries: number,
    elapsedMs: number,
    creditRatio: number = 1.0,
  ): number {
    const timeBonus = (elapsedMs <= TIME_THRESHOLD_MS && creditRatio >= 1.0) ? rules.timeBonus : 0;
    const perfectBonus = (hintsUsed === 0 && retries === 0 && creditRatio >= 1.0) ? rules.perfectBonus : 0;
    const score = Math.round(rules.baseScore * creditRatio)
      - (hintsUsed * rules.hintPenalty)
      - (retries * rules.retryPenalty)
      + timeBonus
      + perfectBonus;
    return Math.max(0, Math.min(score, rules.baseScore + rules.timeBonus + rules.perfectBonus));
  }
}
