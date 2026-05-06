--
-- PostgreSQL database dump
--

\restrict ngKfgytcIFX1mPgeB3wfZ6Edl6F51UDnX9iGPOfnH8l73OuXiJvU6bfDQQLxle1

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: assignment_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.assignment_type AS ENUM (
    'task',
    'quiz',
    'exam',
    'project'
);


--
-- Name: branch_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.branch_role AS ENUM (
    'owner',
    'admin',
    'usuario'
);


--
-- Name: course_item_kind; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_item_kind AS ENUM (
    'lesson',
    'assignment'
);


--
-- Name: course_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.course_status AS ENUM (
    'draft',
    'active',
    'archived'
);


--
-- Name: item_progress_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.item_progress_status AS ENUM (
    'not_started',
    'in_progress',
    'completed'
);


--
-- Name: member_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.member_status AS ENUM (
    'active',
    'inactive',
    'pending'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'assignment_due',
    'grade_released',
    'comment',
    'announcement',
    'enrollment',
    'other'
);


--
-- Name: question_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.question_type AS ENUM (
    'multiple_choice',
    'true_false',
    'short_text',
    'long_text'
);


--
-- Name: quiz_feedback_mode; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quiz_feedback_mode AS ENUM (
    'immediate',
    'on_submit',
    'manual_release'
);


--
-- Name: submission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.submission_status AS ENUM (
    'draft',
    'submitted',
    'late',
    'returned',
    'graded'
);


--
-- Name: tutor_relationship_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.tutor_relationship_type AS ENUM (
    'mother',
    'father',
    'stepparent',
    'grandparent',
    'sibling',
    'legal_guardian',
    'other'
);


