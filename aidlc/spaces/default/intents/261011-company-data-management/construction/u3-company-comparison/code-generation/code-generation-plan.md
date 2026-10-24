# U3 — 既知2不具合の修正計画（revision 02）

## Summary

- Builds: 未確定保存の誤成功表示と、削除参照の再取得後に新規保存できる不具合を修復する。
- Touches: 比較状態・保存制御2ファイル、比較UI2ファイル、U3既存試験4ファイルと本Unit記録。
- Tests: 新規回帰20件を予定し、既存U3全9試験、実PG結合、CUA画面確認、全体品質・80% line coverageを確認する。

## Scope and Approval Boundary

同じIntent・release Bolt002のU3再修正。現在の計画承認状態はreviseであり、本書と[Unit試験手順](unit-test-instructions.md)に対する新しい正式な人間のCode Generation Plan Approval前に、アプリ・試験・helperの変更や試験実行を始めない。本書は計画のみで、新しいRed/Greenや画面成功の証拠ではない。

修正対象は[既存正式レビュー](reviews/review-01.md)のMajor R-01/R-02。機能設計WF4.4/4.6、WF5.2〜6、WF6.2〜4を実現する範囲に限定し、要件・受入条件・C1/C3/C4・HTTP/schema・時間/再試行規則を変更しない。実B認証、Auth/Supabase準備、実外部API、Vercel/公開確認は後回しという本人の方針を保持する。Minor R-03の実A→B→Aと出力確認中の実本人切替は未確認のまま。

旧文書は[旧計画](code-generation-plan.before-revision-02.md)と[旧試験手順](unit-test-instructions.before-revision-02.md)へ本文を保管した。過去のチェック済み18段階や103件の初回構築計画を今回の完了証拠へ流用しない。旧資料のCDP/Playwright操作は今回の画面確認に再採用しない。

## Current Behavior and Repair Decisions

### R-01 — 確定結果に結び付く成功通知

現行ServerCompanyComparisonの保持操作欄はreadbackStateだけで「保存成功」を補足する。409 conflict後のrefreshLatest失敗も同じerror値になるため、未確定なのに成功と表示する。ComparisonFieldEditor、保持操作欄の両方で、当該intentと一致する確定outcomeを持つcommitted状態だけが成功文の根拠になるようそろえる。古いoutcomeや他欄の成功は根拠にしない。

競合後のlatest取得失敗は「競合・入力保持・最新取得失敗」であり、baseVersion/baseValue/draftを変更しない。実commit後に取得が失敗した場合は確定ID/版を保持し、「保存成功、最新取得失敗」を維持する。新しい保存・再送を自動発行しない。

### R-02 — 参照利用不可と操作結果を分離

現行refreshのcatchは404を通信失敗と同じerrorへまとめ、古いsnapshotの編集欄とComparisonEdits.saveが新operationId/PATCHを許す。既存ClientFailureのnot_found/404を権威ある「対象なし／利用不可」と判定し、通信途絶・503・取消し・不正応答と区別する。404を他所有者と不存在に分けて説明しない。

ComparisonSessionに参照の利用可能性を操作statusとは別に保持し、UIとComparisonEditsの双方が同じ条件で新規intent作成/新ID保存を止める。送信中・unknown・committed・conflictの履歴、draft/base、凍結body/ID/outcomeは消さず、利用不可を保存失敗や未送信確定へ変換しない。旧snapshotは古い参照・出力不可と明示し、入力と保存/rebase操作の利用不可を文字でも示す。

C3の全選択404は原因IDを返さない。要求時に固定した選択に利用不可のガードを置き、一列を推測して削除扱いにしない。有効性の解除は現本人・現対象ID・版を検証した既存readCompany/readMemo、または全C3成功に基づく。対象別取得の明示操作には既存「最新を別領域に取得」を再利用し、成功した対象の最小範囲だけ解除する。メモ確認だけで企業の全所属メモを有効化しない。企業404なら同企業の志望度/所属理由を止め、メモ404で企業存在が別途確認できれば企業志望度まで恒久停止しない。無関係な列や選択外の保持操作を巻き込まず、部分GETを完全比較へ昇格しない。比較全体/出力は全選択C3成功まで停止する。

