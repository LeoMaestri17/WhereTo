/** Money formatting. Ranges, never point estimates — a single number is the thing this app exists to stop people trusting. */

export function formatMoney(value: number): string {
  return `$${Math.round(value).toLocaleString('en-US')}`;
}

export function formatRange(min: number, max: number): string {
  if (min === max) return formatMoney(min);
  if (min === 0 && max === 0) return 'Free';
  return `${formatMoney(min)}–${formatMoney(max)}`;
}
