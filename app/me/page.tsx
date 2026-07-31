import Link from "next/link";
import { requireStudent } from "@/lib/auth";
import { getMyReviews } from "@/lib/data";
import { gradeAt, gradeLabel } from "@/lib/school";
import { ReviewEntry } from "@/app/components/review-entry";
import { SiteHeader } from "@/app/components/site-header";

export default async function MePage() {
  const student = await requireStudent();
  const now = new Date();
  const grade = gradeLabel(gradeAt(student.entranceYear, now));
  const mine = await getMyReviews(student.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <p className="text-sm text-ink-soft">
          {student.entranceYear}年入学 {student.penName}（{grade}）
        </p>
        <h1 className="mt-8 text-xl tracking-wide">じぶんの記録</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          {mine.length > 0
            ? `これまでに${mine.length}枚。卒業したあとも、ここに残ります。`
            : "まだ1枚もありません。"}
        </p>

        <ol className="mt-8 space-y-6">
          {mine.map((review) => (
            <li
              key={review.id}
              className="rounded-sm border border-rule bg-paper"
            >
              <div className="border-b border-rule px-5 py-3.5">
                <Link
                  href={`/works/${review.work.id}`}
                  className="text-base underline-offset-4 hover:underline"
                >
                  {review.work.title}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">
                  {review.work.author}
                </p>
              </div>
              <ol>
                <ReviewEntry review={review} now={now} />
              </ol>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
