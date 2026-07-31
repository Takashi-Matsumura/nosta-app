"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLibrarian, requireStudent, signOut } from "./auth";
import {
  addReview,
  dismissReport,
  getBorrowedBooks,
  hideReportedReview,
  registerTag,
} from "./data";

export async function postReview(formData: FormData) {
  const student = await requireStudent();

  const workId = String(formData.get("workId") ?? "");
  const copyId = String(formData.get("copyId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  const quotePage = Number(formData.get("quotePage"));

  // 感想を書けるのは、いま借りている本だけ
  const borrowed = (await getBorrowedBooks(student.id)).find(
    (b) => b.copy.id === copyId && b.work.id === workId,
  );
  if (!borrowed) {
    throw new Error("この本は借りていません");
  }
  if (!body) {
    throw new Error("感想が空です");
  }

  const review = await addReview({
    workId,
    copyId,
    studentId: student.id,
    body,
    quote: quoteText
      ? { text: quoteText, page: Number.isFinite(quotePage) ? quotePage : 0 }
      : null,
  });

  redirect(`/works/${workId}/opened?r=${review.id}`);
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

/* ------------------------------------------------------------------ */
/* 司書向け                                                            */
/* ------------------------------------------------------------------ */

export async function dismissReportAction(formData: FormData) {
  await requireLibrarian();
  const reportId = String(formData.get("reportId") ?? "");
  await dismissReport(reportId);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function hideReportedReviewAction(formData: FormData) {
  await requireLibrarian();
  const reportId = String(formData.get("reportId") ?? "");
  await hideReportedReview(reportId);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
}

export async function registerTagAction(formData: FormData) {
  await requireLibrarian();
  const copyId = String(formData.get("copyId") ?? "");
  const token = String(formData.get("token") ?? "").trim();
  if (!token) {
    throw new Error("トークンが空です");
  }
  await registerTag(copyId, token);
  revalidatePath("/admin/tags");
  revalidatePath("/admin");
}