対象別latest/readbackの404も同じ利用不可へ反映する。過去世代の404/成功が現状態を停止/解除しない。通信失敗だけでは消失と断定せずdraftを保持し、conflict中はlatest確認成功と本人の明示rebaseまで保存不可という既存規則を維持する。

新規saveの停止と、既に送信したunknown要求の解決を分ける。同IDのlookupは選択外/削除済みでも残す。lookup committedなら元の確定結果を通知し、対象取得404でも確定を取り消さない。lookup unknown後の本人retryは既存C4どおり同ID・同bodyだけであり、新意図や自動再送に変換しない。新規PATCH0の回帰と、明示同ID再試行の回数/同一性は別に検証する。

## Minimal File List and Ownership

承認後のアプリ変更は次の8ファイルに固定する。別ファイルが必要になった場合はrootへ理由と影響を返し、無断で範囲を広げない。

| ファイル | 変更内容・影響先 |
|---|---|
| src/lib/companyComparison/session.ts | LC1の本人/対象/世代に結び付く利用不可状態・安全な解除。入力・操作履歴の寿命を維持 |
| src/lib/companyComparison/edits.ts | LC4の新規save/rebaseガード、対象別取得の404/通信失敗分類、既存lookup/retry保持 |
| src/components/compare/ServerCompanyComparison.tsx | refresh404の分類をLC1へ伝達、保持操作の確定成功表示、古い比較/対象利用不可の案内 |
| src/components/compare/ComparisonFieldEditor.tsx | 同じガードで入力/新規保存/rebaseを停止、対象別最新確認と確定結果の表示 |
| tests/u3-company-comparison/session.test.ts | 状態・世代・保持・解除の回帰5件 |
| tests/u3-company-comparison/edits.test.ts | Controllerの新規保存停止と凍結操作維持の回帰7件 |
| tests/u3-company-comparison/ui.test.ts | 両表示部品と実refresh callback配線の回帰6件 |
| tests/u3-company-comparison/comparison.integration.test.ts | 既存U1 handler/実PGでメモ削除・企業削除を経た回帰2件 |

既存fixture/uiHarnessは読取再利用のみ。既存model/client/export/legacyと各試験、比較表/Provider/入口、docs/company-comparison-local.md、scripts/check-u3-comparison.mjs、scripts/local-workspace-preview.mjsは変更しない。新しい依存・runner・provider・coverage設定/include/exclude/threshold・timeoutを追加/弱化しない。文書専用の変更先は本Unit記録に限り、docs/配下の変更は不要。

U1/U2/U3の現source-manifestを照合した。従来U3 manifestとU1の共有重複はapp/compare/page.tsxとsrc/components/workspace/WorkspaceShell.tsxであり、今回はどちらも変更しない。U2 manifestとの今回8ファイルの重複はない。app/layout.tsx、共有型/schema/client、API/DB/repository/Auth、既存U1/U2試験・helper・handoffは凍結したまま。既存dirty編集と.worktrees/cloud-handoffを保全し、戻さない。新しい8ファイルを旧29件の累積manifestへ無条件に置換せず、承認後のStep5で実変更と従来U3成果物の関係を正確に記録する。

## Predecessor State and Layer Applicability

U1の既知3件はFixed、checkpoint承認済み、aggregate e1d869dcb42cab9f57ac4bb5475ba5c1f4bf63e7f7bfd69cbb6a8bbf4b40d435、検証607件。U2の重複保存はFixed、checkpoint verified/approved、aggregate 9ab545c407d7a3405022628ac2f191215cea474f8ee0d44b5ccb92ca209e3478、55files/615件、lines85.12%という先行記録がある。これらは今回のU3変更前baselineではない。U2のNFR5.2画像見比べ/実route往復/native200はMajor未確認として残す。

DB/data modelの永続挙動、repository、server APIは変更しないため新しい実装TDD対象ではない。LC1/LC4のbusiness logicとfrontend behaviorが適用層。実PGは既存C4の404/操作記録とU3制御との結合境界を検証する。既存APIが初回Greenでも新しいAPI Redと偽らない。文書/証拠更新には人工Redを作らず、リンク/ID/差分/encodingを検査する。テスト設定はStep1で読取確認し、変更しない。

## Ordered Steps

