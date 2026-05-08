export function toggleSetValue<TValue>(
  values: ReadonlySet<TValue>,
  value: TValue,
): Set<TValue> {
  const next = new Set(values)
  if (next.has(value)) {
    next.delete(value)
  } else {
    next.add(value)
  }
  return next
}

export function addSetValue<TValue>(
  values: ReadonlySet<TValue>,
  value: TValue,
): Set<TValue> {
  const next = new Set(values)
  next.add(value)
  return next
}

export function addSetValues<TValue>(
  values: ReadonlySet<TValue>,
  valuesToAdd: Iterable<TValue>,
): Set<TValue> {
  const next = new Set(values)
  for (const value of valuesToAdd) {
    next.add(value)
  }
  return next
}

export function removeSetValue<TValue>(
  values: ReadonlySet<TValue>,
  value: TValue,
): Set<TValue> {
  const next = new Set(values)
  next.delete(value)
  return next
}

export function removeSetValues<TValue>(
  values: ReadonlySet<TValue>,
  valuesToRemove: Iterable<TValue>,
): Set<TValue> {
  const next = new Set(values)
  for (const value of valuesToRemove) {
    next.delete(value)
  }
  return next
}

export function setSetValuePresence<TValue>(
  values: ReadonlySet<TValue>,
  value: TValue,
  isPresent: boolean,
): Set<TValue> {
  return isPresent ? addSetValue(values, value) : removeSetValue(values, value)
}

export function getVisibleSelectedValues<TValue>(
  selectedValues: Iterable<TValue>,
  visibleValues: ReadonlySet<TValue>,
): TValue[] {
  return [...selectedValues].filter((value) => visibleValues.has(value))
}
