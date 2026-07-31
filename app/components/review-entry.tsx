import { authorLabel, gradeLabel, stampDate, yearsAgo } from "@/lib/school";
import type { ReviewWithAuthor } from "@/lib/types";

/** カードに記入された1行ぶんの感想 */
export function ReviewEntry({
  review,
  now,
  isMine = false,
  className = "",
  style,
  actions,
}: {
  review: ReviewWithAuthor;
  now: Date;
  isMine?: boolean;
  className?: string;
  style?: React.CSSProperties;
  actions?: React.ReactNode;
}) {
  const ago = yearsAgo(review.postedAt, now);

  return (
    <li
      className={`px-5 py-6 pl-11 ${isMine ? "bg-paper-aged" : ""} ${className}`}
      style={style}
    >
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <span className="text-sm">
          {authorLabel(review.author.entranceYear, review.penNameAtPost)}
        </span>
        <span className="rounded-sm border border-rule px-1.5 py-px text-[0.7rem] text-ink-soft">
          {gradeLabel(review.gradeAtPost)}のとき
        </span>
        {isMine && (
          <span className="text-[0.7rem] tracking-widest text-ink-faint">
            じぶん
          </span>
        )}
        <span className="ml-auto -rotate-2 rounded-sm border border-stamp/50 px-1.5 py-0.5 font-mono text-[0.7rem] tracking-wider text-stamp">
          {stampDate(review.postedAt)}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap leading-[2]">{review.body}</p>

      {review.quote && (
        <blockquote className="mt-5 border-l-2 border-stamp/40 pl-4 text-sm leading-[1.9] text-ink-soft">
          「{review.quote.text}」
          <span className="ml-2 font-mono text-[0.7rem] text-ink-faint">
            p.{review.quote.page}
          </span>
        </blockquote>
      )}

      {ago > 0 && (
        <p className="mt-4 text-[0.7rem] text-ink-faint">{ago}年前の記録</p>
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          {actions}
        </div>
      )}
    </li>
  );
}
