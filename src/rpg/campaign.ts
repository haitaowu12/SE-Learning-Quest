import { questsOne } from './quests-one.ts';
import { questsTwo } from './quests-two.ts';
import type { Quest } from './types.ts';

export const quests: Quest[] = [...questsOne, ...questsTwo];
export const questById = new Map(quests.map((quest) => [quest.id, quest]));
