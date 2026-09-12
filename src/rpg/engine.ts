import { quests, questById } from './campaign.ts';
import { acts, badgeNames, skillNames } from './world.ts';
import type { Choice, Decision, Derived, Puzzle, Quest, QuestRecord, Save, Skill } from './types.ts';

const metrics = ['trust', 'resilience', 'supplies'] as const;
export const skills = Object.keys(skillNames) as Skill[];
const freshRecord = (): QuestRecord => ({ decisions: {}, puzzleAnswer: null, attempts: 0, assisted: false, completed: false });

export function newSave(name = 'Iona', origin: Skill = 'empathy'): Save {
  return {
    version: 1, campaign: 'asterfall', contentVersion: 1,
    player: { name: name.trim().slice(0, 24) || 'Iona', origin }, onboarded: false,
    activeQuestId: null, records: {}, talents: [],
    settings: { textScale: 1, reducedMotion: false, highContrast: false },
  };
}

function applyFlag(flags: Record<string, string>, choice: Choice | undefined): void {
  if (choice?.flag) flags[choice.flag.key] = choice.flag.value;
}

/** Resolve conditions at the point in the story where they occur, never from later flags. */
export function storyDecisions(save: Save, quest: Quest): Decision[] {
  const flags: Record<string, string> = {};
  for (const prior of quests) {
    const visible: Decision[] = [];
    for (const decision of prior.decisions) {
      if (decision.when && flags[decision.when.flag] !== decision.when.value) continue;
      visible.push(decision);
      const selected = save.records[prior.id]?.decisions[decision.id];
      applyFlag(flags, decision.options.find((option) => option.id === selected));
    }
    if (prior.id === quest.id) return visible;
  }
  return [];
}

export function flagsBefore(save: Save, quest: Quest): Record<string, string> {
  const flags: Record<string, string> = {};
  for (const prior of quests) {
    if (prior.id === quest.id) break;
    for (const decision of storyDecisions(save, prior)) {
      applyFlag(flags, decision.options.find((option) => option.id === save.records[prior.id]?.decisions[decision.id]));
    }
  }
  return flags;
}

export function derive(save: Save): Derived {
  const result: Derived = {
    xp: 0, level: 1, skills: { empathy: 0, analysis: 0, craft: 0, assurance: 0, stewardship: 0 },
    metrics: { trust: 50, resilience: 40, supplies: 65 }, flags: {}, completed: [], unlocked: [],
    concepts: [], badges: [], talentPoints: 0,
  };
  result.skills[save.player.origin] = 1;
  for (const quest of quests) {
    const record = save.records[quest.id];
    if (!record) continue;
    let decisionXp = 0;
    for (const decision of storyDecisions(save, quest)) {
      const choice = decision.options.find((option) => option.id === record.decisions[decision.id]);
      if (!choice) continue;
      applyFlag(result.flags, choice);
      for (const key of metrics) result.metrics[key] = Math.max(0, Math.min(100, result.metrics[key] + (choice.effects[key] ?? 0)));
      decisionXp += choice.quality === 'strong' ? 25 : choice.quality === 'mixed' ? 15 : 5;
    }
    if (!record.completed) continue;
    result.completed.push(quest.id);
    result.xp += 100 + decisionXp + (quest.puzzle ? (record.assisted ? 20 : 40) : 0);
    result.skills[quest.skill] += 1;
    result.concepts.push(...quest.processes, ...quest.concepts);
  }
  result.concepts = [...new Set(result.concepts)];
  result.level = 1 + Math.floor(result.xp / 400);
  result.talentPoints = Math.floor(result.level / 2) - save.talents.length;
  for (const skill of save.talents) result.skills[skill] += 2;
  result.unlocked = quests.filter((quest) => quest.prerequisites.every((id) => result.completed.includes(id))).map((quest) => quest.id);
  if (result.completed.includes('q01')) result.badges.push(badgeNames[0]);
  for (const act of acts) {
    if (quests.filter((quest) => quest.act === act.id).every((quest) => result.completed.includes(quest.id))) result.badges.push(badgeNames[act.id]);
  }
  if (Object.values(save.records).some((record) => record.completed && record.attempts > 0)) result.badges.push(badgeNames[7]);
  return result;
}

