import { addUserAction, setUserActiveAction } from "@/lib/actions";
import { requireLibrarian } from "@/lib/auth";
import { getAllUsers } from "@/lib/data";
import { AdminHeader } from "@/app/components/admin-header";

export default async function AdminUsersPage() {
  const me = await requireLibrarian();
  const accounts = await getAllUsers();

  return (
    <>
      <AdminHeader />
      <main className="mx-auto w-full max-w-3xl grow px-5 py-10">
        <h1 className="text-xl tracking-wide">ユーザー</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          ログインできるメールアドレスをここで登録します。登録の無いメールアドレスはログインできません。
          卒業したアカウントは停止します。書いたカードは残ります。
        </p>

        <div className="mt-8 rounded-sm border border-rule bg-paper px-5 py-5">
          <p className="text-sm">アカウントを追加する</p>
          <form action={addUserAction} className="mt-4 space-y-4">
            <div>
              <label htmlFor="email" className="text-xs tracking-widest text-ink-soft">
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="student@your-school.example"
                className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-4 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-ink-soft"
              />
            </div>

            <div>
              <p className="text-xs tracking-widest text-ink-soft">役割</p>
              <div className="mt-1.5 flex gap-5 text-sm">
                <label className="flex items-center gap-1.5">
                  <input type="radio" name="role" value="student" defaultChecked />
                  生徒
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" name="role" value="librarian" />
                  司書
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="flex-1">
                <label htmlFor="penName" className="text-xs tracking-widest text-ink-soft">
                  ペンネーム（生徒のみ）
                </label>
                <input
                  id="penName"
                  name="penName"
                  type="text"
                  placeholder="しおり"
                  className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-4 py-2.5 text-sm outline-none placeholder:text-ink-faint focus:border-ink-soft"
                />
              </div>
              <div className="w-full sm:w-32">
                <label htmlFor="entranceYear" className="text-xs tracking-widest text-ink-soft">
                  入学年度（生徒のみ）
                </label>
                <input
                  id="entranceYear"
                  name="entranceYear"
                  type="number"
                  placeholder="2024"
                  className="mt-1.5 w-full rounded-sm border border-rule bg-paper px-4 py-2.5 font-mono text-sm outline-none placeholder:font-sans placeholder:text-ink-faint focus:border-ink-soft"
                />
              </div>
            </div>

            <button
              type="submit"
              className="rounded-sm border border-navy bg-navy px-6 py-2.5 text-xs tracking-[0.15em] text-paper transition-opacity hover:opacity-90"
            >
              登録する
            </button>
          </form>
        </div>

        <h2 className="mt-10 text-sm text-ink-soft">
          登録済み {accounts.length}件
        </h2>
        <ul className="mt-4 divide-y divide-rule-soft rounded-sm border border-rule bg-paper">
          {accounts.map((account) => (
            <li
              key={account.id}
              className={`flex flex-wrap items-center justify-between gap-x-3 gap-y-1 px-5 py-3.5 ${
                account.active ? "" : "text-ink-faint"
              }`}
            >
              <div>
                <p className="text-sm">{account.email}</p>
                {account.role === "student" && (
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {account.entranceYear}年入学 {account.penName}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-sm border px-1.5 py-px text-[0.7rem] ${
                    account.role === "librarian"
                      ? "border-navy text-navy"
                      : "border-rule text-ink-soft"
                  }`}
                >
                  {account.role === "librarian" ? "司書" : "生徒"}
                </span>
                {!account.active && (
                  <span className="rounded-sm border border-stamp px-1.5 py-px text-[0.7rem] text-stamp">
                    停止中
                  </span>
                )}
                {account.id !== me.id && (
                  <form action={setUserActiveAction}>
                    <input type="hidden" name="userId" value={account.id} />
                    <input
                      type="hidden"
                      name="active"
                      value={account.active ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className={
                        account.active
                          ? "rounded-sm border border-stamp bg-stamp px-3 py-1 text-[0.7rem] text-paper transition-opacity hover:opacity-90"
                          : "rounded-sm border border-rule bg-paper px-3 py-1 text-[0.7rem] text-ink-soft transition-colors hover:bg-paper-aged"
                      }
                    >
                      {account.active ? "停止する" : "再開する"}
                    </button>
                  </form>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </>
  );
}
