import Link from "next/link";
import { signOutAction } from "@/lib/actions";

/** 司書用の画面であることを示すヘッダー。生徒向け SiteHeader とは藍色で区別する */
export function AdminHeader() {
  return (
    <header className="border-b border-navy/30 bg-navy text-paper">
      <div className="mx-auto flex max-w-3xl items-baseline justify-between px-5 py-4">
        <p className="flex items-baseline gap-3">
          <Link href="/admin" className="text-lg tracking-[0.35em]">
            ノスタ
          </Link>
          <span className="text-[0.65rem] tracking-[0.2em] text-paper/70">
            司書用
          </span>
        </p>
        <nav className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-sm text-paper/80">
          <Link href="/admin" className="hover:text-paper">
            ダッシュボード
          </Link>
          <Link href="/admin/reports" className="hover:text-paper">
            通報
          </Link>
          <Link href="/admin/tags" className="hover:text-paper">
            タグ登録
          </Link>
          <Link href="/admin/loans" className="hover:text-paper">
            貸出
          </Link>
          <Link href="/admin/users" className="hover:text-paper">
            ユーザー
          </Link>
          <form action={signOutAction}>
            <button type="submit" className="hover:text-paper">
              サインアウト
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
