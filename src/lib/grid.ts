// Spans for a 6-column grid that never leaves an orphan: items run in rows of
// three, and any remainder opens the grid larger (two halves, or one full row).
const SPAN = { third: 'lg:col-span-2', half: 'lg:col-span-3', full: 'lg:col-span-6' } as const;

export function gridSpans(count: number): string[] {
  const lead = count % 3;
  return Array.from({ length: count }, (_, i) => {
    if (i >= lead) return SPAN.third;
    return lead === 1 ? SPAN.full : SPAN.half;
  });
}
