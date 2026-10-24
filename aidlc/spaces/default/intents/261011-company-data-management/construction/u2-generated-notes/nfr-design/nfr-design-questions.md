# U2 非機能設計の判断根拠

## 既存決定の具体化

新しい本人判断が必要な未決事項は検出していない。既存の単一アプリ／U1保存契約を使い、有限deadline・一時draft・操作結果確認・最小診断を設計する。queue、cache、別DB、監視製品、新しい課金やSLAは採用しない。新しい人間回答やコード実装許可を作らない。

## 適用と保留

実Supabase設定は後回し、dummyと実使い捨てPGで先行する。Vercel作業は本人担当。U1競合UI／復元session／削除期限の古い記載は調査時点の情報であり、現在も未修正とは推定しない。当該Unitの現行検証証拠と共有契約を参照し、U2の設計レビューを実装合格へ代用しない。

本人の機能設計Q1の回答「両方確認できる」を環境準備情報として引き継ぐ。追加画面観察は接続エラーで完了しておらず、画像入力以降・保存後往復・実倍率200%の受入成功は未確認。上流WF5とNFR2.3／2.4／3.1／3.2／5.2を具体化し、保存状態の所有者を表示パネルから分離する。数値目標・技術選定・実装範囲の追加はない。

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

