import { randomUUID } from "node:crypto";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "./db";
import { copies, loans, reports, reviews, students, users, works } from "./db/schema";
import { gradeAt, isEditable } from "./school";
import type {
  BorrowedBook,
  Copy,
  ReportWithReview,
  Review,
  ReviewWithAuthor,
  Role,
  Student,
  UntaggedCopy,
  UserAccount,
  Work,
} from "./types";

function toReview(row: typeof reviews.$inferSelect): Review {
  return {
    id: row.id,
    workId: row.workId,
    copyId: row.copyId,
    studentId: row.studentId,
    gradeAtPost: row.gradeAtPost,
    penNameAtPost: row.penNameAtPost,
    body: row.body,
    quote: row.quoteText !== null ? { text: row.quoteText, page: row.quotePage ?? 0 } : null,
    postedAt: row.postedAt,
    hidden: row.hidden,
  };
}

/* ------------------------------------------------------------------ */
/* 認証まわり（NextAuth から使う）                                      */
/* ------------------------------------------------------------------ */

/** ログインしてきたメールアドレスに対応する users 行。未登録なら undefined */
export async function getUserByEmail(
  email: string,
): Promise<{ id: string; email: string; role: "student" | "librarian" } | undefined> {
  const db = getDb();
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

/* ------------------------------------------------------------------ */
/* 生徒・作品・蔵書                                                     */
/* ------------------------------------------------------------------ */

export async function getStudent(studentId: string): Promise<Student> {
  const db = getDb();
  const [student] = await db.select().from(students).where(eq(students.id, studentId)).limit(1);
  if (!student) throw new Error(`不明な生徒: ${studentId}`);
  return student;
}

/**
 * 生徒本人がペンネームを変える。過去の感想は penNameAtPost を持っているので、
 * ここでの変更は今後の表示（ホーム・じぶんの記録の見出し等）にのみ反映される。
 */
export async function updatePenName(studentId: string, penName: string): Promise<void> {
  const db = getDb();
  await db.update(students).set({ penName }).where(eq(students.id, studentId));
}

export async function getWork(workId: string): Promise<Work | undefined> {
  const db = getDb();
  const [work] = await db.select().from(works).where(eq(works.id, workId)).limit(1);
  return work;
}

export async function getCopy(copyId: string): Promise<Copy | undefined> {
  const db = getDb();
  const [copy] = await db.select().from(copies).where(eq(copies.id, copyId)).limit(1);
  return copy;
}

/** NTAG をかざしたときの入口 */
export async function getCopyByToken(token: string): Promise<Copy | undefined> {
  const db = getDb();
  const [copy] = await db.select().from(copies).where(eq(copies.tagToken, token)).limit(1);
  return copy;
}

/** この作品に NTAG を貼り終えた蔵書があるか */
export async function hasTaggedCopy(workId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: copies.id })
    .from(copies)
    .where(and(eq(copies.workId, workId), isNotNull(copies.tagToken)))
    .limit(1);
  return Boolean(row);
}

/** いま借りている本。感想を書けるのはこれだけ */
export async function getBorrowedBooks(studentId: string): Promise<BorrowedBook[]> {
  const db = getDb();
  const activeLoans = await db
    .select()
    .from(loans)
    .where(and(eq(loans.studentId, studentId), isNull(loans.returnedAt)));

  const result: BorrowedBook[] = [];
  for (const loan of activeLoans) {
    const copy = await getCopy(loan.copyId);
    const work = copy && (await getWork(copy.workId));
    if (!copy || !work) continue;
    result.push({ loan, copy, work, hasWritten: await hasWritten(studentId, work.id) });
  }
  return result;
}

/** この生徒がこの作品に既に感想を残しているか */
export async function hasWritten(studentId: string, workId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.studentId, studentId), eq(reviews.workId, workId)))
    .limit(1);
  return Boolean(row);
}

/* ------------------------------------------------------------------ */
/* 感想                                                                 */
/* ------------------------------------------------------------------ */

/** その作品の感想を、古い順（先輩から）に並べる。非表示にした感想は出さない */
export async function getReviewsForWork(workId: string): Promise<ReviewWithAuthor[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(reviews)
    .where(and(eq(reviews.workId, workId), eq(reviews.hidden, false)))
    .orderBy(reviews.postedAt);

  const result: ReviewWithAuthor[] = [];
  for (const row of rows) {
    result.push({ ...toReview(row), author: await getStudent(row.studentId) });
  }
  return result;
}

