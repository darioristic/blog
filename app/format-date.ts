// Formats a parseable date string (e.g. "June 1, 2026") as DD.MM.YYYY for display.
// The stored dates stay in English so new Date() parsing keeps working everywhere
// (URLs, sitemap, time-ago, structured data); only the rendered output changes.
export function formatDate(date: string): string {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}
