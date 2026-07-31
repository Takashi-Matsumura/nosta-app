import Link from "next/link";
import { deleteReviewAction, reportReviewAction } from "@/lib/actions";
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
  workId,
  reported = false,
}: {
  review: ReviewWithAuthor;
  isMine: boolean;
  now: Date;
  workId?: string;
  reported?: boolean;
}) {
  if (!isMine) {
    if (reported) {
      return (
        <p className="text-[0.7rem] text-ink-faint">
          通報しました。司書が確認します。
        </p>
      );
    }
    return (
      <details className="text-[0.7rem]">
        <summary className="cursor-pointer text-ink-soft underline underline-offset-4">
          通報する
        </summary>
        <form action={reportReviewAction} className="mt-2 max-w-sm">
          <input type="hidden" name="reviewId" value={review.id} />
          <input type="hidden" name="workId" value={workId} />
          <textarea
            name="reason"
            required
            rows={3}
            placeholder="気になったところを、そのまま書いてください。"
            className="w-full rounded-sm border border-rule bg-paper px-3 py-2 text-xs leading-relaxed outline-none placeholder:text-ink-faint focus:border-ink-soft"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <p className="text-ink-faint">
              司書だけが読みます。書いた人には知らされません。
            </p>
            <button
              type="submit"
              className="shrink-0 rounded-sm border border-rule bg-paper px-3 py-1 text-ink-soft transition-colors hover:bg-paper-aged"
            >
              送信する
            </button>
          </div>
        </form>
      </details>
    );
  }

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
