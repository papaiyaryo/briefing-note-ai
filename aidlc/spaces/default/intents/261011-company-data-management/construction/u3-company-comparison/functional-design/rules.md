# U3 — 企業比較の業務ルール

## Scope

既存7観点、本人確認、1企業1参照、C3/C4の版・更新・出力前確認を具体化する。新機能の追加、保存正本の重複、旧データ移行、外部サービス呼出しの追加をしない。

## Business Rules

次のYAMLが判断条件の正本。操作の順序と状態遷移の正本は[functional-spec.md](functional-spec.md)。

```yaml
rules:
  -
    id: "BR1.1"
    statement: "比較の全読取・更新・出力前確認を本人の境界で行う"
    category: "authorization"
    applies_to: "比較候補、参照取得、志望度・理由更新、出力"
    trigger: "操作要求時"
    logic: "本人確認の後、対象企業とメモの所有者・所属を保存元が照合する。画面のIDや表示名を権限の根拠にしない。"
    violation: "未認証は保護表示を隠し、別所有者と不存在は同じ対象不明として内容を返さない。"
    source: "FR1.1, FR1.2, FR1.3, NFR1, C1, C3, C4"
  -
    id: "BR1.2"
    statement: "本人・選択・要求世代を越えた結果を適用しない"
    category: "authorization"
    applies_to: "保護表示、一時入力、参照要求、更新結果"
    trigger: "失効、ログアウト、本人・選択切替時"
    logic: "保護結果を破棄し、旧要求を取消しまたは無効化する。一時入力と未確定の要求は同じ本人の端末内メモリだけへ保持し、別本人へ表示・自動送信しない。"
    violation: "遅延した旧応答は表示・成功通知・出力に使わない。同じ本人の復帰時も最新を読み、自動上書きしない。"
    source: "FR1.3, NFR1, NFR3, C1"
  -
    id: "BR2.1"
    statement: "新比較は選択順を持つ1企業1構造化メモとする"
    category: "validation"
    applies_to: "新サーバー比較の選択"
    trigger: "選択変更・比較要求時"
    logic: "0件は対象なし。要求は1〜20の異なる企業IDと各社に属する1メモIDだけ。同名でもIDが違えば別企業、同じ企業のメモ切替は1社のまま。1社比較も許可し、自動統合・自動参照選択はしない。"
    violation: "重複企業、所属不一致、21社以上を拒否し、入力と選択を保持する。20社を企業登録上限にしない。"
    source: "FR8.1, FR8.2, C3, delivery-planning Input and Response Limits"
  -
    id: "BR2.2"
    statement: "候補一覧の未取得・空・構造なし・失敗を区別する"
    category: "policy"
    applies_to: "保存企業と所属メモの候補"
    trigger: "入口・候補再取得時"
    logic: "終了状態の企業も比較候補に含める。メモ一覧のページと正確な所属件数を区別し、構造化項目ありの保存メモだけを選択可能とする。候補の同名・長名は識別情報で区別する。"
    violation: "取得失敗を0件にせず再取得へ。本文のみのメモは構造化項目なしと示し、本文を比較項目へ変換しない。"
    source: "FR3.3, FR8.1, FR8.2, C3, C4"
  -
    id: "BR2.3"
    statement: "比較は一つの整合した保存参照全体から作る"
    category: "constraint"
    applies_to: "ComparisonResultと各ComparisonSource"
    trigger: "比較取得成功の採用時"
    logic: "C3が返す選択順・企業ID・メモ所属・企業版・メモ版・有効構造を確認し、全選択に対応する結果だけを採用する。C3の保存元が一貫した読取を担い、画面で別々の読取を寄せ集めて代用しない。"
    violation: "不足・重複・不正構造・対象不明を含む応答を成功比較へせず、部分結果を完全な表や出力へ昇格しない。"
    source: "FR8.1, FR8.2, NFR2, C3"
  -
    id: "BR3.1"
    statement: "既存7観点を同じ順序・意味で表示する"
    category: "calculation"
    applies_to: "比較の観点と参照情報"
    trigger: "有効参照から結果を導出する時"
    logic: "strengths、concerns、impressions、emphasizedPoints、idealCandidate、esPoints、questionsだけを既存のラベルと順序で並べる。企業名は保存企業、項目は選択メモを参照し、生成企業名で企業を改名しない。"
    violation: "観点の自動追加、評価点数、順位付け、複数メモの混合を行わない。"
    source: "FR7.1, FR8.1, domain-design CompanyComparison"
  -
    id: "BR3.2"
    statement: "本文・欠損・本人の印象を企業事実へ変換しない"
    category: "policy"
    applies_to: "本文、構造化項目、欠損、7観点"
    trigger: "表示・出力の導出時"
    logic: "本文のみの修正は構造化項目を変えない。空の比較配列は未記載、原文にある要確認はそのまま区別する。印象・HR強調・質問・ES材料を別観点に保つ。"
    violation: "未記載を弱点やゼロ評価と断定せず、架空の数字・文章を補わない。"
    source: "FR5.2, FR7.2, FR7.3, FR8.2, NFR4"
  -
    id: "BR3.3"
    statement: "出自と採用Web出典を別区分で保持する"
    category: "constraint"
    applies_to: "選択メモのorigin、providerOrigin、採用Web"
    trigger: "参照検証・表示・出力時"
    logic: "手入力と生成、dummyとopenaiを保存値どおり示す。採用Webはid、category、content、sourceUrl、fetchedAt、confidence、adopted状態を保持し、紙由来7観点へ混ぜない。URLと取得日を表示・出力する。"
    violation: "出典不足や不正な参照を有効な比較として出力しない。出自を事実性の証明や未確認の実API成功へ読み替えない。"
    source: "FR5.2, FR7.3, FR9.1, NFR4, C3"
  -
    id: "BR4.1"
    statement: "企業志望度とメモ比較理由を独立した正本へ明示保存する"
    category: "constraint"
    applies_to: "Company.interestLevelとMemo.comparisonReason"
    trigger: "各保存ボタンの明示操作時"
    logic: "志望度は企業のhigh/medium/low/undecided/null、理由は選択メモの5000 code points以下の任意文字列で空欄null。未設定と未定を区別する。各要求は対象欄だけを変更し、各々の版でU1へ依頼する。"
    violation: "片方の成功を両方成功と表示しない。本文、構造、企業自由メモ、他メモ理由を変更せず、入力・選択だけで新比較を自動保存しない。"
    source: "FR2.3, FR7.2, FR8.1, NFR2, C3"
  -
    id: "BR4.2"
    statement: "更新意図と結果不明を同じ要求・IDで扱う"
    category: "policy"
    applies_to: "ComparisonWriteIntentと欄別保存結果"
    trigger: "保存送信・通信途絶・再試行時"
    logic: "送信前にoperationId、対象、expectedVersion、変更値を凍結する。同欄の二重送信を抑制し、結果不明は操作照会へ。unknownなら本人の再試行で同じ要求・IDを送る。確定済みなら同じ結果を表示して最新を読み直す。"
    violation: "新IDによる自動再送・無限照会をしない。保存確定後の再取得失敗は保存成功と読取失敗を別表示する。比較参照POSTの失敗は書込結果不明と混同しない。"
    source: "NFR2, FR2.3, C3, C4"
  -
    id: "BR4.3"
    statement: "競合時は保持入力と最新保存値を並べて確認する"
    category: "policy"
    applies_to: "志望度・理由の編集基準版"
    trigger: "旧版による拒否・最新再取得時"
    logic: "旧版要求を黙って確定させない。元の基準版・入力を保持したまま最新値を別に取得・表示する。本人が最新を基準に編集を続けると明示した後だけ、新しい基準版と新しい保存意図へ進む。"
    violation: "最新取得で入力を破棄せず、自動マージ・無言の基準版差替えをしない。取得失敗・削除後は保存不可とし入力を保持する。"
    source: "NFR3, FR2.3, FR7.1, C3, C4"
  -
    id: "BR4.4"
    statement: "一時入力と確定結果の寿命を表示部品の再表示から分離する"
    category: "policy"
    applies_to: "欄別draft、pending、committed結果、移動"
    trigger: "入力変更・欄の再表示・選択切替・画面移動時"
    logic: "未保存変更の破棄は確認し取消なら選択・入力・focusを保つ。送信中・結果不明の要求と確定IDは本人・対象に結び、一時的な非表示や再表示だけで新規意図へ戻さない。保存後に増えた未送信入力は残す。"
    violation: "再表示を契機に新しい操作IDを発行しない。移動・取消しを送信済みサーバー変更のロールバックと称さない。再読込・終了を越える一時入力の復元は保証しない。"
    source: "NFR2, NFR3, C1, C4, refined-mockups C08"
  -
    id: "BR5.1"
    statement: "選択変更・参照変更・削除で古い結果を無効化する"
    category: "policy"
    applies_to: "比較結果と出力可能性"
    trigger: "選択変更、再取得失敗、参照削除・保存変更の検出時"
    logic: "選択世代を進め以前の要求を取消しまたは破棄する。保存更新後は全選択をC3で再取得する。対象が不明なら再選択を促し、残った選択を勝手に完全比較へ変更しない。"
    violation: "古い結果を最新と表示せず出力を止める。保存0件・選択0件・削除・不正構造・失敗を区別する。"
    source: "FR6.4, FR8.1, FR8.2, NFR2, C3"
  -
    id: "BR5.2"
    statement: "出力直前に同じ参照を再取得し版を比較する"
    category: "constraint"
    applies_to: "新比較Markdown出力"
    trigger: "本人の出力操作時"
    logic: "有効表示と未保存・未確定更新がないことを確認し、同じ選択順をC3で再取得する。全company.versionとmemo.versionが表示時と一致し、本人・選択世代も現在なら、その表示と同じ参照内容から一つのファイルを作る。"
    violation: "変更・削除・取得失敗・401・不正応答ならファイルを作らない。変更時は最新を表示して本人が確認した後のもう一度の出力操作を待つ。無関係な企業の変更やsnapshotVersionだけの変化を選択元の変更と混同しない。"
    source: "FR8.3, FR9.1, C3"
  -
    id: "BR5.3"
    statement: "表示と比較Markdownを同じ保存スナップショットから導出する"
    category: "constraint"
    applies_to: "比較表、出典、志望度、理由、参照情報、出力"
    trigger: "表示・ファイル組立て時"
    logic: "選択順、7観点、保存企業名・参照メモ・企業版/メモ版、出自、企業志望度、保存済み理由と別区分のWeb出典を同じ参照から導く。未保存・未確定欄がある間は新比較出力を止め、保存または明示破棄を案内する。"
    violation: "HTML風文字・表区切り・改行を安全に扱い、値を実行しない。安全な絶対http/https URLだけリンクにし、資格情報入りURLを使わない。画面だけの値や古いキャッシュを混ぜない。"
    source: "FR8.3, FR9.1, NFR4, NFR5, C3"
  -
    id: "BR6.1"
    statement: "旧ブラウザ比較と新サーバー比較を別入口・別正本とする"
    category: "policy"
    applies_to: "LegacyComparisonMemoと新比較"
    trigger: "入口選択・旧データ読取/既存編集/出力時"
    logic: "新入口は保存した企業を比較、旧入口はこのブラウザの旧比較とする。旧id/memo/markdown/interestNote/savedAt/updatedAtは従来の意味を維持する。旧の志望度・理由は端末内の旧データだけを扱い、サーバー企業やアカウントとの対応を推定しない。"
    violation: "自動移行・自動削除・自動サーバー送信をしない。旧データ未設定・利用不能・不正を区別し、安全に読めない項目を成功比較へ使わず、旧保存内容を自動修復・消去しない。"
    source: "FR8.4, FR9.1, C1, unit-of-work U3"
  -
    id: "BR7.1"
    statement: "主要操作と状態通知をPC・スマホ・キーボードで利用可能にする"
    category: "policy"
    applies_to: "選択、比較、欄別保存、復旧、出力、旧入口"
    trigger: "画面表示・操作・状態変化時"
    logic: "観点順と参照を両表示で一致させ、ラベル・見出し・表の対応・未保存/保存中/確定/不明/競合/削除/失敗を文字で示す。画面入口だけ見出しへfocusし、入力中や再取得だけで奪わない。"
    violation: "色だけ・ドラッグだけ・隠れた入口だけを操作手段にしない。長文・拡大・狭幅でも操作へ到達できることを後続の承認済み画面確認で検証する。"
    source: "FR3.4, NFR5, refined-mockups C01/C06/C08"
```

