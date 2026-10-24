# U3 検証結果 — revision02の現在値と履歴

## revision02 — 現在の最終ローカル品質
正本は[verification-revision-02.md](verification-revision-02.md)。最終typecheck/lint/build/diff exit0、通常635件成功、同条件coverage Retry635件成功/lines85.95%(2962/3446)、U3全139件。旧587件/83.50%は以下の履歴であり現在値ではない。初回shell/typecheck/coverage失敗は[停止履歴](verification-revision-02-root-stop.md)に保持。実CI/公開/実Auth/Supabaseは未確認。限定GUI/Step9未完は[現在の手動記録](manual-revision-02-root.md)を参照。

## 以下はrevision01以前の検証履歴

## CDP Retry後の最終補完

比較app/共有接続/単体試験は再開時からbytes不変。変更はhelper/docsのみ。既存587tests/lines83.50%/typecheck/build成功をその同じapp bytesの既実行結果として維持し、今回再実行したとは表現しない。

- helper構文 `node --check scripts/check-u3-comparison.mjs`: exit0。
- `node scripts/check-u3-comparison.mjs --self-test`: 3check/exit0。
- `node scripts/check-u3-comparison.mjs --self-test-failure`: falseを検出する意図的exit1（成功へ変更しない）。
- `npm run lint`: exit0、warning0。npm更新noticeは依存更新指示として実行していない。
- 独立実DOM結果/各commands/exit/cleanupは[CDP証拠](cdp-retry-evidence.md)と[現在受入表](manual-acceptance-status.md)へ。最新の全幅/native/安全/keyboard/確認中変更はそれぞれ有限の区間で成功し、全flow/性能100回の反復ではない。
- 最終read-only cleanup: Node22.23.3、isolatedSchemas0、dbClients[]、3000/9224 responding=false、exit0。
- 所有照合: strict manifest29path一致/削除0、U3 aggregate `36a9f6f6cfaf75eeefdb116382f7a0d49ccfebe7436ca55d63421bac39d49d93`、再開変更helper/docs2fileのみ。U1 94source4f419f…/target337337…とU2 41source530045…を実再計算で確認。
- 137IDと文書リンク/最終diffの検査結果は最後の校正記録へ。Step16は実B未確認で未チェック、他の完了済みcheckboxを変更しない。

### 2026-10-20の記録照合

親側の読取検査はexit0。manifest29件とfingerprints29件のbytes不一致0、再計算aggregateは上記36a9f6…と一致。traceabilityはupstream/coverage各137件、unique137（90AC/17BR/30NFR）、OK参照先の実file欠落0。主要記録6文書の相対リンク28件は欠落0、git diff --checkはexit0（既存LF/CRLF警告のみ）。保存済み実装の試験を新たに実行した結果ではない。最新限定区間と以前の診断失敗の区別だけを文書校正し、承認計画・試験手順・アプリsource・テストは変更していない。


## 直前Retry時点の判定（以下は履歴）

Step17品質は順次すべてexit0：lint warning0、typecheck、54files/587passed（29.43秒）、build、coverage同587passed（30.01秒）・全app/src lines83.50%（2794/3346）、git diff --check（既存LF/CRLF警告のみ）。include/lines80下限/既存assertion不変。実PGskipなし。以下の旧U1失敗と今回の別承認修正後結果を区別する。

Step16はCDP Runtime.evaluate timeoutで未完了・未チェック。helperは残M区間だけを実行し、M2/M3等5check成功後exit1、専用cleanup全true。比較切替時503/unavailableは明示再取得で回復し確定値/追加PATCH0を確認、原因は未確定。app Red認定なし。詳細・未到達条件は[再開証拠](post-u1-resume-evidence.md)と[手動記録](manual-evidence.md)。品質成功だけでUnit全体を合格にしない。

