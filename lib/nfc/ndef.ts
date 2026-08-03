/** NTAG213 のユーザーメモリは page 4〜39 の144バイト。ここ以外は書き込み対象にしない */
export const USER_MEMORY_FIRST_PAGE = 4;
export const USER_MEMORY_BYTES = 144;

/** NFC Forum URI Record Type Definition の接頭辞省略コード。長い接頭辞から順に照合する */
const URI_PREFIXES: Array<{ code: number; prefix: string }> = [
  { code: 0x02, prefix: "https://www." },
  { code: 0x01, prefix: "http://www." },
  { code: 0x04, prefix: "https://" },
  { code: 0x03, prefix: "http://" },
  { code: 0x00, prefix: "" },
];

/** URLをNDEF Type 2 TagのTLV（0x03 … 0xFE）にエンコードし、4バイト境界まで0埋めする */
export function encodeNdefUriTlv(url: string): Buffer {
  const match = URI_PREFIXES.find((p) => url.startsWith(p.prefix))!;
  const rest = url.slice(match.prefix.length);
  const payload = Buffer.concat([
    Buffer.from([match.code]),
    Buffer.from(rest, "ascii"),
  ]);
  if (payload.length > 0xff) {
    throw new Error(`URLが長すぎます（payload ${payload.length} bytes）`);
  }

  // NDEFレコード: [flags(MB|ME|SR|TNF=1)] [type length] [payload length] [type='U'] [payload]
  const record = Buffer.concat([
    Buffer.from([0xd1, 0x01, payload.length, 0x55]),
    payload,
  ]);

  // TLV: [0x03][length][NDEFメッセージ][0xFE ターミネータ]
  const tlv = Buffer.concat([
    Buffer.from([0x03, record.length]),
    record,
    Buffer.from([0xfe]),
  ]);

  const padLen = (4 - (tlv.length % 4)) % 4;
  const padded = Buffer.concat([tlv, Buffer.alloc(padLen, 0x00)]);

  if (padded.length > USER_MEMORY_BYTES) {
    throw new Error(
      `NTAG213のユーザーメモリ(${USER_MEMORY_BYTES}バイト)に収まりません（${padded.length}バイト）`,
    );
  }
  return padded;
}
