# Bolt 2 — Build and Test計画（受入範囲変更・再承認待ち）

## Status

2026-10-31作成。**計画の再承認待ち**。Build and Testの完了承認ではない。今回の検査・画面確認は未実行。承認後に実行し、結果の承認は別に求める。

## Human Decision

以下は2026-10-31の人間の指示原文である。範囲変更の指示を記録したものであり、この計画全体への再承認を代行しない。

> Build and Test計画の受入範囲を変更する。人間の判断（2026-10-31）：以下はBolt 2の受入範囲から外し、Deferredとして次Intentへ持ち越す。合格扱いにはしない。
>
> R-03（実ユーザーB / A→B→A切替）
> モバイル幅・200%/400%拡大の画面確認
> U2の画面受入
> 実環境（Supabase/Auth）での受入
> traceabilityでは該当ACを「Deferred（人間判断で範囲外）」とし、Build and Test計画にこの変更を明記して、承認ゲートで私に再承認を求めること。lint/typecheck/test/buildは従来どおり実施する。

## Acceptance Scope Change

| ID | 次Intentへ持ち越す確認 | 関係AC・境界 |
|---|---|---|
| D-01 | R-03：実ユーザーB、実A→B→A、出力中の実本人切替 | AC1.1.1〜4、AC1.2.2、AC8.1.4、AC9.1.2、AC9.1.4。本人境界・旧応答・出力の実セッション確認だけを持越す。dummy認証／API／ローカルPGの回帰は継続 |
| D-02 | モバイル幅、native 200%/400%拡大の画面確認 | AC1.2.1、AC2.2.3、AC3.1.4、AC3.1.6、AC3.1.8、および全ACに共通するスマホ表示条件。PC通常表示・キーボードは継続。各UnitのNFR5.2等の対応条件も持越す |
| D-03 | U2の画面受入 | AC5.1.1〜5、AC5.2.1〜5、AC6.2.1〜5、AC6.3.1〜4、AC9.1.1、AC9.1.3、AC9.1.5、AC9.2.1〜4のU2画面部分。U1/U3で共有する同ACの確認とU2自動試験を除外しない |
| D-04 | 実Supabase/Authでの受入 | AC1.1.1〜4、AC1.2.1〜4を直接対応とし、保存・再取得・競合・削除・比較・出力を含む全ACの実Supabase/Auth環境による受入部分を持越す。ローカルdummy／使い捨てPGによる検査は継続 |

各項目は **Deferred（人間判断で範囲外）**。未実証のままであり、合格・Met・OKへ変換しない。次Intentではこの表とtraceability.jsonを入力に、担当・実行条件・証拠・受入基準を改めて計画する。次Intentを作成済みとは扱わない。

## Traceability and Existing Evidence

[traceability.json](traceability.json)を今回の受入範囲の対応表とする。AC単位の集約状態はDeferredとし、除外した**確認側面**と、Bolt 2で残る側面を併記する。AC全体の実装・自動試験を除外する意味ではない。既存UnitのOKは局所の実装／試験対応であり、この受入範囲の合格を意味しない。

U1〜U3のcode-generation/code-summary.md、traceability.json、計画、試験手順、TDD証拠、レビュー、失敗・手動確認の履歴は変更・削除せず保持する。新しい受入範囲は日付付きの本計画と対応表で上書き関係を明示し、過去の成功も失敗も書き換えない。

既存Code Generationをスキップしたこと自体は、証拠の存在や後段の合格を保証しない。Build and Testの必要記録・AC/FR/NFR対応・対象ファイルを照合する。記録不足やDeferredを許容しない検査で止まった場合、状態・証拠・ルールを変更せず、その不足と停止内容を報告する。未確認の対象をOKにしたり検査を無効化したりしない。

## Remaining U3 Screen Acceptance

PC通常表示、架空データ、既存のローカルpreviewで以下を確認し、操作・期待値・実結果・証拠の場所を記録する。過去のSSR/callback試験や旧GUI成功を今回の実画面合格へ読み替えない。

