# 企業メモ管理の実装Unit

## Scope and Approval Basis

units-generation-questions.md Q1の実回答a（Approve Plan）で確認した3 Unitを定義する。承認済み49要件・18ストーリー・90受入条件とDomain Designの6部品を実現するための分解であり、機能範囲を追加・縮小しない。

1 Intent = 1リリースBolt。3 Unitは同じNext.jsアプリへ共有配置し、依存関係を守って直列実行する。Unitごとに別PR・別本番リリースを作らず、全体を揃えて日本語PRを1つ作る。人間のInception計画承認・Code Generation Plan Approval前にアプリ実装を開始しない。

## Unit Definitions

| Unit ID | Directory | Name | Kind | Deployment | Complexity | Purpose |
|---|---|---|---|---|---|---|
| U1 | u1-company-notes | u1-company-notes | service | shared | XL | 本人が企業・メモ・選考状況を保存して管理する |
| U2 | u2-generated-notes | u2-generated-notes | service | shared | L | 訂正OCRと確認した生成メモを選択企業へ保存する |
| U3 | u3-company-comparison | u3-company-comparison | service | shared | M | 保存した企業と参照メモを比較して対応Markdownを出力する |

`service`は画面・API・保存や処理を含むNext.js実行アプリの機能増分を示す。独立サーバーを3つ配備する意味ではない。`shared`は既存Next.js／Vercelアプリと一緒に公開する配置。複雑度は相対評価で、日数・人員・速度の約束ではない。DirectoryとYAMLのUnit名は同じ安定識別子として後続のconstruction記録に使う。

## U1 — 本人確認と企業・メモ管理

### Responsibilities and Boundaries

- AccessControlとCompanyWorkspaceの実装責任を持つ。Principal、Company、Memo、WriteOperation、DeletionSnapshotの所有者は承認済みコンポーネントのままで、Unit分解によってデータの正本を移さない。
- ApplicationExperienceの共通ナビゲーション・本人の入口、企業登録・ボード・詳細、手入力・保存メモの本文／構造化項目／原文出典の閲覧編集・確認付き削除・本文Markdown出力を担当する。
- 企業ID、所属メモ、状態、次の選考日・締切、企業共通の志望度、メモごとの比較理由、保存版と所有者検査を一貫して扱う。保存メモの生成由来情報は既存構造に従う架空fixtureでも検証する。
- 通常6状態／終了2状態の任意再表示、検討中の対応中社数からの除外、15社以上だけの警告、次の選考日の強調と未設定・締切との区別を含む。
- 古い更新、確認後の対象・所属メモ変更、部分削除、二重送信、結果不明、失効を扱う責任を持つ。企業削除は子集合と版を確認して一貫して変更する具体方法を後続契約・詳細設計で確定する。
- 既存OCR・生成・Web補足・復習も本人確認を必要とする共通境界を接続する。公開healthとログイン入口は区別し、未認証の直接API要求を拒否する。生成・復習の本来の処理と出力は維持する。

### Inputs and Outputs

本人の明示した入力を検証し、保存確定後に再取得できる企業・メモ・状態・社数を返す。U2とU3が利用する対象確認・保存・読取・明示更新・削除・競合の正式契約はContract Designで定める。IDだけや生成企業名だけを権限の証明にしない。

### Runnable Result and Verification

本人としてログインし、企業名だけで登録、日付・状態・社数を確認、画像なしのメモを保存して別クライアントで再取得する一連の動作を持つ。保存済み構造化メモのfixtureを使って編集・情報区分・版・削除を確認できる。U2のOCR成功やU3の画面を、保存契約の試験の前提にしない。

U1だけの完了で比較画面の無効化や生成保存を全受入済みとはしない。横断する条件はstory-mapのU2／U3とリリース全体の確認まで追跡する。

### Implementation Notes

XLの範囲は、認証・対象所有権、企業とメモの保存、状態と集計、版と再試行、削除、画面の利用フローに分けてコード計画で検証する。契約を確認し、各対象のrunnerを確認した後、小さい受入単位でRed→Green→Refactorを繰り返す。技術層だけの別リリースへ分解しない。DB・認証製品、設定・完全スキーマ・制限値は実装前に承認する。

## U2 — OCR生成メモの企業保存と既存復習の維持

### Responsibilities and Boundaries

- MemoGenerationの保存先企業確認、元画像とOCR訂正の見比べ、既存生成結果の検証、本人が確認した候補をU1へ保存する接続を担当する。
- ApplicationExperienceの生成側の画面・原文／出典の扱いを担当する。生成名で保存先企業を変更せず、不正構造・出典不足・生成失敗を成功メモにしない。dummy由来を判別できる表示を維持する。
- 原画像は一時表示のみとし、永続保存・旧localStorage保存をしない。不要後の参照解放と、アプリ非保存と外部OCR側の保持条件の区別を確認する。
- InterviewReviewの既存生成結果からの復習・出力と本人確認後の導線を回帰確認する。保存DBへの新しい復習接続や結果永続化は追加しない。
- 企業・メモの独自ストアを作らず、U1の対象確認と保存契約を使う。生成の失敗・結果不明・二重送信でも入力と確認可能な結果を保つ。

