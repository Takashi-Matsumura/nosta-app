import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-rule/70">
      <div className="mx-auto flex max-w-3xl items-baseline justify-between px-5 py-4">
        <Link href="/" className="text-lg tracking-[0.35em]">
          ノスタ
        </Link>
        <nav className="flex gap-5 text-sm text-ink-soft">
          <Link href="/search" className="hover:text-ink">
            さがす
          </Link>
          <Link href="/me" className="hover:text-ink">
            じぶんの記録
          </Link>
        </nav>
      </div>
    </header>
  );
}
