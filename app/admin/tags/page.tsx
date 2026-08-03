import { registerTagAction } from "@/lib/actions";
import { requireLibrarian } from "@/lib/auth";
import { getUntaggedCopies } from "@/lib/data";
import { AdminHeader } from "@/app/components/admin-header";

/** 書き込み結果のエラーコード（app/admin/tags/write/route.ts）→ 表示文言 */
const ERROR_MESSAGES: Record<string, string> = {
  "not-found": "指定した蔵書が見つかりませんでした。",
  "already-tagged": "この蔵書にはすでにタグが登録されています。",
  "token-collision": "トークンの生成に失敗しました。もう一度お試しください。",
  "no-reader": "NFCリーダーが見つかりません。RC-S300 が接続されているか確認してください。",
  busy: "他のタグ書き込みが進行中です。しばらくしてからもう一度お試しください。",
  timeout: "20秒以内にタグが検出されませんでした。NTAG をリーダーにかざしてください。",
  "write-failed": "タグへの書き込みに失敗しました。",
  "verify-failed": "書き込み後の読み戻しが一致しませんでした。",
};

export default async function AdminTagsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; copy?: string }>;
}) {
  await requireLibrarian();
  const { ok, error } = await searchParams;
  const untagged = await getUntaggedCopies();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">タグ登録</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          「タグに書き込む」を押してから、NTAG を RC-S300 にかざしてください。
        </p>

        {ok && (
          <p className="mt-6 text-sm leading-relaxed text-ink-soft">
            タグへの書き込みと登録が完了しました。
          </p>
        )}
        {error && (
          <p className="mt-6 text-sm leading-relaxed text-stamp">
            {ERROR_MESSAGES[error] ?? "書き込みに失敗しました。"}
          </p>
        )}

        {untagged.length === 0 ? (
          <p className="mt-10 text-sm text-ink-faint">
            タグ登録待ちの蔵書はありません。
          </p>
        ) : (
          <ul className="mt-8 space-y-4">
            {untagged.map(({ copy, work, reviewCount }) => (
              <li
                key={copy.id}
                className="rounded-sm border border-rule bg-paper px-5 py-5"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="text-sm">
                    {work.title}
                    <span className="ml-2 text-ink-soft">{work.author}</span>
                  </p>
                  <span className="font-mono text-[0.7rem] text-ink-faint">
                    {copy.barcode}
                  </span>
                </div>
                <p className="mt-2 text-xs text-ink-faint">
                  {reviewCount > 0
                    ? `${reviewCount}件の感想がついています`
                    : "まだ感想はついていません"}
                </p>

                <form
                  action="/admin/tags/write"
                  method="post"
                  className="mt-4"
                >
                  <input type="hidden" name="copyId" value={copy.id} />
                  <button
                    type="submit"
                    className="rounded-sm border border-navy bg-navy px-5 py-2.5 text-xs tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
                  >
                    タグに書き込む
                  </button>
                </form>

                <details className="mt-4 text-xs text-ink-faint">
                  <summary className="cursor-pointer underline underline-offset-4">
                    リーダーが無い、またはうまく書き込めないとき
                  </summary>
                  <form
                    action={registerTagAction}
                    className="mt-3 flex gap-3"
                  >
                    <input type="hidden" name="copyId" value={copy.id} />
                    <input
                      type="text"
                      name="token"
                      required
                      placeholder="NTAG に書き込んだトークン"
                      aria-label="NTAG トークン"
                      className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-4 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-sm border border-rule bg-paper px-5 py-2.5 text-xs tracking-widest transition-colors hover:bg-paper-aged"
                    >
                      登録する
                    </button>
                  </form>
                </details>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
