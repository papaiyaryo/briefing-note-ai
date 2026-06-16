# Phase 5 実装計画: MVP 品質改善・テスト

## Phase 目的

Phase 4 で完成したローカル完結の MVP データフロー(アップロード → ダミー OCR 確認 → Markdown 生成 →
編集・プレビュー → `.md` ダウンロード)の品質を固め、次の状態にする。

1. Markdown 生成ロジックと主要 UI コンポーネントが自動テストで保護されている
2. 将来の E2E テスト導入方針が決まっている
3. 画像・OCR テキスト・生成 Markdown の扱いがセキュリティ/プライバシー観点で確認済みである
4. README だけで MVP の使い方・制約・スコープ外が分かる
5. セルフレビュー結果が docs に残っている
6. MVP の操作イメージが README から伝わる(スクリーンショット)

この Phase は **品質改善とドキュメント整備が中心** であり、新しいユーザー向け機能は追加しない。
PR を作る前の品質ゲートとして扱う(Issue #31 Notes 準拠)。

## 対象 Issue 一覧

| Issue | タイトル | 優先度 | 役割 |
| --- | --- | --- | --- |
| #27 | Markdown 生成ロジックの単体テストを追加する | High | テスト(ロジック) |
| #28 | UI コンポーネントの基本テストを追加する | Medium | テスト(UI) |
| #30 | セキュリティ・プライバシー確認を実施する | High | セキュリティ確認 |
| #29 | E2E テスト方針を整理する | Medium | テスト方針(ドキュメントのみ) |
| #31 | MVP セルフレビューと README 更新を行う | High | 品質ゲート / ドキュメント |
| #32 | MVP デモ用スクリーンショットを追加する | Low | ドキュメント(デモ素材) |

## 実装順序と依存関係

```text
#27 (Markdown ロジックの既存テスト点検 + 不足分追加)
#28 (UI コンポーネントテスト基盤の導入 + 追加)
  └─> #30 (セキュリティ/プライバシー確認、コードは変更しない)
        └─> #29 (E2E 方針ドキュメント、コードは変更しない)
              └─> #31 (README 更新 + セルフレビュー記録)
                    └─> #32 (README にスクリーンショットを追加)
```

推奨実装順: **#27 → #28 → #30 → #29 → #31 → #32**

理由:

- #27 と #28 は「テスト」そのものであり、#31 の Dependencies(`Depends on Phase 4 and tests`)が
  指す対象。先に着手し、README にテスト状況を正確に書けるようにする。
- #27 は既存の `tests/markdown.test.ts`(Phase 4 で実装済み)が Acceptance Criteria の大部分を
  満たしている可能性が高いため、まず点検し、不足分のみ追加する低リスクな Issue。
- #28 は `@testing-library/react` 等の新規導入を伴うため、#27 の後に独立して進める。
- #30 はコードを変更せず確認とドキュメント化が中心なので、テスト導入後でも先でも進められるが、
  README の「外部送信なし」記述の裏付けとして #31 より前に確定させる。
- #29 もドキュメントのみで他 Issue に依存しないが、README からリンクするため #31 より前に置く。
- #31 は #27/#28/#29/#30 の結果(テスト状況、セキュリティ確認結果、E2E 方針)を README に
  まとめる集約 Issue。最後に Phase 全体のセルフレビューを記録する。
- #32 は #31 で確定した README の構成(「使い方」節)にスクリーンショットを差し込むため最後。

各 Issue は **1 Issue = 1 Branch = 1 PR**。複数 Issue を 1 PR にまとめない。
ドキュメントのみの Issue(#29, #30 の一部, #31, #32)であっても、同じ README の同じ箇所を
複数の PR で同時に編集しないよう、上記の順序を守る。

## 共有設計判断(Phase 全体で固定)

### 1. テスト環境はファイル単位で切り替える(`vitest.config.ts` は追加しない)

- 既存のロジックテスト(`tests/*.test.ts`)は Vitest のデフォルト環境(node)で動作しており、
  この前提を変えない。
- UI コンポーネントテスト(#28)は DOM が必要なため、各テストファイルの先頭に
  `// @vitest-environment jsdom` プラグマを付け、ファイル単位で jsdom に切り替える。
- グローバルな `vitest.config.ts` や `setupFiles` は本 Phase では追加しない。jest-dom の
  matcher 拡張は `import "@testing-library/jest-dom/vitest";` をテストファイルごとに直接 import
  することで満たす(設定ファイル追加より差分が小さく、既存テストへの影響もない)。

### 2. UI コンポーネントテストの対象はステップコンポーネント単体

- `src/components/steps/UploadStep.tsx` / `OcrReviewStep.tsx` / `MarkdownEditStep.tsx` を
  対象にする。props はすべてモック関数(`vi.fn()`)で渡し、親コンポーネントの状態管理には依存しない。
- `BriefingNoteFlow.tsx` 自体は `window.setTimeout` による擬似遅延を内部に持つため、本 Phase の
  対象に含めない(Issue #28 の Out of Scope に合わせる)。タイマーを含む統合テストは将来の
  Follow-up として扱う。
- jsdom は `URL.createObjectURL` / `URL.revokeObjectURL` を実装していないため、`UploadStep` の
  テストでは最小限のスタブ(`vi.stubGlobal` 等)を用意する。

### 3. ドキュメントの配置(`docs/` 配下、1 Issue = 1 ファイルを基本にする)

| ファイル | Issue | 役割 |
| --- | --- | --- |
| `docs/e2e-test-policy.md` | #29 | E2E 対象フロー・ツール比較・導入タイミング |
| `docs/security-review.md` | #30 | セキュリティ/プライバシー確認チェックリストと結果 |
| `docs/self-review-phase5.md` | #31 | Phase 5 のセルフレビュー結果(チェック結果・AC 達成状況) |
| `docs/images/*.png` | #32 | README に埋め込むスクリーンショット |

README.md の更新は **#31 に集約** する。#29 / #30 では README を編集せず、ドキュメントを作成する
だけにする(同じ README の行を複数 PR で編集してコンフリクトさせないため)。#32 は #31 が作る
「使い方」節に画像参照を追記する。

### 4. README 構成の方針(#31 で適用)

既存の見出し(Status / MVP / Future Ideas / Documentation / Development / Code Quality / CI /
Testing)を維持しつつ、次を行う。

- **Status**: 「Docker 開発環境構築フェーズ」という記述は Phase 4 完了後の実態とズレているため、
  ダミー OCR で MVP フローが一通り動作する旨に更新する。
- **使い方(新規)**: `docs/roadmap.md` の「MVP 完了の定義」(7 ステップ)に沿って、画像アップロード
  からダウンロードまでの操作手順を書く。
- **MVP / Out of Scope の分離**: 既存の `## MVP` と `## Future Ideas` の境界を明確にし、
  「MVP に含むもの」と「MVP に含まないもの(Post-MVP)」が一文で区別できるようにする。
  `Future Ideas` は roadmap.md の「MVP に含めないもの」と表現を揃える。
- **Documentation**: `docs/e2e-test-policy.md`、`docs/security-review.md`、
  `docs/self-review-phase5.md` へのリンクを追加する(存在するファイルのみリンクする)。
- **Testing**: ロジックテストと UI コンポーネントテストの両方があることを明記する
  (実行コマンドは `npm test` のまま変更しない)。

### 5. ログ・秘密情報の方針(変更なし、確認のみ)

- AGENTS.md / docs/ci-policy.md / docs/architecture.md の既存方針(画像内容・OCR 全文・生成
  Markdown・個人情報を不要にログ出力しない、`.env` をコミットしない)を変更せず、#30 でその通り
  実装されているかを確認する。設計時点の grep 確認では `src/` `app/` 配下に `console.*` 呼び出しは
  存在しない。

## Phase 全体の検証方針

各 Issue の PR で最低限以下を実行し、すべてグリーンであることを確認する。

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

加えて、コードに影響する Issue(#27, #28)では手動で MVP フローを再確認する。

1. 画像をアップロード → OCR 確認に進む(成功 / 失敗の両方)
2. Markdown を生成 → 編集 → プレビューが追従する
3. `.md` をダウンロードし、内容を確認する

ドキュメントのみの Issue(#29, #30, #31, #32)では、上記コマンドが Issue 着手前と同じ結果で
通ること(コードに影響していないこと)を確認すれば十分とする。

## スコープ外(Phase 5 では実装しない)

- 実 OCR / 実 LLM 接続(Phase 6)
- Google Drive 保存(Phase 7)
- Web 補足情報の取得・統合(Phase 8)
- 企業比較・面接準備モード(Phase 9)
- README のポートフォリオ向け詳細化、技術構成図、デモ動画 / GIF、Copilot レビュー運用整理(Phase 10)
- E2E テストの実装そのもの(#29 は方針整理のみ)
- 本番監査体制、認証・権限管理
- 依存パッケージ脆弱性スキャンの CI 組み込み(`npm audit` の手動確認まではスコープ内)

## リスク / 留意点

- **README コンフリクト**: #29・#30・#31・#32 が同じファイル(README.md)に触れる可能性がある。
  上記の通り #31 に編集を集約し、他 Issue は新規ドキュメントの作成のみに留めることでコンフリクトを
  避ける。
- **#27 のスコープ過大化**: `tests/markdown.test.ts` は Phase 4 時点で既にケースが豊富にある。
  Acceptance Criteria を満たしているかをまず点検し、満たしていれば重複するテストを追加しない。
- **#28 の jsdom 未実装 API**: `URL.createObjectURL` など jsdom が実装しない API を使う箇所は
  最小限のスタブで対応し、テストの本質(レンダリングと基本操作の確認)から外れない範囲にとどめる。
- **#31 着手時点で #27-#30 が未完了の場合**: README やセルフレビューには、完了していない事実を
  「完了済み」と書かない。状況をそのまま記載し、Follow-up として明記する。
