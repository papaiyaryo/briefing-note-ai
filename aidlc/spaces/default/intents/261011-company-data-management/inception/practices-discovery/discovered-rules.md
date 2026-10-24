# 人間指定の制約

AGENTS.md、project.md、導入方針にある人間指定のみを整理した。質問Q1の回答Aは検証方法の選択としてteam-practices.mdに反映し、新しい絶対禁止規則にはしない。静的観察から必須規則を作らず、この文書の最終承認・memoryへの反映は別途行う。

## Mandated

- ALWAYS Classic/strictと公式ゲートを使い、実際のInception計画承認とCode Generation Plan Approval後にアプリ実装する。
- ALWAYS 1 Intentを1リリースBoltとし、依存Unitsを直列・公式チェックポイント付きで実行する。
- ALWAYS 新規・変更する振る舞いと不具合修正を受入基準に対応するRed → Green → Refactorで実装し、runner確認と実行証拠を公式Unit記録に残す。
- ALWAYS PR前にlint/typecheck/test/buildと受入基準を検証し、Docker変更時はDockerも確認する。
- ALWAYS release/bolt-{number}-{short-description}を使い、日本語PRをBoltごとに1つ作り、CI成功後に人間が最終マージする。
- ALWAYS 承認済み要件・設計・範囲・受入基準・検証コマンドの変更は再承認を得る。
- ALWAYS 実merge SHAのVercel成功・ページ・health・承認済み利用導線を確認してから次Boltを実装する。
- ALWAYS テスト/CIはdummy providersを使い、外部API秘密情報をサーバーに保つ。
- ALWAYS 事実・印象・HR/社員強調・質問・ES/面接材料・Web補足を分け、不明情報を要確認とし、Web出典URL/取得日を保持する。

## Forbidden

- NEVER 人間承認・hook信頼・state/audit receiptを偽造/代行したり、承認ガードを無効化して迂回したりする。
- NEVER mainに直接pushしたり、AIが最終マージしたり、失敗CIをマージしたりする。
- NEVER 成功させるためだけに受入基準やアサーションを弱める。
- NEVER .env・秘密情報・hook trust receipts・machine-local paths・実メモ/OCR内容を不必要に記録/コミットする。
- NEVER 承認計画に含まれない機能・不具合修正・Express・実外部APIテストを追加する。
- NEVER 旧Phase/Issue設計を現在の承認済みIntentの代替にする。
