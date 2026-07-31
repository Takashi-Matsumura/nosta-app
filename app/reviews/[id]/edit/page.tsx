import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { getReview, getWork } from "@/lib/data";
import { editableDaysLeft, isEditable } from "@/lib/school";
import { SiteHeader } from "@/app/components/site-header";
import { EditForm } from "./edit-form";

export default async function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const student = await requireStudent();
  const review = await getReview(id);
  if (!review) notFound();

  const work = await getWork(review.workId);
  if (!work) notFound();

  const now = new Date();
  const reason =
    review.studentId !== student.id
      ? "自分の感想だけ直せます。"
      : review.hidden
        ? "この感想は司書によって非表示にされているため、直せません。"
        : !isEditable(review.postedAt, now)
          ? "投稿から1週間を過ぎたため、直せません。"
          : null;

  if (reason) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl grow px-5 py-16">
          <p className="text-sm leading-relaxed">{reason}</p>
          <Link
            href={`/works/${work.id}`}
            className="mt-6 inline-block text-sm underline underline-offset-4"
          >
            本のページに戻る
          </Link>
        </main>
      </>
    );
  }

  const daysLeft = editableDaysLeft(review.postedAt, now);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <p className="text-[0.65rem] tracking-[0.4em] text-ink-faint">
          書き直す
        </p>
        <h1 className="mt-3 text-2xl leading-snug">{work.title}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">{work.author}</p>

        <EditForm review={review} workId={work.id} daysLeft={daysLeft} />
      </main>
    </>
  );
}