- [ ] Step 1 — **所有境界・runner確認**。US8.1/US9.1、共同US1.1/US6.3、NFR6.2。working tree、branch、既存manifestと凍結U1/U2との差分を読み、Node/npm/既存Vitest4.1.8/node環境/v8/lines80を確認。試験手順のreadinessとU3全9ファイルのexact commandを変更前に実行し、件数・skip・exitを記録。0件/収集不能/DB準備不備はRedにしない。新しいreadinessファイルは作らない。

- [ ] Step 2 — **変更前baseline**。US8.1/US9.1、NFR6.3。新しい回帰を書き始める前に全既存npm testと既存coverageを実行し、現在の成功/失敗/skip/lines/環境を記録する。U1/U2の607/615や旧U3の587を今回の結果へ流用しない。失敗なら同一原因を切り分け、環境不備・既存不備・対象不具合を区別してrootへ報告し、成功扱いで続けない。

- [ ] Step 3 — **状態/保存制御と結合境界のRed**。US8.1、共同US6.3/US6.4/US6.5、AC6.3.1〜4/AC6.4.3/AC6.5.4/AC8.1.4/AC9.1.4、BR4.1〜4.4/BR5.1、NFR2.3〜2.7/3.1〜3.3。session5件・edits7件・実PG2件の予定14件を受入に結び付け先に追加し、試験手順の該当exact commandsで不具合原因によるRedを確認する。正常/保持の対照例は初回Greenのまま記録し、全14件が失敗したとは主張しない。実削除→C3 404→保存操作→新operation/PATCH0の結合回帰を必須にする。

- [ ] Step 4 — **状態/保存制御のGreen**。Step3と同じUS/AC/BR/NFR。session.ts/edits.tsだけに必要最小の参照ガード・分類・解除を実装。各対象に適切な本人/世代判定を行い、全選択404から原因を推測しない。新規保存を止めても、unknown凍結要求・同IDlookup/retry・commit後読取失敗を保持する。14件と既存状態/保存/結合試験をGreenにする。

- [ ] Step 5 — **状態/保存制御のRefactor**。Step3と同じ追跡先。重複条件を必要最小に整理し、該当groupを再実行してgreenを維持する。client/契約/DBや他Unitへ抽象化を広げず、assertionを緩めない。

- [ ] Step 6 — **画面振る舞いのRed**。US8.1/US9.1、共同US6.3/US6.4/US6.5、AC8.1.4/AC6.4.3/AC6.5.4/AC9.1.4、BR4/5/7、NFR2.7/3.1/3.3/5.3。ui.test.tsへ6件を先に追加し、既存HookHarness/SSR/実callbackでR-01の誤成功文とR-02のrefresh配線不足を再現する。実controllerと送信spyを使い、disabled属性だけを合格根拠にしない。実DOM/実ブラウザ試験と称さない。

- [ ] Step 7 — **画面のGreen**。Step6と同じ追跡先。ServerCompanyComparison.tsx/ComparisonFieldEditor.tsxだけを最小修正し、確定した当該outcomeから成功文を出し、利用不可の文字通知・新規入力/保存/rebaseガード・既存latest確認を接続する。未知の操作結果照会を失わず、全体出力の停止と有効な他欄の継続を両立する。

- [ ] Step 8 — **画面のRefactor・U3既存回帰**。Step6と同じ追跡先。画面6件と全U3 exact commandをgreenに保って整理。既存7観点/区分/出典/旧比較/owner隔離/出力前全版確認/タイムアウト・GET再試行のassertionを保持する。今回20件の追加数と実実行数を記録し、最低件数へ届かせるための重複例を足さない。

- [ ] Step 9 — **限定CUA手動確認**。US8.1/US9.1、共同US6.3〜6.5、AC8.1.4/AC6.4.3/AC6.5.4/AC9.1.4、NFR2.7/3.1/3.3/5.2/5.3。下記M-R1〜M-R5を架空データで実施。画面はCUAのみ。故障分岐のVitest/実PGと実GUI証拠を明確に分ける。未達は未達と記し、既存広範UI sweepを無条件に再実行しない。

- [ ] Step 10 — **全体品質・差分確認**。全担当AC、NFR6.3。npm run lint、npm run typecheck、npm test、npm test -- --passWithNoTests=false --coverage、npm run build、git diff --checkを実行。全app/src lines80%以上、既存設定を維持。新失敗を修正する場合も該当Red→Green→Refactorから行い、必要な検査を再実行。Docker/CI/依存変更はなく、不要なDocker再構築・依存導入はしない。