--
-- Name: video_provider; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.video_provider AS ENUM (
    'youtube',
    'vimeo',
    'mux',
    'self_hosted'
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: can_edit_course(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_edit_course(p_course_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from courses c
    where c.id = p_course_id
      and is_branch_staff(c.branch_id)
  );
$$;


--
-- Name: can_view_course(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_view_course(p_course_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from courses c
    where c.id = p_course_id
      and (
        is_branch_staff(c.branch_id)
        or exists (
          select 1 from course_enrollments e
          where e.course_id = p_course_id
            and e.student_profile_id = auth.uid()
        )
      )
  );
$$;


--
-- Name: current_user_branches(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.current_user_branches() RETURNS SETOF uuid
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select branch_id
  from branch_members
  where profile_id = auth.uid()
    and status = 'active';
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;


--
-- Name: has_branch_role(uuid, public.branch_role[]); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_branch_role(p_branch_id uuid, p_roles public.branch_role[]) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from branch_members
    where profile_id = auth.uid()
      and branch_id = p_branch_id
      and status = 'active'
      and role = any(p_roles)
  );
$$;


--
-- Name: is_branch_staff(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_branch_staff(p_branch_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select has_branch_role(p_branch_id, array['owner', 'admin']::branch_role[]);
$$;


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: storage_first_folder_uuid(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.storage_first_folder_uuid(p_name text) RETURNS uuid
    LANGUAGE sql IMMUTABLE
    AS $_$
  select case
    when (storage.foldername(p_name))[1] ~ '^[0-9a-fA-F-]{36}$'
    then ((storage.foldername(p_name))[1])::uuid
    else null
  end;
$_$;


--
-- Name: user_in_course_branch(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.user_in_course_branch(p_course_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  select exists (
    select 1 from courses c
    where c.id = p_course_id
      and c.branch_id in (select current_user_branches())
  );
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
_filename text;
BEGIN
	select string_to_array(name, '/') into _parts;
	select _parts[array_length(_parts,1)] into _filename;
	-- @todo return the last part instead of 2
	return reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[1:array_length(_parts,1)-1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::int) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: assignment_criteria; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignment_criteria (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    max_score numeric(6,2) NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    instructions text,
    type public.assignment_type NOT NULL,
    max_score numeric(6,2) DEFAULT 10 NOT NULL,
    weight numeric(5,2) DEFAULT 1.0 NOT NULL,
    due_date timestamp with time zone,
    available_from timestamp with time zone,
    published_at timestamp with time zone,
    allow_late_submission boolean DEFAULT false NOT NULL,
    max_attempts integer,
    time_limit_minutes integer,
    shuffle_questions boolean DEFAULT false NOT NULL,
    feedback_mode public.quiz_feedback_mode DEFAULT 'on_submit'::public.quiz_feedback_mode NOT NULL,
    pass_threshold_percent numeric(5,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: branch_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branch_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    role public.branch_role NOT NULL,
    status public.member_status DEFAULT 'active'::public.member_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.branches (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    cnpj text,
    address_line text,
    city text,
    state text,
    postal_code text,
    logo_url text,
    status text DEFAULT 'active'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT branches_cnpj_check CHECK (((cnpj IS NULL) OR (length(regexp_replace(cnpj, '\D'::text, ''::text, 'g'::text)) = 14)))
);


--
-- Name: course_enrollments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    enrolled_at timestamp with time zone DEFAULT now() NOT NULL,
    completed_at timestamp with time zone
);


--
-- Name: course_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    module_id uuid,
    "position" integer NOT NULL,
    kind public.course_item_kind NOT NULL,
    lesson_id uuid,
    assignment_id uuid,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT course_items_check CHECK ((((kind = 'lesson'::public.course_item_kind) AND (lesson_id IS NOT NULL) AND (assignment_id IS NULL)) OR ((kind = 'assignment'::public.course_item_kind) AND (assignment_id IS NOT NULL) AND (lesson_id IS NULL))))
);


--
-- Name: course_modules; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.course_modules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    name text NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: courses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    branch_id uuid NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    cover_url text,
    color_tone text,
    status public.course_status DEFAULT 'draft'::public.course_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: daily_activity; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_activity (
    profile_id uuid NOT NULL,
    date date NOT NULL,
    count integer DEFAULT 1 NOT NULL
);


--
-- Name: grades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.grades (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    submission_id uuid,
    score numeric(6,2) NOT NULL,
    feedback text,
    graded_by uuid NOT NULL,
    graded_at timestamp with time zone DEFAULT now() NOT NULL,
    released_at timestamp with time zone
);


--
-- Name: item_progress; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_item_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    status public.item_progress_status DEFAULT 'not_started'::public.item_progress_status NOT NULL,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    watch_seconds integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lesson_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    name text NOT NULL,
    storage_path text NOT NULL,
    mime_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lesson_comments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    author_id uuid NOT NULL,
    parent_id uuid,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lesson_favorites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lesson_favorites (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    lesson_id uuid NOT NULL,
    profile_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lessons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    course_id uuid NOT NULL,
    author_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    video_url text,
    video_provider public.video_provider,
    video_duration_seconds integer,
    is_essential boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_profile_id uuid NOT NULL,
    branch_id uuid,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    body text,
    link text,
    metadata jsonb,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    full_name text NOT NULL,
    avatar_url text,
    phone text,
    birth_date date,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_options; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_options (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    question_id uuid NOT NULL,
    content text NOT NULL,
    is_correct boolean DEFAULT false NOT NULL,
    "position" integer NOT NULL
);


--
-- Name: quiz_options_for_students; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.quiz_options_for_students WITH (security_invoker='on') AS
 SELECT id,
    question_id,
    content,
    "position"
   FROM public.quiz_options;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    prompt text NOT NULL,
    hint text,
    type public.question_type NOT NULL,
    points numeric(6,2) DEFAULT 1 NOT NULL,
    "position" integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: quiz_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_responses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    question_id uuid NOT NULL,
    selected_option_id uuid,
    text_answer text,
    earned_points numeric(6,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: submission_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submission_attachments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    name text NOT NULL,
    storage_path text NOT NULL,
    mime_type text,
    size_bytes bigint,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: submission_criterion_scores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submission_criterion_scores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    submission_id uuid NOT NULL,
    criterion_id uuid NOT NULL,
    score numeric(6,2) NOT NULL,
    feedback text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: submissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    assignment_id uuid NOT NULL,
    student_profile_id uuid NOT NULL,
    attempt integer DEFAULT 1 NOT NULL,
    content text,
    status public.submission_status DEFAULT 'draft'::public.submission_status NOT NULL,
    submitted_at timestamp with time zone,
    score numeric(6,2),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: tutor_contacts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutor_contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    student_profile_id uuid NOT NULL,
    full_name text NOT NULL,
    relationship public.tutor_relationship_type NOT NULL,
    phone text,
    email text,
    is_primary boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: assignment_criteria assignment_criteria_assignment_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_criteria
    ADD CONSTRAINT assignment_criteria_assignment_id_position_key UNIQUE (assignment_id, "position");


--
-- Name: assignment_criteria assignment_criteria_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_criteria
    ADD CONSTRAINT assignment_criteria_pkey PRIMARY KEY (id);


--
-- Name: assignments assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_pkey PRIMARY KEY (id);


--
-- Name: branch_members branch_members_branch_id_profile_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_members
    ADD CONSTRAINT branch_members_branch_id_profile_id_role_key UNIQUE (branch_id, profile_id, role);


--
-- Name: branch_members branch_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_members
    ADD CONSTRAINT branch_members_pkey PRIMARY KEY (id);


--
-- Name: branches branches_cnpj_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_cnpj_key UNIQUE (cnpj);


--
-- Name: branches branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_pkey PRIMARY KEY (id);


--
-- Name: branches branches_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branches
    ADD CONSTRAINT branches_slug_key UNIQUE (slug);


--
-- Name: course_enrollments course_enrollments_course_id_student_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_student_profile_id_key UNIQUE (course_id, student_profile_id);


--
-- Name: course_enrollments course_enrollments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_pkey PRIMARY KEY (id);


--
-- Name: course_items course_items_course_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_items
    ADD CONSTRAINT course_items_course_id_position_key UNIQUE (course_id, "position");


--
-- Name: course_items course_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_items
    ADD CONSTRAINT course_items_pkey PRIMARY KEY (id);


--
-- Name: course_modules course_modules_course_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_position_key UNIQUE (course_id, "position");


--
-- Name: course_modules course_modules_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_pkey PRIMARY KEY (id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (id);


--
-- Name: daily_activity daily_activity_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_pkey PRIMARY KEY (profile_id, date);


--
-- Name: grades grades_assignment_id_student_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_assignment_id_student_profile_id_key UNIQUE (assignment_id, student_profile_id);


--
-- Name: grades grades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_pkey PRIMARY KEY (id);


--
-- Name: item_progress item_progress_course_item_id_student_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_progress
    ADD CONSTRAINT item_progress_course_item_id_student_profile_id_key UNIQUE (course_item_id, student_profile_id);


--
-- Name: item_progress item_progress_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_progress
    ADD CONSTRAINT item_progress_pkey PRIMARY KEY (id);


--
-- Name: lesson_attachments lesson_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attachments
    ADD CONSTRAINT lesson_attachments_pkey PRIMARY KEY (id);


--
-- Name: lesson_comments lesson_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_pkey PRIMARY KEY (id);


--
-- Name: lesson_favorites lesson_favorites_lesson_id_profile_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_favorites
    ADD CONSTRAINT lesson_favorites_lesson_id_profile_id_key UNIQUE (lesson_id, profile_id);


--
-- Name: lesson_favorites lesson_favorites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_favorites
    ADD CONSTRAINT lesson_favorites_pkey PRIMARY KEY (id);


--
-- Name: lessons lessons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: quiz_options quiz_options_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_pkey PRIMARY KEY (id);


--
-- Name: quiz_options quiz_options_question_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_question_id_position_key UNIQUE (question_id, "position");


--
-- Name: quiz_questions quiz_questions_assignment_id_position_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_assignment_id_position_key UNIQUE (assignment_id, "position");


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: quiz_responses quiz_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_pkey PRIMARY KEY (id);


--
-- Name: quiz_responses quiz_responses_submission_id_question_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_submission_id_question_id_key UNIQUE (submission_id, question_id);


--
-- Name: submission_attachments submission_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_pkey PRIMARY KEY (id);


--
-- Name: submission_criterion_scores submission_criterion_scores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_criterion_scores
    ADD CONSTRAINT submission_criterion_scores_pkey PRIMARY KEY (id);


--
-- Name: submission_criterion_scores submission_criterion_scores_submission_id_criterion_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_criterion_scores
    ADD CONSTRAINT submission_criterion_scores_submission_id_criterion_id_key UNIQUE (submission_id, criterion_id);


--
-- Name: submissions submissions_assignment_id_student_profile_id_attempt_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_student_profile_id_attempt_key UNIQUE (assignment_id, student_profile_id, attempt);


--
-- Name: submissions submissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (id);


--
-- Name: tutor_contacts tutor_contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_contacts
    ADD CONSTRAINT tutor_contacts_pkey PRIMARY KEY (id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: assignment_criteria_assignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignment_criteria_assignment_idx ON public.assignment_criteria USING btree (assignment_id);


--
-- Name: assignments_course_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_course_idx ON public.assignments USING btree (course_id);


--
-- Name: assignments_due_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX assignments_due_idx ON public.assignments USING btree (due_date);


--
-- Name: branch_members_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX branch_members_branch_idx ON public.branch_members USING btree (branch_id);


--
-- Name: branch_members_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX branch_members_profile_idx ON public.branch_members USING btree (profile_id);


--
-- Name: branch_members_role_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX branch_members_role_idx ON public.branch_members USING btree (role);


--
-- Name: branches_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX branches_status_idx ON public.branches USING btree (status);


--
-- Name: course_enrollments_course_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_enrollments_course_idx ON public.course_enrollments USING btree (course_id);


--
-- Name: course_enrollments_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_enrollments_student_idx ON public.course_enrollments USING btree (student_profile_id);


--
-- Name: course_items_assignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_items_assignment_idx ON public.course_items USING btree (assignment_id);


--
-- Name: course_items_course_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_items_course_idx ON public.course_items USING btree (course_id);


--
-- Name: course_items_lesson_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_items_lesson_idx ON public.course_items USING btree (lesson_id);


--
-- Name: course_items_module_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_items_module_idx ON public.course_items USING btree (module_id);


--
-- Name: course_modules_course_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX course_modules_course_idx ON public.course_modules USING btree (course_id);


--
-- Name: courses_branch_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_branch_idx ON public.courses USING btree (branch_id);


--
-- Name: courses_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX courses_status_idx ON public.courses USING btree (status);


--
-- Name: daily_activity_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX daily_activity_date_idx ON public.daily_activity USING btree (date);


--
-- Name: grades_assignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grades_assignment_idx ON public.grades USING btree (assignment_id);


--
-- Name: grades_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX grades_student_idx ON public.grades USING btree (student_profile_id);


--
-- Name: item_progress_item_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_progress_item_idx ON public.item_progress USING btree (course_item_id);


--
-- Name: item_progress_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX item_progress_student_idx ON public.item_progress USING btree (student_profile_id);


--
-- Name: lesson_attachments_lesson_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_attachments_lesson_idx ON public.lesson_attachments USING btree (lesson_id);


--
-- Name: lesson_comments_lesson_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_comments_lesson_idx ON public.lesson_comments USING btree (lesson_id);


--
-- Name: lesson_comments_parent_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_comments_parent_idx ON public.lesson_comments USING btree (parent_id);


--
-- Name: lesson_favorites_profile_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lesson_favorites_profile_idx ON public.lesson_favorites USING btree (profile_id);


--
-- Name: lessons_course_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lessons_course_idx ON public.lessons USING btree (course_id);


--
-- Name: lessons_published_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX lessons_published_idx ON public.lessons USING btree (published_at);


--
-- Name: notifications_recipient_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_recipient_idx ON public.notifications USING btree (recipient_profile_id);


--
-- Name: notifications_unread_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX notifications_unread_idx ON public.notifications USING btree (recipient_profile_id) WHERE (read_at IS NULL);


--
-- Name: quiz_options_question_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_options_question_idx ON public.quiz_options USING btree (question_id);


--
-- Name: quiz_questions_assignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_questions_assignment_idx ON public.quiz_questions USING btree (assignment_id);


--
-- Name: quiz_responses_submission_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX quiz_responses_submission_idx ON public.quiz_responses USING btree (submission_id);


--
-- Name: submission_attachments_submission_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX submission_attachments_submission_idx ON public.submission_attachments USING btree (submission_id);


--
-- Name: submission_criterion_scores_submission_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX submission_criterion_scores_submission_idx ON public.submission_criterion_scores USING btree (submission_id);


--
-- Name: submissions_assignment_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX submissions_assignment_idx ON public.submissions USING btree (assignment_id);


--
-- Name: submissions_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX submissions_status_idx ON public.submissions USING btree (status);


--
-- Name: submissions_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX submissions_student_idx ON public.submissions USING btree (student_profile_id);


--
-- Name: tutor_contacts_student_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tutor_contacts_student_idx ON public.tutor_contacts USING btree (student_profile_id);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: assignments assignments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER assignments_updated_at BEFORE UPDATE ON public.assignments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: branches branches_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: course_items course_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER course_items_updated_at BEFORE UPDATE ON public.course_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: courses courses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: item_progress item_progress_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER item_progress_updated_at BEFORE UPDATE ON public.item_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lesson_comments lesson_comments_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lesson_comments_updated_at BEFORE UPDATE ON public.lesson_comments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: lessons lessons_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER lessons_updated_at BEFORE UPDATE ON public.lessons FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: profiles profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: submission_criterion_scores submission_criterion_scores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER submission_criterion_scores_updated_at BEFORE UPDATE ON public.submission_criterion_scores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: submissions submissions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER submissions_updated_at BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: tutor_contacts tutor_contacts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER tutor_contacts_updated_at BEFORE UPDATE ON public.tutor_contacts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: assignment_criteria assignment_criteria_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignment_criteria
    ADD CONSTRAINT assignment_criteria_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: assignments assignments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: assignments assignments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.assignments
    ADD CONSTRAINT assignments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: branch_members branch_members_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_members
    ADD CONSTRAINT branch_members_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: branch_members branch_members_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.branch_members
    ADD CONSTRAINT branch_members_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_enrollments course_enrollments_student_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_enrollments
    ADD CONSTRAINT course_enrollments_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: course_items course_items_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_items
    ADD CONSTRAINT course_items_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: course_items course_items_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_items
    ADD CONSTRAINT course_items_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: course_items course_items_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_items
    ADD CONSTRAINT course_items_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: course_items course_items_module_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_items
    ADD CONSTRAINT course_items_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.course_modules(id) ON DELETE SET NULL;


--
-- Name: course_modules course_modules_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.course_modules
    ADD CONSTRAINT course_modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: courses courses_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: courses courses_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: daily_activity daily_activity_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_activity
    ADD CONSTRAINT daily_activity_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: grades grades_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: grades grades_graded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_graded_by_fkey FOREIGN KEY (graded_by) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: grades grades_student_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: grades grades_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.grades
    ADD CONSTRAINT grades_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE SET NULL;


--
-- Name: item_progress item_progress_course_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_progress
    ADD CONSTRAINT item_progress_course_item_id_fkey FOREIGN KEY (course_item_id) REFERENCES public.course_items(id) ON DELETE CASCADE;


--
-- Name: item_progress item_progress_student_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_progress
    ADD CONSTRAINT item_progress_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lesson_attachments lesson_attachments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_attachments
    ADD CONSTRAINT lesson_attachments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_comments lesson_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lesson_comments lesson_comments_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_comments lesson_comments_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_comments
    ADD CONSTRAINT lesson_comments_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.lesson_comments(id) ON DELETE CASCADE;


--
-- Name: lesson_favorites lesson_favorites_lesson_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_favorites
    ADD CONSTRAINT lesson_favorites_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id) ON DELETE CASCADE;


--
-- Name: lesson_favorites lesson_favorites_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lesson_favorites
    ADD CONSTRAINT lesson_favorites_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: lessons lessons_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;


--
-- Name: lessons lessons_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lessons
    ADD CONSTRAINT lessons_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_recipient_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_profile_id_fkey FOREIGN KEY (recipient_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: quiz_options quiz_options_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_options
    ADD CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: quiz_responses quiz_responses_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id) ON DELETE CASCADE;


--
-- Name: quiz_responses quiz_responses_selected_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_selected_option_id_fkey FOREIGN KEY (selected_option_id) REFERENCES public.quiz_options(id) ON DELETE SET NULL;


--
-- Name: quiz_responses quiz_responses_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_responses
    ADD CONSTRAINT quiz_responses_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;


--
-- Name: submission_attachments submission_attachments_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_attachments
    ADD CONSTRAINT submission_attachments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;


--
-- Name: submission_criterion_scores submission_criterion_scores_criterion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_criterion_scores
    ADD CONSTRAINT submission_criterion_scores_criterion_id_fkey FOREIGN KEY (criterion_id) REFERENCES public.assignment_criteria(id) ON DELETE CASCADE;


--
-- Name: submission_criterion_scores submission_criterion_scores_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submission_criterion_scores
    ADD CONSTRAINT submission_criterion_scores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_assignment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id) ON DELETE CASCADE;


--
-- Name: submissions submissions_student_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: tutor_contacts tutor_contacts_student_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutor_contacts
    ADD CONSTRAINT tutor_contacts_student_profile_id_fkey FOREIGN KEY (student_profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: assignment_criteria; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignment_criteria ENABLE ROW LEVEL SECURITY;

--
-- Name: assignment_criteria assignment_criteria_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignment_criteria_modify ON public.assignment_criteria USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_criteria.assignment_id) AND public.can_edit_course(a.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_criteria.assignment_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: assignment_criteria assignment_criteria_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignment_criteria_select ON public.assignment_criteria FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = assignment_criteria.assignment_id) AND (public.can_edit_course(a.course_id) OR ((a.published_at IS NOT NULL) AND (a.published_at <= now()) AND public.can_view_course(a.course_id)))))));


--
-- Name: assignments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

--
-- Name: assignments assignments_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_modify ON public.assignments USING (public.can_edit_course(course_id)) WITH CHECK (public.can_edit_course(course_id));


--
-- Name: assignments assignments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY assignments_select ON public.assignments FOR SELECT USING ((public.can_edit_course(course_id) OR ((published_at IS NOT NULL) AND (published_at <= now()) AND public.can_view_course(course_id))));


--
-- Name: branch_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branch_members ENABLE ROW LEVEL SECURITY;

--
-- Name: branch_members branch_members_modify_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branch_members_modify_owner ON public.branch_members USING (public.has_branch_role(branch_id, ARRAY['owner'::public.branch_role])) WITH CHECK (public.has_branch_role(branch_id, ARRAY['owner'::public.branch_role]));


--
-- Name: branch_members branch_members_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branch_members_select ON public.branch_members FOR SELECT USING (((branch_id IN ( SELECT public.current_user_branches() AS current_user_branches)) OR (profile_id = auth.uid())));


--
-- Name: branches; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

--
-- Name: branches branches_modify_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branches_modify_owner ON public.branches USING (public.has_branch_role(id, ARRAY['owner'::public.branch_role])) WITH CHECK (public.has_branch_role(id, ARRAY['owner'::public.branch_role]));


--
-- Name: branches branches_select_member; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY branches_select_member ON public.branches FOR SELECT USING ((id IN ( SELECT public.current_user_branches() AS current_user_branches)));


--
-- Name: course_enrollments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

--
-- Name: course_enrollments course_enrollments_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_enrollments_modify ON public.course_enrollments USING ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = course_enrollments.course_id) AND public.is_branch_staff(c.branch_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = course_enrollments.course_id) AND public.is_branch_staff(c.branch_id)))));


--
-- Name: course_enrollments course_enrollments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_enrollments_select ON public.course_enrollments FOR SELECT USING (((student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = course_enrollments.course_id) AND public.is_branch_staff(c.branch_id))))));


