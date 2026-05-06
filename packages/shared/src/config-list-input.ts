export type ConfigListInputSeparator = 'comma' | 'newline' | 'comma-or-newline';

export interface ParseConfigListInputOptions {
  separator?: ConfigListInputSeparator;
  unique?: boolean;
}

export interface FormatConfigListInputOptions {
  separator?: Exclude<ConfigListInputSeparator, 'comma-or-newline'>;
}

function getSplitPattern(separator: ConfigListInputSeparator): RegExp {
  if (separator === 'newline') return /\r?\n/;
  if (separator === 'comma') return /,/;
  return /[\n,]/;
}

function normalizeConfigListValues(values: readonly string[] = [], unique: boolean = false): string[] {
  const normalized = values.map((entry) => entry.trim()).filter(Boolean);
  return unique ? [...new Set(normalized)] : normalized;
}

export function sanitizeConfigStringList(values: readonly unknown[] = []): string[] {
  return [...new Set(
    values
      .filter((value): value is string => typeof value === 'string')
      .map((value) => value.trim())
      .filter(Boolean),
  )];
}

export function parseConfigListInput(input: string, options: ParseConfigListInputOptions = {}): string[] {
  const separator = options.separator ?? 'comma-or-newline';
  return normalizeConfigListValues(input.split(getSplitPattern(separator)), options.unique ?? false);
}

export function formatConfigListInput(values: readonly string[] | undefined, options: FormatConfigListInputOptions = {}): string {
  const separator = options.separator ?? 'comma';
  const delimiter = separator === 'newline' ? '\n' : ', ';
  return normalizeConfigListValues(values).join(delimiter);
}
