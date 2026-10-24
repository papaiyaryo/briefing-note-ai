# U2再開：root最終自己点検

## Scope and Results

2026-10-23 Asia/Tokyo。承認済みU2計画と現在成果物を照合した。今回のapp/test/config追加変更はなく、既存R1〜R8とgenuine TDD履歴を保持。新しい人工Redを作っていない。現在の実行結果と初回timeout・明示Retryはrestart-verification-2026-10-23.md、GUIの到達範囲とcleanupはmanual-restart-20261023-root.mdを参照する。

- rootの読取専用検査：U1の96ファイル、U3の29ファイルは保管hashと全一致。凍結されたsourceへ書込みなし。
- U2累積41claimsはすべて実在。過去snapshotとの差は今回更新したdocs/generated-notes-checks.mdだけで、残る40ファイル（app/testを含む）は一致。snapshotを現在の公式review/checkpoint proofとみなさない。
- traceabilityは135 unique upstream IDs、90AC/14BR/31NFR、OK71/Deferred64を維持。OKのtargetはすべて実在。native200%などの未確認をOKへ昇格していない。
- 現在のmanual、verification、summaryはU+FFFDなし、行末空白なし、H2はそれぞれ4/7/4。新しい説明文に秘密値・私的画像/本文は含めていない。
- 初回root scratch検査は旧snapshot schemaを単一のhashes配列と仮定したためU1/U3を0件としていた。その結果は凍結source一致の証拠として採用しない。scratchだけを配列形式の実測・期待96/41/29件の必須検査へ修正し、再実行exit0で上記件数を確認した。アプリRedや試験成功へ数えていない。

## Remaining Acceptance

native拡大キーが実寸法へ反映されず、filechooserもtimeoutした。画像以降の実操作・保存後OCR/復習往復・native200%・各幅/キーボードは未確認。準備不成立を製品不具合と断定して対象外修正をしていない。Step5/6は未チェックのまま残す。

全体npm testの初回は既存U1の5000ms timeout1件。本人Retry後は条件を変えず635件成功、coverageも635件成功・lines85.95%（2962/3446）、lint/typecheck/build/diffもexit0。再発原因は未確定であり、成功を原因解消の証拠にしない。preview停止のhelper exit1は保持し、その後のportと権限付きprocess読取で専用process終了を確認した。実Auth・Supabase・外部provider・実CI・本番は未確認。

