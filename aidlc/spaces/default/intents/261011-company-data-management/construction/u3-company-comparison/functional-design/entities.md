# U3 — 企業比較の論理モデル

## Scope and Ownership

この段階は機能設計であり実装済みの宣言ではない。CompanyComparisonと比較画面の一時状態を具体化する。Company/Memoの正本・所有権・版・永続操作記録はC1/C3/C4の所有者から移さない。U2の生成処理との新しい依存や比較結果の永続保存は作らない。

## Entity Model

次のYAMLが属性・制約・関係の正本。新比較は一時的な派生表示、旧比較は既存ブラウザ形式を保持する。

```yaml
unit: "u3-company-comparison"
ownership: "新しい保存正本は作らず、Company/Memo/本人の正本は外部のC1/C3/C4所有者のまま。"
external_references:
  -
    name: "Principal"
    owner: "AccessControl"
    identifier: "userId"
    constraint: "画面用本人キーは権限証明ではない。保存元が各要求の本人を検証する。"
  -
    name: "Company"
    owner: "CompanyWorkspace"
    identifier: "companyId"
    constraint: "名前とは独立したIDと不透明なversionを保持する。"
  -
    name: "Memo"
    owner: "CompanyWorkspace"
    identifier: "memoId"
    constraint: "同じ本人・企業に所属し、構造化項目と本文を別正本で保持する。"
entities:
  -
    name: "ComparisonSelection"
    owner: "CompanyComparison"
    kind: "transient"
    description: "本人の新比較で選んだ企業と参照メモの順序。永続化・自動選択しない。"
    identifier: "selectionId"
    attributes:
      -
        name: "selectionId"
        type: "local opaque id"
        required: true
        unique: true
      -
        name: "ownerKey"
        type: "Principal.userId"
        required: true
        references: "Principal"
      -
        name: "generation"
        type: "non-negative integer"
        required: true
        default: 0
      -
        name: "entries"
        type: "ordered list of {companyId, memoId}"
        required: true
        min: 0
        max: 20
        default: []
        references:
          - "Company"
          - "Memo"
        constraints:
          - "companyIdは重複なし"
          - "各memoIdは対応するcompanyIdに属する"
    constraints:
      - "0件はno-selectionでC3を呼ばない"
      - "有効な比較要求は1〜20企業"
      - "表示名では同一性を判定しない"
      - "本人・選択世代が変わった旧応答を採用しない"
  -
    name: "ComparisonSource"
    owner: "CompanyComparison"
    kind: "read-only projection"
    description: "C3の一貫したCompany/Memo読取。正本の複製保存ではない。"
    identifier: "comparisonRequestId + companyId"
    attributes:
      -
        name: "comparisonRequestId"
        type: "local opaque id"
        required: true
      -
        name: "companyId"
        type: "Company.companyId"
        required: true
        references: "Company"
      -
        name: "memoId"
        type: "Memo.memoId"
        required: true
        references: "Memo"
      -
        name: "company"
        type: "C3 Company snapshot"
        required: true
      -
        name: "memo"
        type: "C3 Memo with non-null existing structuredContent"
        required: true
      -
        name: "companyVersion"
        type: "opaque equality-only version"
        required: true
      -
        name: "memoVersion"
        type: "opaque equality-only version"
        required: true
      -
        name: "providerOrigin"
        type: "dummy | openai | null"
        required: true
      -
        name: "adoptedWebSources"
        type: "list of existing adopted source"
        required: true
        max: 50
        constraints:
          - "id/category/content/sourceUrl/fetchedAt/confidence/statusを保持"
          - "statusはadopted"
          - "出典を紙由来へ混ぜない"
    constraints:
      - "選択した同じ本人のCompany/Memoのみ"
      - "memo.companyIdはcompany.companyIdに一致"
      - "企業とメモの各版は返された同じ参照に一致"
      - "7観点の空配列は未記載、不正構造は有効参照としない"
  -
    name: "ComparisonResult"
    owner: "CompanyComparison"
    kind: "transient derived result"
    description: "同じ選択・保存版に基づく表と対応出力。比較結果ストアを追加しない。"
    identifier: "comparisonRequestId"
    attributes:
      -
        name: "comparisonRequestId"
        type: "local opaque id"
        required: true
        unique: true
      -
        name: "selectionGeneration"
        type: "non-negative integer"
        required: true
      -
        name: "snapshotVersion"
        type: "C3 opaque snapshot marker"
        required: false
      -
        name: "sources"
        type: "ordered list of ComparisonSource"
        required: true
        min: 0
        max: 20
        default: []
      -
        name: "points"
        type: "fixed ordered list"
        required: true
        allowed_values:
          - "strengths"
          - "concerns"
          - "impressions"
          - "emphasizedPoints"
          - "idealCandidate"
          - "esPoints"
          - "questions"
      -
        name: "resultState"
        type: "loading | ready | stale | invalid | error | unauthenticated"
        required: true
      -
        name: "exportState"
        type: "idle | checking | blocked"
        required: true
        default: "idle"
    constraints:
      - "readyだけが現選択に対応する有効結果"
      - "readyはsnapshotVersionと1〜20参照の全検証完了が必要。loading等は参照0件を許容する"
      - "未選択時には有効ComparisonResultなし"
      - "取得途中・部分結果から出力しない"
      - "出力クリックごとに同じ参照を再検証する"
      - "表示版と確認版が変われば最新表示の確認後に再操作する"
  -
    name: "ComparisonEditDraft"
    owner: "ApplicationExperience"
    kind: "owner-scoped in-memory draft"
    description: "企業志望度または選択メモ理由の一時入力。最新保存値と保持入力を分離する。"
    identifier: "ownerKey + targetKind + companyId + memoId"
    attributes:
      -
        name: "ownerKey"
        type: "Principal.userId"
        required: true
        references: "Principal"
      -
        name: "targetKind"
        type: "company_interest | memo_reason"
        required: true
      -
        name: "companyId"
        type: "Company.companyId"
        required: true
        references: "Company"
      -
        name: "memoId"
        type: "Memo.memoId or null"
        required: false
        references: "Memo"
        constraints:
          - "company_interestならnull"
          - "memo_reasonなら選択メモID"
      -
        name: "baselineVersion"
        type: "opaque version"
        required: true
      -
        name: "baselineValue"
        type: "interest value or reason value"
        required: true
      -
        name: "draftValue"
        type: "interest value or reason value"
        required: false
        constraints:
          - "interestはhigh/medium/low/undecided/null"
          - "reasonは5000 code points以下、空欄は保存時null"
          - "自動切詰めしない"
      -
        name: "latestSaved"
        type: "separate latest value and version"
        required: false
      -
        name: "dirty"
        type: "boolean"
        required: true
        default: false
      -
        name: "saveState"
        type: "editing | saving | unknown | committed | readback-error | rejected | conflict | unavailable"
        required: true
    constraints:
      - "同じ対象でも企業志望度とメモ理由を混ぜない"
      - "入力値を最新再取得だけで上書きしない"
      - "最新を基準にする操作は明示確認後"
      - "本人切替で他本人の入力を表示しない"
      - "一時非表示・再表示だけで入力や確定結果を初期化しない"
      - "再読込・終了を越える復旧を保証しない"
  -
    name: "ComparisonWriteIntent"
    owner: "ApplicationExperience"
    kind: "transient mutation identity"
    description: "欄別の明示更新要求と結果。永続操作記録の所有者はU1のまま。"
    identifier: "operationId"
    attributes:
      -
        name: "operationId"
        type: "C4 UUID"
        required: true
        unique: true
      -
        name: "draftTarget"
        type: "ComparisonEditDraft identity"
        required: true
      -
        name: "frozenRequest"
        type: "target + expectedVersion + one permitted changes field"
        required: true
      -
        name: "state"
        type: "sending | unknown | rejected | conflict | committed"
        required: true
      -
        name: "outcome"
        type: "C4 MutationOutcome"
        required: false
      -
        name: "readbackState"
        type: "not-requested | loading | ready | error"
        required: true
        default: "not-requested"
    constraints:
      - "operationIdは新しい明示保存意図の時だけ作る"
      - "再送は同じ凍結要求を使用"
      - "比較参照POSTには更新意図を作らない"
      - "確定結果を再表示で新規要求へ戻さない"
      - "確定成功と再取得失敗を別状態で示す"
      - "結果不明の旧要求を新しい内容に流用しない"
  -
    name: "LegacyComparisonMemo"
    owner: "CompanyComparison"
    kind: "existing browser-owned record"
    description: "従来のSavedCompanyMemo。新比較のCompany/Memoへ変換しない。"
    identifier: "id"
    attributes:
      -
        name: "id"
        type: "existing opaque string"
        required: true
        unique: true
      -
        name: "memo"
        type: "existing CompanyMemoStructured"
        required: true
      -
        name: "markdown"
        type: "existing string"
        required: true
      -
        name: "interestNote"
        type: "existing {level, memo}"
        required: true
        constraints:
          - "levelはhigh/medium/low/undecided"
          - "memoは従来の本人コメント"
      -
        name: "savedAt"
        type: "existing timestamp string"
        required: true
      -
        name: "updatedAt"
        type: "existing timestamp string"
        required: true
    constraints:
      - "既存保存形式・有効な既存編集/出力を維持する"
      - "サーバー企業ID・所有者・保存版を推定しない"
      - "新サーバー操作で旧データを消さない"
      - "自動移行・自動修復・自動削除・サーバー送信なし"
      - "読取失敗や不正データを有効な新比較としない"
relationships:
  -
    from: "ComparisonSelection"
    to: "ComparisonResult"
    cardinality: "1 -> 0..1 current"
    direction: "derives"
    constraint: "選択世代が変われば旧結果は無効"
  -
    from: "ComparisonResult"
    to: "ComparisonSource"
    cardinality: "1 -> 0..20 ordered; ready requires 1..20"
    direction: "contains"
  -
    from: "ComparisonSource"
    to: "Company"
    cardinality: "many -> 1"
    direction: "references external"
  -
    from: "ComparisonSource"
    to: "Memo"
    cardinality: "many -> 1"
    direction: "references external"
  -
    from: "ComparisonEditDraft"
    to: "ComparisonWriteIntent"
    cardinality: "1 -> 0..1 current or retained intent"
    direction: "owns UI lifetime"
  -
    from: "LegacyComparisonMemo"
    to: "ComparisonResult"
    cardinality: "none"
    direction: "isolated"
    constraint: "新サーバー比較との自動対応なし"
```