--
-- Name: course_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_items ENABLE ROW LEVEL SECURITY;

--
-- Name: course_items course_items_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_items_modify ON public.course_items USING (public.can_edit_course(course_id)) WITH CHECK (public.can_edit_course(course_id));


--
-- Name: course_items course_items_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_items_select ON public.course_items FOR SELECT USING (public.can_view_course(course_id));


--
-- Name: course_modules; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

--
-- Name: course_modules course_modules_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_modify ON public.course_modules USING (public.can_edit_course(course_id)) WITH CHECK (public.can_edit_course(course_id));


--
-- Name: course_modules course_modules_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY course_modules_select ON public.course_modules FOR SELECT USING (public.can_view_course(course_id));


--
-- Name: courses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

--
-- Name: courses courses_modify_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_modify_staff ON public.courses USING (public.is_branch_staff(branch_id)) WITH CHECK (public.is_branch_staff(branch_id));


--
-- Name: courses courses_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY courses_select ON public.courses FOR SELECT USING ((public.is_branch_staff(branch_id) OR ((status = 'active'::public.course_status) AND (EXISTS ( SELECT 1
   FROM public.course_enrollments e
  WHERE ((e.course_id = courses.id) AND (e.student_profile_id = auth.uid())))))));


--
-- Name: daily_activity; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_activity daily_activity_modify_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY daily_activity_modify_self ON public.daily_activity USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));


