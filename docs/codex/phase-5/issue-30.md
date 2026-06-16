# Issue #30 設計: セキュリティ・プライバシー確認を実施する

対象 GitHub Issue: #30(`docs/generated-issues/05-04-セキュリティ-プライバシー確認を実施する.md`)
Phase: 5 / 優先度: High / 実装順: **3 番目**

## Issue 概要

画像・OCR テキスト・生成 Markdown の扱いが就活情報として安全かを確認し、結果を記録する。
本 Issue は基本的にコードを変更せず、確認とドキュメント化が中心。

## スコープ

- ログ出力に画像内容・OCR 全文・生成 Markdown・個人情報が含まれていないか確認する
- API キーや `.env` がコミットされていないか確認する
- 外部送信なし(MVP はダミー OCR・ローカル生成のみで、ネットワークリクエストを行わない)ことを
  コードレベルで確認する
- 確認結果を `docs/security-review.md` に記録する

## スコープ外

- 本番監査体制の構築
- 認証・権限管理の実装
- 依存パッケージ脆弱性スキャンの CI 組み込み(手動 `npm audit` 実行・結果記録まではスコープ内)
- README の更新(#31 に集約するため、本 Issue では行わない)

## 共有設計判断(Phase 計画より)

- 本 Issue はドキュメント作成と確認作業が中心であり、README は編集しない。README からの
  リンクは #31 で追加する。
- 確認の過程で軽微な問題(コメントの追記漏れ等)が見つかった場合は本 Issue のスコープ内で
  最小修正してよいが、設計や機能に関わる修正が必要な場合は別 Issue として切り出す。

## 実装ステップ

1. ログ出力の確認:

   ```bash
   grep -rn "console\." src app
   ```

   設計時点では 0 件。実装時に増えていないか再確認し、増えていた場合は出力内容が画像内容 /
   OCR 全文 / 生成 Markdown / 個人情報を含まないことを確認する。
2. 秘密情報のコミット確認:

   ```bash
   git ls-files | grep -i env
   cat .gitignore
   cat .env.example
   ```

   `.env` がトラッキングされていないこと、`.gitignore` に `.env` 相当の除外設定があること、
   `.env.example` には空値またはプレースホルダのみが入っていることを確認する。
3. 外部送信なしの確認:

   ```bash
   grep -rn "fetch(\|axios\|XMLHttpRequest" src app
   ```

   `app/api/health/route.ts` 以外に、OCR / Markdown 生成経路でネットワーク呼び出しが
   発生していないことを確認する(`src/lib/dummyOcr.ts` がローカルの擬似処理のみであることを
   含む)。
4. 依存パッケージの脆弱性確認(任意・手動):

   ```bash
   npm audit
   ```

   結果を `docs/security-review.md` に転記する(High/Critical があれば対応方針を記載、
   本 Issue での修正が必要かどうかは別途判断する)。
5. `docs/security-review.md` を新規作成し、以下を記録する。
   - 確認日、対象コミット
   - チェックリストと結果(OK / NG / 該当なし)
   - MVP の保存方針(永続化なし、ブラウザのメモリ上にのみ保持、ユーザー操作による `.md`
     ダウンロードのみがファイル出力)
   - 既知の制約(ダミー OCR のため、実際の画像内容は OCR 処理に使われていない 等)

## 変更が想定されるファイル

- `docs/security-review.md`(新規)

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 秘密情報が repo に含まれていない | `.env` / `.gitignore` / `.env.example` の確認 |
| 個人情報を不要にログ出力しない | `console.*` の grep 確認 |
| MVP の保存方針が明記されている | `docs/security-review.md` 内に明記(README からは #31 でリンク) |

## 検証コマンド

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

(コードを変更しない想定のため、Issue 着手前と同じ結果で通ることを確認する。)

## リスク / 不明点

- **確認中に問題が見つかった場合**: 秘密情報の混入など重大な問題が見つかった場合は、本 Issue の
  スコープを超える可能性がある。その場合は人間に報告し、対応を別 Issue にするか本 Issue 内で
  緊急修正するかを判断してもらう。
- **`npm audit` の結果**: 開発依存の脆弱性まで本 Issue で全て解消するとスコープが膨らむため、
  記録と簡単な方針メモまでに留め、対応自体は必要なら別 Issue にする。
