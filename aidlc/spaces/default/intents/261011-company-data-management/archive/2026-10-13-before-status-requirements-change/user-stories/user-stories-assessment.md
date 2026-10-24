# 利用の流れの整理が必要かの評価

## Decision

Execute

## Rationale

今回は個人向けの企業管理という利用者が直接操作する改善であり、認証・複数端末・企業と複数メモの保存・選考状態・社数・比較がつながる。機能一覧だけでなく、成功・失敗・境界条件を利用の流れに沿って整理する価値がある。純粋なリファクタリングや孤立した不具合修正ではない。

## Factors Considered

- BrownfieldのNext.jsアプリ。既存OCR生成・Markdown出力・比較・復習の導線を出発点とする。
- 利用者は本人1種類。PCとスマホは別の利用環境であり、架空の管理者・共同編集者を製品ペルソナとして追加しない。
- 対応中の数え方、15社以上だけの警告、画像非保存、本文と構造化項目の違いには具体的な境界条件がある。
- 保存失敗・認証失効・二重送信・複数端末の競合・削除の影響は、受入条件に対応させる必要がある。
- 要件で区別したA1〜A3の解釈・既定案は、今回の質問で明示確認してから具体化する。

## Value of Stories

本人が行う登録・編集・保存・再表示・状態変更・比較を中心に分解し、各ストーリーを架空の事前データで独立検証できる形にする。実装時のTDDと手動の受入確認へ同じ条件を引き継ぐ。技術層別にリリースを分けず、1リリースBolt内の依存関係は後のUnit・計画で定める。

## Unresolved Design Items

上流の要件確認で残った志望度の正本・理由編集の範囲、代表データ量と応答性能の目標は、後続の設計・計画で具体化する。ここで数値や保存先を推定して確定しない。DB・認証方式・検証コマンドの承認もまだない。

## Sources

- `../requirements-analysis/requirements.md` — 承認済みFR1〜FR9、NFR1〜NFR7、A1〜A3、対象外。
- `aidlc/spaces/default/codekb/briefing-note-ai/business-overview.md` — 現行の生成・比較・復習と今回の目的。
- `aidlc/spaces/default/codekb/briefing-note-ai/component-inventory.md` — 現行UI・保存・クライアント・サーバーの接続面。
- `../practices-discovery/team-practices.md` — TDD、直列Unit、Vitest＋手動確認、人間マージ、対象SHAの公開確認。
- `user-stories-questions.md` — 利用の流れの整理方針と未回答の既定案確認。
