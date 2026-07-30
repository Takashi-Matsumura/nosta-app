"use server";

import { redirect } from "next/navigation";
import { addReview, CURRENT_STUDENT_ID, getBorrowedBooks } from "./mock-data";

export async function postReview(formData: FormData) {
  const workId = String(formData.get("workId") ?? "");
  const copyId = String(formData.get("copyId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  const quotePage = Number(formData.get("quotePage"));

  // 感想を書けるのは、いま借りている本だけ
  const borrowed = getBorrowedBooks(CURRENT_STUDENT_ID).find(
    (b) => b.copy.id === copyId && b.work.id === workId,
  );
  if (!borrowed) {
    throw new Error("この本は借りていません");
  }
  if (!body) {
    throw new Error("感想が空です");
  }

  const review = addReview({
    workId,
    copyId,
    studentId: CURRENT_STUDENT_ID,
    body,
    quote: quoteText
      ? { text: quoteText, page: Number.isFinite(quotePage) ? quotePage : 0 }
      : null,
  });

  redirect(`/works/${workId}/opened?r=${review.id}`);
}
