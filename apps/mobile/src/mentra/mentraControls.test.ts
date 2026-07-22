import { describe, expect, it } from 'vitest';
import { resolveMentraTouchAction } from './mentraControls';

describe('resolveMentraTouchAction', () => {
  it('maps hands-free taps to wake, sleep, and deferred sleep', () => {
    expect(resolveMentraTouchAction({ gestureName: 'single_tap', handsFree: true, handsFreePhase: 'sleeping', capturing: false })).toBe('wake');
    expect(resolveMentraTouchAction({ gestureName: 'single_tap', handsFree: true, handsFreePhase: 'listening', capturing: true })).toBe('sleep');
    expect(resolveMentraTouchAction({ gestureName: 'single_tap', handsFree: true, handsFreePhase: 'speaking', capturing: false })).toBe('sleep-after-turn');
  });

  it('uses tap-to-start and tap-to-finish outside hands-free mode', () => {
    expect(resolveMentraTouchAction({ gestureName: 'single_tap', handsFree: false, handsFreePhase: 'sleeping', capturing: false })).toBe('start-capture');
    expect(resolveMentraTouchAction({ gestureName: 'single_tap', handsFree: false, handsFreePhase: 'sleeping', capturing: true })).toBe('finish-capture');
  });

  it('reserves long press for stop and ignores unsupported gestures', () => {
    expect(resolveMentraTouchAction({ gestureName: 'long_press', handsFree: true, handsFreePhase: 'listening', capturing: true })).toBe('stop');
    expect(resolveMentraTouchAction({ gestureName: 'forward', handsFree: true, handsFreePhase: 'listening', capturing: true })).toBe('none');
  });
});
