import { NFC, type Reader } from "nfc-pcsc";
import { encodeNdefUriTlv, USER_MEMORY_FIRST_PAGE } from "./ndef";

export class NfcError extends Error {
  code: "no-reader" | "busy" | "timeout" | "write-failed" | "verify-failed";
  constructor(code: NfcError["code"], message: string) {
    super(message);
    this.code = code;
  }
}

const CC_PAGE = 3;
const NTAG213_CC = Buffer.from([0xe1, 0x10, 0x12, 0x00]);
const READER_TIMEOUT_MS = 10_000;
const CARD_TIMEOUT_MS = 20_000;

let writeInFlight: Promise<{ uid: string }> | null = null;

/**
 * タグをリーダーにかざしてもらい、URLをNDEFとして書き込む。
 * 同時に1件しか実行できない（PC/SCリーダーは1台の前提）。
 */
export async function writeTagUrl(url: string): Promise<{ uid: string }> {
  if (writeInFlight) {
    throw new NfcError(
      "busy",
      "他のタグ書き込みが進行中です。しばらくしてからもう一度お試しください",
    );
  }
  const task = writeOnce(url);
  writeInFlight = task;
  try {
    return await task;
  } finally {
    writeInFlight = null;
  }
}

async function writeOnce(url: string): Promise<{ uid: string }> {
  // かざす前に、書き込むデータの妥当性（長さ超過など）を確認しておく
  const data = encodeNdefUriTlv(url);

  const nfc = new NFC();
  try {
    const reader = await waitForReader(nfc);
    const card = await waitForCard(reader);

    try {
      const cc = await readAligned(reader, CC_PAGE, 4);
      if (!cc.equals(NTAG213_CC)) {
        await reader.write(CC_PAGE, NTAG213_CC, 4);
      }
      await reader.write(USER_MEMORY_FIRST_PAGE, data, 4);
    } catch (err) {
      throw new NfcError(
        "write-failed",
        `タグへの書き込みに失敗しました: ${(err as Error).message}`,
      );
    }

    const after = await readAligned(reader, USER_MEMORY_FIRST_PAGE, data.length);
    if (!after.equals(data)) {
      throw new NfcError("verify-failed", "書き込み後の読み戻しが一致しませんでした");
    }

    return { uid: card.uid };
  } finally {
    nfc.close();
  }
}

function waitForReader(nfc: NFC): Promise<Reader> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new NfcError(
          "no-reader",
          "NFCリーダーが見つかりません。RC-S300が接続されているか確認してください",
        ),
      );
    }, READER_TIMEOUT_MS);
    nfc.once("reader", (reader) => {
      clearTimeout(timer);
      resolve(reader);
    });
    nfc.once("error", (err) => {
      clearTimeout(timer);
      reject(new NfcError("no-reader", `NFCリーダーの初期化に失敗しました: ${err.message}`));
    });
  });
}

function waitForCard(reader: Reader): Promise<{ uid: string }> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new NfcError(
          "timeout",
          "20秒以内にタグが検出されませんでした。NTAGをリーダーにかざしてください",
        ),
      );
    }, CARD_TIMEOUT_MS);
    reader.once("card", (card: { uid: string }) => {
      clearTimeout(timer);
      resolve(card);
    });
  });
}

/**
 * NTAG213 の READ は PC/SC 経由だと常に4ページ(16バイト)単位でしか返せない
 * （Leが16でないと 0x6C10 で拒否される）。必要バイト数を16の倍数に切り上げて
 * 読み、先頭だけ切り出す。
 */
async function readAligned(
  reader: Reader,
  startPage: number,
  byteLength: number,
): Promise<Buffer> {
  const alignedLength = Math.ceil(byteLength / 16) * 16;
  const data = await reader.read(startPage, alignedLength, 4);
  return data.subarray(0, byteLength);
}