export async function countReviews(workId: string): Promise<number> {
  const db = getDb();
  const rows = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(and(eq(reviews.workId, workId), eq(reviews.hidden, false)));
  return rows.length;
}

export async function getReview(reviewId: string): Promise<ReviewWithAuthor | undefined> {
  const db = getDb();
  const [row] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!row) return undefined;
  return { ...toReview(row), author: await getStudent(row.studentId) };
}

/** 自分の記録。新しい順 */
export async function getMyReviews(
  studentId: string,
): Promise<(ReviewWithAuthor & { work: Work })[]> {
  const db = getDb();
  const rows = await db
    .select()
    .from(reviews)
    .where(eq(reviews.studentId, studentId))
    .orderBy(desc(reviews.postedAt));

  const result: (ReviewWithAuthor & { work: Work })[] = [];
  for (const row of rows) {
    const work = await getWork(row.workId);
    if (!work) continue;
    result.push({ ...toReview(row), author: await getStudent(row.studentId), work });
  }
  return result;
}

export async function searchWorks(query: string): Promise<Work[]> {
  const q = query.trim();
  if (!q) return [];
  const db = getDb();
  const all = await db.select().from(works);
  return all.filter((w) => w.title.includes(q) || w.author.includes(q) || w.isbn === q);
}

export async function addReview(input: {
  workId: string;
  copyId: string;
  studentId: string;
  body: string;
  quote: { text: string; page: number } | null;
}): Promise<Review> {
  const db = getDb();
  const student = await getStudent(input.studentId);
  const now = new Date();
  const row = {
    id: `r-${randomUUID()}`,
    workId: input.workId,
    copyId: input.copyId,
    studentId: input.studentId,
    gradeAtPost: gradeAt(student.entranceYear, now),
    penNameAtPost: student.penName,
    body: input.body,
    quoteText: input.quote?.text ?? null,
    quotePage: input.quote?.page ?? null,
    postedAt: now.toISOString().slice(0, 10),
    hidden: false,
  };
  await db.insert(reviews).values(row);
  return toReview(row);
}

async function getOwnEditableReviewRow(reviewId: string, studentId: string) {
  const db = getDb();
  const [row] = await db.select().from(reviews).where(eq(reviews.id, reviewId)).limit(1);
  if (!row) throw new Error(`不明な感想: ${reviewId}`);
  if (row.studentId !== studentId) throw new Error("自分の感想ではありません");
  if (row.hidden) throw new Error("この感想は司書によって非表示にされています");
  if (!isEditable(row.postedAt, new Date())) {
    throw new Error("投稿から1週間を過ぎたので、直せません");
  }
  return row;
}

/** 本人の感想を直す。編集期間を過ぎていたら直せない */
export async function updateReview(
  reviewId: string,
  studentId: string,
  input: { body: string; quote: { text: string; page: number } | null },
): Promise<Review> {
  await getOwnEditableReviewRow(reviewId, studentId);
  const db = getDb();
  const [row] = await db
    .update(reviews)
    .set({
      body: input.body,
      quoteText: input.quote?.text ?? null,
      quotePage: input.quote?.page ?? null,
    })
    .where(eq(reviews.id, reviewId))
    .returning();
  return toReview(row);
}

/** 本人の感想を消す。編集期間を過ぎていたら消せない */
export async function deleteReview(reviewId: string, studentId: string): Promise<Review> {
  await getOwnEditableReviewRow(reviewId, studentId);
  const db = getDb();
  const [row] = await db.delete(reviews).where(eq(reviews.id, reviewId)).returning();
  return toReview(row);
}

/** 生徒が感想を通報する。自分の感想や、同じ感想への二重通報はできない */
export async function addReport(input: {
  reviewId: string;
  reporterId: string;
  reason: string;
}): Promise<void> {
  const review = await getReview(input.reviewId);
  if (!review) throw new Error(`不明な感想: ${input.reviewId}`);
  if (review.studentId === input.reporterId) {
    throw new Error("自分の感想は通報できません");
  }

  const db = getDb();
  const [already] = await db
    .select({ id: reports.id })
    .from(reports)
    .where(
      and(eq(reports.reviewId, input.reviewId), eq(reports.reporterId, input.reporterId)),
    )
    .limit(1);
  if (already) throw new Error("この感想はもう通報しています");

  await db.insert(reports).values({
    id: `rep-${randomUUID()}`,
    reviewId: input.reviewId,
    reporterId: input.reporterId,
    reason: input.reason,
    reportedAt: new Date().toISOString().slice(0, 10),
  });
}