--
-- Name: daily_activity daily_activity_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY daily_activity_select ON public.daily_activity FOR SELECT USING (((profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.branch_members bm
  WHERE ((bm.profile_id = daily_activity.profile_id) AND public.is_branch_staff(bm.branch_id))))));


--
-- Name: grades; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;

--
-- Name: grades grades_modify_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grades_modify_staff ON public.grades USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = grades.assignment_id) AND public.can_edit_course(a.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = grades.assignment_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: grades grades_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY grades_select ON public.grades FOR SELECT USING ((((student_profile_id = auth.uid()) AND (released_at IS NOT NULL)) OR (EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = grades.assignment_id) AND public.can_edit_course(a.course_id))))));


--
-- Name: item_progress; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.item_progress ENABLE ROW LEVEL SECURITY;

--
-- Name: item_progress item_progress_modify_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_progress_modify_student ON public.item_progress USING ((student_profile_id = auth.uid())) WITH CHECK ((student_profile_id = auth.uid()));


--
-- Name: item_progress item_progress_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY item_progress_select ON public.item_progress FOR SELECT USING (((student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.course_items ci
  WHERE ((ci.id = item_progress.course_item_id) AND public.can_edit_course(ci.course_id))))));


--
-- Name: lesson_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_attachments lesson_attachments_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_attachments_modify ON public.lesson_attachments USING ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_attachments.lesson_id) AND public.can_edit_course(l.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_attachments.lesson_id) AND public.can_edit_course(l.course_id)))));


