import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import {
  getBorrowedBooks,
  getReviewsForWork,
  getWork,
  hasTaggedCopy,
  hasWritten,
} from "@/lib/data";
import { LibraryCard } from "@/app/components/library-card";
import { ReviewEntry } from "@/app/components/review-entry";
import { SealedNotice } from "@/app/components/sealed-notice";
import { SiteHeader } from "@/app/components/site-header";

export default async function WorkPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) notFound();

  const student = await requireStudent();
  const now = new Date();
  const reviews = await getReviewsForWork(work.id);
  const opened = await hasWritten(student.id, work.id);
  const borrowed = (await getBorrowedBooks(student.id)).find(
    (b) => b.work.id === work.id,
  );

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <LibraryCard work={work} tagged={await hasTaggedCopy(work.id)}>
          {opened ? (
            <ol className="divide-y divide-rule-soft">
              {reviews.map((review) => (
                <ReviewEntry
                  key={review.id}
                  review={review}
                  now={now}
                  isMine={review.studentId === student.id}
                />
              ))}
            </ol>
          ) : (
            <SealedNotice count={reviews.length} />
          )}
        </LibraryCard>

        <div className="mt-8">
          {borrowed ? (
            <>
              <Link
                href={`/works/${work.id}/write`}
                className="inline-block rounded-sm border border-stamp bg-stamp px-7 py-3.5 text-sm tracking-[0.2em] text-paper transition-opacity hover:opacity-90"
              >
                {opened ? "もう一度カードを書く" : "カードを書く"}
              </Link>
              <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                {borrowed.loan.borrowedAt} に借りた1冊（
                <span className="font-mono">{borrowed.copy.barcode}</span>）
              </p>
            </>
          ) : (
            <p className="text-sm leading-relaxed text-ink-soft">
              この本は借りていません。
              <br />
              図書館で借りると、あなたもカードを書けます。
            </p>
          )}
        </div>
      </main>
    </>
  );
}
