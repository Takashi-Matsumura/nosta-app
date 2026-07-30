import {
  countReviews,
  getBorrowedBooks,
  getCurrentStudent,
  hasTaggedCopy,
  searchWorks,
} from "@/lib/mock-data";
import { BookSlip } from "@/app/components/book-slip";
import { SiteHeader } from "@/app/components/site-header";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q ?? "";
  const results = searchWorks(query);
  const student = getCurrentStudent();
  const borrowed = new Set(
    getBorrowedBooks(student.id).map((b) => b.work.id),
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">さがす</h1>

        <form action="/search" className="mt-6 flex gap-3">
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="題名か、著者の名前"
            aria-label="題名か著者で探す"
            className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-4 py-3 text-base outline-none placeholder:text-ink-faint focus:border-ink-soft"
          />
          <button
            type="submit"
            className="shrink-0 rounded-sm border border-rule bg-paper px-6 text-sm tracking-widest transition-colors hover:bg-paper-aged"
          >
            さがす
          </button>
        </form>

        {query && (
          <p className="mt-6 text-sm text-ink-soft">
            {results.length > 0
              ? `${results.length}冊`
              : "見つかりませんでした。"}
          </p>
        )}

        <ul className="mt-4 space-y-3">
          {results.map((work) => {
            const count = countReviews(work.id);
            return (
              <BookSlip
                key={work.id}
                work={work}
                href={`/works/${work.id}`}
                tagged={hasTaggedCopy(work.id)}
                note={
                  <span>
                    {count > 0 ? `${count}枚のカード` : "カードはまだ白紙"}
                    {borrowed.has(work.id) && "　／　借りています"}
                  </span>
                }
              />
            );
          })}
        </ul>
      </main>
    </>
  );
}
