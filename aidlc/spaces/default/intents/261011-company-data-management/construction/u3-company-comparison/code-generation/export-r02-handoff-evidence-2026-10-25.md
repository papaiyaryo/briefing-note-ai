# 出力時404 R-02 — 適用済み修正のhandoff証拠

記録日: 2026-10-25 JST。対象Unit: u3-company-comparison。ユーザーの明示依頼による既適用修正の確認と記録更新であり、旧revision02の8file計画承認を遡及して変更するものではない。今回アプリ/試験/approved plan/unit-test-instructionsの編集0、ソースを戻したRed再現0。正式review/Unit完了/ライフサイクル操作は実施していない。

## 対象bytesと累積所属

| path | SHA256 |
|---|---|
| src/lib/companyComparison/export.ts | df330394f5ae714ff5fd1730a4f90ccdd09a5be1a5b79b4a75b97f8d39924ecf |
| tests/u3-company-comparison/export.test.ts | 1d406daafe0da7e53360475fb06344e4a577d33f787608e7c0fba387ff2eac5e |

rootによる提示値照合済み2fileを読み、今回終了時にも照合する。両pathは既存source-manifest.jsonのwritesに所属し、累積29件を変更/縮小していない。source-fingerprints.jsonは更新せず、以前の共有3file（app/layout.tsx、app/compare/page.tsx、src/components/compare/CompanyComparePage.tsx）の差分を消していない。旧aggregateを現在bytesの全件合格へ読み替えない。先行Unitの履歴hashとの差は既存記録を保持し、無承認変更との断定や修復を行っていない。

## 現在の実装・受入試験の確認

exportComparisonのcatchは、現tokenをacceptする場合にClientFailureのcode=not_foundかつstatus=404だけでsession.invalidateReferences(token)を呼ぶ。続いて既存の出力blocked/error表示へ進む。503を削除判定へ扱わない。

追加されたBR4.2試験は出力確認404後のdownload0、選択した全sourceのinterest/reason欄の利用不可、2欄の新規保存に対するport.send 0、入力保持を検査する。BR5.2試験は503後のdownload0とreason欄の利用可を検査する。既存12件は保持され、計14件となっている。この確認は実GUI/実DBでの削除受入を代替しない。

## ユーザー報告と独立実行の区別

ユーザー報告: Claude Code側でbaseline12/12 → Red1失敗（expected true / received false）→ Green14/14。続いてDBなし7files/128tests成功、typecheck/lint/prettier exit0。これらの過去実行を本担当の直接観測Red/品質成功として記録しない。

今回の独立実行コマンド:

```text
npm test -- tests/u3-company-comparison/export.test.ts --passWithNoTests=false
```

2026-10-25 01:11:54 JST開始、Vitest v4.1.8、exit0、Test Files 1 passed、Tests 14 passed、Duration1.72s（tests123ms）。既存unit-test-instructionsのVitest/同export path/--passWithNoTests=falseを使い、ユーザー依頼に合わせてexportだけに限定した。指示書にこの単独コマンドが元からあるとは主張しない。過去のRedを再現するための巻戻しや試験弱化は行っていない。

## 残条件

この2file修正後の実PG、full、coverage、buildは未実行。旧635件/85.95%/build成功は当時の履歴であり、今回bytesへの保証ではない。今回lint/typecheck/prettier再実行もしていない。GUI Step9、R-03実本人変更等、実Auth/外部CI/本番、共同AC/NFRのDeferredを維持する。正式reviewと必要な追加検証の判断は親オーケストレーターへ返す。
