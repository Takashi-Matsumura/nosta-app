/** openBD から引いた書誌。works に入れる形に整えてある */
export type OpenBdBook = {
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  publishedYear: number;
};

type OpenBdSummary = {
  isbn: string;
  title?: string;
  publisher?: string;
  pubdate?: string;
  author?: string;
};

/**
 * ISBN から書誌を引く。見つからなければ undefined。
 * 通信に失敗した場合や、見つかったのに刊行年が読めない場合は Error を投げる
 * （どちらも「入力し直せば直るかもしれない通常の結果」ではないため）。
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
  if (!summary) return undefined;

  const publishedYear = Number(String(summary.pubdate ?? "").slice(0, 4));
  if (!summary.title || !Number.isFinite(publishedYear) || publishedYear === 0) {
    throw new Error("openBD の書誌が不完全です（刊行年が取れません）");
  }

  return {
    isbn: summary.isbn,
    title: summary.title,
    // "宮沢賢治／著" のような表記から末尾の "／著" のみ落とす。それ以上の整形はしない
    author: (summary.author ?? "").replace(/／著$/, ""),
    publisher: summary.publisher ?? "",
    publishedYear,
  };
}
