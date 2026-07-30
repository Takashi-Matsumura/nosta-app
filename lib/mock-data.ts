import { gradeAt } from "./school";
import type {
  BorrowedBook,
  Copy,
  Loan,
  Review,
  ReviewWithAuthor,
  Student,
  Work,
} from "./types";

/** 試作のあいだは、この生徒でログインしているものとして扱う */
export const CURRENT_STUDENT_ID = "s-shiori";

export const students: Student[] = [
  { id: "s-shiori", penName: "しおり", entranceYear: 2024 },
  { id: "s-kamome", penName: "かもめ", entranceYear: 2015 },
  { id: "s-fuyunoinu", penName: "冬の犬", entranceYear: 2016 },
  { id: "s-nanakumi", penName: "七組の雨", entranceYear: 2018 },
  { id: "s-takenoko", penName: "たけのこ", entranceYear: 2019 },
  { id: "s-minamo", penName: "みなも", entranceYear: 2021 },
  { id: "s-shizuku", penName: "しずく", entranceYear: 2022 },
];

/** 試作用のダミー書誌。ISBN は実在しない値 */
export const works: Work[] = [
  {
    id: "w-ginga",
    isbn: "9784100000018",
    title: "銀河鉄道の夜",
    author: "宮沢 賢治",
    publisher: "新潮社",
    publishedYear: 1989,
    callNumber: "913.6/ミ",
  },
  {
    id: "w-kokoro",
    isbn: "9784100000025",
    title: "こころ",
    author: "夏目 漱石",
    publisher: "新潮社",
    publishedYear: 1952,
    callNumber: "913.6/ナ",
  },
  {
    id: "w-sangetsu",
    isbn: "9784100000032",
    title: "山月記・李陵",
    author: "中島 敦",
    publisher: "岩波書店",
    publishedYear: 1994,
    callNumber: "913.6/ナ",
  },
  {
    id: "w-ningen",
    isbn: "9784100000049",
    title: "人間失格",
    author: "太宰 治",
    publisher: "新潮社",
    publishedYear: 1952,
    callNumber: "913.6/ダ",
  },
  {
    id: "w-lemon",
    isbn: "9784100000056",
    title: "檸檬",
    author: "梶井 基次郎",
    publisher: "新潮社",
    publishedYear: 1967,
    callNumber: "913.6/カ",
  },
  {
    id: "w-kaze",
    isbn: "9784100000063",
    title: "風が強く吹いている",
    author: "三浦 しをん",
    publisher: "新潮社",
    publishedYear: 2009,
    callNumber: "913.6/ミ",
  },
];

/**
 * 蔵書1冊。tagToken が入っているのは NTAG を貼り終えた本。
 * 感想が書かれた本に後から貼る運用なので、感想ゼロの本にはまだ無い。
 */
export const copies: Copy[] = [
  { id: "c-ginga-1", workId: "w-ginga", barcode: "0100248", tagToken: "k7f2a9" },
  { id: "c-ginga-2", workId: "w-ginga", barcode: "0100249", tagToken: null },
  { id: "c-kokoro-1", workId: "w-kokoro", barcode: "0100311", tagToken: "m3b8c1" },
  {
    id: "c-sangetsu-1",
    workId: "w-sangetsu",
    barcode: "0100477",
    tagToken: "q9d4e2",
  },
  { id: "c-ningen-1", workId: "w-ningen", barcode: "0100502", tagToken: "t5h1n6" },
  { id: "c-lemon-1", workId: "w-lemon", barcode: "0100634", tagToken: null },
  { id: "c-kaze-1", workId: "w-kaze", barcode: "0100781", tagToken: "w2y7r3" },
];

/** いま しおり が借りている4冊 */
export const loans: Loan[] = [
  {
    id: "l-1",
    copyId: "c-ginga-1",
    studentId: "s-shiori",
    borrowedAt: "2026-07-24",
    returnedAt: null,
  },
  {
    id: "l-2",
    copyId: "c-kokoro-1",
    studentId: "s-shiori",
    borrowedAt: "2026-07-24",
    returnedAt: null,
  },
  {
    id: "l-3",
    copyId: "c-sangetsu-1",
    studentId: "s-shiori",
    borrowedAt: "2026-07-10",
    returnedAt: null,
  },
  {
    id: "l-4",
    copyId: "c-lemon-1",
    studentId: "s-shiori",
    borrowedAt: "2026-07-28",
    returnedAt: null,
  },
];

