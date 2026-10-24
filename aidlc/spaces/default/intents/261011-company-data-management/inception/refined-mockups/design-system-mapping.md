# 既存デザインとの対応

## Existing Design System
大きな外部UIライブラリはこの段階で追加しない。app/globals.cssの背景#f7f8fa・本文#1f2933・日本語sans-serif、Button.tsxのprimary/secondary・rounded-lg・focus ring、既存編集のPC左右／スマホ切替、既存比較観点を出発点にする。tailwind.config.tsは存在せず、存在する定義として引用しない。

## Proposed Tokens
| Token | 設計値／用途 | 根拠 |
|---|---|---|
| canvas | #f7f8fa | 既存globals.css |
| surface | #ffffff | 既存白カード |
| text | #1f2933 | 既存globals.css |
| muted | #475569 | 新たな補助文字のモック用明示値 |
| primary | #0f766e / white text | 既存teal系の意図を継承したモック値。Tailwindクラスの実際の生成色と同一と断定しない |
| border | #cbd5e1 | カード区分。入力の識別・focusは別の強い線も使う |
| warning | #92400e on #fffbeb | >=15社と文字警告 |
| danger | #b91c1c on white | 削除・拒否の文字と明示ボタン |
| focus | #0f766e 2px outline + offset | キーボードfocus |
| spacing | 4/8/12/16/24/32px | 既存カードを整理 |
| radius | 8px | rounded-lgの見た目を継承 |
| body | 14〜16px、line-height 1.6、日本語sans-serif | 密度と長文の読みやすさ |
| target | 最低44px相当、隣接8px余白 | 本アプリの設計目標。WCAG2.1AAの全項目適合済みという意味ではない |

## Component Mapping
| 設計部品 | 既存との関係 | 必要な追加・変更（後続承認後） |
|---|---|---|
| C01 nav | 既存各画面のheader | 保存画面の共通入口、現在位置、skip link |
| C02 board/card | 既存white cardの見た目 | 保存8状態・通常6状態／終了再表示、次の選考日の強調、企業ID・社数・幅適応 |
| C03 form | native input/select＋Button | 登録dialog、企業詳細の項目・8状態、明示保存、検証・競合表示 |
| C04 editor | MarkdownEditStep、MarkdownPreview | サーバー保存入口、別構造化編集、原文出典、保存状態 |
| C05 OCR | 既存Upload/OcrReview手順を継承 | 保存先企業・画像非保存の境界、一時画像と訂正 |
| C06 compare | CompanyComparePage、comparison.tsの7観点 | 企業ごとメモ選択、最新取得、旧比較区別、出典分離 |
| C07 dialog | 新設する確認UI | 未保存破棄、影響件数、変更後再確認、focus管理 |
| C08 feedback | ErrorNotice／Buttonのdisabled | 保存拒否・未確定・競合・失効を区別 |
危険ボタンの色・dialog・tabs等は現行Buttonが実装済みと扱わない。今はHTMLモックの表現であり、アプリの追加依存や部品実装ではない。

## Board Design Mapping

再承認済みFR3.5とAC3.1.8に対応し、次の選考日に25px程度の太字、青緑背景、左の強調線を用い、色だけに依存しない日付ラベルを付ける。状態・メモ件数は12〜14pxの補助情報とする。通常の状態列は6、終了企業の再表示時は8。未設定は文字表示し、日付保存と応募締切との区別は操作・データ契約でも維持する。

## Responsive Mapping
| 幅 | 配置 |
|---|---|
| <768px | 縦グループboard、detail1列、本文切替、画像/OCR上下、観点ごとの縦比較 |
| >=768px | 空間に応じた2列編集、PCboard通常6列／再表示8列の領域スクロール、比較表 |
| 拡大／長文 | 折返しと1列への再配置、必要な二次元領域だけ個別移動 |
具体的な長文上限・件数ページング・代表データ量はDomain Designに引継ぐ。見た目の確認例から性能や保存上限を推定しない。

## Sources
mockups.md、interaction-spec.md、refined-mockups-questions.md Q1〜Q3、../user-stories/stories.md、../requirements-analysis/requirements.md、../practices-discovery/team-practices.md。既存app/globals.css、Button、MarkdownEditStep、CompanyComparePageの読取。