--
-- Name: lesson_attachments lesson_attachments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_attachments_select ON public.lesson_attachments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_attachments.lesson_id) AND (public.can_edit_course(l.course_id) OR ((l.published_at IS NOT NULL) AND (l.published_at <= now()) AND public.can_view_course(l.course_id)))))));


--
-- Name: lesson_comments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_comments ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_comments lesson_comments_delete; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_comments_delete ON public.lesson_comments FOR DELETE USING (((author_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_comments.lesson_id) AND public.can_edit_course(l.course_id))))));


--
-- Name: lesson_comments lesson_comments_insert; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_comments_insert ON public.lesson_comments FOR INSERT WITH CHECK (((author_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_comments.lesson_id) AND public.can_view_course(l.course_id))))));


--
-- Name: lesson_comments lesson_comments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_comments_select ON public.lesson_comments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = lesson_comments.lesson_id) AND public.can_view_course(l.course_id)))));


--
-- Name: lesson_comments lesson_comments_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_comments_update_own ON public.lesson_comments FOR UPDATE USING ((author_id = auth.uid())) WITH CHECK ((author_id = auth.uid()));


--
-- Name: lesson_favorites; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lesson_favorites ENABLE ROW LEVEL SECURITY;

--
-- Name: lesson_favorites lesson_favorites_modify_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_favorites_modify_own ON public.lesson_favorites USING ((profile_id = auth.uid())) WITH CHECK ((profile_id = auth.uid()));


