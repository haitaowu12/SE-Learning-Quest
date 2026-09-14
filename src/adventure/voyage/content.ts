import { stormglass } from './stormglass.ts';
import { field } from './field.ts';
import { service } from './service.ts';
import { inheritance } from './inheritance.ts';
export const scenes = [...stormglass, ...field, ...service, ...inheritance];
export const chapters = [
  { number: 4, region: 'stormglass', title: 'Stormglass', subtitle: 'Give the promise a working form.' },
  { number: 5, region: 'field', title: 'The watch returns', subtitle: 'Observe, accept and hand over.' },
  { number: 6, region: 'service', title: 'A changing shore', subtitle: 'Operate, repair and include new lives.' },
  { number: 7, region: 'inheritance', title: 'The next keeper', subtitle: 'Support, retire and leave a future.' },
] as const;