- [ ] Step 11 — **証拠・自己review・Step5引継ぎ**。全担当US/AC/17BR/30NFR。実変更8ファイルと所有差分、Red/Green/Refactor、M-R結果/限界/cleanup、最終品質と最終source hashを対応付ける。承認後のcode-summary.md/traceability.json/source-manifest.json、既存tdd-evidence.md/verification-results.md/manual-evidence.md/manual-acceptance-status.mdを実結果に沿って更新し、旧証拠を消さない。機能traceのU3担当35AC/他Unit55ACを維持。R-01/R-02は実証してから修復済みとし、R-03/実環境/U2未確認は残す。codeとStep5成果物が揃ってからrootへ正式review用に渡す。今はこれらを書かず、reviewerを先行実行しない。

## Test Strategy and Verification

Standardを維持する。既存のsession12件、editsの正常/二重送信/unknown/競合/commit後取得失敗、UIの正常/復旧/旧比較等を保持し、今回の変更責任に対してsession5・edits7・UI6・実PG2＝予定20件を追加する。UIは2部品の同じ利用不可/成功投影を扱い、既存ケースと合わせて各部品の正常・少なくとも2異常、5〜8基礎例以上を確保する。5〜8へ合わせるためだけの新規ケース水増しはしない。

Unit対象exact commandsは[Unit試験手順](unit-test-instructions.md)だけに集約する。Step1/2前の計画読取は静的確認でありrunner成功とは呼ばない。変更前baselineと最終品質の全体コマンドは次のとおり。

| 検証 | コマンド／条件 |
|---|---|
| 変更前全体baseline | npm test / npm test -- --passWithNoTests=false --coverage |
| 全体品質 | npm run lint / npm run typecheck / npm test / npm test -- --passWithNoTests=false --coverage / npm run build / git diff --check |
| 登録済み公式checkpoint | npm test -- --passWithNoTests=false をrootが既承認のまま使用。変更しない |
| DB前提 | 必要時だけ既存 docker compose -f compose.test.yml up -d --wait。localhostの使い捨てworkspace_test/PG17以外に接続しない |
| 画面用準備 | 既存 node scripts/local-workspace-preview.mjs を変更せず使用。最大300000ms、延長しない。専用schema/Next子プロセスだけ所有 |
| 終了 | helper stdinへstop、専用preview停止・専用schema削除の結果を確認。既存server/volume/他者worktreeを停止/削除しない |

## Bounded Manual Acceptance

実画面は既存computer-useのCUA操作のみ。ブラウザfetch/evaluateによるAPI要求、状態注入、CDP、Playwright CLI、旧scripts/check-u3-comparison.mjsの画面操作を使わない。既存previewはserver/隔離/cleanup準備だけに使う。企業/構造化メモは画面から手入力してよく、画像アップロードを前提にしない。同じ架空本人の2つのCUAタブを別クライアントとして使い、実B認証成功とは区別する。

各runは5分TTL内の限定ケースとし、終わらなければ一度終了・cleanupしてから新しい隔離環境で次のケースを行う。無期限待機・TTL延長・ブラウザセキュリティ設定の変更は行わない。

| ID | 実施手順 | 期待と証拠の種類 |
|---|---|---|
| M-R1 | タブA/Bで同じ架空企業・構造化メモを開く。Bで理由を変更保存、Aで旧版理由を保存し競合→最新確認→明示rebase | 実GUIで旧base/draft/latestの区別、勝手な成功/mergeなし、明示操作後だけ保存。latest失敗の制御はU-R1で別証拠 |
| M-R2 | Aでdirty比較理由を保持、Bの企業詳細で同メモを確認削除、Aで比較再取得。該当欄と保存操作を確認 | 対象なし/利用不可、古い比較/出力不可、dirty保持、新規保存停止。実GUIの画面証拠＋U-R3/I-R1の新PATCH0で配線/制御の保証を補う |
| M-R3 | 同様にBで所属メモを含む企業を確認削除、Aで再取得。残る別企業を対象別確認して保存 | 消失企業の欄は新規保存不可、原因ID非開示・選択を黙って縮小しない。有効な別対象は契約上可能な操作を維持。比較全体出力は全C3成功まで0 |
| M-R4 | 有効欄を通常保存、他欄dirtyの保持と確定ID表示、画面往復、比較.md前の再取得を確認 | 片欄の確定だけ成功、往復で追加保存なし。commit後GET失敗/unknownの故障分岐は制御試験で確認し、未実施の実GUI成功を約束しない |
| M-R5 | 修正通知/利用不可欄/最新確認をTab・ShiftTab/Enterで操作し、既存PC/mobile幅とnative倍率の条件を確認可能な範囲で記録 | 幅/zoomを測定できた値だけ記録。通知・label・focusを確認。CUAでCSS幅/DPR/native倍率が測れない場合やキー操作で変わらない場合は未確認。旧CDPの幅/200/400証拠を今回の測定へ流用しない |