--
-- Name: lesson_favorites lesson_favorites_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lesson_favorites_select_own ON public.lesson_favorites FOR SELECT USING ((profile_id = auth.uid()));


--
-- Name: lessons; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

--
-- Name: lessons lessons_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_modify ON public.lessons USING (public.can_edit_course(course_id)) WITH CHECK (public.can_edit_course(course_id));


--
-- Name: lessons lessons_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY lessons_select ON public.lessons FOR SELECT USING ((public.can_edit_course(course_id) OR ((published_at IS NOT NULL) AND (published_at <= now()) AND public.can_view_course(course_id))));


--
-- Name: notifications; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

--
-- Name: notifications notifications_select_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_select_own ON public.notifications FOR SELECT USING ((recipient_profile_id = auth.uid()));


--
-- Name: notifications notifications_update_own; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY notifications_update_own ON public.notifications FOR UPDATE USING ((recipient_profile_id = auth.uid())) WITH CHECK ((recipient_profile_id = auth.uid()));


--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles profiles_select_self_or_branch; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_select_self_or_branch ON public.profiles FOR SELECT USING (((id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM (public.branch_members sm1
     JOIN public.branch_members sm2 ON ((sm1.branch_id = sm2.branch_id)))
  WHERE ((sm1.profile_id = auth.uid()) AND (sm2.profile_id = profiles.id) AND (sm1.status = 'active'::public.member_status) AND (sm2.status = 'active'::public.member_status))))));


--
-- Name: profiles profiles_update_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY profiles_update_self ON public.profiles FOR UPDATE USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));


--
-- Name: quiz_options; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_options quiz_options_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_options_modify ON public.quiz_options USING ((EXISTS ( SELECT 1
   FROM (public.quiz_questions q
     JOIN public.assignments a ON ((a.id = q.assignment_id)))
  WHERE ((q.id = quiz_options.question_id) AND public.can_edit_course(a.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.quiz_questions q
     JOIN public.assignments a ON ((a.id = q.assignment_id)))
  WHERE ((q.id = quiz_options.question_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: quiz_options quiz_options_select_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_options_select_staff ON public.quiz_options FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.quiz_questions q
     JOIN public.assignments a ON ((a.id = q.assignment_id)))
  WHERE ((q.id = quiz_options.question_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: quiz_questions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_questions quiz_questions_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_questions_modify ON public.quiz_questions USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = quiz_questions.assignment_id) AND public.can_edit_course(a.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = quiz_questions.assignment_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: quiz_questions quiz_questions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_questions_select ON public.quiz_questions FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = quiz_questions.assignment_id) AND (public.can_edit_course(a.course_id) OR ((a.published_at IS NOT NULL) AND (a.published_at <= now()) AND public.can_view_course(a.course_id)))))));


--
-- Name: quiz_responses; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

--
-- Name: quiz_responses quiz_responses_insert_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_responses_insert_student ON public.quiz_responses FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = quiz_responses.submission_id) AND (s.student_profile_id = auth.uid())))));


