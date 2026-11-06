## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-10-25T09:53:17Z
**Iteration:** 1

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-requirements/security-requirements.md > NFR1.3 (出自証明) | 出自証明は本人・generationId・providerOriginにだけ署名結合し、内容は含まない。この設計では、検証可能な基準が「署名が通ること」だけになっている。有効期限、1回限り性（同じ証明で別operationIdのメモを何件も作れるか）、署名鍵が未設定または不整合のときに失敗側へ倒れる要件、鍵ローテーション後の旧証明の扱いが書かれていない。契約(C2)は鍵の保持とローテーションを後続に送っており、この文書もそれを引き継いだだけで受け皿の要件がない。鍵が空のとき開発用の固定鍵に落ちる実装でも、本要件は満たされてしまう。 | NFR1.3に測定可能な条件を追加する。(a) 署名鍵が未設定ならdummy・openaiを問わず発行と検証を拒否する（fail-closed）。(b) 証明の有効期限と、期限切れ時に候補を保持して再生成を案内する挙動。(c) 同一generationIdから作れる保存メモ数の扱い（許容するなら明記）。(d) 鍵ローテーション時に旧証明を拒否して候補を保持する挙動。検証方法も併記する。 | New |
| R-02 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-requirements/security-requirements.md > NFR4.4 | 「単発Responses」にだけstore:falseを要求している。同じ画像由来のOCRテキストや本文を送るstructure、web-supplement、interview-reviewの各呼出しで同じ設定を求めるかが不明。個人メモを外部に送る全経路が対象になっていない。 | store:falseまたは同等の外部保持抑止の対象を、個人メモ・OCR・画像を送る全providerルートに広げる。対象外のルートがあれば理由を明記し、fake送信契約の検査対象にも含める。 | New |
| R-03 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-requirements/security-requirements.md > Identity and Trust Boundaries（全体） | 認証済み本人が外部provider(OCR・生成・Web)を何度でも呼べる。429(rate_limited)は契約の写像にあるだけで、本人単位の呼出し頻度・同時実行の上限要件がない。signupは非公開だが、Cookie窃取やスクリプト暴走で外部API費用が際限なく増えうる。この文書は外部費用を扱うscalability(NFR7.5)とも結び付いていない。 | 本人単位の生成系呼出しの上限（例: 分あたり回数・同時実行数）を数値で置くか、置かない理由と残余リスクをResidual Risksに明記する。 | New |
| R-04 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-requirements/security-requirements.md > Untrusted Content and Image Boundary | 画像アップロードの内容検証（許可MIME・拡張子とバイナリ実体の一致・枚数・サイズ）が、セキュリティ側に要件として無い。サイズ上限はperformance(NFR7.2)にあるが、外部へ送る前の種別検証は誰も持っていない。 | 外部送信前の画像種別検証（許可形式、不一致時の拒否、拒否時にproviderを呼ばず入力を保持）をNFR4.xとして追加するか、既存のOCRルートでの実施をNFR7.2へ明示的に結び付ける。 | New |
| R-05 | Minor | aidlc/spaces/default/intents/261011-company-data-management/construction/u2-generated-notes/nfr-requirements/security-requirements.md > Compliance and Residual Risks | 既存依存auditのhigh5／critical1に言及しているが、出典がなく（今回の入力には現れない）、対応の担当者と時期は「正式な修正経路」とだけある。認証・個人メモ保存を新たに載せるリリースで、既知の重大脆弱性の扱いが未確定のまま残る。 | 出典（取得日と対象）を付けるか記述を外す。リリース前にどの段階で誰が判断するか（例: Code Generation PlanまたはBuild and Testでの確認事項）を一行で割り当てる。 | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| traceability.json の機械照合（手動） | PASS | 上流のNFR1〜NFR7の7件すべてがcoverageに存在し、status は全件OK。各targetのNFR1.1〜1.5、2.1〜2.7、3.1〜3.2、4.1〜4.4、5.1〜5.2、6.1〜6.4、7.1〜7.7の合計29件が、U2の6文書のいずれかに実在する（1.1〜1.4はsecurity、1.5はobservability、4.1はperformance、5.2とNFR6.2〜6.4はtech-stack-decisions等）。孤立ID、未定義ID、重複定義はなし。 |
| 上流との整合（手動） | PASS（軽微な注意あり） | NFR1/NFR4/NFR5の要件、BR1.1・1.2・2.3・3.3・3.4、C1/C2/C4/C5と矛盾なし。BR1.2の再読込後は保持しない方針ともNFR1.4が一致。tech-stack-decisionsがU1選定済みのSupabase Authとするのは、U1側の確定内容を本レビューでは確認していない（兄弟Unit読取り禁止のため）。 |

### Summary

セキュリティ要件は上流のNFR1・NFR4・NFR5とC1/C2/C4/C5に整合し、traceabilityも機械的に成立しているため、実装着手に足りる。最大の懸念は出自証明(NFR1.3)で、鍵未設定時の失敗側動作と有効期限などが要件化されておらず、実装次第で保護が名目だけになりうる。これをゲートで検討してほしい。
