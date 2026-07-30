import { registerTagAction } from "@/lib/actions";
import { getUntaggedCopies } from "@/lib/mock-data";
import { AdminHeader } from "@/app/components/admin-header";

export default function AdminTagsPage() {
  const untagged = getUntaggedCopies();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">タグ登録</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          感想がついた本に NTAG を貼ったら、書き込んだトークンをここに登録してください。
        </p>

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
                  {reviewCount}件の感想がついています
                </p>

                <form
                  action={registerTagAction}
                  className="mt-4 flex gap-3"
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
                    className="shrink-0 rounded-sm border border-navy bg-navy px-5 py-2.5 text-xs tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
                  >
                    登録する
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