export function nextDecision(save: Save, quest: Quest): Decision | undefined {
  return storyDecisions(save, quest).find((decision) => !save.records[quest.id]?.decisions[decision.id]);
}

export function beginQuest(save: Save, questId: string): Save {
  if (!save.onboarded) throw new Error('Begin your journey before choosing a destination.');
  if (!questById.has(questId) || !derive(save).unlocked.includes(questId)) throw new Error('Complete the linked quests before travelling here.');
  const next = structuredClone(save);
  next.activeQuestId = questId;
  next.records[questId] ??= freshRecord();
  return next;
}

function active(save: Save): { quest: Quest; record: QuestRecord } {
  const quest = questById.get(save.activeQuestId ?? '');
  const record = quest && save.records[quest.id];
  if (!quest || !record) throw new Error('Choose a quest on the map first.');
  return { quest, record };
}

export function choose(save: Save, decisionId: string, choiceId: string): Save {
  const { quest, record } = active(save);
  if (record.completed) throw new Error('This quest is recorded. Start a new expedition to explore a different history.');
  const decision = nextDecision(save, quest);
  if (!decision || decision.id !== decisionId) throw new Error('Resolve the current conversation first.');
  if (!decision.options.some((option) => option.id === choiceId)) throw new Error('That choice is not part of this conversation.');
  const next = structuredClone(save);
  next.records[quest.id].decisions[decisionId] = choiceId;
  return next;
}

export function tradeTotals(puzzle: Puzzle): Record<string, number> {
  return Object.fromEntries(puzzle.items.map((item) => [item.id,
    (puzzle.criteria ?? []).reduce((sum, criterion) => sum + criterion.weight * (puzzle.scores?.[item.id]?.[criterion.id] ?? 0), 0),
  ]));
}

export function puzzlePassed(puzzle: Puzzle, answer: unknown): boolean {
  const solution = puzzle.solution;
  if (puzzle.kind === 'match') {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer) || Array.isArray(solution)) return false;
    const values = answer as Record<string, unknown>;
    return Object.keys(values).length === puzzle.items.length && puzzle.items.every((item) => values[item.id] === solution[item.id]);
  }
  if (!Array.isArray(answer) || !Array.isArray(solution) || answer.length !== solution.length || new Set(answer).size !== answer.length) return false;
  if (puzzle.kind === 'order') return answer.every((id, index) => id === solution[index]);
  return answer.every((id) => typeof id === 'string' && solution.includes(id));
}

/** Wrong/incomplete evidence is teachable; unknown identifiers or shapes are not save data. */
export function puzzleAnswerProblem(puzzle: Puzzle, answer: unknown): string | null {
  if (puzzle.kind === 'match') {
    if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return 'Matching response must connect items to categories.';
    if (Object.getPrototypeOf(answer) !== Object.prototype && Object.getPrototypeOf(answer) !== null) return 'Matching response must be a plain record.';
    for (const [id, category] of Object.entries(answer)) {
      if (!puzzle.items.some((item) => item.id === id)) return 'Matching response contains an unknown item.';
      if (typeof category !== 'string' || !puzzle.categories?.some((item) => item.id === category)) return 'Matching response contains an unknown category.';
    }
    return null;
  }
  if (!Array.isArray(answer)) return 'Bench response must be a list of items.';
  if (answer.length > puzzle.items.length || new Set(answer).size !== answer.length || answer.some((id) => typeof id !== 'string' || !puzzle.items.some((item) => item.id === id))) return 'Bench response contains duplicate or unknown items.';
  return null;
}

export function submitPuzzle(save: Save, answer: string[] | Record<string, string>, assisted = false): Save {
  const { quest, record } = active(save);
  if (!quest.puzzle || record.completed || nextDecision(save, quest)) throw new Error('Finish the conversation before working at the bench.');
  if (assisted && record.attempts < 2) throw new Error('Try the challenge twice to unlock Pip’s walkthrough.');
  const response = assisted ? quest.puzzle.solution : answer;
  const problem = puzzleAnswerProblem(quest.puzzle, response);
  if (problem) throw new Error(problem);
  const next = structuredClone(save);
  const updated = next.records[quest.id];
  updated.puzzleAnswer = structuredClone(response);
  updated.attempts = Math.min(999, updated.attempts + (puzzlePassed(quest.puzzle, updated.puzzleAnswer) ? 0 : 1));
  updated.assisted ||= assisted;
  return next;
}

