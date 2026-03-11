export const shouldRenderOptionalChild = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  return Boolean(value);
};