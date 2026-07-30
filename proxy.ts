import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REALM = "nosta admin";
const ADMIN_USER = process.env.ADMIN_BASIC_AUTH_USER ?? "librarian";

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

function unauthorized() {
  return new NextResponse("認証が必要です", {
    status: 401,
    headers: { "WWW-Authenticate": `Basic realm="${REALM}"` },
  });
}

/**
 * /admin 配下は司書専用。本格的な認証（学校の Google アカウント）が入るまでの
 * 暫定措置として、Basic 認証で誰でも見える状態を防ぐ。
 * ADMIN_BASIC_AUTH_PASSWORD が未設定の環境では、安全側に倒して全て拒否する。
 */
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_BASIC_AUTH_PASSWORD;
  if (!password) {
    return new NextResponse(
      "司書用管理画面は ADMIN_BASIC_AUTH_PASSWORD が未設定のため利用できません。",
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Basic ")) {
    const decoded = Buffer.from(auth.slice(6), "base64").toString("utf-8");
    const separatorIndex = decoded.indexOf(":");
    const user = decoded.slice(0, separatorIndex);
    const pass = decoded.slice(separatorIndex + 1);
    if (safeEqual(user, ADMIN_USER) && safeEqual(pass, password)) {
      return NextResponse.next();
    }
  }

  return unauthorized();
}

export const config = {
  matcher: ["/admin/:path*"],
};