## Model Summary

| モデル | 役割と寿命 |
|---|---|
| ComparisonSelection | 本人と順序に結び付く選択。0件と要求可能な1〜20社を区別 |
| ComparisonSource | 保存元が一貫して返す企業・選択メモ・各版の読取投影 |
| ComparisonResult | 選択と同じ版から作る7観点・志望度・理由・出典。永続保存しない |
| ComparisonEditDraft | 欄別入力と旧基準版・最新値を別保持する本人限定一時メモリ |
| ComparisonWriteIntent | 安定した操作IDと凍結要求、確定結果。再表示で新規化しない |
| LegacyComparisonMemo | 従来の端末内記録。アカウントやサーバー企業に自動対応させない |

型名は論理的な共有仕様への参照であり、新しい同名DTOの実装を要求するものではない。比較の7観点は構造化データを参照し、自由本文・企業自由メモ・旧コメントから生成しない。

## Sources

- [Unit定義](../../../inception/units-generation/unit-of-work.md)、[担当対応](../../../inception/units-generation/unit-of-work-story-map.md)、[要件](../../../inception/requirements-analysis/requirements.md)。
- [ストーリーと90AC](../../../inception/user-stories/stories.md)、[部品と所有者](../../../inception/domain-design/components.md)。
- [共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[操作仕様](../../../inception/refined-mockups/interaction-spec.md)、[入力上限・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現時点の引継ぎ](../../../../../../../../docs/session-handoff.md)。実装済みの部品があることを全受入・実環境成功の証明にしない。

