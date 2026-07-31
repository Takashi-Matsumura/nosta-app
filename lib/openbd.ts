/**
 * openBD から引いた書誌。works に入れる形に整えてある。
 * publishedYear は openBD 側にデータが無いこともあるため null になりうる
 * （その場合は司書が確認画面で手入力する）。
 */
export type OpenBdBook = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedYear: number | null;
};

type OpenBdSummary = {
  isbn: string;
  title?: string;
  publisher?: string;
  pubdate?: string;
  author?: string;
};

/**
 * 本の裏表紙にある「ISBN978-4-12-150861-4 C1236」のような表記から
 * ISBN部分だけを取り出す。"ISBN" の文字・ハイフン・末尾のCコードや価格は無視する。
 */
export function normalizeIsbn(raw: string): string {
  const withoutLabel = raw.trim().replace(/^isbn[:\s]*/i, "");
  const firstToken = withoutLabel.split(/\s+/)[0] ?? "";
  return firstToken.replace(/-/g, "");
}

/**
 * ISBN から書誌を引く。見つからなければ undefined。通信に失敗した場合は Error を投げる
 * （「入力し直せば直るかもしれない通常の結果」ではないため）。
 */
export async function fetchBook(isbn: string): Promise<OpenBdBook | undefined> {
  let res: Response;
  try {
    res = await fetch(`https://api.openbd.jp/v1/get?isbn=${encodeURIComponent(isbn)}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new Error("openBD に接続できませんでした");
  }
  if (!res.ok) {
    throw new Error("openBD に接続できませんでした");
  }

  // 未知の ISBN でも openBD は 200 で [null] を返すため、res.ok だけでは判定できない
  const data = (await res.json()) as ({ summary: OpenBdSummary } | null)[];
  const summary = data[0]?.summary;
  if (!summary?.title) return undefined;

  // pubdate が空文字のまま登録されている本があり、その場合は司書に手入力してもらう
  const parsedYear = Number(String(summary.pubdate ?? "").slice(0, 4));
  const publishedYear = Number.isFinite(parsedYear) && parsedYear > 0 ? parsedYear : null;

  return {
    isbn: summary.isbn,
    title: summary.title,
    // "宮沢賢治／著" のような表記から末尾の "／著" のみ落とす。それ以上の整形はしない
    author: (summary.author ?? "").replace(/／著$/, ""),
    publisher: summary.publisher ?? "",
    publishedYear,
  };
}
