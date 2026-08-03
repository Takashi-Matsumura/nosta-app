import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireLibrarian } from "@/lib/auth";
import { getCopy, getCopyByToken, registerTag } from "@/lib/data";
import { NfcError, writeTagUrl } from "@/lib/nfc/writer";
import { newTagToken, tagUrl } from "@/lib/tag";

const MAX_TOKEN_ATTEMPTS = 3;

/**
 * タグへの書き込み。Server Action にしないのは、本番ビルドでは Server Action の
 * 例外メッセージが伏せられ、「リーダーが繋がっていない」のような日常的な結果を
 * 司書に伝えられなくなるため（/admin/works の照会と同じ理由。README 参照）。
 *
 * DB を更新するのは物理書き込みが成功してからにする。逆にすると、書き込み失敗時に
 * 「DB 上だけ貼付済み」という気づきにくい不整合が残る。NTAG213 はロックしない限り
 * 何度でも上書きできるので、書き込みが失敗しても再試行すれば回復できる。
 */
export async function POST(request: Request) {
  await requireLibrarian();

  const formData = await request.formData();
  const copyId = String(formData.get("copyId") ?? "");

  const redirectWith = (params: Record<string, string>) => {
    const url = new URL("/admin/tags", request.url);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    return NextResponse.redirect(url, 303);
  };

  const copy = await getCopy(copyId);
  if (!copy) {
    return redirectWith({ error: "not-found" });
  }
  if (copy.tagToken !== null) {
    return redirectWith({ error: "already-tagged", copy: copyId });
  }

  let token: string | null = null;
  for (let i = 0; i < MAX_TOKEN_ATTEMPTS; i++) {
    const candidate = newTagToken();
    if (!(await getCopyByToken(candidate))) {
      token = candidate;
      break;
    }
  }
  if (!token) {
    return redirectWith({ error: "token-collision", copy: copyId });
  }

  try {
    await writeTagUrl(tagUrl(token));
  } catch (err) {
    const code = err instanceof NfcError ? err.code : "write-failed";
    return redirectWith({ error: code, copy: copyId });
  }

  await registerTag(copyId, token);
  revalidatePath("/admin/tags");
  revalidatePath("/admin");

  return redirectWith({ ok: copyId });
}
