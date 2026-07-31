"use client";

import Link from "next/link";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import { updateReviewAction } from "@/lib/actions";
import type { Review } from "@/lib/types";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="rounded-sm border border-stamp bg-stamp px-7 py-3.5 text-sm tracking-[0.2em] text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:border-rule disabled:bg-desk-deep disabled:text-ink-faint"
    >
      {pending ? "書き直しています…" : "書き直す"}
    </button>
  );
}

export function EditForm({
  review,
  workId,
  daysLeft,
}: {
  review: Review;
  workId: string;
  daysLeft: number;
}) {
  const [body, setBody] = useState(review.body);
  const isEmpty = body.trim().length === 0;

  return (
    <form action={updateReviewAction} className="mt-8">
      <input type="hidden" name="reviewId" value={review.id} />

      <div className="rounded-sm border border-rule bg-paper shadow-[0_10px_24px_-16px_rgba(43,38,33,0.55)]">
        <div className="border-b border-rule px-5 py-3">
          <label htmlFor="body" className="text-xs tracking-widest text-ink-soft">
            読んで、思ったこと
          </label>
        </div>
        <div className="px-5 py-4">
          <textarea
            id="body"
            name="body"
            rows={9}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="うまく書こうとしなくて大丈夫です。"
            className="card-rules w-full resize-none bg-transparent text-base leading-[1.75rem] outline-none placeholder:text-ink-faint"
          />
        </div>

        <div className="border-t border-rule px-5 py-4">
          <label
            htmlFor="quoteText"
            className="text-xs tracking-widest text-ink-soft"
          >
            心に残った一節（任意）
          </label>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              id="quoteText"
              name="quoteText"
              type="text"
              defaultValue={review.quote?.text ?? ""}
              placeholder="本文から書き写す"
              className="min-w-0 flex-1 border-b border-rule bg-transparent pb-1.5 text-sm outline-none placeholder:text-ink-faint focus:border-ink-soft"
            />
            <div className="flex shrink-0 items-baseline gap-1.5">
              <label htmlFor="quotePage" className="text-xs text-ink-faint">
                p.
              </label>
              <input
                id="quotePage"
                name="quotePage"
                type="number"
                min={1}
                inputMode="numeric"
                defaultValue={review.quote?.page ?? undefined}
                className="w-20 border-b border-rule bg-transparent pb-1.5 font-mono text-sm outline-none focus:border-ink-soft"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
        <SubmitButton disabled={isEmpty} />
        <Link
          href={`/works/${workId}`}
          className="text-sm text-ink-soft underline underline-offset-4"
        >
          やめる
        </Link>
      </div>

      <p className="mt-5 text-xs leading-relaxed text-ink-faint">
        あと{daysLeft}日は直せます。それを過ぎると、そのまま残ります。
      </p>
    </form>
  );
}
