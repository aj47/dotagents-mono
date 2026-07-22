import type { HandsFreePhase } from '@dotagents/shared';

export type MentraControlAction =
  | 'none'
  | 'wake'
  | 'sleep'
  | 'sleep-after-turn'
  | 'stop'
  | 'start-capture'
  | 'finish-capture';

export function resolveMentraTouchAction(options: {
  gestureName: string;
  handsFree: boolean;
  handsFreePhase: HandsFreePhase;
  capturing: boolean;
}): MentraControlAction {
  if (options.gestureName === 'long_press') return 'stop';
  if (options.gestureName !== 'single_tap') return 'none';

  if (!options.handsFree) {
    return options.capturing ? 'finish-capture' : 'start-capture';
  }

  if (options.handsFreePhase === 'sleeping' || options.handsFreePhase === 'paused') {
    return 'wake';
  }
  if (options.handsFreePhase === 'processing' || options.handsFreePhase === 'speaking') {
    return 'sleep-after-turn';
  }
  return 'sleep';
}