故障注入を要する「409→latest取得503/切断」「commit→GET失敗」「unknown照会/retry」「遅延旧世代」はU3 Vitestの実controller/callback、実削除404は実PG/既存handlerで実証する。対応するライブDOM故障注入の手段は今回用意しない。実HTTP計測の旧ローカル参考値は性能の履歴として保持し、今回の新実測・実Supabase成功とは呼ばない。性能目標/容量/有限期限は既存回帰で維持し、新しい広範性能sweepは追加しない。

## Acceptance Traceability and Completion Limits

| 修復対象 | 既存US/AC | 規則・詳細NFR | 計画／証拠 |
|---|---|---|---|
| R-01誤成功表示 | US8.1、共同US6.3、AC6.3.1〜4/AC8.1.4 | BR4.1〜4.4、WF4.4/4.6/5、NFR2.3〜2.5/2.7/3.1 | Steps3〜8、U-R1/U-R2、C-R3/C-R4、M-R1/M-R4 |
| R-02消失参照保存停止 | US8.1/US9.1、共同US6.4/US6.5、AC6.4.3/AC6.5.4/AC8.1.4/AC9.1.4 | BR4.3/4.4/5.1/5.2、WF5.6/6.2〜4、NFR2.4〜2.7/3.1〜3.3 | Steps3〜9、S-R1〜5/C-R1〜7/U-R3〜6/I-R1〜2、M-R2/M-R3 |
| 所有者・表示・品質維持 | US1.1/US8.1/US9.1のU3部分 | BR1.2/7.1、NFR1.2/5.2/5.3/6.2〜6.4 | Steps1〜11、全U3回帰、M-R5。実BはDeferred |

今回の計画で要求・設計・verification commandを改める必要はない。実装中に必要と判明した場合はrootへ返す。U1/U2 frozen成果物/state/audit/承認記録の書換えは行わない。計画作成担当は上記2文書と旧版保管のみを所有する。後続の実装・証拠更新は新Plan Approval後の別実行である。

実Auth/実B/Supabase/実CI job/本番merge SHA/公開フローは未確認。ローカル品質やreview、Classic段階完了だけでは本番リリース完了にならない。既存NFR5.2全条件を新たな局所成功で一括合格にしない。

## Testing Contract

