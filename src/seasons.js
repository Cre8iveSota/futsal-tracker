// シーズン境界のロジック。
//
// LINEノートの実データから逆算すると、実際の区切りは
//   Season1: 2025-08-01 〜 2025-11-30
//   Season2: 2025-12-01 〜 2026-03-31
//   Season3: 2026-04-01 〜 2026-07-31
//   Season4: 2026-08-01 〜（進行中）
// という4か月区切りの繰り返しで、1年(12か月)に3シーズンという計算になる
// (「1年で4シーズン」という説明とはズレがある可能性あり。3か月区切りの
// 本来の四半期制に変えたい場合は SEASON_LENGTH_MONTHS を 3 にして
// EPOCH_* を実際のSeason1開始日に合わせて調整してください)。
const EPOCH_YEAR = 2025;
const EPOCH_MONTH_INDEX = 7; // 8月 (0始まりで1月=0)
export const SEASON_LENGTH_MONTHS = 4;

function monthIndexOf(date) {
  return date.getFullYear() * 12 + date.getMonth();
}

function epochMonthIndex() {
  return EPOCH_YEAR * 12 + EPOCH_MONTH_INDEX;
}

export function seasonNumberForDate(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  const diff = monthIndexOf(d) - epochMonthIndex();
  return Math.floor(diff / SEASON_LENGTH_MONTHS) + 1;
}

export function seasonRange(seasonNumber) {
  const startIdx = epochMonthIndex() + (seasonNumber - 1) * SEASON_LENGTH_MONTHS;
  const startYear = Math.floor(startIdx / 12);
  const startMonth = ((startIdx % 12) + 12) % 12;
  const endIdx = startIdx + SEASON_LENGTH_MONTHS;
  const endYear = Math.floor(endIdx / 12);
  const endMonth = ((endIdx % 12) + 12) % 12;
  const start = new Date(startYear, startMonth, 1);
  const end = new Date(endYear, endMonth, 1);
  end.setDate(end.getDate() - 1);
  return { start, end };
}

export function formatSeasonRange(seasonNumber) {
  const { start, end } = seasonRange(seasonNumber);
  const fmt = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(start)} 〜 ${fmt(end)}`;
}
