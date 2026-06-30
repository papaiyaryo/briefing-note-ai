# Web 補足機能 設計（Phase 8）

## ステータス

Post-MVP。Phase 6（OpenAI 連携）完了後に着手する。

## 目的

企業説明会メモ（紙メモ由来）では得られない補足情報を、Web から取得して追記できるようにする。
ただし、Web 由来情報を説明会で得た事実と混同しないことを最優先とする。

---

## 情報源の分離方針

### 紙メモ由来情報（trusted）

- 出所: ユーザーが説明会で書いた紙メモ → 画像アップロード → OCR
- 信頼度: ユーザーが直接確認した情報
- 扱い: Markdown の各セクション（事業内容・強み・求める人物像など）に直接記載する

### Web 由来情報（supplemental）

- 出所: 公式サイト・採用ページなどから取得した情報
- 信頼度: 参考情報。紙メモと同列に扱わない
- 扱い: `## Web 補足情報` セクションにのみ記載し、他のセクションには混入させない

**両情報を同一セクションに混在させることを禁止する。**

---

## 取得対象ページの優先度

| 優先度 | 対象 | 理由 |
|--------|------|------|
| 1 | 採用公式ページ（`/recruit`, `/careers` など） | 求める人物像・選考フローが最も信頼できる |
| 2 | 企業公式トップページ | 事業概要・企業理念の一次情報 |
| 3 | プレスリリース・IR ページ | 最新の事業動向・数値情報 |
| 対象外 | SNS・口コミサイト・転職サイト | 二次情報・信頼性が低い |
| 対象外 | ニュース記事（一般メディア） | 文脈が切り取られるリスクがある |

### 補足しない情報

- 推測、LLM の知識ベース由来の情報
- 出典 URL が確認できない情報
- 企業名だけで一意に特定できなかった場合の候補情報

---

## 出典メタデータの仕様

Web 由来の補足情報には、必ず以下のメタデータを付与する。

```ts
type WebSupplementSource = {
  url: string;         // 取得元 URL
  retrievedAt: string; // 取得日（ISO 8601: "2026-06-30"）
  pageTitle: string;   // ページタイトル
  reliability: "confirmed" | "unverified";
  // confirmed: 公式ドメインと一致する場合
  // unverified: ドメイン確認が取れない場合
};

type WebSupplementItem = {
  content: string;
  source: WebSupplementSource;
  status: "pending" | "adopted" | "rejected";
};
```

### Markdown への記録形式

```markdown
## Web 補足情報

> この情報は公式 Web サイトから取得した参考情報です。説明会で得た事実とは分離して記載しています。

### 事業内容（Web 補足）
- {{補足内容}}
  - 出典: [{{ページタイトル}}]({{URL}})
  - 取得日: {{YYYY-MM-DD}}
  - 信頼度: 公式確認済み / 要確認

### 採用情報（Web 補足）
- {{補足内容}}
  - 出典: [{{ページタイトル}}]({{URL}})
  - 取得日: {{YYYY-MM-DD}}
  - 信頼度: 公式確認済み / 要確認
```

---

## ユーザー確認フロー

Web 補足情報は、**ユーザーが明示的に採用を選択した場合のみ** Markdown に統合する。

```text
1. ユーザーが Markdown 生成後、「Web 補足を追加」を選択
2. システムが企業名をもとに補足候補を取得・生成
3. 補足候補一覧をUI上に表示（出典・取得日・内容を表示）
4. ユーザーが各候補を「採用 / 却下」で個別に選択
5. 採用した項目だけを「## Web 補足情報」セクションに追記
6. 却下した項目はMarkdownに含めない
```

### 自動統合を禁止する理由

- Web 情報が実際の説明会内容と矛盾する場合がある
- ユーザーが何を採用したかを把握できないと、誤った情報で ES・面接準備をするリスクがある
- 選考情報は個人に影響が大きいため、最終判断は必ずユーザーに委ねる

---

## データモデル案

```ts
type WebSupplementSession = {
  companyName: string;
  requestedAt: string;
  items: WebSupplementItem[];
};

type WebSupplementState =
  | "idle"
  | "fetching"
  | "review"       // ユーザー確認中
  | "integrated"   // Markdown に統合済み
  | "error";
```

---

## API 境界案

```text
POST /api/web-supplement
  input: { companyName: string }
  output: {
    items: WebSupplementItem[],
    sessionId: string
  }

POST /api/web-supplement/adopt
  input: { sessionId: string, adoptedIds: string[] }
  output: { markdown: string }  // 採用分を追記した Web 補足セクション
```

- `companyName` のみをサーバーに送信する
- 取得したページの全文はサーバー側でのみ保持し、クライアントには補足候補テキストと出典メタデータだけを返す
- セッションは一時的なもので、ユーザーがページを閉じたら破棄する

---

## プライバシーと安全性

| 項目 | 方針 |
|------|------|
| 外部送信データ | 企業名のみ |
| ページ全文のログ | 残さない |
| 補足候補の保存 | セッション内のみ・永続化しない |
| ユーザーメモとの結合 | ユーザー確認後のみ |
| LLM 推測による補足 | 行わない（Web 取得情報のみ） |

---

## MVP との境界

| 機能 | MVP | Phase 8 |
|------|-----|---------|
| 紙メモ OCR | ✅ | ✅ |
| Markdown 生成 | ✅ | ✅ |
| Web 補足取得 | ❌ | ✅ |
| 補足確認 UI | ❌ | ✅ |
| 補足の Markdown 統合 | ❌ | ✅ |

MVP の `## Web 補足情報` セクションは「MVP では未使用」として空で出力する。
Phase 8 実装時に、このセクションに実データを埋める形で拡張する。

---

## スコープ外（Phase 8 では実装しない）

- Web スクレイピングの本格実装（実装方式は Issue #08-02 で決定する）
- 自動企業データベースの構築・永続化
- 複数企業の一括補足
- SNS・口コミ・転職サイトからの取得
- LLM の知識ベースによる推測補足

---

## 依存関係

- Phase 6（OpenAI API 連携）: CompanyMemo の型定義・Markdown 出力形式が確定していること
- Phase 7（Google Drive）: 補足情報の永続化が必要な場合は Phase 7 との連携を検討するが、Phase 8 単体では永続化しない

## 関連ドキュメント

- `docs/output-format.md` — Markdown テンプレートと Web 補足セクションの定義
- `docs/requirements.md` — 将来的な機能要件の Web 補足の記載
- `docs/roadmap.md` — Phase 8 のスコープ定義
- `docs/generated-issues/08-01-web-補足機能の仕様と取得方針を整理する.md`
- `docs/generated-issues/08-02-出典付き-web-補足情報の取得-生成を実装する.md`
- `docs/generated-issues/08-03-web-補足の確認-ui-と-markdown-統合を実装する.md`
