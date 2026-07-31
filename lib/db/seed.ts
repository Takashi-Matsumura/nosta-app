import { getDb } from "./index";
import { copies, loans, reports, reviews, students, users, works } from "./schema";

/**
 * ローカル開発用の投入データ。試作フェーズの mock-data.ts と同じ内容。
 * ALLOWED_EMAIL_DOMAIN 配下のダミーメールアドレスを生徒ごとに割り当てる。
 */
const domain = process.env.ALLOWED_EMAIL_DOMAIN ?? "nosta-school.example";

const studentSeeds = [
  { slug: "shiori", penName: "しおり", entranceYear: 2024 },
  { slug: "kamome", penName: "かもめ", entranceYear: 2015 },
  { slug: "fuyunoinu", penName: "冬の犬", entranceYear: 2016 },
  { slug: "nanakumi", penName: "七組の雨", entranceYear: 2018 },
  { slug: "takenoko", penName: "たけのこ", entranceYear: 2019 },
  { slug: "minamo", penName: "みなも", entranceYear: 2021 },
  { slug: "shizuku", penName: "しずく", entranceYear: 2022 },
];

async function main() {
  const db = getDb();

  console.log("既存データを削除しています…");
  await db.delete(reports);
  await db.delete(reviews);
  await db.delete(loans);
  await db.delete(copies);
  await db.delete(works);
  await db.delete(students);
  await db.delete(users);

  console.log("ユーザー・生徒を投入しています…");
  // students.id は users.id と同じ値を共有する（1対1）
  await db.insert(users).values([
    ...studentSeeds.map((s) => ({
      id: `s-${s.slug}`,
      email: `${s.slug}@${domain}`,
      role: "student" as const,
    })),
    { id: "u-librarian", email: `librarian@${domain}`, role: "librarian" as const },
  ]);
  await db.insert(students).values(
    studentSeeds.map((s) => ({
      id: `s-${s.slug}`,
      penName: s.penName,
      entranceYear: s.entranceYear,
    })),
  );

  console.log("書誌を投入しています…");
  await db.insert(works).values([
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
  ]);

  console.log("蔵書を投入しています…");
  await db.insert(copies).values([
    { id: "c-ginga-1", workId: "w-ginga", barcode: "0100248", tagToken: "k7f2a9" },
    { id: "c-ginga-2", workId: "w-ginga", barcode: "0100249", tagToken: null },
    { id: "c-kokoro-1", workId: "w-kokoro", barcode: "0100311", tagToken: "m3b8c1" },
    { id: "c-sangetsu-1", workId: "w-sangetsu", barcode: "0100477", tagToken: "q9d4e2" },
    { id: "c-ningen-1", workId: "w-ningen", barcode: "0100502", tagToken: "t5h1n6" },
    { id: "c-lemon-1", workId: "w-lemon", barcode: "0100634", tagToken: null },
    { id: "c-kaze-1", workId: "w-kaze", barcode: "0100781", tagToken: "w2y7r3" },
  ]);

  console.log("貸出を投入しています…");
  await db.insert(loans).values([
    { id: "l-1", copyId: "c-ginga-1", studentId: "s-shiori", borrowedAt: "2026-07-24", returnedAt: null },
    { id: "l-2", copyId: "c-kokoro-1", studentId: "s-shiori", borrowedAt: "2026-07-24", returnedAt: null },
    { id: "l-3", copyId: "c-sangetsu-1", studentId: "s-shiori", borrowedAt: "2026-07-10", returnedAt: null },
    { id: "l-4", copyId: "c-lemon-1", studentId: "s-shiori", borrowedAt: "2026-07-28", returnedAt: null },
  ]);

  console.log("感想を投入しています…");
  await db.insert(reviews).values([
    {
      id: "r-1", workId: "w-ginga", copyId: "c-ginga-1", studentId: "s-kamome", gradeAtPost: 5,
      body: "二回目に読んだら、カムパネルラがいつからいなかったのかが分かってしまって、一回目より息が苦しかった。最初に読んだときは、ただきれいな話だと思っていた。同じ本なのに、読む人が変わると別の本になる。",
      quoteText: "ほんとうのさいわい", quotePage: 212, postedAt: "2019-11-08", hidden: false,
    },
    {
      id: "r-2", workId: "w-ginga", copyId: "c-ginga-1", studentId: "s-nanakumi", gradeAtPost: 5,
      body: "電車の窓の外はずっと暗いのに、ページの上はずっと明るい。自習室で読んでいたら外も暗くなっていて、顔を上げたとき自分がどこにいるのか一瞬わからなかった。あの感じのために、たぶんまた読む。",
      quoteText: null, quotePage: null, postedAt: "2022-09-14", hidden: false,
    },
    {
      id: "r-3", workId: "w-ginga", copyId: "c-ginga-2", studentId: "s-minamo", gradeAtPost: 4,
      body: "読み終えてから、しばらく返却カウンターに行けなかった。返したら終わってしまう気がして、結局そのまま延長した。",
      quoteText: "ほんとうのさいわい", quotePage: 212, postedAt: "2024-10-11", hidden: false,
    },
    {
      id: "r-4", workId: "w-kokoro", copyId: "c-kokoro-1", studentId: "s-fuyunoinu", gradeAtPost: 5,
      body: "先生はずるいと思った。でも、自分もたぶん同じことをする。それが分かってしまったのがいちばん嫌だった。",
      quoteText: "私はその人を常に先生と呼んでいた。", quotePage: 5, postedAt: "2021-01-30", hidden: false,
    },
    {
      id: "r-5", workId: "w-kokoro", copyId: "c-kokoro-1", studentId: "s-takenoko", gradeAtPost: 5,
      body: "上と中を読んでいるあいだは退屈だと思っていたのに、下でぜんぶ意味が変わった。退屈だと思っていた自分ごと、下に回収された感じがする。",
      quoteText: null, quotePage: null, postedAt: "2023-07-19", hidden: false,
    },
    {
      id: "r-6", workId: "w-sangetsu", copyId: "c-sangetsu-1", studentId: "s-kamome", gradeAtPost: 3,
      body: "授業で読まされたときはまったくピンとこなかったのに、テストが終わってから自分で読み返したらこわくなった。",
      quoteText: "臆病な自尊心と尊大な羞恥心", quotePage: 14, postedAt: "2017-06-22", hidden: false,
    },
    {
      id: "r-7", workId: "w-sangetsu", copyId: "c-sangetsu-1", studentId: "s-nanakumi", gradeAtPost: 3,
      body: "書いたものを人に見せるのが怖いのは、下手だと思われるのが怖いんじゃなくて、本気だとばれるのが怖いからだと気づいた。",
      quoteText: null, quotePage: null, postedAt: "2020-05-02", hidden: false,
    },
    {
      id: "r-8", workId: "w-sangetsu", copyId: "c-sangetsu-1", studentId: "s-takenoko", gradeAtPost: 3,
      body: "虎になった理由が、才能がなかったからではなく、才能があるかどうかを確かめなかったからだ、というところがいちばんこたえた。",
      quoteText: null, quotePage: null, postedAt: "2021-12-03", hidden: false,
    },
    {
      id: "r-9", workId: "w-sangetsu", copyId: "c-sangetsu-1", studentId: "s-shiori", gradeAtPost: 3,
      body: "李徴の言い訳が、自分の言い訳とおなじ言い方をしていた。読み終わってから、机の上に置いたままの提出物を見るのがいやになった。",
      quoteText: "臆病な自尊心と尊大な羞恥心", quotePage: 14, postedAt: "2026-07-15", hidden: false,
    },
    {
      id: "r-10", workId: "w-ningen", copyId: "c-ningen-1", studentId: "s-shizuku", gradeAtPost: 4,
      body: "明るく振る舞うほど人から遠くなる、というのが分かりすぎて、途中で本を閉じた。次の日にちゃんと続きを読んだ。",
      quoteText: "恥の多い生涯を送って来ました。", quotePage: 9, postedAt: "2025-06-05", hidden: false,
    },
    {
      id: "r-11", workId: "w-kaze", copyId: "c-kaze-1", studentId: "s-minamo", gradeAtPost: 2,
      body: "走るのがきらいだったのに、読み終わったら少しだけ走ってみたくなった。次の日の朝に実際に走って、三分でやめた。それでも読む前とは違う。",
      quoteText: null, quotePage: null, postedAt: "2023-02-17", hidden: false,
    },
    {
      id: "r-12", workId: "w-kaze", copyId: "c-kaze-1", studentId: "s-shizuku", gradeAtPost: 3,
      body: "十人ぜんぶに好きなところがあるのがずるい。誰か一人に決められないまま最後まで来てしまった。",
      quoteText: null, quotePage: null, postedAt: "2024-05-20", hidden: false,
    },
  ]);

  console.log("通報を投入しています…");
  await db.insert(reports).values([
    { id: "rep-1", reviewId: "r-9", reason: "個人が特定できそうな内容が含まれている", reportedAt: "2026-07-20" },
    { id: "rep-2", reviewId: "r-11", reason: "本の内容と関係ない書き込みに見える", reportedAt: "2026-07-25" },
  ]);

  console.log(`完了。ログイン用メール例: shiori@${domain}（生徒） / librarian@${domain}（司書）`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
