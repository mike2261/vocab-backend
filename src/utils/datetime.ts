export function normalizeUtcTimestamp(value: string | null | undefined) {
  if (!value) return value ?? null;

  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
    return `${value.replace(" ", "T")}Z`;
  }

  return value;
}