| 確認 | 操作と期待結果 | AC |
|---|---|---|
| M-R1 | 競合時のbase/draft/latest分離と入力保持を確認。明示rebase後に再保存し、確定結果に対応する成功表示だけを示す | AC6.3.1〜4、AC7.1.1 |
| M-R2 | 比較参照メモ削除後に最新取得。入力を保持し、新規保存/rebase/比較出力を停止。企業だけの有効な再取得で企業欄だけが再開し、明示保存の確定を確認 | AC6.4.3、AC8.1.4、AC9.1.4 |
| M-R3 | 企業・所属メモ削除後に両欄と出力が停止。残る別企業を最新確認して保存でき、削除対象へ誤保存しない | AC6.5.2、AC6.5.4、AC8.1.4 |
| M-R4 | 他欄dirtyのまま片欄を保存し、確定ID・版と残る入力を確認。画面往復で追加保存なし。比較.md出力前の再取得と参照一致、無効参照時のfile生成停止を確認 | AC2.2.5、AC7.1.1〜2、AC9.1.2、AC9.1.4〜5 |
| M-R5 | PC通常表示でTab/ShiftTab/Enter、ラベル・文字通知・取消後focusと主要操作への到達を確認 | AC3.1.4〜5およびU3 NFR5.3 |

画面観測だけでHTTP書込数を証明できない場合は自動試験の別証拠と区別する。故障注入の制御試験と実画面も区別する。範囲内の未確認が残った場合は合格にしない。今回の4項目以外を暗黙にDeferredへ追加しない。

## Ordered Verification Plan

- [ ] この計画の人間による再承認を記録する。
- [ ] 全Unitのcode-generation-plan.md／unit-test-instructions.md／code-summary.md、traceabilityとNFR要件・設計から検査対象と品質目標を棚卸しする。記録不足で停止したら変更前に報告する。
- [ ] 既存build/test設定を読み、build-instructions.md、integration-test-instructions.md、必要な性能・セキュリティ手順とTarget Verification Matrixを作成する。範囲変更以外の品質目標は維持する。
- [ ] Node22、既存依存、dummy provider/Authとlocalhostの使い捨てPGを確認する。必要な場合のみ既存 `docker compose -f compose.test.yml up -d --wait`。実Supabase/Auth・実外部APIへ接続しない。
- [ ] `npm run lint`、`npm run typecheck`、`npm test`、`npm test -- --passWithNoTests=false --coverage`、`npm run build`を直列に各1回実行する。重複するUnitコマンドは重複実行せず、必要なUnit固有検査を既存手順から収集する。
- [ ] v8・全app/srcのline coverage 80%以上、既存assertion・include/exclude・timeoutを維持する。過去645件／85.96%は履歴であり今回結果を新規記録する。
- [ ] U3のM-R1〜M-R5のうち上記の範囲内部分を実画面で確認する。既存 `node scripts/local-workspace-preview.mjs` を変更せず使用し、最大300000msを延長しない。専用preview／専用schemaの後始末を確認し、他者のserver・volume等には触れない。
- [ ] 全FR/NFR/ACのUnit横断対応と対象ファイルを照合し、cross-unit-traceability.md、test-results.md、build-and-test-summary.mdに範囲内の結果とDeferredを別々に記録する。Deferredを全件成功へ加算しない。
- [ ] 結果をレビューし、範囲内の不足・失敗を報告する。必要な修正・追加判断を勝手に適用しない。
- [ ] Build and Testの結果承認を人間へ求める。計画承認だけで結果承認・本番リリース完了とはしない。

## Change Boundary

今回の変更はこのBuild and Test計画と受入範囲のtraceabilityのみ。アプリ、既存Unit証拠、tools/agent-mail、docs/、.npm/、依存・設定は変更しない。公式コマンドによる必要な状態・監査記録を除き、他のファイルは変更しない。commit/push/PR/merge/deployは行わない。

検査は長時間でも完了まで待つ。記録不足で停止したら修復や再分類の前に報告する。実行失敗をTDD Redと偽らず、assertionや品質目標を弱めない。

## Sources

- inception/user-stories/stories.md（90 ACと共通受入条件）
- construction/u1-company-notes/code-generation/traceability.json
- construction/u2-generated-notes/code-generation/code-summary.md、traceability.json（2026-10-29本人報告と残条件を区別）
- construction/u3-company-comparison/code-generation/code-generation-plan.md、unit-test-instructions.md、code-summary.md、manual-acceptance-status.md、traceability.json
- 2026-10-31の人間判断（上記原文）
