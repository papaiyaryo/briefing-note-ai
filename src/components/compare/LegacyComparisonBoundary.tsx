"use client";
import { CompanyComparePage } from "./CompanyComparePage";
export function LegacyComparisonBoundary() {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-bold">このブラウザの旧比較</h2>
      <p>
        旧データはこのブラウザ内だけの記録です。サーバーの保存企業やアカウントへ移行・関連付け・送信しません。
      </p>
      <CompanyComparePage />
    </section>
  );
}
