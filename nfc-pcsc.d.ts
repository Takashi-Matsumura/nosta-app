/** nfc-pcsc には型定義が同梱されていないため、実際に使う分だけ最小限に宣言する */
declare module "nfc-pcsc" {
  import { EventEmitter } from "node:events";

  export class Reader extends EventEmitter {
    reader: { name: string };
    autoProcessing: boolean;
    read(blockNumber: number, length: number, blockSize?: number): Promise<Buffer>;
    write(blockNumber: number, data: Buffer, blockSize?: number): Promise<void>;
    close(): void;
  }

  export class NFC extends EventEmitter {
    on(event: "reader", listener: (reader: Reader) => void): this;
    on(event: "error", listener: (error: Error) => void): this;
    close(): void;
  }
}
