# U2の信頼性設計

## RD1 — Frozen Intent and Confirmed Outcome

対象: NFR2.3、NFR2.4、NFR3.1、NFR3.2。

保存操作のcontrollerはoperationId・memoId・companyId・candidateの送信snapshotを一つの意図として固定する。保存中は二重クリックを抑止し、U1へ一度の明示要求を送る。U1が同じtransactionで本人・親・版・変更と操作結果を確定する。U2独自の書込記録を作らない。

controllerの所有者は生成ワークスペースとし、OCR／既存復習／候補表示のパネルに所有させない。同じ候補に対する保存中・結果不明・確定結果を表示往復中も保持し、再表示時に同じIDと状態へ結び直す。確定後の表示往復では新しい保存POSTを出さず、同じmemoIdの取得・編集へ進む。

明示拒否は入力保持で修正へ戻す。応答途絶はunknownとし、操作結果GETでcommittedなら確定表示、unknownなら未実行と断言しない。照会結果が再送可能と示す場合だけ同じ要求・IDで本人が再試行し、照会失敗・不明のまま別IDを発行しない。現在編集draftと凍結送信snapshotを分け、unknown中に内容を変えた同一ID要求を送らない。明示的新生成が検証成功して次候補へ移った場合だけ新しい保存意図に新IDを割り当て、生成失敗では元の確定結果を残す。操作GETにも有限待機／GET限定1回再試行を適用し、無限pollingしない。

確定成功と対象GETは独立状態。GET失敗でも「保存確定／再取得失敗」を残す。取得対象が後続編集・削除済みなら古い結果版を現在本文と偽らず最新状態を示す。保存時に親消失・別ownerなら候補を保持し他企業へ自動保存しない。

保存後の編集はU1の同じメモへ渡す。旧版競合はdraftとbaselineを保持したまま最新を別表示し、本人が確認して明示再編集する設計とする。本文／構造の片方を自動同期しない。過去のU1競合UIの不備記載を現行の未修正・合格の証拠にせず、2clientの再取得でID／保存内容／出自／出典と入力保持を照合する。

## RD2 — Degradation and Recovery Boundaries

対象: NFR2.5、NFR2.6、NFR6.1。

生成失敗は保存成功へ変換せず、訂正入力・最後の有効候補を残して明示再操作へ戻す。未保存移動は破棄確認しcancelで継続。reload後のdraft復旧を保証しない。新しいcircuit breaker、別provider fallback、replica、自動failover、新SLAは追加せず、有限待機と安全な再試行で縮退する。

U2独自backupはない。永続メモはU1のbackup手順を利用するが、通常tokenを持ち越さず復元後に再認証し失効sessionが復活しない条件を満たす必要がある。復元session・削除期限の過去の指摘を現在の未修正と推定しない。共有契約と当該Unitの現行検証証拠で確認し、full schema restore成功だけで安全性を認定しない。

既存復習は従来の生成入力から従来入口へ接続し、現在結果に対応した.mdを出す。新DBメモ読取と復習永続化なし。既存の範囲外中断不具合は今回の退行と区別する。healthは従来の公開契約のまま、機能合格の代わりにしない。

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