## Rules Summary

| ID | ルール | 根拠 |
|---|---|---|
| BR1.1 | 比較の全読取・更新・出力前確認を本人の境界で行う | FR1.1, FR1.2, FR1.3, NFR1, C1, C3, C4 |
| BR1.2 | 本人・選択・要求世代を越えた結果を適用しない | FR1.3, NFR1, NFR3, C1 |
| BR2.1 | 新比較は選択順を持つ1企業1構造化メモとする | FR8.1, FR8.2, C3, delivery-planning Input and Response Limits |
| BR2.2 | 候補一覧の未取得・空・構造なし・失敗を区別する | FR3.3, FR8.1, FR8.2, C3, C4 |
| BR2.3 | 比較は一つの整合した保存参照全体から作る | FR8.1, FR8.2, NFR2, C3 |
| BR3.1 | 既存7観点を同じ順序・意味で表示する | FR7.1, FR8.1, domain-design CompanyComparison |
| BR3.2 | 本文・欠損・本人の印象を企業事実へ変換しない | FR5.2, FR7.2, FR7.3, FR8.2, NFR4 |
| BR3.3 | 出自と採用Web出典を別区分で保持する | FR5.2, FR7.3, FR9.1, NFR4, C3 |
| BR4.1 | 企業志望度とメモ比較理由を独立した正本へ明示保存する | FR2.3, FR7.2, FR8.1, NFR2, C3 |
| BR4.2 | 更新意図と結果不明を同じ要求・IDで扱う | NFR2, FR2.3, C3, C4 |
| BR4.3 | 競合時は保持入力と最新保存値を並べて確認する | NFR3, FR2.3, FR7.1, C3, C4 |
| BR4.4 | 一時入力と確定結果の寿命を表示部品の再表示から分離する | NFR2, NFR3, C1, C4, refined-mockups C08 |
| BR5.1 | 選択変更・参照変更・削除で古い結果を無効化する | FR6.4, FR8.1, FR8.2, NFR2, C3 |
| BR5.2 | 出力直前に同じ参照を再取得し版を比較する | FR8.3, FR9.1, C3 |
| BR5.3 | 表示と比較Markdownを同じ保存スナップショットから導出する | FR8.3, FR9.1, NFR4, NFR5, C3 |
| BR6.1 | 旧ブラウザ比較と新サーバー比較を別入口・別正本とする | FR8.4, FR9.1, C1, unit-of-work U3 |
| BR7.1 | 主要操作と状態通知をPC・スマホ・キーボードで利用可能にする | FR3.4, NFR5, refined-mockups C01/C06/C08 |

## Validation Boundaries

1〜20社は比較要求の上限、0件は画面の対象なし。20社を登録上限へ使わない。比較理由5000 code points、志望度の未設定nullと未定undecided、既存構造化項目と採用Webの制約は承認済み共有契約から引き継ぐ。文字・配列・改行を黙って切り詰めない。

旧ブラウザ形式へ新サーバー書込の制約やIDを後付けせず、既存の有効な読取・本人編集・出力を維持する。旧データへのアクセス失敗・不正レコードは説明し、自動修復や消去をしない。適用範囲にないデータで新比較を埋めない。

## Sources

- [Unit定義](../../../inception/units-generation/unit-of-work.md)、[担当対応](../../../inception/units-generation/unit-of-work-story-map.md)、[要件](../../../inception/requirements-analysis/requirements.md)。
- [ストーリーと90AC](../../../inception/user-stories/stories.md)、[部品と所有者](../../../inception/domain-design/components.md)。
- [共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[操作仕様](../../../inception/refined-mockups/interaction-spec.md)、[入力上限・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [現時点の引継ぎ](../../../../../../../../docs/session-handoff.md)。実装済みの部品があることを全受入・実環境成功の証明にしない。

