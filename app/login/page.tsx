import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-sm grow flex-col justify-center px-6 py-20">
      <h1 className="text-center text-3xl tracking-[0.5em] indent-[0.5em]">
        ノスタ
      </h1>
      <p className="mt-6 text-center text-sm leading-loose text-ink-soft">
        読んだ本の感想を、
        <br />
        次の誰かのために残す。
      </p>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <button
          type="submit"
          className="mt-12 block w-full rounded-sm border border-rule bg-paper px-6 py-4 text-center text-sm tracking-widest transition-colors hover:bg-paper-aged"
        >
          学校の Google アカウントで入る
        </button>
      </form>

      {error && (
        <p className="mt-6 text-center text-xs leading-relaxed text-stamp">
          ログインできませんでした。学校のアカウントでお試しください。
        </p>
      )}

      <p className="mt-8 text-center text-xs leading-relaxed text-ink-faint">
        卒業するとアカウントは止まりますが、
        <br />
        書いたカードは図書館に残ります。
      </p>
    </main>
  );
}