```json
{
  "version": 1,
  "methodology": "tdd",
  "source": "project",
  "ordering": "For each applicable testable layer: Red, then Green, then Refactor.",
  "scope": "classic",
  "test_strategy": "standard",
  "project_type": "brownfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    },
    {
      "layer": "team",
      "text": "- **Methodology**: tdd\n- **Methodology evidence**: 2026-10-10の人間の「TDDで実装したいな」、project.mdおよびAGENTS.mdの明示方針。現行テストやcommit順からTDD実践済みと推定したものではない。\n- **Ordering**: 新規・変更する振る舞いと不具合修正は各対象レイヤーのrunner確認後、受入基準に対応する失敗テストを実行するRed、最小実装で通すGreen、テストをgreenに保つRefactorの順に進める。\n- 環境不備や無関係の失敗をRedとせず、コマンドと結果を公式Unit記録に残す。アサーションを弱めない。純粋な文書・設定変更は非適用理由と検証方法を承認計画に示す。\n- Test StrategyはStandard。Classic/orgのline coverage 80%下限を維持する。現在はcoverage provider・設定・レポートがなく達成未確認。計測対象、provider、CI接続は後続計画・承認で解決し、この段階では新依存を追加しない。\n- 現行Vitestはnode環境、純粋関数/API fake client/静的SSR中心。Q1の人間回答Aに従い、既存Vitestと手動の画面確認を受入検証の基本にする。後続の承認計画に具体的な操作、期待結果、証拠の残し方を記載する。新しいブラウザ自動テスト依存を自動採用しない。\n- PR前にnpm run lint、npm run typecheck、npm test、npm run buildと承認済み受入基準を検証する。Docker変更時はDockerも確認する。\n- テスト/CIはdummy providersを使い、実API秘密情報や個人メモを用いない。公式runtimeはアプリ検査から除外し、公式doctorと信頼済みセッションで確認する。"
    },
    {
      "layer": "project",
      "text": "Methodology: tdd\nOrdering: For each applicable testable layer: Red, then Green, then Refactor.\n\n- ユーザーが本プロジェクトの実装方針として TDD を選択した（2026-10-10 の会話「TDDで実装したいな」）。これは運用方針の選択であり、個々のアプリ Bolt の Inception / Code Generation Plan Approval を代替しない。\n- 新規・変更する振る舞いと不具合修正は、受入基準に対応するテストを先に書き、対象の未実装／不具合による失敗を実行して確認する（Red）。実行環境の不備や unrelated failure を Red の証拠にしない。\n- テストを通す最小実装を行う（Green）。その後、既存テストと新規テストを green に保って整理する（Refactor）。成功させるためだけに受入基準やアサーションを弱めない。\n- 既存のテスト runner / Unit 対象コマンドを Red の前に確認する。対象レイヤー、受入基準とテストの対応、実行コマンド、Red / Green / Refactor の結果を公式 Unit 記録に残す。\n- 実行可能な振る舞いを持たないドキュメント・純粋な設定変更に人工的な失敗テストは作らない。適用対象外の理由と検証方法を計画に示す。テスト量・coverage・CI の既存要件は維持する。\n\n- Before the release PR, pass npm run lint, npm run typecheck, npm test, and npm run build; also verify the Bolt's user-facing acceptance criteria.\n- Keep the official runtime outside application lint/typecheck/format checks; validate it with aidlc doctor and trusted-session $aidlc --doctor.\n- Tests/CI use dummy providers and do not call real OpenAI/Google Drive APIs or log private notes or secrets."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "tdd",
    "runner_step": "Verify the existing test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Verify the existing test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - Red: write the failing tests and record the failing command output.",
      "Data model / database behavior - Green: implement only enough behavior to pass.",
      "Data model / database behavior - Refactor: improve the implementation while tests stay green.",
      "Repository / data access - Red: write the failing tests and record the failing command output.",
      "Repository / data access - Green: implement only enough behavior to pass.",
      "Repository / data access - Refactor: improve the implementation while tests stay green.",
      "Business logic - Red: write the failing tests and record the failing command output.",
      "Business logic - Green: implement only enough behavior to pass.",
      "Business logic - Refactor: improve the implementation while tests stay green.",
      "API / endpoint - Red: write the failing tests and record the failing command output.",
      "API / endpoint - Green: implement only enough behavior to pass.",
      "API / endpoint - Refactor: improve the implementation while tests stay green.",
      "Frontend behavior - Red: write the failing tests and record the failing command output.",
      "Frontend behavior - Green: implement only enough behavior to pass.",
      "Frontend behavior - Refactor: improve the implementation while tests stay green.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:a81ff743a3d49d0b372ca217833d3121675db14e36b6566d65f53925c5db9985",
  "contract_sha256": "sha256:a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440"
}
```

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[論理モデル](../functional-design/entities.md)、[画面責任](../functional-design/frontend-components.md)。
- [整合性設計](../nfr-design/reliability-design.md)、[論理部品](../nfr-design/logical-components.md)、[性能](../nfr-design/performance-design.md)、[安全性](../nfr-design/security-design.md)、[画面品質](../nfr-requirements/tech-stack-decisions.md)。
- [要件](../../../inception/requirements-analysis/requirements.md)、[ストーリー/AC](../../../inception/user-stories/stories.md)、[共有部品](../../../inception/domain-design/components.md)、[契約](../../../inception/contract-design/contract-summary.md)、[Unit対応](../../../inception/units-generation/unit-of-work-story-map.md)、[Bolt計画](../../../inception/delivery-planning/bolt-plan.md)。
- [既存正式レビュー](reviews/review-01.md)、[既存手動範囲](manual-acceptance-status.md)、[旧計画](code-generation-plan.before-revision-02.md)、[旧試験手順](unit-test-instructions.before-revision-02.md)。
