import Link from "next/link";
import { deleteReviewAction } from "@/lib/actions";
import { isEditable } from "@/lib/school";
import type { ReviewWithAuthor } from "@/lib/types";

/**
 * 感想1件にぶら下がる操作（直す・消す・通報する）。
 * 表示の判断はここに集約し、ReviewEntry 自体には持たせない。
 */
export function ReviewActions({
  review,
  isMine,
  now,
}: {
  review: ReviewWithAuthor;
  isMine: boolean;
  now: Date;
}) {
  if (!isMine) return null;

  if (review.hidden) {
    return (
      <p className="text-[0.7rem] text-ink-faint">
        この記録は、いまは図書館の画面に出ていません。
      </p>
    );
  }

  if (!isEditable(review.postedAt, now)) {
    return (
      <p className="text-[0.7rem] text-ink-faint">
        投稿から1週間が過ぎたので、この記録はもう直せません。
      </p>
    );
  }

  return (
    <>
      <Link
        href={`/reviews/${review.id}/edit`}
        className="text-[0.7rem] text-ink-soft underline underline-offset-4"
      >
        直す
      </Link>

      <details className="text-[0.7rem]">
        <summary className="cursor-pointer text-ink-soft underline underline-offset-4">
          消す
        </summary>
        <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <p className="leading-relaxed text-ink-faint">
            消すと、この本の先輩のカードはまた伏せられます。
          </p>
          <form action={deleteReviewAction}>
            <input type="hidden" name="reviewId" value={review.id} />
            <button
              type="submit"
              className="shrink-0 rounded-sm border border-stamp px-3 py-1 text-[0.7rem] text-stamp transition-colors hover:bg-stamp hover:text-paper"
            >
              本当に消す
            </button>
          </form>
        </div>
      </details>
    </>
  );
}
