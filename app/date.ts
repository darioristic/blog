const MONTHS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
];

/**
 * Posts carry human dates ("June 1, 2026", "Nov 10, 2014"). Parse them in UTC —
 * `new Date(...)` would read them as local midnight and shift the day for
 * anyone east of Greenwich, which shows up in sitemaps and structured data.
 */
export function toISODate(date: string): string {
  const match = date.match(/^(\w+)\s+(\d{1,2}),\s*(\d{4})$/);
  if (match == null) return date;

  const month = MONTHS.indexOf(match[1].slice(0, 3).toLowerCase());
  if (month === -1) return date;

  const day = match[2].padStart(2, "0");
  return `${match[3]}-${String(month + 1).padStart(2, "0")}-${day}`;
}

export function year(date: string): string | undefined {
  return date.match(/\d{4}/)?.[0];
}
