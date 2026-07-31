import { redirect } from "next/navigation";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { getStudent, getUserByEmail } from "./data";

const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN;

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      // 毎回アカウント選択を出す。複数の Google アカウントでログインしている
      // ブラウザだと、これが無いと Google 側が黙って別アカウントを使ってしまう
      authorization: { params: { prompt: "select_account" } },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    /** 学校のドメイン外のメール、users に登録の無いアカウント、停止済みのアカウントを弾く */
    async signIn({ profile }) {
      const email = profile?.email;
      if (!email) return false;
      if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) return false;
      const user = await getUserByEmail(email);
      return user?.active ?? false;
    },
    async jwt({ token, profile }) {
      const email = profile?.email ?? token.email;
      if (email) {
        const user = await getUserByEmail(email);
        // 停止されたアカウント（登録が消えた場合を含む）は、ここでセッションごと落とす
        if (!user || !user.active) return null;
        token.userId = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.userId && token.role) {
        session.user.id = token.userId;
        session.user.role = token.role;
      }
      return session;
    },
  },
});

/** ログイン必須ページの先頭で呼ぶ。未ログインなら /login に送る */
export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id || !session.user.role) {
    redirect("/login");
  }
  return session.user;
}

/** 生徒本人のページ用。生徒のプロフィール（ペンネーム等）まで解決して返す */
export async function requireStudent() {
  const user = await requireSession();
  if (user.role !== "student") {
    redirect("/login");
  }
  return getStudent(user.id);
}

/** 司書用ページの先頭で呼ぶ。生徒アカウントでは開けない */
export async function requireLibrarian() {
  const user = await requireSession();
  if (user.role !== "librarian") {
    redirect("/login");
  }
  return user;
}
