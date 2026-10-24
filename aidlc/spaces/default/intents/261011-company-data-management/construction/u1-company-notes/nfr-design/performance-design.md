# U1：性能を満たす設計

## PD1 — 必要な項目だけを読む

NFR7.1／NFR7.2を対象に、ボードは本文／OCRを含まないカードを一つの整合した読取で返す。状態件数・社数・所属件数も同じ読取基準で求め、企業ごとの別要求を繰り返す形を避ける。メモ一覧は本文なし、既定20・最大100件、更新時刻降順とIDの安定順を用いる。本文は選択したメモだけで読み、比較参照は1〜20企業の本人所有の選択メモだけを一つのスナップショットで読む。

読取には所有者＋状態、所有者＋企業＋更新時刻＋IDの索引を配置設計で対応付ける。IDと索引の形を変えて保存上限を作らない。不透明cursorは本人・企業・並べ替え位置を結び、改変／別企業利用を拒否する。ページ間の他端末変更は全一覧を同時刻として保証せず、再取得を示す。

## PD2 — 接続・期限の管理

NFR2.1／NFR7.5を対象に、プロセスの接続数は最大3、取得待ちにもdeadlineを適用する。要求全体10秒の残り時間を各依存呼出しへ引き継ぎ、DBトランザクションは最大8秒かつ要求の残り時間以内にする。Auth確認とDB処理の上限を単純に足して10秒を超える運用にしない。

期限切れは実処理へ取消しを伝え、未確定トランザクションを終了してから接続を返す。statement単位の上限だけで全体上限を代用せず、取消しを確認できない接続はプールへ戻さず切断する。ROLLBACKも期限内に終えられなければ接続を破棄し、別接続の操作記録照合で結果を確認する。成功し得たCOMMITの応答途絶はunknown。

## PD3 — 私的データのcacheと計測

NFR1.6／NFR7.1／NFR7.6を対象に、保護応答はprivate/no-store。共有の企業本文cache・比較結果正本・別読取ストアを作らない。ブラウザ内の表示cacheは本人と要求世代に結び、保存確定後の再取得、401／logout／対象変更で無効化する。遅い旧応答を新しい表示へ適用しない。

同じ候補SHAのPreviewで承認済みfixture・2クライアント、warm-up5回後に操作別50回を計測。p95 2秒／50メモ企業削除3秒、最大・失敗数を記録する。cold start・初回Auth・休止復旧は別の欄で示す。達成したとはまだ扱わない。過剰なqueue／自動書込再送／新cache製品を足す前に既存読取と索引を確認する。

## Sources

- ../nfr-requirements/performance-requirements.md、security-requirements.md、scalability-requirements.md、reliability-requirements.md、observability-requirements.md、tech-stack-decisions.md — 33詳細NFRと選定／未達条件。
- ../functional-design/functional-spec.md — WF1〜WF7、画面状態・C1〜C6の受渡し。
- ../../../inception/contract-design/contract-summary.md — 共有契約・正本・入力検査・失敗体系。
- ../../../inception/domain-design/components.md — 6部品とデータ所有者。
- ../../../inception/delivery-planning/bolt-plan.md — 具体上限・Supabase／接続・検証・着手条件。
- ../nfr-requirements/nfr-requirements-questions.md Q1=a — 日次利用終了時と配置／形式変更前の手動バックアップ。

