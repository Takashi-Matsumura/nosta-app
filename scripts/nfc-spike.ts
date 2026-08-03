/**
 * RC-S300 (PC/SC) で NTAG213 に URL を読み書きできるか確かめる検証スクリプト。
 * アプリ本体（DB・Next.js）には一切触れない。失敗した段階がわかるよう、
 * ステップごとにログを出す。
 *
 * 使い方: npm run nfc:spike
 * 書き込むURLを変えたい場合: NFC_SPIKE_URL="http://192.168.1.15:3000/c/nfctest01" npm run nfc:spike
 */
import { NFC } from "nfc-pcsc";

const TARGET_URL =
  process.env.NFC_SPIKE_URL ?? "http://192.168.1.15:3000/c/nfctest01";

const NTAG213_USER_MEMORY_BYTES = 144; // ページ4〜39
const CC_PAGE = 3;
const USER_MEMORY_START_PAGE = 4;
const NTAG213_CC = Buffer.from([0xe1, 0x10, 0x12, 0x00]); // NDEF対応, v1.0, 144byte, フルアクセス

function log(step: string, message: string) {
  console.log(`[${step}] ${message}`);
}

/**
 * NTAG213 の READ コマンドは PC/SC 経由だと常に4ページ(16バイト)単位でしか
 * 返せない（Leが16でないと 0x6C10 で拒否される）。必要バイト数を16の倍数に
 * 切り上げて読み、先頭だけ切り出す。
 */
// nfc-pcsc に型定義が無いため reader は any で受ける
async function readAligned(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reader: any,
  startPage: number,
  byteLength: number,
): Promise<Buffer> {
  const alignedLength = Math.ceil(byteLength / 16) * 16;
  const data = await reader.read(startPage, alignedLength, 4);
  return data.subarray(0, byteLength);
}

/** URIレコードの接頭辞省略コード（NFC Forum URI Record Type Definition） */
const URI_PREFIXES: Array<{ code: number; prefix: string }> = [
  { code: 0x04, prefix: "https://" },
  { code: 0x03, prefix: "http://" },
  { code: 0x02, prefix: "https://www." },
  { code: 0x01, prefix: "http://www." },
  { code: 0x00, prefix: "" },
];

function buildNdefUriTlv(url: string): Buffer {
  const match = URI_PREFIXES.find((p) => url.startsWith(p.prefix)) ?? {
    code: 0x00,
    prefix: "",
  };
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

  if (tlv.length > NTAG213_USER_MEMORY_BYTES) {
    throw new Error(
      `NTAG213のユーザーメモリ(${NTAG213_USER_MEMORY_BYTES}バイト)に収まりません（TLV ${tlv.length}バイト）`,
    );
  }

  // ページ書き込みは4バイト単位のみ許可されるため0パディング
  const padLen = (4 - (tlv.length % 4)) % 4;
  return Buffer.concat([tlv, Buffer.alloc(padLen, 0x00)]);
}

async function main() {
  log("init", `書き込み予定URL: ${TARGET_URL}`);
  const nfc = new NFC();
  let settled = false;

  const timeout = setTimeout(() => {
    if (!settled) {
      console.error(
        "[timeout] 30秒以内にタグが検出されませんでした。RC-S300が接続されているか、NTAG213がリーダーに正しく載っているか確認してください。",
      );
      process.exit(1);
    }
  }, 30_000);

  nfc.on("reader", (reader) => {
    log("reader", `リーダーを検出: ${reader.reader.name}`);

    reader.on("card", async (card) => {
      settled = true;
      clearTimeout(timeout);

      try {
        log("card", `タグを検出: ATR=${card.atr?.toString("hex")} UID=${card.uid}`);

        log("cc-read", `ページ${CC_PAGE}（Capability Container）を読み取り中...`);
        const cc = await readAligned(reader, CC_PAGE, 4);
        log("cc-read", `CC = ${cc.toString("hex")}`);

        if (!cc.equals(NTAG213_CC)) {
          log(
            "cc-write",
            `CCがNTAG213標準値(${NTAG213_CC.toString("hex")})と異なるため書き込みます（NDEFフォーマット化）`,
          );
          await reader.write(CC_PAGE, NTAG213_CC, 4);
          log("cc-write", "CC書き込み完了");
        } else {
          log("cc-write", "既にNDEFフォーマット済み。スキップ");
        }

        log(
          "backup-read",
          `既存のユーザーメモリ（ページ${USER_MEMORY_START_PAGE}〜）を退避表示...`,
        );
        const before = await readAligned(
          reader,
          USER_MEMORY_START_PAGE,
          NTAG213_USER_MEMORY_BYTES,
        );
        log("backup-read", `現在の内容 = ${before.toString("hex")}`);

        const data = buildNdefUriTlv(TARGET_URL);
        log(
          "write",
          `NDEF URIレコードを組み立て（${data.length}バイト） = ${data.toString("hex")}`,
        );
        await reader.write(USER_MEMORY_START_PAGE, data, 4);
        log("write", "書き込み完了");

        log("verify", "読み戻して一致確認中...");
        const after = await readAligned(reader, USER_MEMORY_START_PAGE, data.length);
        if (after.equals(data)) {
          log("verify", "OK: 書き込んだ内容と読み戻した内容が一致しました");
          log(
            "done",
            `検証成功。iPhoneでこのタグをタップし、${TARGET_URL} が開くか確認してください。`,
          );
        } else {
          console.error(
            `[verify] NG: 不一致。書き込み=${data.toString("hex")} / 読み戻し=${after.toString("hex")}`,
          );
          process.exitCode = 1;
        }
      } catch (err) {
        console.error("[error]", err);
        process.exitCode = 1;
      } finally {
        process.exit(process.exitCode ?? 0);
      }
    });

    reader.on("error", (err) => {
      console.error("[reader-error]", err);
    });
  });

  nfc.on("error", (err) => {
    console.error("[nfc-error]", err);
    process.exit(1);
  });

  log("init", "リーダー検出待ち... NTAG213をRC-S300に載せてください");
}

main();
