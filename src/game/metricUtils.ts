import type { MetricDelta, MetricKey, MetricState } from '../types/index.ts';
import { clamp } from '../utils/helpers.ts';

export const METRIC_KEYS: MetricKey[] = [
  'system_quality',
  'stakeholder_trust',
  'risk_exposure',
  'delivery_confidence',
  'team_capacity',
];

export function cloneMetrics(metrics: MetricState): MetricState {
  return { ...metrics };
}

export function applyMetricDelta(metrics: MetricState, delta: MetricDelta): MetricState {
  const next = cloneMetrics(metrics);
  for (const key of METRIC_KEYS) {
    const change = delta[key] ?? 0;
    next[key] = clamp(next[key] + change, 0, 100);
  }
  return next;
}

export function diffMetrics(before: MetricState, after: MetricState): MetricDelta {
  const delta: MetricDelta = {};
  for (const key of METRIC_KEYS) {
    const change = after[key] - before[key];
    if (change !== 0) {
      delta[key] = change;
    }
  }
  return delta;
}

export function createMetricSnapshot(metrics: MetricState): MetricState {
  return cloneMetrics(metrics);
}
