export function parseVietnameseDate(value: string): Date | null {
  // Hỗ trợ: "15/05/1990", "1990-05-15", "15-05-1990"
  const formats = [
    /^(\d{2})\/(\d{2})\/(\d{4})$/,  // dd/mm/yyyy
    /^(\d{4})-(\d{2})-(\d{2})$/,    // yyyy-mm-dd
    /^(\d{2})-(\d{2})-(\d{4})$/,    // dd-mm-yyyy
  ];

  for (const fmt of formats) {
    const m = value.match(fmt);
    if (!m) continue;

    let year: number, month: number, day: number;
    if (fmt.source.startsWith('^(\\d{4})')) {
      [, year, month, day] = m.map(Number) as [string, number, number, number];
    } else {
      [, day, month, year] = m.map(Number) as [string, number, number, number];
    }

    const d = new Date(year, month - 1, day);
    if (d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day) {
      return d;
    }
  }

  return null;
}

export function isExpired(dateValue: string, gracePeriodDays = 0): boolean {
  const date = parseVietnameseDate(dateValue);
  if (!date) return false;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - gracePeriodDays);
  return date < cutoff;
}
