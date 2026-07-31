"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLibrarian, requireStudent, signOut } from "./auth";
import {
  addLoan,
  addReport,
  addReview,
  addUser,
  addWork,
  deleteReview,
  dismissReport,
  getCopy,
  getCopyByBarcode,
  getCopyByToken,
  getWritableLoan,
  hideReportedReview,
  registerTag,
  returnLoan,
  setUserActive,
  updatePenName,
  updateReview,
} from "./data";
import { fetchBook } from "./openbd";

export async function postReview(formData: FormData) {
  const student = await requireStudent();

  const workId = String(formData.get("workId") ?? "");
  const copyId = String(formData.get("copyId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  const quoteText = String(formData.get("quoteText") ?? "").trim();
  const quotePage = Number(formData.get("quotePage"));

  // 感想を書けるのは、借りているか、返却から猶予期間内の本だけ
  const writable = await getWritableLoan(student.id, workId);
  if (!writable || writable.copy.id !== copyId) {
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

export async function setUserActiveAction(formData: FormData) {
  const me = await requireLibrarian();

  const userId = String(formData.get("userId") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (!active && userId === me.id) {
    throw new Error("自分のアカウントは停止できません");
  }

  await setUserActive(userId, active);
  revalidatePath("/admin/users");
}

/**
 * 貸し出す。1冊の特定は copyId（手動選択）か copyKey（NTAG タップ／バーコード）の
 * どちらか。copyKey は USB NFC リーダーがタグの URL 全体を打ち込むことがあるので、
 * 末尾のトークンだけ取り出してタグ→バーコードの順に照合する。
 */
export async function lendAction(formData: FormData) {
  await requireLibrarian();

  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) {
    throw new Error("生徒が選ばれていません");
  }

  const copyId = String(formData.get("copyId") ?? "").trim();
  const copy = copyId ? await getCopy(copyId) : await resolveCopyByKey(formData);
  if (!copy) {
    throw new Error("不明な蔵書です");
  }

  await addLoan(copy.id, studentId);
  revalidatePath("/admin/loans");
  revalidatePath("/");
}

async function resolveCopyByKey(formData: FormData) {
  const raw = String(formData.get("copyKey") ?? "").trim();
  if (!raw) {
    throw new Error("NTAG かバーコードを入力してください");
  }
  const key = raw.split("/").pop() ?? "";
  const copy = (await getCopyByToken(key)) ?? (await getCopyByBarcode(key));
  if (!copy) {
    throw new Error(`タグにもバーコードにも一致しません: ${raw}`);
  }
  return copy;
}

export async function returnLoanAction(formData: FormData) {
  await requireLibrarian();
  const loanId = String(formData.get("loanId") ?? "");
  await returnLoan(loanId);
  revalidatePath("/admin/loans");
  revalidatePath("/");
}

/** openBD の照会（/admin/works?isbn=... の GET）自体は Server Component 側で行い、ここは登録だけを扱う */
export async function addWorkAction(formData: FormData) {
  await requireLibrarian();

  const isbn = String(formData.get("isbn") ?? "").replace(/[-\s]/g, "").trim();
  const callNumber = String(formData.get("callNumber") ?? "").trim();
  const barcode = String(formData.get("barcode") ?? "").trim();

  if (!/^(\d{9}[\dX]|\d{13})$/.test(isbn)) {
    throw new Error("ISBN が不正です");
  }
  if (!callNumber) {
    throw new Error("請求記号が空です");
  }
  if (!barcode) {
    throw new Error("バーコードが空です");
  }

  const book = await fetchBook(isbn);
  if (!book) {
    throw new Error(`openBD に ISBN ${isbn} の本が見つかりませんでした`);
  }

  await addWork({ ...book, callNumber, barcode });
  revalidatePath("/admin/works");
}