### Inputs and Outputs

選択企業、一時画像、訂正OCR、イベント、採用Web情報から検証済み保存候補を作る。候補の保存は本人の明示操作でU1が確定する。本文、構造化項目、訂正OCR、イベント、出典を別の用途として保持し、入力を事実へ自動昇格しない。

### Runnable Result and Verification

本人が選択企業を示した状態で画像とOCRを確認し、生成・内容確認・保存・再取得できる。試験は架空画像とdummy provider。生成企業名の不一致、読取不能・未記載、不正構造、情報区分、出典、画像非保存、保存結果不明を確認する。既存復習・ダウンロードがU1の認証境界後も利用できることを確認する。

### Implementation Notes

既存のFlow・step・HTTP client・API Route・server service・構造検証を出発点とする。U1が接続した共通本人確認を維持し、追加された入口も同じ境界へ接続する。外部APIの実成功・正解率をdummy試験から推定しない。保存候補と保存正本を分ける確認をTDDと手動の利用フローで扱う。

## U3 — 保存企業の比較と比較出力

### Responsibilities and Boundaries

- CompanyComparisonとApplicationExperienceの比較画面・対応Markdown出力を担当する。本人の各企業から構造化メモを選び、企業ID・参照メモ・保存版を明示する。
- 既存7観点（強み・特徴、懸念・気になった点、自分との接点・印象、HR・社員の強調点、求める人物像、ES・面接材料、次に聞きたい質問）を維持する。
- 企業共通の志望度と、選択メモごとの本人の比較理由を区別する。更新はU1へ依頼し、本文・企業自由メモ・構造化された事実を勝手に書き換えない。
- 参照の切替・削除・取得失敗・不正構造・未認証によって古い結果を最新と扱わず、無効な比較を成功ファイルとして出力しない。表示と出力は同じ参照データを使う。
- Web補足・出典は紙由来と別区分。本文を自動構造化せず、欠損は未記載／要確認。旧ブラウザ比較は入口と参照元を区別し、自動移行・自動削除・新サーバー企業の推定をしない。

### Inputs and Outputs

U1の保存済み企業・メモと本人が選んだ参照から、一時比較結果と対応するMarkdownを作る。比較のための企業・メモの複製正本や比較結果の永続ストアは作らない。旧localStorageの従来形式を別の参照として維持する。

### Runnable Result and Verification

U1の契約に従う架空の構造化保存メモから、本人が企業・メモを選び、比較・志望度／理由の明示編集・再取得・出力できる。参照メモ切替で7観点と理由だけが切り替わり、企業志望度は変わらない例を確認する。別端末、情報不足、古い参照、削除、取得失敗、旧比較の区別を確認する。U2を実行して作ったデータだけを唯一の試験方法にしない。

### Implementation Notes

既存comparison.tsと比較画面の観点・ダウンロードを出発点にする。保存更新はU1契約へ依頼し、独自の書込・独自の認証規則を増やさない。PC／スマホ、ラベル、選択と結果の無効化、本文と比較項目の参照元をTDDと手動の利用フローで確認する。

## Cross-Unit Ownership and Integration

ApplicationExperienceは共通入口・企業／メモ画面をU1、生成画面の接続をU2、比較画面をU3に分担する。6部品の所有者や呼出方向は変更しない。共通UI・保存の正式契約をContract Designで固定し、依存Unitはそれを使う。共通ファイルに必要な変更は担当Unitと影響を後続コード計画へ明記する。

所有者検査・保存整合性・情報区分・出力の一致・失効・競合・削除参照は横断する。独立fixtureでUnit内を確認した後、全Unitを合わせた受入確認で18ストーリー・90条件を検証する。配置の共有はデータ正本の重複を許す意味ではない。

## Constraints and Remaining Decisions

TDD、line coverage 80%下限、lint/typecheck/test/build、Docker変更時の確認、dummy provider、Vitest＋手動、直列Unitと公式チェックポイント、人間マージ、実merge SHAのVercel・ページ・health・利用導線確認を維持する。具体コマンドと対象・証拠は後続計画で承認する。

DB・認証サービスの選定／無料条件・本人アカウント準備、完全スキーマ・正式API、原子的な版照合と削除、同じ操作の再試行・期限、入力上限・有限タイムアウト、代表100企業／1000メモ／約10000字の長文／1社50メモでの容量と応答目標・測定条件は未確定。Contract DesignとDelivery Planningで具体化し、未確定のまま実装を許可しない。対応中15社は登録・保存・性能上限ではない。

## Sources

units-generation-questions.md Q1の実回答a（Approve Plan）、../domain-design/components.mdとdecisions.md、../requirements-analysis/requirements.md、../user-stories/stories.md、../refined-mockups/mockups.mdとinteraction-spec.md、適用team/project方針。
