import { dismissReportAction, hideReportedReviewAction } from "@/lib/actions";
import { requireLibrarian } from "@/lib/auth";
import { getReports, getWork } from "@/lib/data";
import { authorLabel, gradeLabel, stampDate } from "@/lib/school";
import { AdminHeader } from "@/app/components/admin-header";

export default async function AdminReportsPage() {
  await requireLibrarian();
  const reports = await getReports();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">通報</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          通報された感想を確認し、非表示にするか却下してください。
        </p>

        {reports.length === 0 ? (
          <p className="mt-10 text-sm text-ink-faint">
            未対応の通報はありません。
          </p>
        ) : (
          <ul className="mt-8 space-y-5">
            {await Promise.all(reports.map(async (report) => {
              const work = await getWork(report.review.workId);
              return (
                <li
                  key={report.id}
                  className="rounded-sm border border-rule bg-paper px-5 py-5"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="text-sm">
                      {work?.title ?? "不明な作品"}
                      <span className="ml-2 text-ink-soft">
                        {authorLabel(
                          report.review.author.entranceYear,
                          report.review.penNameAtPost,
                        )}
                      </span>
                    </p>
                    <span className="font-mono text-[0.7rem] text-ink-faint">
                      通報 {stampDate(report.reportedAt)}
                    </span>
                  </div>

                  <p className="mt-3 whitespace-pre-wrap text-sm leading-[1.9] text-ink-soft">
                    {report.review.body}
                  </p>

                  <p className="mt-3 text-xs text-ink-faint">
                    {gradeLabel(report.review.gradeAtPost)}のとき投稿・通報理由:{" "}
                    {report.reason}
                  </p>

                  <div className="mt-4 flex gap-3">
                    <form action={hideReportedReviewAction}>
                      <input
                        type="hidden"
                        name="reportId"
                        value={report.id}
                      />
                      <button
                        type="submit"
                        className="rounded-sm border border-stamp bg-stamp px-5 py-2 text-xs tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
                      >
                        非表示にする
                      </button>
                    </form>
                    <form action={dismissReportAction}>
                      <input
                        type="hidden"
                        name="reportId"
                        value={report.id}
                      />
                      <button
                        type="submit"
                        className="rounded-sm border border-rule bg-paper px-5 py-2 text-xs tracking-[0.15em] text-ink-soft transition-colors hover:bg-paper-aged"
                      >
                        却下する
                      </button>
                    </form>
                  </div>
                </li>
              );
            }))}
          </ul>
        )}
      </main>
    </>
  );
}