今回はhelper/docs/記録だけ変更、app/test挙動は不変。current29source aggregate a56c3783dd915054858aa2f62501da73b82786d01bba63baf6806808a2a69740。U1改訂2/U2は維持、実CI/本番Auth/公開は未確認。以下は再開前の履歴で、過去の失敗/未実施を消去しない。

## 判定

Unit全体は未合格。Retryでもcoverage付き全suiteが凍結U1期限試験で失敗した。U1変更は未承認のため適用せず、依存しないU3補完の結果を記録して書止めた。計画Step15は完了、Step16〜18は未チェック。正式レビュー・Unit完了の証明ではない。

## Retryの最新結果（以下の旧結果を上書き合格にしない）

公式Retry後、U3 all exactは9files/119passed・exit0。整形後のstate/edit/export exactは48passed・exit0（Refactor）。typecheck/lintはexit0・warning0。以後のhelper変更は最新lint未再実施、production app source変更なし。

`npm run build`はexit0、`git diff --check`はexit0（既存LF/CRLF警告）。`npm test -- --passWithNoTests=false --coverage`は54files/587tests中586passed/1failed・exit1、同じU1 routes:262の40ms期待operation_unknown/実際unavailable（68ms）。coverage集計はこの出力に出ず、80%判定未確認。以後の全体test/coverage再試行は停止した。

119件終了後のread-only診断では隔離test/preview schema0、他DB接続0、専用3000/9224応答なし、専用node process0。残存による継続負荷の証拠なし、全suite内の実時間競合/原因は未確定。[最小の未適用U1試験案](u1-deadline-diagnosis.md)は再承認が必要。

helper構文0/自己検査0/意図的失敗1を再確認。cleanup code128を観測した後、所有childの終了確認を有限待機する最小修正と「実終了あり/なし」の自己検査を行い、29check成功・process exit0・preview/Edge/profile/schema cleanup全true/errors=[]を確認した。実TCP p95 616.30ms、最大929.48ms、失敗0、DB15,617,171bytes。以前のexit1は履歴として維持。

追加M flowは25check成功後、M3追加入力破棄→旧/新比較切替後のready待機でexit1。最小診断では旧表示に到達済みで、再入口後server=true/loading=false/readError=true、要求数52→56、login=false。helper前提かapp境界か原因未確定。両実行ともpreview/Edge/profile/schema cleanup全true・errors=[]。一時診断分岐を通常helperへ戻した後の構文はexit0。新しい実helper/補完修正は停止、未到達variantを未実施のまま残す。

未実施は最新helperのlint/全補完の成功確認、Mの残variant、最終全体npm testの再実行、coverage80%認定。型/lint/buildの以前の成功を全体合格へ読み替えない。詳細は下の履歴とmanual-evidence.md。

## 実行結果

Node22.23.3 / npm11.6.1、既存依存、dummy認証/provider、隔離実PostgreSQL17.6を使用。新依存・設定・DB変更なし。

