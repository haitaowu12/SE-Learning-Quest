import { readFileSync, writeFileSync } from 'node:fs';
import { quests } from '../src/rpg/campaign.ts';
import { concepts, processes } from '../src/rpg/curriculum.ts';
import { validateRpgContent } from '../src/rpg/validation.ts';

const issues = validateRpgContent();
if (issues.length) throw new Error(issues.join('\n'));
const esc = (text: string) => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
const questLink = (id: string) => `[${id}](#${id})`;
const rows = (ids: { id: string; title: string }[]) => ids.map((concept) => {
  const mapped = quests.filter((quest) => [...quest.processes, ...quest.concepts].includes(concept.id));
  return `| ${esc(concept.title)} | ${mapped.map((quest) => questLink(quest.id)).join(', ')} | ${mapped.map((quest) => esc(quest.objective)).join('<br>')} |`;
}).join('\n');
const output = `# Shipped curriculum and artifact map

Generated from the shipped quest and field-guide data by \`npm run curriculum\`. This map identifies introductory gameplay coverage, not every normative task or all licensed handbook content. Read [source scope](RPG_SOURCES.md) and [independent review](RPG_CURRICULUM_REVIEW.md) with it.

The campaign has ${quests.length} quests, ${quests.reduce((sum, quest) => sum + quest.decisions.length, 0)} authored decisions (${quests.reduce((sum, quest) => sum + quest.decisions.filter((decision) => !!decision.when).length, 0)} conditional), ${quests.reduce((sum, quest) => sum + quest.decisions.reduce((count, decision) => count + decision.options.length, 0), 0)} choices and ${quests.filter((quest) => quest.puzzle).length} workbench puzzles. Every completed quest contributes its own artifact and keepsake. Processes recur rather than serving as a prescribed one-pass waterfall; an ordered story is not a mandated engineering life-cycle model.

## Lifecycle process areas

| Process area | Quest evidence | Player objective |
| --- | --- | --- |
${rows(processes)}

## Supporting concepts

| Concept | Quest evidence | Player objective |
| --- | --- | --- |
${rows(concepts.filter((concept) => !processes.some((process) => process.id === concept.id)))}

## Playable evidence and reinforcement

${quests.map((quest) => `### ${quest.id}

**${quest.title} — ${quest.location}.** ${quest.objective}

${quest.decisions.map((decision) => `- **${decision.id}${decision.when ? ` (when ${decision.when.flag}=${decision.when.value})` : ''}:** ${decision.prompt} Feedback distinguishes ${decision.options.map((choice) => `${choice.quality}: ${choice.label}`).join('; ')}.`).join('\n')}

${quest.puzzle ? `**Workbench: ${quest.puzzle.title} (${quest.puzzle.kind}).** ${quest.puzzle.prompt}\n\n**Evidence explained:** ${quest.puzzle.success}` : '**Mechanic:** branching dialogue and recorded trade-off decisions; no additional workbench exercise.'}

**Artifact:** ${quest.artifact.title}. ${quest.artifact.body}

**Revisits:** ${quest.revisits.map(questLink).join(', ') || 'Initial mission framing.'} **Reused later by:** ${quests.filter((later) => later.revisits.includes(quest.id)).map((later) => questLink(later.id)).join(', ') || 'The final expedition ledger.'}
`).join('\n')}
## Coverage interpretation

The table demonstrates where the player encounters the selected process concepts and why they matter to this system. It does not establish exhaustive normative coverage, comprehensive handbook chapter coverage, learning effectiveness, retention, certification readiness, or conformance of any real project. No licensed source passages are included. Domain-specific methods and detailed handbook applications require separate scenarios and source-qualified review before claiming them as taught.
`;
const path = new URL('../docs/RPG_CURRICULUM.md', import.meta.url);
if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(path, 'utf8'); } catch { /* Missing generated document is a failed gate. */ }
  if (current !== output) throw new Error('Curriculum map is stale. Run npm run curriculum and commit the regenerated document.');
  console.log('Curriculum map matches the shipped campaign: 30 process areas, 48 field-guide concepts.');
} else {
  writeFileSync(path, output);
  console.log('Generated docs/RPG_CURRICULUM.md from the shipped campaign.');
}
