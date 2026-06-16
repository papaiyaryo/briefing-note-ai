# Issue #30 設計: セキュリティ・プライバシー確認を実施する

対象 GitHub Issue: #30(`docs/generated-issues/05-04-セキュリティ-プライバシー確認を実施する.md`)
Phase: 5 / 優先度: High / 実装順: **4 番目**(`docs/codex/phase-5/implementation-plan.md` 参照)
依存: Phase 4 MVP フロー(#22-#26)

## Issue 概要

画像・OCR テキスト・Markdown の扱いが就活情報として安全かを確認する。本番監査や認証・権限管理は対象外で、
「ログに個人情報を出していないか」「秘密情報を repo に含んでいないか」「外部送信しない MVP 前提を文書化しているか」
の 3 点に絞った、MVP 規模の確認作業。

## スコープ

- ログ出力に画像内容や OCR 全文が含まれないか確認する。
- API キーや `.env` がコミットされていないか確認する。
- 外部送信なしの MVP 前提を README / docs に明記する。

## スコープ外

- 本番監査体制の構築。
- 認証・権限管理の実装。
- Phase 6(OpenAI)/ Phase 7(Google Drive)連携後のセキュリティ設計(着手前に本 Issue の観点で再確認する)。

## 確認結果(設計時点の事前調査)

設計時点でのリポジトリ状態を以下のコマンドで確認した。Codex 実装時はこの手順を再実行し、結果を PR に記録する。

```bash
# 1. ログ出力の確認(console.* の呼び出しを全件確認)
grep -rn "console\.\(log\|warn\|error\|debug\|info\)" app src tests

# 2. .env や秘密情報がコミットされていないかの確認
git ls-files | grep -i "\.env"
cat .gitignore | grep -A2 "dotenv"

# 3. 外部通信の有無の確認(fetch / XMLHttpRequest の呼び出し箇所)
grep -rn "fetch(\|XMLHttpRequest" app src
```

設計時点の結果:

- `console.*` 呼び出しは `app/` `src/` `tests/` 全体で **0 件**。画像・OCR・Markdown を出力するログは存在しない。
- `git ls-files` に `.env` は含まれず、`.env.example` のみが管理対象。`.gitignore` で `.env` / `.env.*`
  (`.env.example` を除く)が除外されている。
- `fetch` / `XMLHttpRequest` の呼び出しは `app/` `src/` に存在せず、現状の MVP フローはブラウザ内処理のみ
  (`app/api/health` のヘルスチェック API は存在するが、フロントエンドの MVP フローからは呼び出されていない)。

この結果から、Acceptance Criteria の (1)(2) は **設計時点で実質的に満たされている**。
Codex 実装時の主な作業は (3) の README / docs 追記と、(1)(2) を再現可能な確認手順として記録することになる。

## 実装ステップ

1. 上記「確認結果」の 3 コマンドを実装時点で再実行し、差分がないか確認する。
   - もし `console.*` 呼び出しが見つかった場合、出力内容が画像 / OCR 全文 / Markdown 全文 / 個人情報を
     含んでいないかを個別に確認し、含む場合は除去または要約表示に変更する(本 Issue の範囲で対応する)。
   - `.env` 相当のファイルが見つかった場合は `git rm --cached` で追跡を外し、`.gitignore` を確認する。
2. README に「セキュリティとプライバシー」または「データの扱い」セクションを 1 つ追加する。
   含める内容:
   - 現時点(MVP)では画像・OCR テキスト・Markdown を外部送信しない(OpenAI / Google Drive 等の API を呼ばない)。
   - 画像・OCR テキスト・Markdown はブラウザのメモリ内(React state)にのみ保持し、リロードで消える
     (サーバー保存・DB 永続化を行わない)。
   - ログに画像内容や OCR 全文、生成 Markdown、個人情報を出力しない方針であること。
   - `.env` はコミットしない、`.env.example` のみを管理する方針であること。
   - Phase 6 / Phase 7 で外部 API 連携を追加する際は本前提が変わるため、その時点で再確認する。
3. `docs/architecture.md` の「セキュリティとプライバシー」節と矛盾しないか確認する
   (既存の記述を流用・参照してよい。重複した方針を別の言葉で書き直さない)。
4. 確認した内容(コマンドと結果)を PR 本文に記録する(Self review の一部として)。
   `docs/` に確認ログ用の新規ファイルを作る必要はない(README 追記で AC を満たせるため)。

## 変更が想定されるファイル

- `README.md`(「セキュリティとプライバシー」または同等のセクションを追加)
- (確認のみで変更なしの可能性が高い)`app/`, `src/`, `.env.example`, `.gitignore`

## Acceptance Criteria マッピング

| AC | 対応 |
| --- | --- |
| 秘密情報が repo に含まれていない | `git ls-files` で `.env` 系ファイルが含まれないことを確認(実装ステップ 1) |
| 個人情報を不要にログ出力しない | `console.*` の grep 確認で対象呼び出しが 0 件であることを確認(実装ステップ 1) |
| MVP の保存方針が明記されている | README に「外部送信なし」「ブラウザ内のみ保持」を明記(実装ステップ 2) |

## 検証コマンド

コード変更を行わない場合(確認のみ)は以下で十分:

```bash
npm run lint
npm run format:check
```

README 以外のコード変更が発生した場合(想定外のログ出力や秘密情報を見つけて修正した場合)は、
`docs/codex/phase-5/implementation-plan.md` の Phase 全体検証方針に従い以下も実行する:

```bash
npm run typecheck
npm test
npm run build
```

## リスク / 不明点

- **将来の再発防止**: 現時点でログ出力 0 件でも、Phase 6(OpenAI 連携)でエラーログにレスポンス全文を
  出力してしまうリスクがある。本 Issue では README にルールを明記するところまでとし、
  Phase 6 着手時に Issue #30 の観点で再確認する(Issue の Notes と一致)。
- **README 追記場所の競合**: 同じ Phase 5 内の Issue #31(MVP セルフレビューと README 更新)も README を
  編集するため、`docs/codex/phase-5/implementation-plan.md` の推奨順序(#30 → #31)を守り、
  #30 のセクションを #31 が重複して書き直さないようにする。
- **`app/api/health` の扱い**: 現状唯一の API Route だが、ヘルスチェック用途のみで画像 / OCR / Markdown を
  扱わない。本 Issue の「外部送信なし」の記述対象には含めない(必要なら別途「ヘルスチェック API のみ存在」と
  一言触れる程度に留める)。
