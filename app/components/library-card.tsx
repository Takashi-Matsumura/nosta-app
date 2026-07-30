import type { Work } from "@/lib/types";
import { TagMark } from "./tag-mark";

/**
 * 図書カードそのもの。作品ページの主役なので見出しは h1。
 * 一覧に並べるときは BookSlip を使う。
 */
export function LibraryCard({
  work,
  tagged,
  children,
}: {
  work: Work;
  tagged: boolean;
  children: React.ReactNode;
}) {
  return (
    <article className="relative rounded-sm border border-rule bg-paper shadow-[0_10px_24px_-16px_rgba(43,38,33,0.55)]">
      {/* 綴じ穴 */}
      <span
        aria-hidden
        className="absolute left-4 top-5 h-2.5 w-2.5 rounded-full border border-rule bg-desk-deep"
      />
      <header className="border-b border-rule px-5 pb-4 pl-11 pt-5">
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-[0.65rem] tracking-[0.4em] text-ink-faint">
            図書カード
          </p>
          <p className="font-mono text-[0.7rem] text-ink-faint">
            {work.callNumber}
          </p>
        </div>
        <h1 className="mt-3 text-2xl leading-snug">{work.title}</h1>
        <p className="mt-1.5 text-sm text-ink-soft">{work.author}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.7rem] text-ink-faint">
          <span>
            {work.publisher} {work.publishedYear}
          </span>
          <span>ISBN {work.isbn}</span>
          {tagged && (
            <span className="flex items-center gap-1 not-italic">
              <TagMark />
              タグあり
            </span>
          )}
        </p>
      </header>
      {children}
    </article>
  );
}
