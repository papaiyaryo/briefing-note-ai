# 企業比較用データ構造設計

## 目的

Phase 9 では、複数の企業メモを横断して比較し、ES 作成や面接前復習に使える観点を整理する。

この設計は比較用の読み取り専用レイヤーを定義するものであり、MVP の単一メモ機能である `CompanyMemoStructured` / `BriefingNote` は変更しない。

## 前提

- 入力元は、MVP で生成・編集された 1 社ごとの Markdown / 構造化メモとする。
- Web 補足情報は、紙メモ由来情報とは別枠で扱う。
- 志望度や比較用メモは、ユーザーの判断・追記として扱い、紙メモの事実とは混ぜない。
- Phase 9 のこの Issue では、比較 UI と企業データベース構築は実装しない。

## 比較観点

| カテゴリ | 項目 | 主な入力元 | 用途 |
| --- | --- | --- | --- |
| 基本情報 | 企業名、説明会/イベント名、開催日、登壇者 | `overview` | 企業を識別し、比較表の見出しに使う |
| 事業内容 | 事業・サービス・市場 | `business` / `facts` | 業界理解、志望理由の土台に使う |
| 強み | 競争優位、特徴、魅力 | `strengths` / `emphasizedPoints` | ES・面接での志望理由に使う |
| 求める人物像 | 人材要件、評価される姿勢 | `idealCandidate` / `emphasizedPoints` | 自己 PR・ガクチカとの接続に使う |
| 志望度 | 5 段階評価、理由、更新日時 | ユーザー追記 | 優先順位付け、応募判断に使う |
| 懸念点 | 不安、確認事項、応募前に調べる点 | `concerns` / ユーザー追記 | 逆質問・追加調査に使う |
| ES / 面接対策 | ES で使える点、逆質問、接続できる経験 | `esPoints` / `questions` / `idealCandidate` / `strengths` | 応募書類・面接前復習に使う |
| Web 補足 | 採用済みの出典付き補足情報 | Phase 8 の Web 補足結果 | 最新情報や公式情報の補足として使う |

## データ構造方針

比較用データは、単一メモの構造を直接変更せず、比較画面・面接前復習画面が参照する派生データとして扱う。

```ts
type SourceOrigin = "memo" | "user" | "web";

type AspirationLevel = 1 | 2 | 3 | 4 | 5;

interface CompanyAspirationNote {
  level: AspirationLevel;
  reason: string;
  updatedAt: string;
}

interface ComparisonConcern {
  text: string;
  origin: "memo" | "user";
  needsFollowUp: boolean;
}

interface ComparisonWebHighlight {
  title: string;
  summary: string;
  sourceUrl: string;
  retrievedAt: string;
  confidence: "high" | "medium" | "low";
  needsVerification: boolean;
}

interface CompanyComparisonEntry {
  memoId: string;
  overview: {
    companyName: string;
    eventName: string;
    eventDate: string;
    speakers: string;
  };
  memoFacts: {
    business: string[];
    strengths: string[];
    idealCandidate: string[];
    emphasizedPoints: string[];
  };
  personalNotes: {
    impressions: string[];
    aspiration?: CompanyAspirationNote;
    concerns: ComparisonConcern[];
  };
  preparation: {
    esPoints: string[];
    questions: string[];
    experienceConnections: string[];
  };
  webSupplement: {
    adoptedHighlights: ComparisonWebHighlight[];
  };
}
```

## CompanyMemo との分離

既存の `CompanyMemoStructured` は、紙メモから抽出した単一企業メモの正規化結果として維持する。

比較用の `CompanyComparisonEntry` は、以下の理由から別構造にする。

- MVP の Markdown 生成・編集・ダウンロード機能への影響を避けるため。
- 紙メモ由来の事実、個人の印象、ユーザー追記、Web 由来情報を混在させないため。
- Phase 9 の比較 UI や面接前復習で必要な項目だけを派生的に参照できるようにするため。

## 志望度メモの扱い

志望度は紙メモ由来の事実ではなく、ユーザーの判断として扱う。

- `level` は 1〜5 の数値で表す。
- `reason` は自由記述とし、志望度の根拠を残す。
- `updatedAt` は ISO 8601 形式の日時文字列とする。
- MVP と同様、この Issue ではサーバー永続化やユーザーアカウント連携は扱わない。

## 懸念点の扱い

懸念点は、紙メモ由来の `concerns` と、比較時にユーザーが追記する懸念を区別する。

- 紙メモ由来の懸念は `origin: "memo"` とする。
- ユーザー追記の懸念は `origin: "user"` とする。
- 追加確認が必要な項目は `needsFollowUp: true` として、逆質問や追加調査に接続できるようにする。

## Web 補足情報の扱い

Web 補足情報は、紙メモ由来情報とは独立した `webSupplement` セクションで扱う。

- 比較に採用した補足情報のみ `adoptedHighlights` に入れる。
- `sourceUrl`、`retrievedAt`、`confidence`、`needsVerification` を保持する。
- Web 由来の内容を、紙メモ由来の `facts` や `strengths` に直接混ぜない。
- 不確実な情報や要確認情報は、比較画面でも要確認として扱う。

## 受け入れ基準との対応

| Acceptance Criteria | 対応 |
| --- | --- |
| 比較に使う項目が定義されている | 基本情報、事業内容、強み、求める人物像、志望度、懸念点、ES/面接対策、Web 補足を定義 |
| ES / 面接対策に使う観点が含まれる | `preparation.esPoints`、`preparation.questions`、`memoFacts.idealCandidate`、`memoFacts.strengths` を定義 |
| MVP の単一メモ機能と分離されている | `CompanyMemoStructured` を変更せず、比較専用の `CompanyComparisonEntry` を派生構造として設計 |
