import { notFound, redirect } from "next/navigation";
import { getCopyByToken } from "@/lib/mock-data";

/**
 * NTAG に書き込む URL の受け口。タグには UID ではなくこのトークンを載せる
 * （NFC の UID は読み取り・複製ができるため）。
 */
export default async function TagPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const copy = getCopyByToken(token);
  if (!copy) notFound();

  redirect(`/works/${copy.workId}`);
}
