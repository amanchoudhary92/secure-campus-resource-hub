-- Campus Resource Hub RLS policies
-- Run this after database/schema.sql and database/stage10-security-upgrades.sql.
-- Safe to run multiple times. Does not drop tables or delete existing data.

create or replace function public.is_admin(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = user_id
      and p.role = 'ADMIN'
  );
$$;

create or replace function public.is_not_blocked(user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select not p.is_blocked
    from public.profiles p
    where p.id = user_id
  ), false);
$$;

create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Service-role/server-side API calls and SQL Editor maintenance should not be blocked by this trigger.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_admin(auth.uid()) then
    return new;
  end if;

  if new.id is distinct from old.id
    or new.email is distinct from old.email
    or new.role is distinct from old.role
    or new.is_blocked is distinct from old.is_blocked
    or new.warning_count is distinct from old.warning_count
    or new.created_at is distinct from old.created_at then
    raise exception 'Students cannot update protected profile fields.';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_prevent_privilege_escalation on public.profiles;
create trigger profiles_prevent_privilege_escalation
before update on public.profiles
for each row
execute function public.prevent_profile_privilege_escalation();

alter table public.profiles enable row level security;
alter table public.resources enable row level security;
alter table public.resource_requests enable row level security;
alter table public.audit_logs enable row level security;
alter table storage.objects enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.resources to authenticated;
grant select, insert, update, delete on public.resource_requests to authenticated;
grant select, insert on public.audit_logs to authenticated;
revoke all on public.profiles from anon;
revoke all on public.resources from anon;
revoke all on public.resource_requests from anon;
revoke all on public.audit_logs from anon;

-- PROFILES
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "profiles_insert_own_student" ON public.profiles;
CREATE POLICY "profiles_insert_own_student"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid() AND role = 'STUDENT' AND is_blocked = false AND warning_count = 0);

DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_update_own_or_admin"
ON public.profiles
FOR UPDATE
TO authenticated
USING (id = auth.uid() OR public.is_admin(auth.uid()))
WITH CHECK (id = auth.uid() OR public.is_admin(auth.uid()));

-- RESOURCES
DROP POLICY IF EXISTS "resources_select_approved_own_or_admin" ON public.resources;
CREATE POLICY "resources_select_approved_own_or_admin"
ON public.resources
FOR SELECT
TO authenticated
USING (status = 'APPROVED' OR uploaded_by_id = auth.uid() OR public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "resources_insert_own_nonblocked" ON public.resources;
CREATE POLICY "resources_insert_own_nonblocked"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (uploaded_by_id = auth.uid() AND public.is_not_blocked(auth.uid()));

DROP POLICY IF EXISTS "resources_update_admin_only" ON public.resources;
CREATE POLICY "resources_update_admin_only"
ON public.resources
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "resources_delete_owner_safe_status_or_admin" ON public.resources;
CREATE POLICY "resources_delete_owner_safe_status_or_admin"
ON public.resources
FOR DELETE
TO authenticated
USING (
  public.is_admin(auth.uid())
  OR (
    uploaded_by_id = auth.uid()
    AND status IN ('PENDING_REVIEW', 'REJECTED', 'BLOCKED')
  )
);

-- RESOURCE REQUESTS
DROP POLICY IF EXISTS "requests_select_logged_in" ON public.resource_requests;
CREATE POLICY "requests_select_logged_in"
ON public.resource_requests
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "requests_insert_own_nonblocked" ON public.resource_requests;
CREATE POLICY "requests_insert_own_nonblocked"
ON public.resource_requests
FOR INSERT
TO authenticated
WITH CHECK (requested_by_id = auth.uid() AND public.is_not_blocked(auth.uid()));

DROP POLICY IF EXISTS "requests_update_admin_only" ON public.resource_requests;
CREATE POLICY "requests_update_admin_only"
ON public.resource_requests
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "requests_delete_own_or_admin" ON public.resource_requests;
CREATE POLICY "requests_delete_own_or_admin"
ON public.resource_requests
FOR DELETE
TO authenticated
USING (requested_by_id = auth.uid() OR public.is_admin(auth.uid()));

-- AUDIT LOGS
DROP POLICY IF EXISTS "audit_logs_select_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin_only"
ON public.audit_logs
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "audit_logs_insert_admin_only" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_admin_only"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- STORAGE: private resource-files bucket. Direct object access is intentionally blocked.
-- The app serves downloads through server-side signed URL APIs only.
UPDATE storage.buckets SET public = false WHERE id = 'resource-files';

DROP POLICY IF EXISTS "resource_files_no_direct_select" ON storage.objects;
CREATE POLICY "resource_files_no_direct_select"
ON storage.objects
FOR SELECT
TO authenticated
USING (false);

DROP POLICY IF EXISTS "resource_files_no_direct_insert" ON storage.objects;
CREATE POLICY "resource_files_no_direct_insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "resource_files_no_direct_update" ON storage.objects;
CREATE POLICY "resource_files_no_direct_update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "resource_files_no_direct_delete" ON storage.objects;
CREATE POLICY "resource_files_no_direct_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (false);
