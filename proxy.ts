import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

/** ログインしていなくても開けるパス */
const PUBLIC_PATHS = ["/login"];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/auth");
}

/**
 * 全ページ、ログイン必須。/admin 配下はさらに司書ロールが必須。
 * 「読む＝ログイン不要」の運用は据置端末の扱いが決まってから対応する。
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isAdminPath = pathname.startsWith("/admin");
  if (isAdminPath && session.user.role !== "librarian") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  // 司書アカウントは生徒向けページを見る理由が無いので、常に /admin に集約する
  if (!isAdminPath && session.user.role === "librarian") {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
