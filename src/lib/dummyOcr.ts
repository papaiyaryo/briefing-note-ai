import { DEMO_OCR_TEXT } from "./sampleData";

export type DummyOcrMode = "success" | "failure";

export type DummyOcrResult =
  | { status: "success"; text: string }
  | { status: "failure"; errorMessage: string };

export function runDummyOcr(mode: DummyOcrMode = "success"): DummyOcrResult {
  if (mode === "failure") {
    return {
      status: "failure",
      errorMessage:
        "ダミー OCR の失敗状態です。画像が暗い、ぼやけている、文字が小さい場合の確認に使います。",
    };
  }

  return {
    status: "success",
    text: DEMO_OCR_TEXT,
  };
}
