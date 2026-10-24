# U1：既知3不具合の改訂3実装結果

承認済み[改訂3計画](code-generation-plan.md)と[試験手順](unit-test-instructions.md)、Testing Contract `a01bc0361713cbf9f8fa516a1c4355a4c4a522a798bc83dbe03bcc8145e77440`に従い、U1の3件を修正しローカル検証を完了した。正式レビュー・公式Unit checkpointはrootの後続処理であり、この文書自体はその完了を意味しない。

## 今回の変更と所有

- CompanyDetail・CompanyForm・MemoEditor：競合後の最新取得を画面移動/破棄から分離。元draft/baseと最新保存版を保持し、版が違う間は編集・保存を止める。本人の明示再編集でだけ最新版をbaselineにする。比較項目/原文の参照タブは閲覧可能に保つ。
- repository：削除の親ロック取得後にも期限を検査し、now>=expiryを拒否。成功操作の先行照合・session→operation→親のロック順は維持する。
- 新しい復元session除去SQL・復元確認script・設定手順：通常dumpからsession/token行を除外。古いdumpを含め、鍵の有無に関係なく再開前に全復元sessionを除去して新ログインを必須にする。通常APIの権限やDBスキーマは変えない。
- repository/restore/uiCallbacks/draftの受入回帰、共有hookHarnessの最小flush補正。新規20caseを追加し、既存587→607件となった。U2/U3のsource/testは変更していない。

branch `release/bolt-002-company-data-management-local`と既存dirty・worktreeを保持した。commit/push/merge/deployは行っていない。root所有の引継ぎ/追加ブラウザ証拠とdeveloperの変更を分ける。依存・runner・coverage対象/threshold・Auth API・HTTP契約・期限・再試行回数は変更していない。

## 実装判断とTDD

詳細なcommand/失敗/訂正/Green/Refactorは[bugfix-evidence](bugfix-evidence.md)に残す。環境や試験selectorの誤りを製品Redに数えず、assertionを弱めない。

| 対象 | 有効なRed | Green / Refactor |
|---|---|---|
| 親ロック後の削除期限 | 実PG15件中13成功・企業/メモの2件失敗 | 同exact15/15 / 15/15 |
| 復元session失効 | 実PG/dummy Auth50件中46成功・4失敗。旧Cookie認証復活とtoken行残存 | 同exact50/50 / 50/50、実dump/restore別DBと共通SQL/cleanup成功 |
| 競合draft保持 | callback/draft56件中51成功・5失敗 | 同exact56/56 / 56/56 |
| 連続最新取得 | 実HTTP/PG57件中56成功・1失敗。有限GET retry後も選択メモが旧版 | 4対象を順に待ち57/57。その後の回帰と手動も成功 |
| 再編集前の参照タブ | 58件中57成功・1失敗。disabled fieldsetが参照操作を妨げる構造 | TabButtonsを外へ移し58/58 / 58/58 |
| 共有harnessのflush | 59件中58成功・1失敗。mock直列GETは1event-loop turn後には完了する対照付き | 既定12pass後の有限1turn+render。U1ui/draft+既存U2ui93/93 / 93/93 |

途中の全体605/606失敗は既存U2入口試験のmock microtask未排出だった。U2試験を編集せず、承認範囲の共有harnessだけで解消した。実I/O完了待ちや製品timeoutを試験側で延ばしていない。修正後の最終全体結果を下欄へ分ける。

## 今回の検証結果

Node22.23.3、既存Vitest4.1.8/v8、loopback PostgreSQL17.6、dummy Auth/providers。重い処理は順次実行した。

| command | 最終結果 |
|---|---|
| 試験手順のU1 exact16file | 253/253、skip0、exit0 |
| `npm run lint` | exit0、warning0 |
| `npm run typecheck` | exit0 |
| `npm test` | 55files / 607/607、skip0、exit0 |
| `npm test -- --passWithNoTests=false --coverage` | 55files / 607/607、skip0、exit0 |
| `npm run build` | exit0、全route生成 |
| `git diff --check` | exit0、既存LF/CRLF警告のみ |

全app/src lines **84.69%（2850/3365）**、statements83.04%（3007/3621）、branches74.28%（1988/2676）、functions80.68%（735/911）。lines80%下限を達成し、他指標の80%達成へ読み替えない。旧587成功・83.50%は[改訂2summary](code-summary-revision-02.md)と[期限修正証拠](deadline-repair-evidence.md)へ履歴として保持する。40ms/operation_unknownと実PG原子性・RLS・成功再送回帰を維持した。

## 画面確認と限界

[rootの追加手動確認](manual-revision-03-root.md)で、企業・メモの2クライアント409→最新取得→元入力保持→Enterによる明示再編集→保存200→別クライアントの最終値一致を確認した。スマホは新規tabで390×844を実測。参照タブ修正後は、再編集前でも比較用項目・原文タブを閲覧でき、保存/追加操作は停止、保持本文を別表示し、追加PATCHゼロであることを確認した。

並列GET時の503、viewportの反映されなかった試行、5分preview寿命後の要求結果不明、DB停止のECONNREFUSEDも失敗/未確定として残した。最後の専用previewはstop/exit0、StopConfirmed:true/schemaDropped:true、専用tabs閉鎖。通常の試験DBは後続検証用に保持する。dummyブラウザの確認は実本人Auth/実Bセッションの証明ではない。

## 証拠・追跡・未達

[source-manifest](source-manifest.json)の旧91claims/展開94filesを保持し、新SQLとrestore試験の2claimsを追加した。現93claims/展開96filesのbytesとaggregateは[source-fingerprints](source-fingerprints.json)に記録する。改訂2の指紋は[source-fingerprints-revision-02](source-fingerprints-revision-02.json)へ保存した。旧reviewed TSVやreview-02.mdは変更していない。

[traceability](traceability.json)は90AC/23BR/33NFRの146IDsを保持し、今回直接解消したAC6.3.2・BR6.6・NFR2.6だけを既存Deferredから実装/試験fileへのOKへ更新した。前状態は[改訂2trace](traceability-revision-02.json)へ保存した。これはローカルの対応証拠であり全体受入/リリース完了ではない。

U2の生成後往復による重複保存とnative200%入口確認、U3の誤った保存成功表示/削除後の更新停止は後続各Unitの新計画・承認・修正・レビュー・checkpointが必要。実Supabase/PostgreSQL17.11・本人Auth・実外部API・実CI・公開受入・実merge SHAは未確認。Vercel作業は本人担当。既存dependency audit high5/critical1は未対処で、依存更新やリスク受容を行っていない。


