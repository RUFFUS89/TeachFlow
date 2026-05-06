export function formatScore(value: number | null | undefined, max?: number): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  if (max !== undefined && Number.isFinite(max)) {
    return `${rounded} / ${max}`;
  }
  return `${rounded}`;
}
