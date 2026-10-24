# U2：保存意図の既存修正と追加画面確認

## 現在の結果

本人の新しいApprove Plan後、[10ステップ計画](code-generation-plan.md)と[試験手順](unit-test-instructions.md)で再検証した。既存のFlowが保存意図を所有する修正と8回帰を維持する。今回のU2ではアプリ・試験・API・DB・設定・依存を追加変更せず、確認資料と本Unit記録だけを更新した。

2026-10-24のlint/typecheck、全体635/635、coverage635/635、build18/18、diffは成功した。一方、標準画面の保存後OCR/復習往復・同じmemoId/件数1と、実倍率200%などの画面受入は未確認。合格へ置き換えず、正式レビューと本人の判断へ渡す。全体リリースや実環境の受入完了ではない。

## 実装判断と所有範囲

BriefingNoteFlowのGenerationSaveSessionが同じ本人・企業・候補の保存意図、安定ID、凍結要求、確定結果を表示パネルの再マウントを越えて保持する。確定後の取得失敗では同じmemoIdを再取得し、新しい作成へ戻さない。送信後の本文・構造・OCR編集は未保存の差分として元の保存メモへの編集導線へ渡す。

操作照会の正常応答unknownは未実行の断定ではないが、本人が同じ凍結要求・operationId・memoIdを再試行できる。照会自体の失敗は結果不明を保って再照会する。新しい再送許可フィールドや新IDを作らない。本人・企業変更と明示的新生成成功は旧候補を無効化し、生成失敗は旧候補の確定を消さない。NFR設計レビューの軽微な表現指摘を解消済みとはしない。

累積[source-manifest](source-manifest.json)の41claimsを保全する。今回の新規変更数とは区別し、5ファイルの許可範囲を拡大しない。歴史的source-fingerprintsは再構築せず保持する。比較ではdocs/generated-notes-checks.mdの追記と、U1が承認済み調査で加えた共有runtimeFixtureの計測を既知の差として区別し、U2のアプリ変更と数えない。U1には計測4ファイルが残るがU2から編集しない。U3とdirty/worktree/共有handoffを保全し、commit/push/merge/deployなし。

## このattemptの検証

[追加確認・品質記録](gui-recheck-after-approval-20261023.md)を正本とし、過去の[再開記録](restart-verification-2026-10-23.md)は履歴として区別する。以前のsummaryとtraceはbefore-gui-recheck-20261024の複製に保存した。

| 検査 | 実結果 |
|---|---|
| Step1 readiness | 4files/16件、exit0、2.83s |
| Step2 UI/model | UI42件3.54s、model22件1.23s、exit0 |
| Step2 provider/API | 20件1.75s、46件1.92s、exit0 |
| Step2実PG/U2全体 | 実PG10件4.44s、U2全140件4.23s、exit0 |
| Step2既存生成・復習・出力 | 15files/82件、3.47s、exit0 |
| Step8初回と本人Retry | 両方633/635・exit1、既存U1の2件が5000ms timeout |
| U1調査中の無変更全体/計測付き全体 | 635/635成功と634/635失敗を別に保持。U2の新しい成功として数え直さない |
| 2026-10-24 lint/typecheck | exit0 / exit0（typecheck shell8.493s） |
| 同日npm test | 55files/635件すべて成功、exit0、23.47s |
| 同日coverage exact | 55files/635件すべて成功、exit0、26.59s |
| 同日build/diff | build exit0、Next15.5.19 compile13.3s、static18/18。diff exit0 |

Node22.23.3、Vitest4.1.8、v8、node環境、全app/src計測、lines80下限、既定並列、元の40ms/4000ms/5000ms・全期待値を維持。今回coverageはlines85.95%（2962/3446）、statements84.33%（3134/3716）、branches76.16%（2106/2765）、functions82.42%（769/933）。過去の同じ85.95%の転記ではなく新測定。

## 画面確認とTDDの適用

今回の追加画面観察では、初回2プレビュー区間で画像選択・OCR訂正・構造化生成まで確認したが、既存300000ms寿命が保存前に終了し、保存成功・memoId・件数1・保存後往復は確認できなかった。正常な前提を失った失敗を製品Redにしない。

U1調査保留後の2026-10-24再開では、Chromeの切断を受け正規一覧から接続を復旧し、ログイン画面まで開いた。入力後のstale/previous-page/Detachedで継続できず追加成功なし。Windows操作はnative pipe不存在、1回再初期化後もCreateProcessWithLogonW failed:2で、native200%を操作していない。PC1366x768、390x844、境界320/767/768、400%、keyboard/label/focus等の今回合格も得られていない。callback/SSRやCSS/viewportを実倍率の代用にしない。

元8回帰のgenuine Red/Green/Refactorは[修正証拠](bugfix-evidence.md)の履歴に維持する。新たな対象内の製品不備が再現していないためStep5–7の条件付き修復は実施せず、既存成功試験を複製して人工Redを作っていない。環境上の未確認を不具合なしの全受入へ昇格しない。Step3–4とGUIを含むStep8は完了チェックしない。

## 後始末と依存の未解決

追加の3プレビュー区間は各専用schema削除true。終了exit1/stopConfirmed falseをそのまま保持し、既知PIDとport3000の不在を独立照会して確認した。最後はhelper51292/Next9052の不在を追加権限の読み取りtasklistで確認、netstatで3000不在。作業tabs閉鎖、倍率/viewport変更なし、テスト/buildとの同時実行なし。

U1の最新診断では入力保持の元assertionが4710msに成立後、pool close完了4713ms、schema cleanup開始4714msで5000msへ達した。bootstrap区間2427msの理由と専用schema cleanup完了は未確認。本人は追加調査の保留と次へ進むことを選び、U1をset-asideしてU2へ戻した。これはU1修復・全体合格・Unit完了の承認ではなく、今回U2全体成功も原因解消を証明しない。U1側の未確認と今回previewの専用schema削除を混同しない。

## 追跡と残る受入

traceabilityの135IDs（90AC/14BR/31NFR）と71 OK/64 Deferredを維持する。OKは既存の実装/試験対応であり、実画面合格ではない。NFR5.2・共同編集・実CI・実外部のDeferredを維持し、現在の証拠とU1保留状態へ注記を更新した。GUIの2つの主要な未確認（保存後往復/1件保持、実倍率200%）は本人判断に明示する。

実Auth/Bsession/Supabase17.11/外部provider/CI job/merge SHA/Vercel/本番の達成は未確認。既存dependency audit high5/critical1も今回解消・受容していない。旧DB Step14のRed順序逸脱、過去の型エラーとtimeoutの履歴も取り消さない。今回品質成功だけで全Unit・release完成を宣言しない。
