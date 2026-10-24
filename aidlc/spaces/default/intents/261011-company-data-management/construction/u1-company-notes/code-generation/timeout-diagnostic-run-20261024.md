# U1 段階計測：最後の全体診断実行

承認済み改訂4 Step2の計測付き全体1回。最終 exit1、55ファイル中54成功、635件中634成功。開始のヘッダーから最後のrunner出力までを以下に保持する。以下は修復のRedではなく診断結果。

```text
> briefing-note-ai@0.1.0 test
> vitest run

 RUN  v4.1.8 D:/briefing-note-ai
stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] admin-connect:start 4ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] admin-connect:done 49ms
[fixture-timing:latest] bootstrap:start 49ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] bootstrap:done 2476ms
[fixture-timing:latest] migration:start 2476ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] migration:done 3048ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] initial-login:start 3051ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] initial-login:done 3594ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] initial-authenticate:done 3648ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] company-and-memo-created 3900ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] initial-reads:done 4080ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] latest-fetch:start 4158ms
[fixture-timing:latest] live-handler:start 4158ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:done 4401ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:start 4402ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:done 4509ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:start 4510ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:done 4589ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:start 4590ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] live-handler:done 4690ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] latest-fetch:done 4710ms
[fixture-timing:latest] draft-and-base:verified 4710ms
[fixture-timing:latest] pool-close:start 4711ms

stdout | tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
[fixture-timing:latest] pool-close:done 4713ms
[fixture-timing:latest] schema-cleanup:start 4714ms

 ❯ tests/u1-company-notes/ui.test.ts (46 tests | 1 failed) 6156ms
     × AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する 5021ms

⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯

 FAIL  tests/u1-company-notes/ui.test.ts > mutation outcome presentation boundaries > AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する
Error: Test timed out in 5000ms.
If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".
 ❯ tests/u1-company-notes/uiCallbacks.tsx:577:3
    575|     }
    576|   });
    577|   it("AC6.3.2 実HTTP/PGでlatest取得を完了し元の入力を保持する", async () => {
       |   ^
    578|     const trace = fixtureTrace("latest");
    579|     const f = await runtimeFixture(trace);

⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯


 Test Files  1 failed | 54 passed (55)
      Tests  1 failed | 634 passed (635)
   Start at  03:36:05
   Duration  26.96s (transform 16.65s, setup 0ms, import 46.70s, tests 133.17s, environment 34ms)


```

ネイティブ実行session 97377 は最終exit1を受領済み。追加Retry・新規試験・仮説修復なし。cleanupはpool-close:done 4713msまで確認し、schema-cleanup:start 4714ms以降の完了は未確認。計測はschema/接続IDを出していないため今回所有の専用schema名を安全に特定できず、列挙や削除は実行していない。engine/state/audit/receiptには書き込んでいない。

