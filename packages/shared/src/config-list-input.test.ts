import { describe, expect, it } from 'vitest';
import { formatConfigListInput, parseConfigListInput, sanitizeConfigStringList } from './config-list-input';

describe('config list input helpers', () => {
  it('parses comma and newline separated values by default', () => {
    expect(parseConfigListInput('one, two\nthree\n\n four ')).toEqual(['one', 'two', 'three', 'four']);
  });

  it('can preserve duplicate values when requested by existing config screens', () => {
    expect(parseConfigListInput('one, one')).toEqual(['one', 'one']);
  });

  it('can dedupe values for operator allowlists', () => {
    expect(parseConfigListInput('one, one\ntwo', { unique: true })).toEqual(['one', 'two']);
  });

  it('can restrict parsing to comma separated values', () => {
    expect(parseConfigListInput('one\ntwo,three', { separator: 'comma' })).toEqual(['one\ntwo', 'three']);
  });

  it('formats comma-separated values by default', () => {
    expect(formatConfigListInput([' one ', '', 'two'])).toBe('one, two');
  });

  it('formats newline-separated values for textarea drafts', () => {
    expect(formatConfigListInput(['one', 'two'], { separator: 'newline' })).toBe('one\ntwo');
  });

  it('sanitizes unknown list values for config persistence and access checks', () => {
    expect(sanitizeConfigStringList([' one ', '', 3, 'two', 'one', null])).toEqual(['one', 'two']);
  });
});
