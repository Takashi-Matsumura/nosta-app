import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { getBorrowedBooks } from "@/lib/data";
import { gradeAt, gradeLabel } from "@/lib/school";
import { BookSlip } from "./components/book-slip";
import { SiteHeader } from "./components/site-header";

export default async function HomePage() {
  const student = await requireStudent();
  const now = new Date();
  const grade = gradeLabel(gradeAt(student.entranceYear, now));
  const books = await getBorrowedBooks(student.id);
  const unwritten = books.filter((b) => !b.hasWritten).length;

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <p className="text-sm text-ink-soft">
          {student.entranceYear}年入学 {student.penName}（{grade}）
        </p>

        <h1 className="mt-8 text-xl tracking-wide">いま借りている本</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          カードを書けるのは、借りた本だけです。
          {unwritten > 0 && `　まだ${unwritten}冊が白紙のままです。`}
        </p>

        <ul className="mt-6 space-y-3">
          {books.map(({ work, copy, hasWritten }) => (
            <BookSlip
              key={copy.id}
              work={work}
              href={`/works/${work.id}`}
              tagged={copy.tagToken !== null}
              note={
                hasWritten ? (
                  <span>カードを書きました</span>
                ) : (
                  <span className="text-stamp">まだ書いていません</span>
                )
              }
            />
          ))}
        </ul>

        <div className="mt-14 border-t border-rule/70 pt-6 text-sm text-ink-soft">
          <p className="leading-relaxed">
            借りていない本も
            <Link href="/search" className="mx-1 underline underline-offset-4">
              さがす
            </Link>
            ことはできます。書けるのは借りたときです。
          </p>
          <p className="mt-4 text-xs leading-relaxed text-ink-faint">
            （試作）本に貼った NTAG をかざすと
            <Link href="/c/k7f2a9" className="mx-1 underline underline-offset-4">
              こう開きます
            </Link>
          </p>
        </div>
      </main>
    </>
  );
}
