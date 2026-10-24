# U2再開：rootの実画面確認

## Scope and Preconditions

2026-10-23 Asia/Tokyo。承認済みU2計画Step5の有限確認。実Auth・Supabase・外部AI・実画像・私的本文は使用せず、既存dummy Auth/providerと使い捨てPostgreSQL schemaだけを使用した。アプリsource・試験・設定・依存は変更していない。今回の自動検証結果は[再開検証記録](restart-verification-2026-10-23.md)を参照する。

- 自動品質検証の完了通知後、port3000に待受なしを確認。既存Node22で承認済み `node scripts/local-workspace-preview.mjs` を実行。5分上限300000msは変更していない。
- helperが起動したNextだけを対象とし、他者process・DB・volume・ブラウザタブは操作していない。初回接続のタブがstale/missing、その後Detachedとなったため、公式案内に従い同じ選択済みChromeで専用タブを新規作成した。ブラウザの再選択や別の自動化方式への切替はしていない。
- CUA browser inventoryはChrome extension。ブラウザ版は今回取得していない。標準画面の実測はCSS幅2560、高さ1261、DPR1、横overflowなし。1366×768、390×844、幅320/767/768の条件を達成した証拠ではない。

## Observed User Flow

- 正しい架空本人のログイン200、企業登録201、企業詳細の保存メモ0件を確認した。専用企業IDは `439452b3-1ff0-465a-aa47-4378c045be48`（削除済みschemaの架空fixture）。
- 「画像・OCRからこの企業のメモを作成」を実クリック。「この企業の画像・OCRから生成」の見出しとfocus、正しい固定保存先、画像選択、任意入力、画像未選択時のOCR無効をDOMと画面で確認した。
- 企業登録後の読込待機で未観測ラベル「企業を追加」を待った呼出しはno matchで失敗。最新DOMを再取得し、実在ラベル「企業を登録」と企業詳細を確認して続行した。製品Redや登録失敗の証拠ではない。
- previewログはlogin200、company201、企業とmemo一覧GET200まで。OCR・生成・メモ保存POSTの成功は観測していない。

## Native Zoom and Upload Limits

- 基準2560×1261／DPR1に対して `Control_L+plus` を1回実行したが同値。キー表記を `Control_L+Shift_L+equal` に補正した1回も同値だった。200%という倍率表示は取得できず、native200%の成功を主張しない。viewport emulationやCSS scaleは代用していない。
- 既存packageの非個人PNG（445bytes、64KiB以下）を候補とし、通常のfilechooser待機10000msを先に開始して観測済み「メモ画像を選択」をクリックした。待機はtimeout。setFilesは呼んでおらず、画像は選択・送信されていない。
- 公式Chrome upload案内に従い「Allow access to file URLs」の利用者向け案内を提示した。こちらで権限・拡張設定を変更していない。設定不足が原因だと確定したものでも、製品のOCR/保存不具合を再現したものでもない。
- よって画像選択以降のOCR訂正・Web採否・生成・内容確認・明示保存・同memo表示・保存後OCR/復習往復・メモ1件保持は今回の実DOMでは未確認。callback42件と実PGを含むU2140件の成功は、それらの実画面受入やnative200%の代わりにならない。Step5/6、NFR5.2の未確認を維持する。

## Cleanup and Interpretation

- 未選択の生成画面をDOM/screenshotで観測した後、Control_L+0で倍率復帰を操作。実測は2560×1261／DPR1のまま。作業用の2タブを閉じた。
- 自身のpreviewへstopを送り、helperの終了結果exit1、`dedicatedPreviewStopConfirmed:false`／`dedicatedSchemaDropped:true`を回収した。停止確認失敗をexit0として扱っていない。
- 続けてport3000の待受なしを確認。通常権限のprocess照会はAccess deniedのため、supported権限経路で読取確認しexit0。既知のhelper/Next PIDはどちらも存在しなかった。追加taskkillや他者process停止は行っていない。この独立確認で専用process終了を確認し、専用schema削除はhelper出力で確認した。
- 自動品質の成功と、この画面受入の未完了を分けて正式レビューへ引き継ぐ。実Auth/Bsession/Supabase/外部provider/実CI/本番は未確認。