--
-- Name: quiz_responses quiz_responses_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_responses_select ON public.quiz_responses FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = quiz_responses.submission_id) AND ((s.student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.assignments a
          WHERE ((a.id = s.assignment_id) AND public.can_edit_course(a.course_id)))))))));


--
-- Name: quiz_responses quiz_responses_update; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY quiz_responses_update ON public.quiz_responses FOR UPDATE USING (((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = quiz_responses.submission_id) AND (s.student_profile_id = auth.uid()) AND (s.status = 'draft'::public.submission_status)))) OR (EXISTS ( SELECT 1
   FROM (public.submissions s
     JOIN public.assignments a ON ((a.id = s.assignment_id)))
  WHERE ((s.id = quiz_responses.submission_id) AND public.can_edit_course(a.course_id)))))) WITH CHECK (((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = quiz_responses.submission_id) AND (s.student_profile_id = auth.uid())))) OR (EXISTS ( SELECT 1
   FROM (public.submissions s
     JOIN public.assignments a ON ((a.id = s.assignment_id)))
  WHERE ((s.id = quiz_responses.submission_id) AND public.can_edit_course(a.course_id))))));


--
-- Name: submission_attachments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.submission_attachments ENABLE ROW LEVEL SECURITY;

--
-- Name: submission_attachments submission_attachments_modify_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submission_attachments_modify_student ON public.submission_attachments USING ((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = submission_attachments.submission_id) AND (s.student_profile_id = auth.uid()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = submission_attachments.submission_id) AND (s.student_profile_id = auth.uid())))));


--
-- Name: submission_attachments submission_attachments_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submission_attachments_select ON public.submission_attachments FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = submission_attachments.submission_id) AND ((s.student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.assignments a
          WHERE ((a.id = s.assignment_id) AND public.can_edit_course(a.course_id)))))))));


--
-- Name: submission_criterion_scores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.submission_criterion_scores ENABLE ROW LEVEL SECURITY;

--
-- Name: submission_criterion_scores submission_criterion_scores_modify; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submission_criterion_scores_modify ON public.submission_criterion_scores USING ((EXISTS ( SELECT 1
   FROM (public.submissions s
     JOIN public.assignments a ON ((a.id = s.assignment_id)))
  WHERE ((s.id = submission_criterion_scores.submission_id) AND public.can_edit_course(a.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.submissions s
     JOIN public.assignments a ON ((a.id = s.assignment_id)))
  WHERE ((s.id = submission_criterion_scores.submission_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: submission_criterion_scores submission_criterion_scores_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submission_criterion_scores_select ON public.submission_criterion_scores FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = submission_criterion_scores.submission_id) AND ((s.student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.assignments a
          WHERE ((a.id = s.assignment_id) AND public.can_edit_course(a.course_id)))))))));


--
-- Name: submissions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: submissions submissions_insert_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submissions_insert_student ON public.submissions FOR INSERT WITH CHECK ((student_profile_id = auth.uid()));


--
-- Name: submissions submissions_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submissions_select ON public.submissions FOR SELECT USING (((student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = submissions.assignment_id) AND public.can_edit_course(a.course_id))))));


--
-- Name: submissions submissions_update_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submissions_update_staff ON public.submissions FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = submissions.assignment_id) AND public.can_edit_course(a.course_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.assignments a
  WHERE ((a.id = submissions.assignment_id) AND public.can_edit_course(a.course_id)))));


--
-- Name: submissions submissions_update_student; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY submissions_update_student ON public.submissions FOR UPDATE USING (((student_profile_id = auth.uid()) AND (status = ANY (ARRAY['draft'::public.submission_status, 'submitted'::public.submission_status])))) WITH CHECK ((student_profile_id = auth.uid()));


--
-- Name: tutor_contacts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.tutor_contacts ENABLE ROW LEVEL SECURITY;

--
-- Name: tutor_contacts tutor_contacts_modify_self; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tutor_contacts_modify_self ON public.tutor_contacts USING ((student_profile_id = auth.uid())) WITH CHECK ((student_profile_id = auth.uid()));


--
-- Name: tutor_contacts tutor_contacts_modify_staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tutor_contacts_modify_staff ON public.tutor_contacts USING ((EXISTS ( SELECT 1
   FROM public.branch_members bm
  WHERE ((bm.profile_id = tutor_contacts.student_profile_id) AND public.is_branch_staff(bm.branch_id))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM public.branch_members bm
  WHERE ((bm.profile_id = tutor_contacts.student_profile_id) AND public.is_branch_staff(bm.branch_id)))));


--
-- Name: tutor_contacts tutor_contacts_select; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY tutor_contacts_select ON public.tutor_contacts FOR SELECT USING (((student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.branch_members bm
  WHERE ((bm.profile_id = tutor_contacts.student_profile_id) AND public.is_branch_staff(bm.branch_id))))));


