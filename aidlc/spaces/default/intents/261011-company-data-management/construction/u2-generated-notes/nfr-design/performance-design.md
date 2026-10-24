# U2の性能設計

## PD1 — Deadline and Cancellation

対象: NFR2.1、NFR2.2、NFR7.1。

生成は呼出し境界でprovider30秒・server40秒・browser45秒のdeadlineを設定し、request終了または取消しで下流へ取消しを伝える。timerはfinallyで必ず解放する。単にPromise待ちをやめるだけにせず、既存provider transportの取消しを利用し、戻った結果にも本人／対象／作業世代を照合する。生成POSTは自動再送しない。複数画像・Web候補は既存の選択順を維持し各呼出しを有限にし、全体取消し後の結果を捨てる。既存復習の範囲外中断不具合を一括修正しない。

保存はU1 clientを使いbrowser15秒、server10秒、DB全体8秒の既存経路へ委譲する。GETのネットワーク／503だけ500ms後1回の再試行を使い、POST／PATCHは再送しない。server timeoutでも書込未実行と決めずRD1へ渡す。新しいquery・poolをU2へ追加しない。

API p95目標と45秒の待機上限を分ける。代表fixtureと同時2clientの計測はU1の共有保存APIで行い、U2は生成から実DB保存・再取得までの結合を確認する。local adapter値を実HTTP／外部速度の証明にしない。

## PD2 — Resource Lifetime and Input Budgets

対象: NFR7.2、NFR4.1。

一時画像管理部品がfileと表示参照を一元所有する。差替え・除去・明示終了・保存確定・unmountで、関連要求を無効化し不要参照を解放する。入力保持が必要な失敗中は訂正テキストと有効候補を保ち、必要な画像だけ一時保持。保存mapperは既存DTOの許可項目だけを構築し、画像／名前／一時URLを渡さない。画像なしで保存メモを再取得する試験を設ける。

ここでのunmountは画像所有部品または生成作業全体の終了であり、保存表示パネルだけの破棄を保存意図の破棄へ結び付けない。OCR／既存復習への表示往復では保存中・結果不明・確定をワークスペースに保持し、不要な画像参照の解放と安定ID／確定結果の保持を分離する。

client検証は本人への案内、server検証は信頼境界とする。画像は既存20枚／1枚10MiB、保存JSON1MiB・本文/OCR50000 code points・構造256KiB・各配列100・各文字5000と個別上限を同時検査する。構造bytesはcompactな正当JSONで数え、DBの見た目の整形空白を入力bytesと混同しない。超過は明示拒否・入力保持。受入は架空画像1枚64KiB以下とし、大画像の既知hosting制約を解消したとはしない。

保護内容の共有cache／CDN・画像storageは追加しない。本文は表示時に必要なものだけ扱い、既存の一覧pagingを利用する。

## Sources

- ../nfr-requirements/performance-requirements.md
- ../nfr-requirements/security-requirements.md
- ../nfr-requirements/scalability-requirements.md
- ../nfr-requirements/reliability-requirements.md
- ../nfr-requirements/observability-requirements.md
- ../nfr-requirements/tech-stack-decisions.md
- ../functional-design/functional-spec.md
- ../../../inception/contract-design/contract-summary.md
- ../../../inception/domain-design/components.md
- ../../../inception/delivery-planning/bolt-plan.md
- ../../../../../../../../docs/session-handoff.md

