# U2改訂2：rootのCUA画面確認

2026-10-21 Asia/Tokyo。承認済みStep5の有限確認。実Auth・実外部APIは使わず、dummy Auth/provider・専用preview schemaで確認した。APIの直接操作・browser state注入・旧CDP helperを使っていない。本記録は試験成功や受入完了を先取りしない。

## 実行と確認済み範囲

- 事前のport3000 Listen照会は該当なし。既存Node22で承認済み `node scripts/local-workspace-preview.mjs` を起動。最大寿命300000msは変更していない。
- CUA専用タブで本人ログインへ到達。最初の架空メール指定はdummy実装の固定メールと不一致で401。実装にある固定の架空本人へ訂正した同画面のログインは200。準備の指定誤りであり製品Redではない。秘密値・Cookieは記録しない。
- 架空企業登録は201、企業詳細と保存メモ0件を実表示。企業IDは `41b0dd77-3c30-4cd8-bebf-343a2c5eab6a`。これは削除済み専用schemaの架空fixture識別子である。
- 基準の実測はCSS innerWidth1920／innerHeight957／devicePixelRatio1、document横overflowなし。1366条件やnative200%の達成へ読み替えない。
- 「画像・OCRからこの企業のメモを作成」を実クリックし、正しい企業の固定保存先とアップロード手順へ到達。見出しfocusと画像選択、任意入力、OCRボタンを確認した。

## 未成立・未確認

- native拡大のCUAキー操作 `Control_L+plus` は表示寸法・DPRに反映されなかった。キー表記を `Control_L+Shift_L+equal` へ補正して1回確認したが、同じ1920×957／DPR1だった。200%の表示は観測できず、viewport emulationやCSS scaleで置き換えなかった。製品が200%で操作不能と判定したものでも、成功の証拠でもない。
- 既存packageの小さな非個人PNG（445bytes）を使う通常filechooser手順を準備した。CUAのfilechooser待機を開始して観測済みの画像選択ボタンをクリックしたが、10000msでchooser待機がtimeoutした。setFilesは呼べず、画像未選択、OCR・生成・メモ保存・保存後往復は未実施。Canvas／Fileの注入やbrowser fetchで回避しなかった。
- 公式ブラウザ対処案内に従い、利用者へChrome拡張の「Allow access to file URLs」を有効にする案内を提示した。こちらから拡張権限やブラウザ設定を変更していない。設定状態が原因と確定したものではない。
- よって今回の実画面でR1の保存後OCR／復習往復の完遂とNFR5.2のnative200%受入は未確認。callback回帰の42/42成功を実DOMの成功へ読み替えない。計画Step5は全条件完了にしない。Step6の製品不備は今回確定しておらず、設定・操作上の未成立を理由にアプリ修正を追加しない。

## Cleanupと次の確認

- 未完了のアップロード画面をCUA screenshotで確認後、この作業の専用タブだけcloseした。画像選択に未到達であり個人fileの送信はない。
- 自身のpreviewへstopを送りexit0を回収。`dedicatedPreviewStopConfirmed:true`／`dedicatedSchemaDropped:true`。helper所有のNext停止と専用schema削除を確認した。通常テストDB・他者タブ・他者process・volumeは変更しない。
- preview logはdummy loginの401→200、企業作成201、企業／メモ一覧等のGET200まで。OCR／生成／メモ作成POSTの成功を示すものはない。
- ブラウザ側の入力・倍率操作が利用可能になった時に承認済みの有限手順を実施する。認証や権限変更を要しないStep7のローカル品質確認は先に進め、今回の未確認を成果物と正式レビューへ引き継ぐ。
