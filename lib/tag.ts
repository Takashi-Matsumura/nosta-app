import { randomInt } from "node:crypto";

/**
 * Crockford Base32（`i` `l` `o` `u` を除く、紛らわしい文字を避けた32文字）。
 * タグが読めないときの手入力フォールバックが残るため、判読しやすさを優先する。
 */
const TOKEN_ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz";
const TOKEN_LENGTH = 10;

/** NTAG に書き込む蔵書トークンを生成する。UID は使わず、こちらを別途発行する */
export function newTagToken(): string {
  let token = "";
  for (let i = 0; i < TOKEN_LENGTH; i++) {
    token += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  }
  return token;
}

/**
 * タグに書き込むフルURL。APP_BASE_URL は実行時に読む（ビルド時に評価すると落ちるため）。
 * ここで書いた URL は物理的にタグへ焼かれるため、本番ドメインが確定するまでは量産しないこと。
 */
export function tagUrl(token: string): string {
  const base = process.env.APP_BASE_URL;
  if (!base) throw new Error("APP_BASE_URL が設定されていません");
  return `${base.replace(/\/+$/, "")}/c/${token}`;
}
