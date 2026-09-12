import { quests } from './campaign.ts';
import { concepts, processes } from './curriculum.ts';
import { puzzlePassed, tradeTotals } from './engine.ts';
import { cast } from './world.ts';
import type { Quest } from './types.ts';

/** Content checks fail the build gate; they do not substitute for educational review. */
export function validateRpgContent(campaign: Quest[] = quests): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  const artifacts = new Set<string>();
  const conceptIds = new Set(concepts.map((concept) => concept.id));
  const processIds = new Set(processes.map((process) => process.id));
  const flagValues = new Map<string, Set<string>>();
  const unique = (values: string[], context: string) => {
    if (new Set(values).size !== values.length) errors.push(`${context}: duplicate identifiers`);
  };
  if (campaign.length !== 24) errors.push(`Expected 24 quests; received ${campaign.length}`);
  if (processIds.size !== 30 || conceptIds.size !== 48) errors.push('Expected 30 process areas and 48 total concepts');
  for (const quest of campaign) {
    if (seen.has(quest.id)) errors.push(`${quest.id}: duplicate quest`);
    if (quest.prerequisites.some((id) => !seen.has(id))) errors.push(`${quest.id}: prerequisite missing or not in topological order`);
    if (quest.revisits.some((id) => !seen.has(id))) errors.push(`${quest.id}: artifact revisit must refer to an earlier quest`);
    if (artifacts.has(quest.artifact.id)) errors.push(`${quest.id}: duplicate artifact id`);
    artifacts.add(quest.artifact.id);
    if (!cast[quest.speaker]) errors.push(`${quest.id}: unknown speaker ${quest.speaker}`);
    if (quest.processes.some((id) => !processIds.has(id)) || quest.concepts.some((id) => !conceptIds.has(id))) errors.push(`${quest.id}: unmapped learning identifier`);
    if (!quest.processes.length || !quest.objective || !quest.artifact.body || !quest.reward.description || !quest.conclusion) errors.push(`${quest.id}: incomplete content`);
    unique(quest.decisions.map((decision) => decision.id), `${quest.id} decisions`);
    for (const echo of quest.echoes ?? []) {
      if (!flagValues.get(echo.when.flag)?.has(echo.when.value)) errors.push(`${quest.id}: echo refers to an unreachable earlier flag ${echo.when.flag}=${echo.when.value}`);
    }
    for (const decision of quest.decisions) {
      if (decision.when && !flagValues.get(decision.when.flag)?.has(decision.when.value)) errors.push(`${quest.id}/${decision.id}: branch condition cannot occur`);
      if (decision.options.length < 3) errors.push(`${quest.id}/${decision.id}: needs three considered alternatives`);
      unique(decision.options.map((choice) => choice.id), `${quest.id}/${decision.id} choices`);
      for (const choice of decision.options) {
        if (!choice.feedback || !choice.tradeoff || !choice.reply) errors.push(`${quest.id}/${decision.id}/${choice.id}: missing explanation or consequence`);
        if (Object.entries(choice.effects).some(([key, value]) => !['trust', 'resilience', 'supplies'].includes(key) || !Number.isFinite(value))) errors.push(`${quest.id}/${decision.id}: invalid effect`);
        if (choice.flag) {
          const values = flagValues.get(choice.flag.key) ?? new Set<string>();
          values.add(choice.flag.value); flagValues.set(choice.flag.key, values);
        }
      }
    }
    const puzzle = quest.puzzle;
    if (puzzle) {
      unique(puzzle.items.map((item) => item.id), `${quest.id} puzzle items`);
      if (!puzzlePassed(puzzle, puzzle.solution)) errors.push(`${quest.id}: solution does not pass its own declared contract`);
      if (Array.isArray(puzzle.solution)) {
        if (puzzle.solution.some((id) => !puzzle.items.some((item) => item.id === id))) errors.push(`${quest.id}: solution contains unknown items`);
        if (puzzle.kind === 'order' && puzzle.solution.length !== puzzle.items.length) errors.push(`${quest.id}: order puzzle omits steps`);
      } else if (puzzle.kind !== 'match' || Object.values(puzzle.solution).some((id) => !puzzle.categories?.some((category) => category.id === id))) errors.push(`${quest.id}: invalid matching categories`);
      if (puzzle.kind === 'trade') {
        if (!puzzle.criteria?.length || puzzle.criteria.some((criterion) => !Number.isFinite(criterion.weight) || criterion.weight <= 0)) errors.push(`${quest.id}: invalid trade weights`);
        for (const item of puzzle.items) {
          if (puzzle.criteria?.some((criterion) => !Number.isFinite(puzzle.scores?.[item.id]?.[criterion.id]))) errors.push(`${quest.id}: missing numeric trade cell`);
        }
        const totals = Object.entries(tradeTotals(puzzle)).sort((a, b) => b[1] - a[1]);
        if (totals.length < 2 || totals[0][1] <= totals[1][1] || !Array.isArray(puzzle.solution) || puzzle.solution.length !== 1 || puzzle.solution[0] !== totals[0][0]) errors.push(`${quest.id}: trade solution is not a unique weighted optimum`);
      }
    }
    seen.add(quest.id);
  }
  for (const process of processes) {
    if (!campaign.some((quest) => quest.processes.includes(process.id))) errors.push(`Process not embedded: ${process.title}`);
  }
  for (const concept of concepts) {
    if (!campaign.some((quest) => [...quest.processes, ...quest.concepts].includes(concept.id))) errors.push(`Concept not embedded: ${concept.title}`);
  }
  for (let act = 1; act <= 6; act++) {
    if (campaign.filter((quest) => quest.act === act).length !== 4) errors.push(`Act ${act} must contain four quests`);
  }
  return errors;
}
