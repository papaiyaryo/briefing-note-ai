# U3 — 企業比較の容量・規模要件

## Input and Response Bounds

| ID | 上限と意味 | 確認方法 |
|---|---|---|
| NFR7.2 | 比較1要求1〜20の異なる企業、各社1メモ。0件はUI対象なし、21件/重複は拒否。理由5000 Unicode code points、空欄null。新保存JSON1MiB。構造全体256KiB・各配列100・各文字5000。採用Web50件、content5000/category200/URL2048。イベント各500、日付は空または実在日。保存本文/OCR各50000という既存契約も維持 | 0/1/20/21、同名別ID/同企業重複、5000/5001（補助文字含む）、byte上限、構造/出典の境界。切詰め0、拒否後入力保持。表示/出力時も不正応答を受理しない |
| NFR7.3 | 100企業/1000メモ/10000小操作、1社50メモの代表量を使う。本文880件約1000字/100件約5000字/20件約10000字、長文構造/OCR、Web各4。DB・索引・基底領域込み200MiB以内というBolt予算を維持。メモ一覧は既定20・最大100/ページ、本文を一覧へ含めない | 実PG sizeとfixture bytes、20社比較/ページ追加取得、50件所属を1ページ20件と誤認しない。同名企業/終了企業も候補に残る。最大長を全1000件へ適用した容量保証とはしない |
| NFR7.4 | 15社警告・20社比較上限・ページ上限を企業登録上限にしない。新ストア/新infra/有料枠/常時通信/比較結果の永続保存は追加しない。容量・性能が既予算に収まらなければ未達を記録し、課金や要件縮小は本人判断を要する | 16社以上の保存企業を拒否しない。idle時に追加APIがないこと、選択変更と比較ボタンの明示要求数を確認。実Supabase無料条件の現在値を再調査したとは言わない |

## Growth and Scaling Decisions

U3はU1の同一アプリ・同一DB契約を消費する。DB pool最大3/プロセスなど既承認設定を比較用に増やさず、新たなschema/索引/常駐workerを設けない。U2からデータを直接受け取る依存辺も追加しない。

規模拡大の判断材料は計測したp95、失敗数、fixture bytes、DB size。既目標を超えたら原因と未達を記録して既承認範囲で修正する。費用・永続容量・登録数の新しい制限は自動導入しない。新数値のアラートや可用性SLAも創作しない。

## Browser Resource Lifetime

結果・draft・frozen要求は本人/対象の一時メモリに置き、選択・本人世代を持たせる。入力を失う一律cache消去で容量対策に代えない。一方で再読込/OS終了を越える未保存復旧は保証しない。legacyは従来のlocalStorage正本を別入口で扱い、新比較のcache領域に流用しない。複数ページの取得失敗を全件0へ変換せず、再取得を案内する。

## Sources

- [機能設計](../functional-design/functional-spec.md)、[ルール](../functional-design/rules.md)、[画面責任](../functional-design/frontend-components.md)。
- [NFR1〜7](../../../inception/requirements-analysis/requirements.md)、[共有C1/C3/C4](../../../inception/contract-design/contract-summary.md)、[Boltの上限・測定・検証条件](../../../inception/delivery-planning/bolt-plan.md)。
- [既存技術の調査記録](../../../../../codekb/briefing-note-ai/technology-stack.md)。調査時点の依存一覧であり、現行設定・安全性の保証ではない。
- [現状と本人担当の境界](../../../../../../../../docs/session-handoff.md)。
