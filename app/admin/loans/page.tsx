import Link from "next/link";
import { lendAction, returnLoanAction } from "@/lib/actions";
import { requireLibrarian } from "@/lib/auth";
import {
  getActiveLoanForCopy,
  getActiveLoans,
  getAllStudents,
  getCopiesForWork,
  searchWorks,
} from "@/lib/data";
import { AdminHeader } from "@/app/components/admin-header";

export default async function AdminLoansPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; q?: string }>;
}) {
  await requireLibrarian();
  const { student: studentId, q } = await searchParams;

  const students = await getAllStudents();
  const selected = studentId ? students.find((s) => s.id === studentId) : undefined;
  const activeLoans = await getActiveLoans();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">貸出</h1>

        {selected ? (
          <SelectedStudentView
            studentId={selected.id}
            heading={`${selected.entranceYear}年入学 ${selected.penName} さんに貸し出す`}
            query={q}
            loans={activeLoans.filter((l) => l.student.id === selected.id)}
          />
        ) : (
          <UnselectedView students={students} loans={activeLoans} />
        )}
      </main>
    </>
  );
}

function groupByEntranceYear<T extends { entranceYear: number }>(students: T[]) {
  const groups: { entranceYear: number; students: T[] }[] = [];
  for (const student of students) {
    const last = groups[groups.length - 1];
    if (last && last.entranceYear === student.entranceYear) {
      last.students.push(student);
    } else {
      groups.push({ entranceYear: student.entranceYear, students: [student] });
    }
  }
  return groups;
}

function UnselectedView({
  students,
  loans,
}: {
  students: Awaited<ReturnType<typeof getAllStudents>>;
  loans: Awaited<ReturnType<typeof getActiveLoans>>;
}) {
  const groups = groupByEntranceYear(students);

  return (
    <>
      <p className="mt-2 text-sm leading-relaxed text-ink-soft">
        生徒を選んでから、本の NTAG をかざすかバーコードを入力してください。
      </p>

      <div className="mt-8 space-y-5">
        {groups.map((group) => (
          <div key={group.entranceYear}>
            <p className="text-xs tracking-widest text-ink-faint">
              {group.entranceYear}年入学
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {group.students.map((s) => (
                <Link
                  key={s.id}
                  href={`/admin/loans?student=${s.id}`}
                  className="rounded-sm border border-rule bg-paper px-3 py-1.5 text-sm transition-colors hover:bg-paper-aged"
                >
                  {s.penName}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm text-ink-soft">
        いま貸出中 {loans.length}件
      </h2>
      <LoanList loans={loans} showStudent />
    </>
  );
}

async function SelectedStudentView({
  studentId,
  heading,
  query,
  loans,
}: {
  studentId: string;
  heading: string;
  query: string | undefined;
  loans: Awaited<ReturnType<typeof getActiveLoans>>;
}) {
  return (
    <>
      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm text-ink-soft">{heading}</p>
        <Link
          href="/admin/loans"
          className="text-xs text-ink-soft underline underline-offset-4"
        >
          別の生徒を選ぶ
        </Link>
      </div>

      <div className="mt-6 rounded-sm border border-rule bg-paper px-5 py-5">
        <p className="text-sm">1冊を特定する</p>
        <form action={lendAction} className="mt-3 flex gap-3">
          <input type="hidden" name="studentId" value={studentId} />
          <input
            type="text"
            name="copyKey"
            autoFocus
            required
            placeholder="NTAG をかざす／バーコードを入力"
            aria-label="NTAG またはバーコード"
            className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-4 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
          />
          <button
            type="submit"
            className="shrink-0 rounded-sm border border-navy bg-navy px-5 py-2.5 text-xs tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
          >
            貸し出す
          </button>
        </form>

        <details className="mt-4 text-xs text-ink-faint">
          <summary className="cursor-pointer underline underline-offset-4">
            タグが無い、または見つからないとき
          </summary>
          <form
            action="/admin/loans"
            method="get"
            className="mt-3 flex gap-3"
          >
            <input type="hidden" name="student" value={studentId} />
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="題名か著者で探す"
              aria-label="題名か著者で探す"
              className="min-w-0 flex-1 rounded-sm border border-rule bg-paper px-4 py-2 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-ink-soft"
            />
            <button
              type="submit"
              className="shrink-0 rounded-sm border border-rule bg-paper px-4 text-xs tracking-widest text-ink-soft transition-colors hover:bg-paper-aged"
            >
              探す
            </button>
          </form>

          {query && (
            <ManualSearchResults studentId={studentId} query={query} />
          )}
        </details>
      </div>

      <h2 className="mt-8 text-sm text-ink-soft">この生徒の貸出中 {loans.length}件</h2>
      <LoanList loans={loans} />
    </>
  );
}

async function ManualSearchResults({
  studentId,
  query,
}: {
  studentId: string;
  query: string;
}) {
  const works = await searchWorks(query);
  if (works.length === 0) {
    return <p className="mt-3 leading-relaxed">見つかりませんでした。</p>;
  }

  return (
    <ul className="mt-3 space-y-3">
      {await Promise.all(
        works.map(async (work) => {
          const copies = await getCopiesForWork(work.id);
          return (
            <li key={work.id}>
              <p className="text-ink">
                {work.title}
                <span className="ml-2 text-ink-soft">{work.author}</span>
              </p>
              <ul className="mt-1.5 space-y-1.5">
                {await Promise.all(
                  copies.map(async (copy) => {
                    const activeLoan = await getActiveLoanForCopy(copy.id);
                    return (
                      <li
                        key={copy.id}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="font-mono">
                          {copy.barcode}
                          {copy.tagToken === null && "（タグなし）"}
                        </span>
                        {activeLoan ? (
                          <span className="text-ink-faint">貸出中</span>
                        ) : (
                          <form action={lendAction}>
                            <input type="hidden" name="studentId" value={studentId} />
                            <input type="hidden" name="copyId" value={copy.id} />
                            <button
                              type="submit"
                              className="rounded-sm border border-navy px-2.5 py-1 text-navy transition-colors hover:bg-navy hover:text-paper"
                            >
                              この1冊を貸す
                            </button>
                          </form>
                        )}
                      </li>
                    );
                  }),
                )}
              </ul>
            </li>
          );
        }),
      )}
    </ul>
  );
}

function LoanList({
  loans,
  showStudent = false,
}: {
  loans: Awaited<ReturnType<typeof getActiveLoans>>;
  showStudent?: boolean;
}) {
  if (loans.length === 0) {
    return <p className="mt-4 text-sm text-ink-faint">貸出中の本はありません。</p>;
  }

  return (
    <ul className="mt-4 divide-y divide-rule-soft rounded-sm border border-rule bg-paper">
      {loans.map(({ loan, copy, work, student }) => (
        <li
          key={loan.id}
          className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3.5"
        >
          <div>
            <p className="text-sm">
              {work.title}
              <span className="ml-2 text-ink-soft">{work.author}</span>
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {loan.borrowedAt} に貸出（<span className="font-mono">{copy.barcode}</span>）
              {showStudent && <> ／ {student.penName}</>}
            </p>
          </div>
          <form action={returnLoanAction}>
            <input type="hidden" name="loanId" value={loan.id} />
            <button
              type="submit"
              className="shrink-0 rounded-sm border border-rule bg-paper px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-paper-aged"
            >
              返却する
            </button>
          </form>
        </li>
      ))}
    </ul>
  );
}
