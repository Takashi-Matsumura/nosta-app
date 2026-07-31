/** 中高一貫6年制。通し学年の表示名 */
const GRADE_LABELS = ["中1", "中2", "中3", "高1", "高2", "高3"] as const;

/** 日本の学年度は4月始まり */
function schoolYearOf(date: Date): number {
  return date.getMonth() + 1 >= 4 ? date.getFullYear() : date.getFullYear() - 1;
}

/** 入学年度とある時点の日付から、そのときの通し学年（1〜6）を出す */
export function gradeAt(entranceYear: number, date: Date): number {
  return schoolYearOf(date) - entranceYear + 1;
}

/** 1 → 「中1」。在籍期間の外に出た場合は年数で表す */
export function gradeLabel(grade: number): string {
  return GRADE_LABELS[grade - 1] ?? `${grade}年`;
}

/** 「2021年入学 みなも」 */
export function authorLabel(entranceYear: number, penName: string): string {
  return `${entranceYear}年入学 ${penName}`;
}

/** 「2019.05.14」——日付印のための表記 */
export function stampDate(iso: string): string {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}.${mm}.${dd}`;
}

/** 何年前に書かれたか。0 なら今年度 */
export function yearsAgo(iso: string, now: Date): number {
  return schoolYearOf(now) - schoolYearOf(new Date(iso));
}

/** 投稿から直せる期間（日） */
export const EDITABLE_DAYS = 7;

/** 日付文字列（YYYY-MM-DD）から now までの暦日の差。タイムゾーンで1日ずれないよう UTC で揃える */
function daysSince(isoDate: string, now: Date): number {
  const [y, m, d] = isoDate.split("-").map(Number);
  const posted = Date.UTC(y, m - 1, d);
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.floor((today - posted) / (1000 * 60 * 60 * 24));
}

/** 投稿から EDITABLE_DAYS 以内なら、まだ直せる */
export function isEditable(postedAt: string, now: Date): boolean {
  return daysSince(postedAt, now) <= EDITABLE_DAYS;
}

/** 直せる期限まであと何日か。「あとN日は直せます」の表示用 */
export function editableDaysLeft(postedAt: string, now: Date): number {
  return Math.max(0, EDITABLE_DAYS - daysSince(postedAt, now));
}
