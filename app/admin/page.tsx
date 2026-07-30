import Link from "next/link";
import { countReports, countUntaggedCopies } from "@/lib/mock-data";
import { AdminHeader } from "@/app/components/admin-header";

export default function AdminDashboardPage() {
  const reportCount = countReports();
  const untaggedCount = countUntaggedCopies();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">ダッシュボード</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          通報の確認とタグ登録は、ここから行います。
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/admin/reports"
            className="block rounded-sm border border-rule bg-paper px-5 py-6 transition-shadow hover:shadow-[0_8px_18px_-14px_rgba(43,38,33,0.6)]"
          >
            <p className="text-sm text-ink-soft">未対応の通報</p>
            <p
              className={`mt-2 text-3xl ${reportCount > 0 ? "text-stamp" : ""}`}
            >
              {reportCount}
              <span className="ml-1 text-base text-ink-faint">件</span>
            </p>
          </Link>

          <Link
            href="/admin/tags"
            className="block rounded-sm border border-rule bg-paper px-5 py-6 transition-shadow hover:shadow-[0_8px_18px_-14px_rgba(43,38,33,0.6)]"
          >
            <p className="text-sm text-ink-soft">タグ登録待ちの蔵書</p>
            <p
              className={`mt-2 text-3xl ${untaggedCount > 0 ? "text-stamp" : ""}`}
            >
              {untaggedCount}
              <span className="ml-1 text-base text-ink-faint">冊</span>
            </p>
          </Link>
        </div>
      </main>
    </>
  );
}
