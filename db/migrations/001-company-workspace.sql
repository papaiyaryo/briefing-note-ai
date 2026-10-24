-- __SCHEMA__ / __APP_ROLE__は検証済みSQL識別子へ展開して管理接続から適用する。
CREATE SCHEMA __SCHEMA__;
REVOKE ALL ON SCHEMA __SCHEMA__ FROM PUBLIC;
GRANT USAGE ON SCHEMA __SCHEMA__ TO __APP_ROLE__;
-- jsonb表示時の区切り空白は入力JSONの容量に含めない。文字列内部の空白は保持する。
CREATE FUNCTION __SCHEMA__.compact_json_bytes(document jsonb) RETURNS integer
LANGUAGE plpgsql IMMUTABLE STRICT SET search_path=pg_catalog AS $$
DECLARE total integer := 2; count_items integer := 0; pair record; item jsonb;
BEGIN
  IF jsonb_typeof(document)='object' THEN
    FOR pair IN SELECT key,value FROM jsonb_each(document) LOOP
      total := total + octet_length(to_jsonb(pair.key)::text) + 1 + __SCHEMA__.compact_json_bytes(pair.value);
      count_items := count_items + 1;
    END LOOP;
  ELSIF jsonb_typeof(document)='array' THEN
    FOR item IN SELECT value FROM jsonb_array_elements(document) LOOP
      total := total + __SCHEMA__.compact_json_bytes(item);
      count_items := count_items + 1;
    END LOOP;
  ELSE
    RETURN octet_length(document::text);
  END IF;
  RETURN total + greatest(count_items-1,0);
END;
$$;
CREATE TABLE __SCHEMA__.companies (
  company_id uuid PRIMARY KEY,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  name text NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 200),
  industry text CHECK (length(industry)<=200),
  interest_level text CHECK (interest_level IN ('high','medium','low','undecided')),
  personal_note text CHECK (length(personal_note)<=5000),
  selection_status text NOT NULL DEFAULT 'not_applied' CHECK (selection_status IN ('not_applied','considering','applied','screening','interview','offer','withdrawn','rejected')),
  next_selection_date date, application_deadline date, official_url text CHECK(length(official_url)<=2048),
  version uuid NOT NULL DEFAULT gen_random_uuid(), children_version bigint NOT NULL DEFAULT 0 CHECK(children_version>=0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(owner_id,company_id)
);
CREATE TABLE __SCHEMA__.memos (
  memo_id uuid PRIMARY KEY, owner_id uuid NOT NULL REFERENCES auth.users(id), company_id uuid NOT NULL,
  origin text NOT NULL CHECK(origin IN ('manual','generated')),
  provider_origin text CHECK(provider_origin IN ('dummy','openai')),
  markdown text NOT NULL CHECK(length(btrim(markdown)) BETWEEN 1 AND 50000),
  structured_content jsonb CHECK(structured_content IS NULL OR (jsonb_typeof(structured_content)='object' AND __SCHEMA__.compact_json_bytes(structured_content)<=262144)),
  corrected_ocr text CHECK(length(corrected_ocr)<=50000), event jsonb,
  adopted_web_sources jsonb NOT NULL DEFAULT '[]' CHECK(jsonb_typeof(adopted_web_sources)='array' AND jsonb_array_length(adopted_web_sources)<=50),
  comparison_reason text CHECK(length(comparison_reason)<=5000),
  version uuid NOT NULL DEFAULT gen_random_uuid(), created_at timestamptz NOT NULL DEFAULT clock_timestamp(), updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY(owner_id,company_id) REFERENCES __SCHEMA__.companies(owner_id,company_id) ON DELETE CASCADE,
  CHECK((origin='manual' AND provider_origin IS NULL) OR (origin='generated' AND provider_origin IS NOT NULL AND structured_content IS NOT NULL AND event IS NOT NULL AND corrected_ocr IS NOT NULL))
);
CREATE TABLE __SCHEMA__.write_operations (
  owner_id uuid NOT NULL REFERENCES auth.users(id), operation_id uuid NOT NULL,
  request_fingerprint text NOT NULL CHECK(request_fingerprint ~ '^[a-f0-9]{64}$'),
  action text NOT NULL CHECK(action IN ('company_create','company_update','memo_create','memo_update','company_delete','memo_delete')),
  company_id uuid NOT NULL, memo_id uuid, resulting_version uuid, committed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(owner_id,operation_id)
);
CREATE TABLE __SCHEMA__.deletion_snapshots (
  confirmation_id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES auth.users(id),
  company_id uuid NOT NULL, memo_id uuid, company_name text NOT NULL, target_version uuid NOT NULL,
  company_version uuid NOT NULL, children_version bigint NOT NULL,
  affected_memos jsonb NOT NULL, displayed_memo_count integer NOT NULL CHECK(displayed_memo_count>=0),
  issued_at timestamptz NOT NULL DEFAULT clock_timestamp(), expires_at timestamptz NOT NULL DEFAULT clock_timestamp()+interval '10 minutes'
);
CREATE TABLE __SCHEMA__.app_sessions (
  session_hash text PRIMARY KEY CHECK(session_hash ~ '^[a-f0-9]{64}$'), user_id uuid NOT NULL REFERENCES auth.users(id),
  auth_session_id text NOT NULL, encrypted_tokens jsonb,
  absolute_expires_at timestamptz NOT NULL, last_used_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  revoked_at timestamptz, refresh_version uuid NOT NULL DEFAULT gen_random_uuid()
);
CREATE INDEX companies_owner_status ON __SCHEMA__.companies(owner_id,selection_status);
CREATE INDEX memos_owner_page ON __SCHEMA__.memos(owner_id,company_id,updated_at DESC,memo_id);
CREATE INDEX operations_created_target ON __SCHEMA__.write_operations(company_id,memo_id,action);
CREATE UNIQUE INDEX company_identity_reserved ON __SCHEMA__.write_operations(company_id) WHERE action='company_create';
CREATE UNIQUE INDEX memo_identity_reserved ON __SCHEMA__.write_operations(memo_id) WHERE action='memo_create';
CREATE INDEX deletion_expiry ON __SCHEMA__.deletion_snapshots(expires_at);
CREATE INDEX session_expiry ON __SCHEMA__.app_sessions(absolute_expires_at);
ALTER TABLE __SCHEMA__.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.companies FORCE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.memos FORCE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.write_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.write_operations FORCE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.deletion_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE __SCHEMA__.deletion_snapshots FORCE ROW LEVEL SECURITY;
CREATE POLICY owner_only ON __SCHEMA__.companies USING(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid);
CREATE POLICY owner_only ON __SCHEMA__.memos USING(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid);
CREATE POLICY owner_only ON __SCHEMA__.write_operations USING(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid);
CREATE POLICY owner_only ON __SCHEMA__.deletion_snapshots USING(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid) WITH CHECK(owner_id=nullif(current_setting('app.owner_id',true),'')::uuid);
GRANT SELECT,INSERT,UPDATE,DELETE ON __SCHEMA__.companies,__SCHEMA__.memos,__SCHEMA__.deletion_snapshots TO __APP_ROLE__;
GRANT SELECT,INSERT ON __SCHEMA__.write_operations TO __APP_ROLE__;
REVOKE ALL ON __SCHEMA__.app_sessions FROM PUBLIC,__APP_ROLE__;
-- 保存版・所属のimmutable条件は通常roleの直接SQLでも保持する。
CREATE FUNCTION __SCHEMA__.memo_change() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog AS $$
BEGIN
  IF TG_OP='UPDATE' AND (NEW.owner_id,NEW.company_id,NEW.origin,NEW.provider_origin,NEW.memo_id) IS DISTINCT FROM (OLD.owner_id,OLD.company_id,OLD.origin,OLD.provider_origin,OLD.memo_id) THEN
    RAISE EXCEPTION 'immutable memo identity' USING ERRCODE='23514';
  END IF;
  IF TG_OP='DELETE' THEN
    UPDATE __SCHEMA__.companies SET children_version=children_version+1 WHERE company_id=OLD.company_id AND owner_id=OLD.owner_id;
    RETURN OLD;
  ELSE
    UPDATE __SCHEMA__.companies SET children_version=children_version+1 WHERE company_id=NEW.company_id AND owner_id=NEW.owner_id;
    RETURN NEW;
  END IF;