/** この生徒が通報済みの感想の id 一覧。二重通報の抑止と「通報しました」表示に使う */
export async function getReportedReviewIds(studentId: string): Promise<string[]> {
  const db = getDb();
  const rows = await db
    .select({ reviewId: reports.reviewId })
    .from(reports)
    .where(eq(reports.reporterId, studentId));
  return rows.map((r) => r.reviewId);
}

/* ------------------------------------------------------------------ */
/* 司書向け                                                            */
/* ------------------------------------------------------------------ */

/** 未対応の通報。新しい順 */
export async function getReports(): Promise<ReportWithReview[]> {
  const db = getDb();
  const rows = await db.select().from(reports).orderBy(desc(reports.reportedAt));

  const result: ReportWithReview[] = [];
  for (const row of rows) {
    const review = await getReview(row.reviewId);
    if (!review) continue;
    result.push({ ...row, review });
  }
  return result;
}

export async function countReports(): Promise<number> {
  const db = getDb();
  const rows = await db.select({ id: reports.id }).from(reports);
  return rows.length;
}

/** 通報を却下する。感想はそのまま残る */
export async function dismissReport(reportId: string): Promise<void> {
  const db = getDb();
  const result = await db.delete(reports).where(eq(reports.id, reportId)).returning({ id: reports.id });
  if (result.length === 0) throw new Error(`不明な通報: ${reportId}`);
}

/** 通報された感想を非表示にし、通報自体もキューから外す */
export async function hideReportedReview(reportId: string): Promise<void> {
  const db = getDb();
  const [report] = await db.select().from(reports).where(eq(reports.id, reportId)).limit(1);
  if (!report) throw new Error(`不明な通報: ${reportId}`);
  await db.update(reviews).set({ hidden: true }).where(eq(reviews.id, report.reviewId));
  await dismissReport(reportId);
}

/**
 * 感想がついているのに NTAG がまだ貼られていない蔵書。
 * 司書がタグを貼ったあと、ここでトークンを登録する。
 */
export async function getUntaggedCopies(): Promise<UntaggedCopy[]> {
  const db = getDb();
  const untaggedCopies = await db.select().from(copies).where(isNull(copies.tagToken));

  const result: UntaggedCopy[] = [];
  for (const copy of untaggedCopies) {
    const reviewRows = await db
      .select({ id: reviews.id })
      .from(reviews)
      .where(eq(reviews.copyId, copy.id));
    if (reviewRows.length === 0) continue;
    const work = await getWork(copy.workId);
    if (!work) continue;
    result.push({ copy, work, reviewCount: reviewRows.length });
  }
  return result;
}

export async function countUntaggedCopies(): Promise<number> {
  return (await getUntaggedCopies()).length;
}

/** NTAG に書き込んだトークンを蔵書に登録する */
export async function registerTag(copyId: string, token: string): Promise<void> {
  const db = getDb();
  const copy = await getCopy(copyId);
  if (!copy) throw new Error(`不明な蔵書: ${copyId}`);
  if (copy.tagToken !== null) throw new Error("すでにタグが登録されています");
  await db.update(copies).set({ tagToken: token }).where(eq(copies.id, copyId));
}

/* ------------------------------------------------------------------ */
/* 司書向け: ユーザー管理                                                */
/* ------------------------------------------------------------------ */

/** ログインできるアカウントの一覧。メールアドレス順 */
export async function getAllUsers(): Promise<UserAccount[]> {
  const db = getDb();
  return db
    .select({
      id: users.id,
      email: users.email,
      role: users.role,
      penName: students.penName,
      entranceYear: students.entranceYear,
    })
    .from(users)
    .leftJoin(students, eq(students.id, users.id))
    .orderBy(users.email);
}

/**
 * ログインできるアカウントを追加する。role: student の場合は
 * ペンネームと入学年度が必須で、students のプロフィールも同時に作る。
 */
export async function addUser(input: {
  email: string;
  role: Role;
  penName?: string;
  entranceYear?: number;
}): Promise<void> {
  const db = getDb();
  const existing = await getUserByEmail(input.email);
  if (existing) throw new Error("このメールアドレスは既に登録されています");
  if (input.role === "student" && (!input.penName || !input.entranceYear)) {
    throw new Error("生徒にはペンネームと入学年度が必要です");
  }

  const id = `u-${randomUUID()}`;
  await db.transaction(async (tx) => {
    await tx.insert(users).values({ id, email: input.email, role: input.role });
    if (input.role === "student") {
      await tx.insert(students).values({
        id,
        penName: input.penName!,
        entranceYear: input.entranceYear!,
      });
    }
  });
}
