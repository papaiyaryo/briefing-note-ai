# U2：同じ生成候補の保存確定を往復後も保持する

承認済み[改訂2計画](code-generation-plan.md)の既存修正を現在のsourceで再検証した。OCR確認・復習への往復で保存パネルが再マウントしても、Flowが所有するGenerationSaveSessionは同じ保存意図・安定ID・凍結要求・確定結果を保持する。現在のローカル品質検証は成功。実画面・native200%はrootの別検証であり、ここで合格とはしない。

## 変更と所有

BriefingNoteFlowとGenerationSavePanelが候補寿命と表示寿命を分ける。同じ候補は追加POSTへ戻らず、確定後GET失敗は同じmemoIdの再取得へ進む。unknownは元の要求を照会してから本人が同一要求を再試行する。本人・企業変更、明示的新生成成功、終了時は古い結果を適用しない。送信後の本文・構造・OCR編集は未保存として保持し、同じ保存メモへの既存編集導線へ渡す。

今回の再開ではapplication source・test・API・DB・設定・依存への追加変更なし。既存8回帰R1〜R8をそのまま検証した。先行U1/U3の凍結source/records、dirty files、既存worktree、共有handoffを保持し、commit/push/merge/deployは行わない。

[source-manifest](source-manifest.json)の累積41claimsを維持する。履歴上の共有pathを今回の新規変更へ数えず、5ファイル修正範囲を拡大しない。source-fingerprintsは以前の履歴snapshotとして保持し、今回手動再構築していない。現在の読取照合では41件中、確認資料docs/generated-notes-checks.mdの今回追記だけが履歴から異なり、application sourceとtestsは一致する。

## 現在の検証

実行順・exact commands・失敗出力は[再開検証記録](restart-verification-2026-10-23.md)。Node22.23.3、Vitest4.1.8、node環境、v8、全app/src計測、lines80閾値を維持した。skip表示なし。

| 検証 | 現在の実結果 |
|---|---|
| runner readiness | 4files/16passed、exit0、4.46s |
| UI・未変更model | UI42passed、exit0、4.50s / model22passed、exit0、1.41s |
| U2全9files | 140passed、exit0、6.36s。実PG結合10件を含む |
| 既存生成回帰 | 15files/82passed、exit0、5.35s |
| lint / typecheck | ともにexit0 |
| 全suite初回 | 634passed/1failed、exit1。凍結U1のAC6.3.2が5000ms timeout |
| 明示Retryの全suite | 55files/635passed、exit0、23.91s |
| coverage | 55files/635passed、exit0、34.63s。lines85.95%（2962/3446） |
| build | Next.js15.5.19、18pages、exit0 |
| git diff --check | exit0。既存LF/CRLF案内のみ |

Dockerの初回権限拒否はrootのsupported権限経路でHealthyへ復旧。全suite timeout後は停止し、本人の明示Retry後に同じsource/期待/5000ms制限/起動条件で再実行した。成功を理由にtimeout原因を確定せず、期限・assertion・閾値の緩和やU1修正はしていない。

## TDD履歴と実画面の限界

既存修正のgenuine Red→Green→Refactorは[bugfix-evidence](bugfix-evidence.md)に保持。R1/R2で追加POST2を観測した履歴と、今回の無変更回帰成功を区別する。新しい人工Redは作成していない。旧DB Step14のRed順序逸脱、旧型検査失敗、過去のnative200%未確認も取り消さない。

再開前summaryは[archive](code-summary.before-restart-2026-10-23.md)へ保持した。旧CUA記録はmanual-revision-02-root.md、旧品質はverification-revision-02.md。[今回の実画面確認](manual-restart-20261023-root.md)では企業登録と固定保存先の生成入口まで到達した。実測2560×1261／DPR1から拡大キーが反映されず、filechooserは10000msでtimeoutした。画像は未選択で、OCR以降・保存後往復・native200%は未確認。callbackをDOM・focus・キーボード・native倍率の証拠へ昇格しない。専用schema削除と、独立したprocess／port照会による専用サーバー終了を確認した。

## 追跡と残る確認

[traceability](traceability.json)の90AC/14BR/31NFR・135IDsとstatusを保持し、現在のローカル証拠参照を更新した。NFR5.2、実CIや共同受入等のDeferredを維持する。U1修正済み事項を旧設計の未修正記述へ戻さない。

画像入力以降の実操作、native200%・各幅・キーボード等の画面受入は未完了。実Auth/Bsession/Supabase/外部provider/実CI job/本番・merge SHAは未確認。既存dependency audit等の既知事項は今回解消・受容したとしない。