/**
 * 試作用のメモリストア。投稿するとここに積まれ、dev サーバを再起動すると
 * 初期状態に戻る。
 */
const reviews: Review[] = [
  {
    id: "r-1",
    workId: "w-ginga",
    copyId: "c-ginga-1",
    studentId: "s-kamome",
    gradeAtPost: 5,
    body: "二回目に読んだら、カムパネルラがいつからいなかったのかが分かってしまって、一回目より息が苦しかった。最初に読んだときは、ただきれいな話だと思っていた。同じ本なのに、読む人が変わると別の本になる。",
    quote: { text: "ほんとうのさいわい", page: 212 },
    postedAt: "2019-11-08",
  },
  {
    id: "r-2",
    workId: "w-ginga",
    copyId: "c-ginga-1",
    studentId: "s-nanakumi",
    gradeAtPost: 5,
    body: "電車の窓の外はずっと暗いのに、ページの上はずっと明るい。自習室で読んでいたら外も暗くなっていて、顔を上げたとき自分がどこにいるのか一瞬わからなかった。あの感じのために、たぶんまた読む。",
    quote: null,
    postedAt: "2022-09-14",
  },
  {
    id: "r-3",
    workId: "w-ginga",
    copyId: "c-ginga-2",
    studentId: "s-minamo",
    gradeAtPost: 4,
    body: "読み終えてから、しばらく返却カウンターに行けなかった。返したら終わってしまう気がして、結局そのまま延長した。",
    quote: { text: "ほんとうのさいわい", page: 212 },
    postedAt: "2024-10-11",
  },
  {
    id: "r-4",
    workId: "w-kokoro",
    copyId: "c-kokoro-1",
    studentId: "s-fuyunoinu",
    gradeAtPost: 5,
    body: "先生はずるいと思った。でも、自分もたぶん同じことをする。それが分かってしまったのがいちばん嫌だった。",
    quote: { text: "私はその人を常に先生と呼んでいた。", page: 5 },
    postedAt: "2021-01-30",
  },
  {
    id: "r-5",
    workId: "w-kokoro",
    copyId: "c-kokoro-1",
    studentId: "s-takenoko",
    gradeAtPost: 5,
    body: "上と中を読んでいるあいだは退屈だと思っていたのに、下でぜんぶ意味が変わった。退屈だと思っていた自分ごと、下に回収された感じがする。",
    quote: null,
    postedAt: "2023-07-19",
  },
  {
    id: "r-6",
    workId: "w-sangetsu",
    copyId: "c-sangetsu-1",
    studentId: "s-kamome",
    gradeAtPost: 3,
    body: "授業で読まされたときはまったくピンとこなかったのに、テストが終わってから自分で読み返したらこわくなった。",
    quote: { text: "臆病な自尊心と尊大な羞恥心", page: 14 },
    postedAt: "2017-06-22",
  },
  {
    id: "r-7",
    workId: "w-sangetsu",
    copyId: "c-sangetsu-1",
    studentId: "s-nanakumi",
    gradeAtPost: 3,
    body: "書いたものを人に見せるのが怖いのは、下手だと思われるのが怖いんじゃなくて、本気だとばれるのが怖いからだと気づいた。",
    quote: null,
    postedAt: "2020-05-02",
  },
  {
    id: "r-8",
    workId: "w-sangetsu",
    copyId: "c-sangetsu-1",
    studentId: "s-takenoko",
    gradeAtPost: 3,
    body: "虎になった理由が、才能がなかったからではなく、才能があるかどうかを確かめなかったからだ、というところがいちばんこたえた。",
    quote: null,
    postedAt: "2021-12-03",
  },
  {
    id: "r-9",
    workId: "w-sangetsu",
    copyId: "c-sangetsu-1",
    studentId: "s-shiori",
    gradeAtPost: 3,
    body: "李徴の言い訳が、自分の言い訳とおなじ言い方をしていた。読み終わってから、机の上に置いたままの提出物を見るのがいやになった。",
    quote: { text: "臆病な自尊心と尊大な羞恥心", page: 14 },
    postedAt: "2026-07-15",
  },
  {
    id: "r-10",
    workId: "w-ningen",
    copyId: "c-ningen-1",
    studentId: "s-shizuku",
    gradeAtPost: 4,
    body: "明るく振る舞うほど人から遠くなる、というのが分かりすぎて、途中で本を閉じた。次の日にちゃんと続きを読んだ。",
    quote: { text: "恥の多い生涯を送って来ました。", page: 9 },
    postedAt: "2025-06-05",
  },
  {
    id: "r-11",
    workId: "w-kaze",
    copyId: "c-kaze-1",
    studentId: "s-minamo",
    gradeAtPost: 2,
    body: "走るのがきらいだったのに、読み終わったら少しだけ走ってみたくなった。次の日の朝に実際に走って、三分でやめた。それでも読む前とは違う。",
    quote: null,
    postedAt: "2023-02-17",
  },
  {
    id: "r-12",
    workId: "w-kaze",
    copyId: "c-kaze-1",
    studentId: "s-shizuku",
    gradeAtPost: 3,
    body: "十人ぜんぶに好きなところがあるのがずるい。誰か一人に決められないまま最後まで来てしまった。",
    quote: null,
    postedAt: "2024-05-20",
  },
];

