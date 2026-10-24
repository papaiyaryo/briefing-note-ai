# U2 機能設計の判断根拠

## 既存回答の引継ぎ

製品要件について新しい選択を要する未決事項は検出しなかった。質問や回答を代作せず、承認済み要件・契約・リリース計画と本人の最新指示から具体化する。2026-10-23のU2 checkpointの実回答Request Changesを受け、画像入力以降と実倍率200%の画面受入を追加確認する。実Supabase設定とVercel作業は本人担当として後回しにし、ローカルdummy試験を準備する。この記録は新たな実装許可ではない。

## Q1 — 画面再検証の環境確認

ChromeのChatGPT拡張で「Allow access to file URLs」が有効で、ブラウザのメニューから200%表示を確認できる状態か。設定変更は本人の操作とし、こちらで権限を変更しない。これは製品仕様の変更ではなく、未確認経路の検証前提を確認する質問。

- A. 両方確認できる
- B. 案内が必要
- C. 後で対応する
- X. Other (please specify)

[Answer]: A. 両方確認できる

## 境界の確認

- ファイル・構造: 既存画像枚数／形式制約と生成入出力を維持。保存DTOには画像を入れない。
- 文字・情報区分: 本文と構造化項目は別正本。不明は要確認、採用Webは出典必須。
- 認証・通信・並行操作: U1の本人／所有権・有限待機・結果不明・同一操作再試行を使用。旧応答は別draftへ適用しない。
- 保存先・削除: 生成名で企業を作成／改名しない。保存直前に親を再検査し、削除済みは入力保持で停止。
- UI・既存機能: 生成候補の明示保存、未保存破棄確認、生成／既存復習出力を維持。新DB復習連携なし。
- 実装前の製品設定・数値制約・タイムアウトはDelivery Planningと後続NFR設計へ追跡し、本機能設計で再選定しない。

## Sources

- ../../../inception/units-generation/unit-of-work.md
- ../../../inception/units-generation/unit-of-work-story-map.md
- ../../../inception/requirements-analysis/requirements.md
- ../../../inception/domain-design/components.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/user-stories/stories.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md — 実環境設定の後回し、Vercel本人担当の現在方針。