--
-- Name: objects avatars_delete_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_delete_own ON storage.objects FOR DELETE USING (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects avatars_insert_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_insert_own ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects avatars_read_all; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_read_all ON storage.objects FOR SELECT USING ((bucket_id = 'avatars'::text));


--
-- Name: objects avatars_update_own; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY avatars_update_own ON storage.objects FOR UPDATE USING (((bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])));


--
-- Name: objects branch_logos_delete; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY branch_logos_delete ON storage.objects FOR DELETE USING (((bucket_id = 'branch-logos'::text) AND public.has_branch_role(public.storage_first_folder_uuid(name), ARRAY['owner'::public.branch_role])));


--
-- Name: objects branch_logos_modify; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY branch_logos_modify ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'branch-logos'::text) AND public.has_branch_role(public.storage_first_folder_uuid(name), ARRAY['owner'::public.branch_role])));


--
-- Name: objects branch_logos_read_all; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY branch_logos_read_all ON storage.objects FOR SELECT USING ((bucket_id = 'branch-logos'::text));


--
-- Name: objects branch_logos_update; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY branch_logos_update ON storage.objects FOR UPDATE USING (((bucket_id = 'branch-logos'::text) AND public.has_branch_role(public.storage_first_folder_uuid(name), ARRAY['owner'::public.branch_role])));


--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: objects course_covers_delete; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY course_covers_delete ON storage.objects FOR DELETE USING (((bucket_id = 'course-covers'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = public.storage_first_folder_uuid(objects.name)) AND public.can_edit_course(c.id))))));


--
-- Name: objects course_covers_modify; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY course_covers_modify ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'course-covers'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = public.storage_first_folder_uuid(objects.name)) AND public.can_edit_course(c.id))))));


--
-- Name: objects course_covers_read_all; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY course_covers_read_all ON storage.objects FOR SELECT USING ((bucket_id = 'course-covers'::text));


--
-- Name: objects course_covers_update; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY course_covers_update ON storage.objects FOR UPDATE USING (((bucket_id = 'course-covers'::text) AND (EXISTS ( SELECT 1
   FROM public.courses c
  WHERE ((c.id = public.storage_first_folder_uuid(objects.name)) AND public.can_edit_course(c.id))))));


--
-- Name: objects lesson_materials_delete; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY lesson_materials_delete ON storage.objects FOR DELETE USING (((bucket_id = 'lesson-materials'::text) AND (EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = public.storage_first_folder_uuid(objects.name)) AND public.can_edit_course(l.course_id))))));


--
-- Name: objects lesson_materials_insert; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY lesson_materials_insert ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'lesson-materials'::text) AND (EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = public.storage_first_folder_uuid(objects.name)) AND public.can_edit_course(l.course_id))))));


--
-- Name: objects lesson_materials_select; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY lesson_materials_select ON storage.objects FOR SELECT USING (((bucket_id = 'lesson-materials'::text) AND (EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = public.storage_first_folder_uuid(objects.name)) AND (public.can_edit_course(l.course_id) OR ((l.published_at IS NOT NULL) AND (l.published_at <= now()) AND public.can_view_course(l.course_id))))))));


--
-- Name: objects lesson_materials_update; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY lesson_materials_update ON storage.objects FOR UPDATE USING (((bucket_id = 'lesson-materials'::text) AND (EXISTS ( SELECT 1
   FROM public.lessons l
  WHERE ((l.id = public.storage_first_folder_uuid(objects.name)) AND public.can_edit_course(l.course_id))))));


--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: objects submission_files_delete; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY submission_files_delete ON storage.objects FOR DELETE USING (((bucket_id = 'submission-files'::text) AND (EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = public.storage_first_folder_uuid(objects.name)) AND (s.student_profile_id = auth.uid()) AND (s.status = 'draft'::public.submission_status))))));


--
-- Name: objects submission_files_insert; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY submission_files_insert ON storage.objects FOR INSERT WITH CHECK (((bucket_id = 'submission-files'::text) AND (EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = public.storage_first_folder_uuid(objects.name)) AND (s.student_profile_id = auth.uid()) AND (s.status = ANY (ARRAY['draft'::public.submission_status, 'submitted'::public.submission_status])))))));


--
-- Name: objects submission_files_select; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY submission_files_select ON storage.objects FOR SELECT USING (((bucket_id = 'submission-files'::text) AND (EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = public.storage_first_folder_uuid(objects.name)) AND ((s.student_profile_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.assignments a
          WHERE ((a.id = s.assignment_id) AND public.can_edit_course(a.course_id))))))))));


--
-- Name: objects submission_files_update; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY submission_files_update ON storage.objects FOR UPDATE USING (((bucket_id = 'submission-files'::text) AND (EXISTS ( SELECT 1
   FROM public.submissions s
  WHERE ((s.id = public.storage_first_folder_uuid(objects.name)) AND (s.student_profile_id = auth.uid()) AND (s.status = 'draft'::public.submission_status))))));


--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict ngKfgytcIFX1mPgeB3wfZ6Edl6F51UDnX9iGPOfnH8l73OuXiJvU6bfDQQLxle1