END $$;
CREATE TRIGGER memo_children AFTER INSERT OR UPDATE OR DELETE ON __SCHEMA__.memos FOR EACH ROW EXECUTE FUNCTION __SCHEMA__.memo_change();
REVOKE ALL ON FUNCTION __SCHEMA__.memo_change() FROM PUBLIC;
-- session表の通常DMLは非公開。hashを指定した限定入口だけをserver roleへ付与。
CREATE FUNCTION __SCHEMA__.session_create(p_hash text,p_user uuid,p_auth text,p_tokens jsonb) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
  INSERT INTO __SCHEMA__.app_sessions(session_hash,user_id,auth_session_id,encrypted_tokens,absolute_expires_at)
  VALUES(p_hash,p_user,p_auth,p_tokens,clock_timestamp()+interval '7 days');
$$;
CREATE FUNCTION __SCHEMA__.session_lock(p_hash text) RETURNS SETOF __SCHEMA__.app_sessions
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
  SELECT * FROM __SCHEMA__.app_sessions WHERE session_hash=p_hash FOR UPDATE;
$$;
CREATE FUNCTION __SCHEMA__.session_replace(p_hash text,p_version uuid,p_tokens jsonb) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  UPDATE __SCHEMA__.app_sessions SET encrypted_tokens=p_tokens,refresh_version=gen_random_uuid(),last_used_at=clock_timestamp()
  WHERE session_hash=p_hash AND refresh_version=p_version AND revoked_at IS NULL
  AND absolute_expires_at>clock_timestamp() AND last_used_at>clock_timestamp()-interval '24 hours';
  RETURN FOUND;
END $$;
CREATE FUNCTION __SCHEMA__.session_touch(p_hash text) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog AS $$
BEGIN
  UPDATE __SCHEMA__.app_sessions SET last_used_at=clock_timestamp()
  WHERE session_hash=p_hash AND revoked_at IS NULL AND absolute_expires_at>clock_timestamp()
  AND last_used_at>clock_timestamp()-interval '24 hours';
  RETURN FOUND;
END $$;
CREATE FUNCTION __SCHEMA__.session_revoke(p_hash text) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog AS $$
  UPDATE __SCHEMA__.app_sessions SET revoked_at=coalesce(revoked_at,clock_timestamp()),encrypted_tokens=NULL,refresh_version=gen_random_uuid() WHERE session_hash=p_hash;
$$;
REVOKE ALL ON FUNCTION __SCHEMA__.session_create(text,uuid,text,jsonb),__SCHEMA__.session_lock(text),__SCHEMA__.session_replace(text,uuid,jsonb),__SCHEMA__.session_touch(text),__SCHEMA__.session_revoke(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION __SCHEMA__.session_create(text,uuid,text,jsonb),__SCHEMA__.session_lock(text),__SCHEMA__.session_replace(text,uuid,jsonb),__SCHEMA__.session_touch(text),__SCHEMA__.session_revoke(text) TO __APP_ROLE__;
