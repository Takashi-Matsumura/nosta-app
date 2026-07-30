import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getReview,
  getReviewsForWork,
  getWork,
} from "@/lib/mock-data";
import { ReviewEntry } from "@/app/components/review-entry";
import { SiteHeader } from "@/app/components/site-header";

/** 投稿の直後だけ通る画面。ここで先輩のカードが開く */
export default async function OpenedPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ r?: string }>;
}) {
  const { id } = await params;
  const { r } = await searchParams;
  const work = getWork(id);
  if (!work) notFound();

  const now = new Date();
  const mine = r ? getReview(r) : undefined;
  const earlier = getReviewsForWork(work.id).filter((rev) => rev.id !== mine?.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <p className="text-[0.65rem] tracking-[0.4em] text-ink-faint">記入完了</p>
        <h1 className="mt-3 text-2xl leading-snug">{work.title}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">{work.author}</p>

        {mine && (
          <div className="mt-8 rounded-sm border border-rule bg-paper shadow-[0_10px_24px_-16px_rgba(43,38,33,0.55)]">
            <div className="border-b border-rule px-5 py-3 pl-11">
              <p className="text-[0.65rem] tracking-[0.4em] text-ink-faint">
                あなたの記入
              </p>
            </div>
            <ol>
              <ReviewEntry review={mine} now={now} isMine />
            </ol>
          </div>
        )}

        {earlier.length > 0 ? (
          <>
            <div className="mt-14 text-center">
              <p className="text-sm leading-relaxed">
                ここから先は、あなたより前に
                <br />
                この本を読んだ人たちです。
              </p>
            </div>

            <ol className="mt-8 divide-y divide-rule-soft rounded-sm border border-rule bg-paper shadow-[0_10px_24px_-16px_rgba(43,38,33,0.55)]">
              {earlier.map((review, i) => (
                <ReviewEntry
                  key={review.id}
                  review={review}
                  now={now}
                  className="animate-unseal"
                  style={{ animationDelay: `${i * 140}ms` }}
                />
              ))}
            </ol>
          </>
        ) : (
          <div className="mt-14 text-center">
            <p className="text-sm leading-relaxed">
              この本のカードは、あなたが最初の一枚です。
            </p>
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              次にこの本を読んだ人が、あなたの字を読みます。
            </p>
          </div>
        )}

        <div className="mt-14 border-t border-rule/70 pt-6">
          <Link
            href={`/works/${work.id}`}
            className="text-sm underline underline-offset-4"
          >
            この本のカードに戻る
          </Link>
        </div>
      </main>
    </>
  );
}
