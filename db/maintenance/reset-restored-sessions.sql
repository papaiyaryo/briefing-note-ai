-- アプリ停止中、復元先の管理者接続で実行する。__SCHEMA__を検証済みの専用schema名へ置換。
-- 復元されたsession/tokenをすべて除去する。企業・メモ・操作履歴は変更しない。
BEGIN;
DO $reset_restored_sessions$
DECLARE
  target_schema constant text := '__SCHEMA__';
BEGIN
  IF target_schema !~ '^[a-z][a-z0-9_]{0,62}$'
     OR target_schema IN ('public', 'auth', 'information_schema')
     OR target_schema LIKE 'pg_%' THEN
    RAISE EXCEPTION '専用schema識別子を確認してください';
  END IF;
  EXECUTE format('DELETE FROM %I.app_sessions', target_schema);
END
$reset_restored_sessions$;
COMMIT;