| 対象・command | 実結果 | 範囲・限界 |
|---|---|---|
| 着手前 `npm test` | 45files/468passed、exit0 | U3変更前のworking tree baseline |
| readiness exact | 1passed、exit0 | runner成立。app Redではない |
| model/legacy exact | 22passed、exit0 | opaque版・URL正規化回帰を含む |
| client/実PG exact | 30passed、exit0 | client20＋既存handlerを通る実PG10、skip0 |
| state/edit/export exact（途中） | 47passed、exit0 | owner/世代・dirty・unknown・rebase・出力 |
| UI exact | 18passed、exit0 | Node callback/SSR。実DOMとは別 |
| U3 all exact（Step14） | 9files/118passed、exit0 | 最後の追加1回帰より前。現在の119件一括成功とは言わない |
| `npm run lint`（Step14） | exit0、warning0 | 最後のedits/test/helper変更前。最終再確認は未実施 |
| `npm run typecheck`（Step14） | exit0 | 最後の追加回帰/最小修正前。最終再確認は未実施 |
| `npm test`（Step14） | 54files/586tests、585passed/1failed、exit1 | 凍結U1の40ms COMMIT期限試験 |
| `npm test -- tests/u1-company-notes/routes.test.ts --passWithNoTests=false` | 19passed、exit0 | 既存assertion/期限を維持した単独再確認 |
| `npm test`（Step17、重い検査の同時実行なし） | 54files/586tests、585passed/1failed、exit1 | 同じU1期限試験が再現。最終全体合格なし |
| 最後のstate/edit/export exact Red | 48tests、1failed/47passed、exit1 | A→B→Aの旧login拒否応答がrejectedになる実不備 |
| 同exact Green | 3files/48passed、exit0 | 旧loginのエラーも同ID照会用unknownへ保持。これ以後source変更なし |
| `node --check scripts/check-u3-comparison.mjs` | exit0 | 診断用finally補足より前 |
| helper `--self-test` / `--self-test-failure` | exit0 / 意図したexit1 | 偽の成功を防ぐ自己確認。最新finally診断追加後の再実行は未実施 |
| 実画面helper | 直近29check成功、process exit1 | 全M条件やhelper総合合格ではない。[手動記録](manual-evidence.md)参照 |
| `npm run build` | 未実施 | 停止指示後に開始せず |
| `npm test -- --passWithNoTests=false --coverage` | 未実施 | 全app/src lines80%以上はU3で未測定。旧coverage値を流用しない |
| `git diff --check` | 未実施 | 最終検査は残存 |

各exact groupの全文commandとRed/Green/Refactorは[TDD記録](tdd-evidence.md)・承認済み[試験手順](unit-test-instructions.md)に対応する。最後の追加修正のRefactor・全体再確認は停止指示により未実施。成功件数へ未実行/skipを加算しない。

## 全体失敗の具体的境界

`tests/u1-company-notes/routes.test.ts:262`、`server deadline during COMMIT response uncertainty stays operation_unknown`。40msの要求で期待`operation_unknown`、実際`unavailable`。単独順次の全suiteでも70msで同じ失敗、全体26.65秒。COMMIT前に予算切れする可能性はあるが、原因は未確定。focused19件成功だけでこの全体失敗を取消さない。U3 sourceを直接importしない既存試験であり、凍結U1 source/test・期限・assertionを変更していない。

## 実画面・参考性能

Edge155.0.4283.62 / protocol1.3 / Windows10.0.26300。直近は29checkすべて成功、専用preview/Edge/schema停止確認はすべてtrue、preview exit0。ただしprocess exit1のfinally設定元は未特定。最後に段階/エラーcodeだけの診断とprofile除去の有限retryを追加したが、停止指示により未再実行。profile除去失敗を確定原因とは言わない。

native200/400%は別tabの実browser設定で幅1342→671/335、DPR1→2/4を確認し、両倍率で理由保存・比較.md・旧入口を実操作。viewport1366/390/320/767/768は別の模擬結果。既存単発の本人編集本文.md/復習.mdも実操作。M2等の未確認variantは手動記録の表に残す。

実TCP HTTP、100企業/1000メモ/10000操作、20社比較、warmup5→2client×50、p95 482.70ms/最大647.59ms/失敗0、cold参考1450.87ms、fixture7,894,886bytes、DB15,338,643bytes。ローカルp95≤2秒/DB≤200MiBの参考条件はこのfixtureで成立。実Supabase/外部ネットワーク/本番の達成ではない。

## 残る条件

実Auth/Supabase/鍵・実CI job・公開・対象merge SHAは未確認。Vercelは本人担当。既存U1の競合draft破棄/復元session復活/ロック待ち後削除期限、U2の保存後往復による重複保存/native200入口未確認、既存dependency audit high5/critical1は未修正。新しいU3回帰や画面成功をそれらの解消としない。

再開時は全体失敗の正式な処理、helper finallyのcode/段階回収、未確認M variant、最後の48件のRefactor/型/lint、U3全119件、最終4品質/coverage/diffの順に必要な確認を行う。確認・修正がないままUnit完了へ進めない。
