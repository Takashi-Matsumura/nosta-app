/**
 * 伏せられたカード。自分が書き終えるまで、先輩の感想は開かない。
 * 「何人ぶんあるか」だけは見せて、書く動機にする。
 */
export function SealedNotice({ count }: { count: number }) {
  return (
    <div className="card-back border-t border-rule px-5 py-14 text-center">
      {count > 0 ? (
        <>
          <p className="text-sm leading-relaxed">
            この本には、{count}人ぶんのカードが挟まっています。
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            まだ読めません。
            <br />
            あなたが自分の感想を書き終えると、ここが開きます。
          </p>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed">
            この本のカードは、まだ白紙です。
          </p>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            あなたが最初の一人になります。
          </p>
        </>
      )}
    </div>
  );
}
