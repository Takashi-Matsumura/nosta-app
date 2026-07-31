import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { countReviews, getBorrowedBooks, getWork } from "@/lib/data";
import { gradeAt, gradeLabel } from "@/lib/school";
import { SiteHeader } from "@/app/components/site-header";
import { WriteForm } from "./write-form";

export default async function WritePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const work = await getWork(id);
  if (!work) notFound();

  const student = await requireStudent();
  const borrowed = (await getBorrowedBooks(student.id)).find(
    (b) => b.work.id === work.id,
  );

  // 借りていない本には書けない
  if (!borrowed) {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl grow px-5 py-16">
          <p className="text-sm leading-relaxed">
            『{work.title}』は借りていないため、カードを書けません。
          </p>
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

  const grade = gradeLabel(gradeAt(student.entranceYear, new Date()));
  const waiting = await countReviews(work.id);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <p className="text-[0.65rem] tracking-[0.4em] text-ink-faint">記入</p>
        <h1 className="mt-3 text-2xl leading-snug">{work.title}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">{work.author}</p>
        <p className="mt-4 text-xs text-ink-faint">
          {student.entranceYear}年入学 {student.penName}（{grade}）として記入します
        </p>

        <WriteForm
          workId={work.id}
          copyId={borrowed.copy.id}
          waiting={waiting}
        />
      </main>
    </>
  );
}
