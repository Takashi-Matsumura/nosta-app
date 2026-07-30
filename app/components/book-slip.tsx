import Link from "next/link";
import type { Work } from "@/lib/types";
import { TagMark } from "./tag-mark";

/** 一覧に並べる小さな札。カードそのものではないので見出しは h2 */
export function BookSlip({
  work,
  href,
  note,
  tagged = false,
}: {
  work: Work;
  href: string;
  note?: React.ReactNode;
  tagged?: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-sm border border-rule bg-paper px-4 py-4 transition-shadow hover:shadow-[0_8px_18px_-14px_rgba(43,38,33,0.6)]"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-base leading-snug">{work.title}</h2>
          <span className="shrink-0 font-mono text-[0.7rem] text-ink-faint">
            {work.callNumber}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{work.author}</p>
        {(note || tagged) && (
          <div className="mt-3 flex items-center gap-3 text-[0.7rem] text-ink-faint">
            {tagged && <TagMark />}
            {note}
          </div>
        )}
      </Link>
    </li>
  );
}
