# U2 local browser evidence

Node22.23.3、Windows、既存Edge155.0.4283.45/CDP1.3、dummy Auth/provider、実PostgreSQL17の専用schema。架空2x2 PNG（64KiB未満）、実画像・私的本文・秘密は記録しない。

`node --check scripts/generated-notes-browser-check.mjs` exit0。`node scripts/generated-notes-browser-check.mjs --self-test-failure` は意図的falseでexit1。helperは未到達・falseを成功扱いしない。

## First actual browser run

`node scripts/generated-notes-browser-check.mjs`

- 18確認中17成功、生成入口で見出しへfocusが移らない1件は実Red。heading実DOMまで到達しfocusを比較してfalseとなった。helper未到達・設定不備ではない。終了コードexit1を確定。
- 成功: 固定企業名不一致/dummy表示、本文編集と構造の独立、安全HTML、表示本文と.md一致、未保存確認の取消focus/Escape/入力保持。
- 幅1366×768、390×844、320/767/768で候補の横overflowなし。CDP視覚viewport拡大200/400%でlabel付きeditor利用可。これはnative browser zoomや拡大時reflow全体の達成を証明しない。
- unknown操作照会後の同一body/ID明示再試行、保存確定後GET失敗でも成功維持、再取得で本文/構造/OCR/イベント/Web/providerOrigin完全一致、同じ企業/memo ID、企業名不変・メモ1件・画像名/URLなしを実HTTP/PGで確認。
- 保存確定後のimage object参照0、idle2秒で追加API要求0、同じ保存メモの既存editor表示を確認。
- helper finallyの実結果: previewStopped=true、schemaDropped=true、edgeStopped=true。他process/schemaは操作しない。過去のexec遅延やrecompile反復との因果は推定しない。

残るflow・focus Green・最終結果は後続の実行結果で追記する。SSR/callbackと実DOMの証拠は区別する。

## Second actual browser run

入口focus・入力中focus維持・Tab/ShiftTab・前回成功flowを含む23確認成功。追加した後続flowが保存editorで非表示の生成入口を探して未到達となりhelper exit1。app不備として数えず、既存「編集を閉じる」から企業詳細へ戻る導線へ修正。専用cleanup3項目はすべてtrue。

1366物理px相当のCSS viewport683/DPR2と341/DPR4で横overflowなし・label付き候補editor利用可を測定した。視覚拡大、CSS viewportリフロー、native browser zoomは別の確認。現時点ではnative zoom200/400%は未確認であり、承認済み拡大受入の全達成とは称さない。

## Third actual browser run

追加の実HTTP署名改変拒否と編集保持、不正な新構造の拒否と最後の有効候補/OCR保持、commit後応答途絶からの同operation照会は成功した。保存確定表示の後、非同期GET完了前に「保存メモを開く」を探したhelper未到達でexit1。固定sleepでなく実要素の有限待機を追加した。

専用profileのnative zoom設定APIは存在したが、既にmobile emulationを使ったtabでは設定後もCSS幅320・DPR1だった。2件のzoom assertionはfalseであり、拡大受入成功として数えない。emulationなしの専用新tabでCSS幅/DPRを測る限定再確認へ進む。成立しなければnative zoom未確認を残し、際限なく再試行しない。3回目もpreview停止・専用schema削除・Edge停止はすべてtrue。

## Fourth / fifth finite runs and current acceptance limit

- emulationなしの新tab、専用profile内のnative zoom設定で、基準CSS幅1342、200%は671/DPR2、400%は335/DPR4を実測。いずれも横overflowなし。400%ではlabel付き生成入口へ到達した。200%では入口labelが有限待機内に届かずassertion false。倍率の測定だけを操作受入の成功へ読み替えない。未到達の原因（アプリ境界か実行条件か）は未確定。
- 4回目は単発遷移後のdocument更新でhelper計測状態が失われbrowser-eval失敗、exit1。アプリRedには数えない。計測の初期化をPage.addScriptToEvaluateOnNewDocumentへ接続して、各documentで実際の要求数・参照を追う。書込数は当該documentの実カウンタ基準で比較する。
- 5回目（最終）: **34確認中33成功、1未確認、exit1**。native200%の生成入口操作だけが未到達のまま。際限なく試行せずNFR5.2/Step18の全体合格を保留する。
- 最終runで、実HTTP証明改変拒否/入力保持、不正構造の新候補拒否/最後候補保持、commit直後応答途絶→同ID照会、unknown未確定→照会→同body/ID明示再試行、保存確定後GET失敗維持/再取得、全保存項目と所属IDの一致を確認した。
- 単発入口→画像除去/差替え→OCR→生成→本人編集本文.md→復習→対応.md→終了も到達。各表示内容との出力一致、新DB書込なし、除去/差替え/終了時のobject参照解放を確認した。架空PNG bytesは64KiB未満。
- 全5回とも最後の専用cleanupはpreviewStopped/schemaDropped/edgeStoppedがtrue。最終helperの実process exit1も回収済み。dev previewとbuildは重ねない。

本人切替の別owner/late応答はNode callback/API/実PGで確認済みだが、実ブラウザで別本人へ切り替える受入の証拠ではない。危険HTML・PCキーボード・label・通知・狭幅・取消は上記の実DOM結果、純粋callbackの結果はTDD記録を参照。実Supabase/Auth/LLM/本番/実CI job、U1既知3不備の解消は未確認/未修正のまま。
