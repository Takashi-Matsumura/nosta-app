import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

/** 認証済みの1人。学校の Google アカウントでログインする */
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["student", "librarian"] })
    .notNull()
    .default("student"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/**
 * 生徒のペンネーム名義。id は users.id と同じ値を共有する（1対1）。
 * 司書アカウントには対応する students 行が無い。
 */
export const students = pgTable("students", {
  id: text("id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  penName: text("pen_name").notNull(),
  /** 入学年度。表示は「2021年入学」 */
  entranceYear: integer("entrance_year").notNull(),
});

/** 作品。同じ本が複数冊あっても作品は1つ */
export const works = pgTable("works", {
  id: text("id").primaryKey(),
  isbn: text("isbn").notNull(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  publisher: text("publisher").notNull(),
  publishedYear: integer("published_year").notNull(),
  /** 請求記号 */
  callNumber: text("call_number").notNull(),
});

/** 蔵書1冊。棚にある物理的な1冊にあたる */
export const copies = pgTable("copies", {
  id: text("id").primaryKey(),
  workId: text("work_id")
    .notNull()
    .references(() => works.id, { onDelete: "cascade" }),
  barcode: text("barcode").notNull(),
  /** NTAG に書き込む不変トークン。未貼付のあいだは null */
  tagToken: text("tag_token").unique(),
});

/** 貸出。感想は借りた本にだけ書ける */
export const loans = pgTable("loans", {
  id: text("id").primaryKey(),
  copyId: text("copy_id")
    .notNull()
    .references(() => copies.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  borrowedAt: date("borrowed_at").notNull(),
  returnedAt: date("returned_at"),
});

/** 感想。心に残った一節は任意なので quoteText/quotePage は nullable */
export const reviews = pgTable("reviews", {
  id: text("id").primaryKey(),
  workId: text("work_id")
    .notNull()
    .references(() => works.id, { onDelete: "cascade" }),
  copyId: text("copy_id")
    .notNull()
    .references(() => copies.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "cascade" }),
  /** 投稿時の学年。1=中1 … 6=高3 */
  gradeAtPost: integer("grade_at_post").notNull(),
  body: text("body").notNull(),
  quoteText: text("quote_text"),
  quotePage: integer("quote_page"),
  postedAt: date("posted_at").notNull(),
  /** 司書が非表示にした感想か */
  hidden: boolean("hidden").notNull().default(false),
});

/** 感想への通報。司書が確認するまでキューに残る */
export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  reviewId: text("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  reportedAt: date("reported_at").notNull(),
});
