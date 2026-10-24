-- 使い捨てworkspace_test DB専用。実Supabase Authの代替は試験参照だけ。
BEGIN;
SELECT pg_advisory_xact_lock(261011001);
DO $$ BEGIN
  IF current_database() <> 'workspace_test' THEN
    RAISE EXCEPTION 'test database required';
  END IF;
END $$;
CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY);
INSERT INTO auth.users(id) VALUES
('11111111-1111-4111-8111-111111111111'),
('22222222-2222-4222-8222-222222222222') ON CONFLICT DO NOTHING;
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='workspace_test_app') THEN
    CREATE ROLE workspace_test_app LOGIN PASSWORD 'local-app-test-only' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
END $$;
COMMIT;
