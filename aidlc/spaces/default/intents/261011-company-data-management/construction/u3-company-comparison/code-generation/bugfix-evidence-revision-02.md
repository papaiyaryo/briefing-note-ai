# U3 revision 02 — 実行証拠

## Readiness and Baseline

- 2026-10-22。最初の branch 観測は `chore/aidlc-claude-code-setup`。root が同じ HEAD の `release/bolt-002-company-data-management-local` へ既存 dirty を保持して復帰。担当は branch/履歴を変更していない。
- Node は既定 v24.11.0 のため、承認済み既存 Node の process-only PATH で v22.23.3 を使用。npm 11.6.1、Vitest 4.1.8、node 環境、v8、全 app/src lines80 設定を変更せず使用。
- `npm test -- tests/u3-company-comparison/readiness.test.ts --passWithNoTests=false`: exit0、1 file / 1 test 成功、skip0。
- Unit試験手順の「Exact U3 All」: exit0、9 files / 119 tests 成功、skip0、5.41秒。
- `npm test`: exit0、55 files / 615 tests 成功、skip0、28.46秒。
- `npm test -- --passWithNoTests=false --coverage`: exit0、55 files / 615 tests 成功、skip0、30.72秒。lines85.12% (2896/3402)、statements83.51%、branches74.71%、functions81.16%。
- 既存実PG fixtureも成功。Docker/依存/runner/coverage設定の変更なし。U1/U2 manifestと今回8ファイルに重複なし。累積U3 manifestの共有既存claimには変更しない。

## TDD

### Business Logic / Integration

US8.1、共同US6.3〜6.5、AC6.3.1〜4/AC6.4.3/AC6.5.4/AC8.1.4/AC9.1.4、BR4/5、NFR2.3〜2.7/3.1〜3.3をS-R1〜5/C-R1〜7/I-R1〜2へ対応。

- Red: Unit試験手順のBusiness Logic exact command、exit1、48件=11 failed/37 passed、skip0。C-R1は404後の新PATCH1、C-R2は企業404後の新PATCH2、C-R4は新operationによる確定outcome置換を観測。S5件/C-R3/C-R6/C-R7は新しい参照状態API未実装のTypeErrorであり、DB/API実装のRedではない。C-R3の既存conflict保持部分とC-R5の同ID保持は初回Green。
- Red: Integration exact command、exit1、12件=2 failed/10 passed、skip0。実PGの削除確定とC3 404は成功し、状態境界API未実装で失敗。fixtureの専用schema/clientをafterAllで閉じた。TCP HTTP/実ブラウザとは称さない。
- Green: 同Business Logic exact command、exit0、48/48成功、skip0、1.39秒。Integration exact、exit0、12/12成功、skip0、6.06秒。
- 実装: owner/選択/要求世代と対象IDを照合する参照ガードを独立保持。全選択404の原因IDを推測せず、個別成功は当該欄だけ解除。企業404は既存所属欄へ反映。draft/base/intent/outcomeを消さず、新規save/rebaseだけ停止。同IDlookup/retryは維持。
- Refactor: 個別latest/readbackを一つの取得・分類経路へ整理し、版の型/非空検証を維持。再実行結果は後記。
- Refactor再実行: Business Logic exact exit0、48/48、skip0、1.16秒。Integration exact exit0、12/12、skip0、5.59秒。

### Frontend Behavior

US8.1/US9.1、共同US6.3〜6.5、AC8.1.4/AC6.4.3/AC6.5.4/AC9.1.4、BR4/5/7、NFR2.7/3.1/3.3/5.3をU-R1〜6へ対応。

- Red: Frontend exact command、exit1、24件=4 failed/20 passed、skip0。U-R1は実409→latest503後の保持欄の誤成功文、U-R2は欠落/別意図outcomeの成功文、U-R3は実refresh404分類・ガード配線不足、U-R6は利用不可欄の個別latest入口不足を観測。U-R4通信失敗対照とU-R5同ID照会は初回Green。
- Green: Frontend exact command、exit0、24/24成功、skip0、2.06秒。
- 既存committed+readback-errorのSSR試験は成功assertionを維持し、欠落していた当該intent/outcomeをfixtureへ補った。新規U-R2ではoutcome欠落/他意図/他対象に成功文がないことを追加確認した。
- 成功表示の一致検査を両部品で共用。入力・save・rebase停止、個別latest入口、unknownの同ID照会を状態に接続。HookHarness/SSR/実controller callbackの証拠であり、live DOM/実GUIではない。
- UI helper整形後の最初のRefactor再実行は `CreateProcessAsUserW failed: 2` によりshell起動前に停止した。試験開始なし、アプリRedや失敗件数へ算入しない。rootへ報告し公式pause後、本人のRetryと公式resumeを受けてStep8から再開した。
- Retry後のFrontend exact command: `npm test -- tests/u3-company-comparison/ui.test.ts --passWithNoTests=false`、exit0、1 file / 24 tests成功、skip0、2.75秒。
- Retry後のUnit試験手順「Exact U3 All」: exit0、9 files / 139 tests成功、skip0、5.94秒。新規20件（S5/C7/U6/I2）と既存119件を保持した。
- Retryでは既存cmd.exeを明示し、同じ既存Node22 binのprocess-only PATHを使用。依存・runner・設定・timeout・検証commandを変更せず、baselineや開始記録を重複実行していない。
- Step8完了。Step9はrootのCUA担当、Step10全体品質はその後に実行する。実GUI成功・最終全体品質はまだ主張しない。

## Final Verification Handoff

その後rootの限定CUA/cleanupを経てStep10を実行した。型不備exit2と凍結U1 coverage timeout exit1を公式pause/本人Retryで扱い、条件やassertionを弱めず検証を完了した。型修正はsetup.readMemoのasync戻り値注記1箇所のみ。最終lint/typecheck/U3 139/全体635/coverage635/build/diffはexit0、全app/src lines85.95%。初回失敗と同条件Retryを含む詳細は [最終ローカル検証](verification-revision-02.md)。本記録のStep8時点の未実施記述は当時の状態として保持する。

Step10チェック済み、Step9の全条件未達は未チェック、Step11はrootへ引継ぎ。承認済み8ソース/試験とdeveloper証拠をここで固定し、追加検査・整形をしない。