export function getCurrentStudent(): Student {
  return getStudent(CURRENT_STUDENT_ID);
}

export function getStudent(studentId: string): Student {
  const student = students.find((s) => s.id === studentId);
  if (!student) throw new Error(`不明な生徒: ${studentId}`);
  return student;
}

export function getWork(workId: string): Work | undefined {
  return works.find((w) => w.id === workId);
}

export function getCopy(copyId: string): Copy | undefined {
  return copies.find((c) => c.id === copyId);
}

/** NTAG をかざしたときの入口 */
export function getCopyByToken(token: string): Copy | undefined {
  return copies.find((c) => c.tagToken === token);
}

/** この作品に NTAG を貼り終えた蔵書があるか */
export function hasTaggedCopy(workId: string): boolean {
  return copies.some((c) => c.workId === workId && c.tagToken !== null);
}

/** いま借りている本。感想を書けるのはこれだけ */
export function getBorrowedBooks(studentId: string): BorrowedBook[] {
  return loans
    .filter((l) => l.studentId === studentId && l.returnedAt === null)
    .flatMap((loan) => {
      const copy = getCopy(loan.copyId);
      const work = copy && getWork(copy.workId);
      if (!copy || !work) return [];
      return [{ loan, copy, work, hasWritten: hasWritten(studentId, work.id) }];
    });
}

/** この生徒がこの作品に既に感想を残しているか */
export function hasWritten(studentId: string, workId: string): boolean {
  return reviews.some((r) => r.studentId === studentId && r.workId === workId);
}

/** その作品の感想を、古い順（先輩から）に並べる */
export function getReviewsForWork(workId: string): ReviewWithAuthor[] {
  return reviews
    .filter((r) => r.workId === workId)
    .sort((a, b) => a.postedAt.localeCompare(b.postedAt))
    .map((r) => ({ ...r, author: getStudent(r.studentId) }));
}

export function countReviews(workId: string): number {
  return reviews.filter((r) => r.workId === workId).length;
}

export function getReview(reviewId: string): ReviewWithAuthor | undefined {
  const review = reviews.find((r) => r.id === reviewId);
  if (!review) return undefined;
  return { ...review, author: getStudent(review.studentId) };
}

/** 自分の記録。新しい順 */
export function getMyReviews(
  studentId: string,
): (ReviewWithAuthor & { work: Work })[] {
  return reviews
    .filter((r) => r.studentId === studentId)
    .sort((a, b) => b.postedAt.localeCompare(a.postedAt))
    .flatMap((r) => {
      const work = getWork(r.workId);
      if (!work) return [];
      return [{ ...r, author: getStudent(r.studentId), work }];
    });
}

export function searchWorks(query: string): Work[] {
  const q = query.trim();
  if (!q) return [];
  return works.filter(
    (w) => w.title.includes(q) || w.author.includes(q) || w.isbn === q,
  );
}

export function addReview(input: {
  workId: string;
  copyId: string;
  studentId: string;
  body: string;
  quote: { text: string; page: number } | null;
}): Review {
  const student = getStudent(input.studentId);
  const now = new Date();
  const review: Review = {
    id: `r-${reviews.length + 1}`,
    workId: input.workId,
    copyId: input.copyId,
    studentId: input.studentId,
    gradeAtPost: gradeAt(student.entranceYear, now),
    body: input.body,
    quote: input.quote,
    postedAt: now.toISOString().slice(0, 10),
  };
  reviews.push(review);
  return review;
}