export function canComplete(save: Save, quest: Quest): boolean {
  const record = save.records[quest.id];
  return !!record && !nextDecision(save, quest) && (!quest.puzzle || puzzlePassed(quest.puzzle, record.puzzleAnswer));
}

export function completeQuest(save: Save): Save {
  const { quest, record } = active(save);
  if (record.completed) return save;
  if (!canComplete(save, quest)) throw new Error('Resolve the decisions and the bench challenge before claiming this reward.');
  const next = structuredClone(save);
  next.records[quest.id].completed = true;
  return next;
}

export function retryQuest(save: Save): Save {
  const { quest, record } = active(save);
  if (record.completed) throw new Error('Completed history is fixed for this expedition.');
  const next = structuredClone(save);
  next.records[quest.id] = { ...freshRecord(), attempts: Math.min(999, record.attempts + 1) };
  return next;
}

export function train(save: Save, skill: Skill): Save {
  if (!skills.includes(skill) || derive(save).talentPoints <= 0) throw new Error('Earn another training point by levelling up.');
  return { ...structuredClone(save), talents: [...save.talents, skill] };
}

export function ending(save: Save): { title: string; text: string } | null {
  const state = derive(save);
  if (state.completed.length !== quests.length) return null;
  const choices = quests.flatMap((quest) => storyDecisions(save, quest).map((decision) => decision.options.find((option) => option.id === save.records[quest.id]?.decisions[decision.id])));
  // Context-dependent alternatives count as considered judgment, not failed answers.
  const judgment = choices.reduce((sum, choice) => sum + (choice?.quality === 'strong' ? 1 : choice?.quality === 'mixed' ? 0.6 : 0.1), 0) / choices.length;
  const result = judgment >= 0.8
    ? { title: 'A constellation, not a crown', text: 'At dusk, the keepers raise their lanterns. Sera lets you light the final one. Your ledger gives the islands a way to challenge a promise, test it, and care for it after its builders leave. Mara’s ferry sails home beneath a chain of small, stubborn lights.' }
    : judgment >= 0.45
      ? { title: 'The patient light', text: 'The relay has a future, though the ledger holds conditions and promises to revisit. You and Sera leave the citadel together to help the next crew. Mara keeps a bell on her ferry. Progress is a light tended, not a victory declared.' }
      : { title: 'A second dawn', text: 'The islands have a path forward, but too many decisions left people or evidence behind. Sera does not take away your lantern. She asks you to carry the ledger back to Lower Quay, listen, and help the communities repair what the charts missed. The next expedition begins with a better question.' };
  const governance: Record<string, string> = {
    commons: 'The public commons opens its first resident review. Its shared budget and representation will need tending as carefully as its lamps.',
    federation: 'Island councils raise their own pennants under a common warning promise. Mutual aid and shared appeals will have to bridge the spaces between them.',
    trust: 'The keeper trust begins its limited term. Sera writes the renewal date on the first page so that continuity never becomes an unexamined claim to power.',
  };
  const support: Record<string, string> = {
    public: 'The public spare pool and support rota pass to their incoming custodian, with funding and review duties attached.',
    supplier: 'The contracted support crew accepts its bounded service. Local keepers retain the records and the right to invoke another route.',
    islands: 'The first island apprentices open their ledgers. Their training and mutual-aid schedule begin the next generation of care.',
  };
  const retirement = state.flags['core-retirement'] === 'reserve'
    ? 'The cold reserve remains in the inventory, with an inspection budget and a removal condition; it has not disappeared because the ceremony is over.'
    : state.flags['core-retirement'] === 'retired'
      ? 'The old core’s service role has a recorded end; its remaining material and information obligations follow the custody decisions in your ledger.'
      : 'The last ledger still records the risk created by disconnecting before the remaining dependency was resolved. The incoming keepers inherit that repair obligation.';
  return { title: result.title, text: [result.text, governance[state.flags.governance], support[state.flags['relay-handover']], retirement].filter(Boolean).join('\n\n') };
}
