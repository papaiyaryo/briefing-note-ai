# U3 — 保存企業比較の実装とローカル実証

比較アプリと単体/実PGの成果は維持し、今回のCDP/helper技術停止を解消した。適用可能な残るローカル実操作を補完したが、single-owner構成で成立しない実B session/A→B→Aは未確認。Step16は未チェックを維持し、全受入・Unit完了を宣言しない。コード/ローカル実証と本人担当実環境・リリース受入を区別する。

## 所有と現在のsource

再開時から変更したsourceは `scripts/check-u3-comparison.mjs` と `docs/company-comparison-local.md` の2fileのみ。app/共有接続/単体試験/DB/Auth/依存/CI/coverage設定のbytesは変更していない。他者のdirtyを保全し、commit/push/mergeなし。branch `release/bolt-002-company-data-management-local`、HEAD `df63c09be502bf5c9e50b58a69e2bacea5c39bc5`。

厳密な[source-manifest.json](source-manifest.json)は29実file・削除0を維持。[source-fingerprints.json](source-fingerprints.json)の現在aggregateは `36a9f6f6cfaf75eeefdb116382f7a0d49ccfebe7436ca55d63421bac39d49d93`。算式はsorted `path:sha256` をLF結合・末尾LFなし。今回開始値a56c3783…と変更2file、以前の開始値c567f1d4…を区別する。[開始baseline](source-baseline.json)に対する既存共有4file差分とroot所有handoff、別承認U1期限test変更をU3変更へ混同しない。

読取再計算でU1 94source `4f419fdb5da964d28f61d712638557e56a497cf780389c508ea47578e293510c`、target `33733741017a5208c0b8e5f0b1cd5d9b98ec00a1f94338905adeacf1474374c5`、U2 41source `53004538088d1e50f75837cf48ee045f2cd38f5e93eb854a4111258725e06fd8` の維持を確認した。

## 実装する契約

1〜20社・1社1構造化メモ・固定7観点、空は未記載/要確認を保持。自由本文から企業事実を生成しない。紙区分と採用Webの全metadata、保存名/イベント/出自/manual/dummy/openaiを分ける。Versionは非空の不透明値。

C1/C3/C4を再利用し、企業志望度とメモ理由は別版・別保存・changes限定。owner別app-instance store、draft/pending/committedの寿命をmountから分離。同ID/bodyのunknown照会/明示再試行、base/draft/latest分離、commit後GET失敗と保存成功の区別、追加入力保持を維持する。出力毎に全company/memo版・本人/選択/入力世代を確認し、同snapshotから1file。旧比較は明示別入口で正常操作と元形式を維持し、破損混在を欠落書込/移行/送信しない。

## 今回の実操作とhelper修正

[CDP Retry詳細](cdp-retry-evidence.md)、[M1〜M12/30NFR現在表](manual-acceptance-status.md)、[手動履歴](manual-evidence.md)に結果を分けた。以前の未達・exit1は消さない。

- M4 timeoutはhelperの非cancelableなanchor.click置換とnative beforeunloadを実eventで特定。blob以外はnative clickへ委譲し、実DOM preventDefault、custom guard、実route remount→同IDcommitted/追加PATCH0を9check/exit0で確認。native dialog自動承認なし、app修正なし。
- M6の不正/実15秒期限/途中入力、別client各版変更/削除、出力中401とfile0を確認。確認中変更は各caseの新C3保留・旧通知なし→実HTTP変更/削除成功→解放後の当C3完了/200・404→file0を6check/exit0で確認。過去の出力前変更とは別証拠。
- M7制御401→保護欄非表示→同A最新確認/明示復旧/draft保持/追加write0は3check/exit0。実B認証や実A/B/Aの代用ではない。
- M8旧正常編集/出力・混在非破壊・利用不能/0件、M10実scroll、M12企業詳細の本文/構造保存と対応.mdを独立区間で確認。M12最初の連続実行exit1は保持し、本文成功と限定構造4check/exit0を分ける。
- M9は1366/390/320/767/768とnative200/400それぞれ主要操作へ可視/有効/scroll・focus・実入力で到達。PC/mobileのCSS排他表示と7観点順も確認。nativeは非emulated新tabの基準1342/DPR1→671/DPR2・335/DPR4を実測。既存の倍率別出力/旧入口証拠を再利用した。全異常×全幅という未承認の追加直積を課さない。
- 危険HTML/img/pipe/実改行の表示・Markdown安全化、契約不正URL3種の実配送/拒否/file0/非リンク/実行0、401出力阻止は6check/exit0。login時の既存Analytics debug Script1件を総数として保持し、既知一致boolと対象操作外部増分0を分けた。未知/操作起因要求は許容しない。
- keyboardは一時DOM配送プローブ後、19対象へ実Tab到達（計517、最大122）、Enter/Space/ArrowDown等の主要操作を11check/exit0で確認。503回復の既存helper clickは別記し、連続全操作が完全keyboard-onlyだったとは表現しない。既存M10のShiftTab/Tab wrap・Escape/20社ArrowRight証拠も保持。

実503/unavailable→明示再取得・保存成功/入力保持・追加write0を複数回観測した。根本原因は未確定。回復によって元の失敗を消さず、app bug/期限/lockへ飛躍しない。

## 品質と証拠の境界

[verification-results.md](verification-results.md)に確定結果を記録。先行のU1改訂2後の同じapp/test bytesで、lint/typecheck/build/diff exit0、全54files/587tests成功・skip0、全app/src lines83.50%（2794/3346）を維持。新たな全体反復はしていない。include/80%下限/assertionを変更していない。

今回のhelper最終構文exit0、自己検査3check/exit0、意図的failure検出exit1、lint exit0（warning0）。最終diff/リンク/JSON/137ID照合は同検証記録へ。最終専用schema0/DB clients空/3000・9224応答なしをread-onlyで確認し、全専用資源を後片付けした。既存DB/volume/他者processは変更しない。

## 未確認と持越し

[traceability.json](traceability.json)に90AC/17BR/30NFRの137IDを維持する。35ACのU3実装と55ACの他Unit境界、local実証と全体受入保留を区別する。[TDD履歴](tdd-evidence.md)の実app Red→Green→Refactorは保存し、今回のhelper/setup失敗を新app Redへ加算しない。[再開前summary](code-summary-before-cdp-retry.md)も保存する。

現single-owner previewでは実B sessionが成立せず、実A/B/A DOM確認は未達。Auth構成を拡張せず、単体/実PGowner隔離を実B browserの証拠と称さない。実Auth/Supabase秘密/本番DB/実CI job/Vercel設定・deploy・公開/対象merge SHAは本人担当・未確認。ローカル参考HTTP p95やDB容量を本番保証へ読み替えない。

U1既知3不備、U2既知2件、既存audit high5/critical1は未修正でrisk acceptanceもしていない。通常の再表示でのU3境界成功を、これらの修正やリリース完了として扱わない。
