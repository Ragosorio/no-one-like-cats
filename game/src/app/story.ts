/** Story / onboarding orchestration (owned by the story module). Placeholder until implemented. */
import type { BootInfo } from '../state';
import { goIsland } from './flow';

export async function maybeIntro(_info: BootInfo) {
  await goIsland();
}
