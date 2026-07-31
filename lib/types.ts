/** 作品。同じ本が複数冊あっても作品は1つ */
export type Work = {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedYear: number;
  /** 請求記号 */
  callNumber: string;
};

/** 蔵書1冊。棚にある物理的な1冊にあたる */
export type Copy = {
  id: string;
  workId: string;
  barcode: string;
  /**
   * NTAG に書き込む不変トークン。NFC の UID は複製できるため直接は使わない。
   * 感想が書かれた本に後から貼るので、未貼付のあいだは null。
   */
  tagToken: string | null;
};

export type Student = {
  id: string;
  penName: string;
  /** 入学年度。表示は「2021年入学」 */
  entranceYear: number;
};

/** 心に残った一節 */
export type Quote = {
  text: string;
  page: number;
};

export type Review = {
  id: string;
  workId: string;
  /** どの1冊を読んで書いたか */
  copyId: string;
  studentId: string;
  /** 投稿時の学年。1=中1 … 6=高3 */
  gradeAtPost: number;
  /** 投稿時のペンネーム。本人が後で改名しても、この感想の表示は変わらない */
  penNameAtPost: string;
  body: string;
  quote: Quote | null;
  /** ISO 8601 の日付 */
  postedAt: string;
  /** 司書が非表示にした感想か */
  hidden: boolean;
};

/** 感想への通報。司書が確認して非表示にするか却下する */
export type Report = {
  id: string;
  reviewId: string;
  /** 通報した生徒。悪用調査・重複防止のためだけに持つ。司書向け画面には出さない */
  reporterId: string | null;
  reason: string;
  /** ISO 8601 の日付 */
  reportedAt: string;
};

/** 通報と、その対象の感想 */
export type ReportWithReview = Report & {
  review: ReviewWithAuthor;
};

/** タグ未登録の蔵書。感想がついているのに NTAG がまだ貼られていない1冊 */
export type UntaggedCopy = {
  copy: Copy;
  work: Work;
  reviewCount: number;
};

/** 貸出。感想は借りた本にだけ書ける */
export type Loan = {
  id: string;
  copyId: string;
  studentId: string;
  borrowedAt: string;
  returnedAt: string | null;
};

/** 画面に渡す、1冊ぶんのまとまり */
export type BorrowedBook = {
  loan: Loan;
  copy: Copy;
  work: Work;
  /** この生徒がこの作品に既に感想を残しているか */
  hasWritten: boolean;
};

/** 感想と、その書き手 */
export type ReviewWithAuthor = Review & {
  author: Student;
};

export type Role = "student" | "librarian";

/** ログインできるアカウント。role: student の場合のみ生徒プロフィールを伴う */
export type UserAccount = {
  id: string;
  email: string;
  role: Role;
  penName: string | null;
  entranceYear: number | null;
  /** 卒業などで false になったアカウントはログインできない。感想・貸出はそのまま残る */
  active: boolean;
};

/** 貸出中の1冊と、借りている生徒。司書の貸出画面で使う */
export type ActiveLoan = {
  loan: Loan;
  copy: Copy;
  work: Work;
  student: Student;
};
