/**
 * 国立国会図書館サーチ（NDLサーチ）SRU API から、openBD には無い情報
 * （刊行年の補完・NDC分類）を引く。あくまで補完用のベストエフォートなので、
 * 何も見つからない・通信に失敗した場合も例外は投げず null を返す
 * （司書が確認画面で手入力すればよいだけで、登録の妨げにはしない）。
 */
export type NdlInfo = {
  /** 見つかれば刊行年（openBD 側が空のときの補完用） */
  publishedYear: number | null;
  /** NDC分類（例: "019.1"）。請求記号の頭数字の候補として使う */
  ndc: string | null;
};

const EMPTY: NdlInfo = { publishedYear: null, ndc: null };

export async function fetchNdlInfo(isbn: string): Promise<NdlInfo> {
  try {
    const url =
      "https://ndlsearch.ndl.go.jp/api/sru" +
      `?operation=searchRetrieve&version=1.2&query=isbn%3D${encodeURIComponent(isbn)}` +
      "&recordSchema=dcndl&recordPacking=xml&maximumRecords=1";
    // レスポンスが大きく(数十KB)、openBDよりまれに遅いことがあるため少し長めに取る
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return EMPTY;

    const xml = await res.text();
    // dcterms:issued は "2026" のような西暦のみのプレーンテキスト
    const yearMatch = xml.match(/<dcterms:issued[^>]*>(\d{4})/);
    // NDC は dcterms:subject の rdf:resource が
    // ".../class/ndc10/019.1" のような URI で表される
    const ndcMatch = xml.match(/class\/ndc10\/([0-9.]+)"/);

    return {
      publishedYear: yearMatch ? Number(yearMatch[1]) : null,
      ndc: ndcMatch ? ndcMatch[1] : null,
    };
  } catch {
    return EMPTY;
  }
}
