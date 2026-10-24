# U3 revision02 — rootによる限定CUA画面確認

## 実施境界
2026-10-22 JSTに、承認済みStep9の限定確認をCUA/Chrome extensionで実施。dummy本人、架空企業・手入力構造化メモ、既存local-workspace-preview.mjs/専用schemaのみ。画面操作をCDP/外部Playwright/ブラウザfetch/状態注入で代替していない。実B/Auth/Supabase/Vercel未実施。変更なしのNode22/Next15.5.19/helper5分TTLを使用。以下はGUIの実観測だけで、直接controller試験や新PATCH0は別のTDD証拠。

## 各限定runと準備上の失敗
1. schema u1_preview_ce320868e7af45b089c39877c22c623b、helper12536/next50472、exec87965。誤った /companies 入口404の後、正しい / に移動。初回layout.jsのSyntaxErrorと認証確認中を観測。reload後にログイン画面へ到達し、同じ生成layout.jsのnode --checkはexit0。恒久原因や修正成功を推定しない。setValue後の再描画で古いAX要素を参照したため、実DOMのlabel locatorへ切り替え。dummy login200、企業201、構造化メモ201を実施したが比較前に300000ms TTL終了。M-R成功に加算しない。exit0、専用preview停止true/schema削除true。
2. schema u1_preview_ccf4b2c9d7c4440996b81bbd13e627a6、helper48968/next48804、exec8000。新規架空企業/構造化メモ作成。登録直後の遷移待ちでlocator期限に到達したが、再観測後に既存buttonで続行。M-R1/M-R2/M-R4の下記部分を確認。最後の企業削除確認入口で結果不明表示となり、企業削除の確定を主張しない。次runへ分離した。使用tab1632699666/1632699669を閉じ、stop送信後exit0/停止true/削除true。
3. schema u1_preview_4702490b5a6b4797a355dd378f231305、helper39756/next46300、exec72453。新規架空企業/構造化メモを作り、M-R3の企業全体削除とM-R5の限定操作を確認。tab1632699674/1632699677を閉じた。stop後exit0、停止true/削除true。既存DB/volume/他者worktreeを削除していない。

## M-Rの実観測と未達
| ID | 実観測 | 未確認・限界 |
|---|---|---|
| M-R1 | 同本人2タブ。Aの比較理由保存200→確定操作/版表示。B企業詳細で理由更新200、A旧版保存409。Aでは元の基準・保持入力・最新を分け、成功文なし。明示latest GET200後に別タブ保存値と新しい版を別領域へ表示し、基準/下書きは保持 | 明示rebase後の再保存はこのrunで未実施。409→latest503/切断はUI回帰試験の別証拠でありGUI注入していない |
| M-R2 | Bでメモ削除確認200→削除確定200/所属0件。Aの比較参照再取得404→対象なし/利用不可・古い参照/出力不可。dirty理由の値保持、理由入力/新規保存/rebase無効、全体出力無効。全選択404から原因列を推測しない表示。企業だけlatest GET200後company combobox有効、memo textbox無効、export無効をisEnabledで確認 | GUIからdisabledを迂回して直接送信していない。新intent/PATCH0はcontroller/UI/実PG試験へ対応。企業欄の新規保存確定までは未実施 |
| M-R3 | 第3runで所属メモ1件を含む企業削除確認200→削除確定200→Bボード0社。A比較参照404、企業志望度/メモ理由入力・保存無効、理由draft保持、全体出力無効。旧選択/比較表を勝手に縮小していない。企業latest GET404も確認 | 残る別企業の対象別確認→保存はGUI未実施。controller/UIの有効な別対象継続回帰とは区別 |
| M-R4 | 比較理由の通常保存200、GET200、C3再取得200、同じ確定操作/版と保存成功・確定結果保持を表示。後続競合ではその旧確定を新成功へ誤適用しない | 他欄dirty同時保存、route往復、比較.mdの実downloadは今回未実施。unknown/commit後GET失敗は制御試験、GUI成功へ読み替えない |
| M-R5 | PC実CSS幅1905、height901（第2run）/957（第3run）、document横overflow false。削除通知/ラベル/無効欄を実画面で確認。Tab/ShiftTabで既存latest確認buttonへfocus、Enterでlatest確認→GET404/利用不可保持 | viewport.set390x844を呼んでも実幅1905のまま。reset実施。Control_L+plusでも幅1905のままでnative倍率変化は立証せず、Control_L+0で戻す操作。mobile幅/native200/400未確認。全操作keyboard-onlyとは主張しない |

## ログと証拠の区別
run2の実HTTPログは比較C3 200→保存PATCH200→別タブPATCH200→旧版PATCH409→latestGET200→メモ削除200→C3 404→企業GET200という順序を確認。run3は企業/所属削除200→C3 404→企業GET404を確認。操作内容/完全body/Cookie/鍵は記録していない。GUI snapshotに現れた架空本文や操作IDを監査記録へ複写しない。画面で出力button無効を見たがfile0の計測を別途行ったとは表現しない。

Step9は上記限定実施済みだが全M-R条件の完了ではないため、plan checkboxは未チェックを維持する。R-01/R-02の回帰と上記GUI証拠を合わせて後続正式reviewへ渡す。旧CDP手動履歴は履歴として残し、今回の幅/zoom証明へ流用しない。実B/A→B→A/出力中本人変更、U2の画面受入未確認、公開/実CIは未確認のまま。

