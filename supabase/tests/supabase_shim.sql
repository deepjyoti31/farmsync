-- Minimal stand-in for the parts of Supabase that the migrations depend on,
-- so they can be applied to a plain PostgreSQL 15+ database in CI.
-- Never apply this file to a real Supabase project: those objects already exist there.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT,
    raw_user_meta_data JSONB DEFAULT '{}'::jsonb
);

-- Supabase reads the caller's identity from the request JWT; tests set it with
-- SET request.jwt.claim.sub = '<uuid>'.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION auth.jwt() RETURNS JSONB LANGUAGE sql STABLE AS $$
    SELECT coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;

GRANT USAGE ON SCHEMA auth, public TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid(), auth.jwt() TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Storage: just enough of Supabase's storage schema for bucket and policy migrations.
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    public BOOLEAN DEFAULT false,
    file_size_limit BIGINT,
    allowed_mime_types TEXT[]
);

CREATE TABLE IF NOT EXISTS storage.objects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bucket_id TEXT REFERENCES storage.buckets(id),
    name TEXT,
    owner UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Same behaviour as Supabase: the folder segments of an object path.
CREATE OR REPLACE FUNCTION storage.foldername(name TEXT) RETURNS TEXT[]
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
    _parts TEXT[];
BEGIN
    _parts := string_to_array(name, '/');
    RETURN _parts[1:array_length(_parts, 1) - 1];
END $$;

GRANT USAGE ON SCHEMA storage TO anon, authenticated, service_role;
GRANT ALL ON storage.objects, storage.buckets TO authenticated, service_role;
GRANT SELECT ON storage.objects, storage.buckets TO anon;
