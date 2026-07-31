"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLibrarian, requireStudent, signOut } from "./auth";
import {
  addReport,
  addReview,
  addUser,
  deleteReview,
  dismissReport,
  getBorrowedBooks,
  hideReportedReview,
  registerTag,
  updatePenName,
  updateReview,
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

export async function updatePenNameAction(formData: FormData) {
  const student = await requireStudent();
  const penName = String(formData.get("penName") ?? "").trim();
  if (!penName) {
    throw new Error("ペンネームが空です");
  }
  await updatePenName(student.id, penName);
  revalidatePath("/me");
  revalidatePath("/");
}

export async function updateReviewAction(formData: FormData) {
  const student = await requireStudent();

  const reviewId = String(formData.get("reviewId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  const quotePage = Number(formData.get("quotePage"));

  if (!body) {
    throw new Error("感想が空です");
  }

  const review = await updateReview(reviewId, student.id, {
    body,
    quote: quoteText
      ? { text: quoteText, page: Number.isFinite(quotePage) ? quotePage : 0 }
      : null,
  });

  redirect(`/works/${review.workId}`);
}

export async function deleteReviewAction(formData: FormData) {
  const student = await requireStudent();
  const reviewId = String(formData.get("reviewId") ?? "");

  const review = await deleteReview(reviewId, student.id);

  revalidatePath(`/works/${review.workId}`);
  revalidatePath("/me");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/tags");
}

export async function reportReviewAction(formData: FormData) {
  const student = await requireStudent();

  const reviewId = String(formData.get("reviewId") ?? "");
  const workId = String(formData.get("workId") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) {
    throw new Error("通報の理由が空です");
  }

  await addReport({ reviewId, reporterId: student.id, reason });

  revalidatePath(`/works/${workId}`);
  revalidatePath("/admin/reports");
  revalidatePath("/admin");
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

export async function addUserAction(formData: FormData) {
  await requireLibrarian();

  const email = String(formData.get("email") ?? "").trim();
  const role = String(formData.get("role") ?? "");
  if (!email.includes("@")) {
    throw new Error("メールアドレスが不正です");
  }
  if (role !== "student" && role !== "librarian") {
    throw new Error("役割が不正です");
  }
  const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;
  if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
    throw new Error(`${allowedDomain} のメールアドレスではありません`);
  }

  if (role === "student") {
    const penName = String(formData.get("penName") ?? "").trim();
    const entranceYear = Number(formData.get("entranceYear"));
    if (!penName) throw new Error("ペンネームが空です");
    if (!Number.isFinite(entranceYear)) throw new Error("入学年度が不正です");
    await addUser({ email, role, penName, entranceYear });
  } else {
    await addUser({ email, role });
  }

  revalidatePath("/admin/users");
}
