import { addWorkAction } from "@/lib/actions";
import { requireLibrarian } from "@/lib/auth";
import { getAllWorks } from "@/lib/data";
import { fetchBook, normalizeIsbn } from "@/lib/openbd";
import { AdminHeader } from "@/app/components/admin-header";

export default async function AdminWorksPage({
  searchParams,
}: {
  searchParams: Promise<{ isbn?: string }>;
}) {
  await requireLibrarian();
  const { isbn } = await searchParams;
  const works = await getAllWorks();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">蔵書</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          ISBN を入れると、openBD から書誌を取り込みます。
        </p>

        <form
          action="/admin/works"
          method="get"
          className="mt-6 flex gap-3"
        >
          <input
            type="text"
            name="isbn"
            defaultValue={isbn}
            required
            placeholder="9784100000018"
            aria-label="ISBN"
            className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-4 py-3 font-mono text-base outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
          />
          <button
            type="submit"
            className="shrink-0 rounded-sm border border-rule bg-paper px-6 text-sm tracking-widest transition-colors hover:bg-paper-aged"
          >
            照会する
          </button>
        </form>

        {isbn && <IsbnLookupResult isbn={isbn} />}

        <h2 className="mt-10 text-sm text-ink-soft">
          登録済み {works.length}件
        </h2>
        <ul className="mt-4 divide-y divide-rule-soft rounded-sm border border-rule bg-paper">
          {works.map((work) => (
            <li key={work.id} className="px-5 py-3.5">
              <p className="text-sm">
                {work.title}
                <span className="ml-2 text-ink-soft">{work.author}</span>
              </p>
              <p className="mt-0.5 text-xs text-ink-faint">
                {work.publisher} {work.publishedYear}
                <span className="font-mono">{work.callNumber}</span>
                {work.copyCount}冊
              </p>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}

async function IsbnLookupResult({ isbn }: { isbn: string }) {
  let book;
  try {
    book = await fetchBook(normalizeIsbn(isbn));
  } catch (e) {
    return (
      <p className="mt-6 text-sm leading-relaxed text-stamp">
        {(e as Error).message}
      </p>
    );
  }

  if (!book) {
    return (
      <p className="mt-6 text-sm leading-relaxed text-stamp">
        ISBN {isbn} の本は openBD に見つかりませんでした。番号を確かめてください。
      </p>
    );
  }

  return (
    <div className="mt-6 rounded-sm border border-rule bg-paper px-5 py-5">
      <p className="text-[0.65rem] tracking-[0.4em] text-ink-faint">
        この内容で登録します
      </p>
      <h3 className="mt-2 text-lg leading-snug">{book.title}</h3>
      <p className="mt-1 text-sm text-ink-soft">{book.author}</p>
      <p className="mt-2 font-mono text-[0.7rem] text-ink-faint">
        {book.publisher}　ISBN {book.isbn}
      </p>

      <form action={addWorkAction} className="mt-5 space-y-3">
        <input type="hidden" name="isbn" value={book.isbn} />
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="w-full sm:w-28">
            <label
              htmlFor="publishedYear"
              className="text-xs tracking-widest text-ink-soft"
            >
              刊行年
            </label>
            <input
              id="publishedYear"
              name="publishedYear"
              type="number"
              required
              defaultValue={book.publishedYear ?? undefined}
              placeholder="1989"
              className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-4 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="callNumber"
              className="text-xs tracking-widest text-ink-soft"
            >
              請求記号
            </label>
            <input
              id="callNumber"
              name="callNumber"
              type="text"
              required
              placeholder="913.6/ミ"
              className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-4 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
            />
          </div>
          <div className="flex-1">
            <label
              htmlFor="barcode"
              className="text-xs tracking-widest text-ink-soft"
            >
              バーコード（1冊目）
            </label>
            <input
              id="barcode"
              name="barcode"
              type="text"
              required
              placeholder="0100248"
              className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-4 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
            />
          </div>
        </div>
        <p className="text-xs leading-relaxed text-ink-faint">
          {book.publishedYear === null && (
            <>openBD に刊行年のデータが無かったため、確認して入れてください。</>
          )}
          {book.publishedYear === null && " "}
          請求記号とバーコードは openBD には無いので、手で入れてください。
        </p>
        <button
          type="submit"
          className="rounded-sm border border-navy bg-navy px-6 py-2.5 text-xs tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
        >
          登録する
        </button>
      </form>
    </div>
  );
}
