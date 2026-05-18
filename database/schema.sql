-- Campus Resource Hub - Auth + Admin Review + AI Summary Schema
-- Run this in Supabase SQL Editor. Safe to run multiple times.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique,
  email text not null unique,
  role text not null check (role in ('STUDENT', 'ADMIN')) default 'STUDENT',
  branch text,
  semester text,
  enrollment_no text,
  avatar_url text,
  is_blocked boolean not null default false,
  warning_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  subject text not null,
  branch text not null,
  semester text not null,
  resource_type text not null,
  tags text[] default '{}',
  file_name text not null,
  file_type text not null,
  file_size bigint not null,
  file_url text,
  storage_key text,
  file_hash text,
  status text not null default 'PENDING_REVIEW',
  moderation_reason text not null default 'Pending admin review',
  uploaded_by_id uuid references public.profiles(id) on delete set null,
  uploaded_by_name text not null default 'Local Student',
  uploaded_by_email text,
  reviewed_by_id uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  summary text,
  keywords text[] default '{}',
  extracted_text text,
  summary_status text not null default 'PENDING',
  summary_generated_at timestamptz,
  created_at timestamptz not null default now()
);

-- Idempotent upgrades for older project versions.
alter table public.resources add column if not exists file_url text;
alter table public.resources add column if not exists storage_key text;
alter table public.resources add column if not exists file_hash text;
alter table public.resources add column if not exists tags text[] default '{}';
alter table public.resources add column if not exists moderation_reason text not null default 'Pending admin review';
alter table public.resources add column if not exists uploaded_by_id uuid references public.profiles(id) on delete set null;
alter table public.resources add column if not exists uploaded_by_name text not null default 'Local Student';
alter table public.resources add column if not exists uploaded_by_email text;
alter table public.resources add column if not exists reviewed_by_id uuid references public.profiles(id) on delete set null;
alter table public.resources add column if not exists reviewed_at timestamptz;
alter table public.resources add column if not exists summary text;
alter table public.resources add column if not exists keywords text[] default '{}';
alter table public.resources add column if not exists extracted_text text;
alter table public.resources add column if not exists summary_status text not null default 'PENDING';
alter table public.resources add column if not exists summary_generated_at timestamptz;

alter table public.resources drop constraint if exists resources_status_check;
alter table public.resources add constraint resources_status_check
  check (status in ('PENDING_REVIEW', 'APPROVED', 'REJECTED', 'BLOCKED'));
alter table public.resources alter column status set default 'PENDING_REVIEW';

alter table public.resources drop constraint if exists resources_summary_status_check;
alter table public.resources add constraint resources_summary_status_check
  check (summary_status in ('PENDING', 'GENERATED', 'PARTIAL', 'NO_TEXT', 'FAILED'));

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists resources_status_idx on public.resources(status);
create index if not exists resources_created_at_idx on public.resources(created_at desc);
create index if not exists resources_subject_idx on public.resources(subject);
create index if not exists resources_uploaded_by_idx on public.resources(uploaded_by_id);
create index if not exists resources_file_hash_idx on public.resources(file_hash);

-- Prevent duplicate active/pending files. Rejected/blocked files do not count.
create unique index if not exists resources_file_hash_unique_active_idx
  on public.resources(file_hash)
  where file_hash is not null and status in ('PENDING_REVIEW', 'APPROVED');

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  reason text,
  ip_address text,
  user_agent text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Server-side service_role API is used by this starter app.
-- Public registration creates STUDENT profiles. Fixed admin emails are promoted by code via ADMIN_EMAILS.

-- Stage 8: keep resources table in sync if a file is manually deleted from Supabase Storage.
-- If you delete an object from Storage bucket resource-files, the matching public.resources row is removed automatically.
create or replace function public.delete_resource_when_storage_file_deleted()
returns trigger
language plpgsql
security definer
as $$
begin
  if old.bucket_id = 'resource-files' then
    delete from public.resources
    where storage_key = old.name;
  end if;

  return old;
end;
$$;

drop trigger if exists on_storage_file_deleted_cleanup_resource
on storage.objects;

create trigger on_storage_file_deleted_cleanup_resource
after delete on storage.objects
for each row
execute function public.delete_resource_when_storage_file_deleted();


-- Stage 8.7: Resource request board
-- Students can request missing resources after login. Requests are visible to all users.
create table if not exists public.resource_requests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  subject text not null,
  branch text not null,
  semester text not null,
  resource_type text not null default 'Notes',
  status text not null default 'OPEN',
  requested_by_id uuid references public.profiles(id) on delete set null,
  requested_by_name text not null default 'Student',
  requested_by_email text,
  fulfilled_by_resource_id uuid references public.resources(id) on delete set null,
  expires_at timestamptz not null default (now() + interval '7 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resource_requests add column if not exists title text;
alter table public.resource_requests add column if not exists description text;
alter table public.resource_requests add column if not exists subject text;
alter table public.resource_requests add column if not exists branch text;
alter table public.resource_requests add column if not exists semester text;
alter table public.resource_requests add column if not exists resource_type text not null default 'Notes';
alter table public.resource_requests add column if not exists status text not null default 'OPEN';
alter table public.resource_requests add column if not exists requested_by_id uuid references public.profiles(id) on delete set null;
alter table public.resource_requests add column if not exists requested_by_name text not null default 'Student';
alter table public.resource_requests add column if not exists requested_by_email text;
alter table public.resource_requests add column if not exists fulfilled_by_resource_id uuid references public.resources(id) on delete set null;
alter table public.resource_requests add column if not exists expires_at timestamptz not null default (now() + interval '7 days');
alter table public.resource_requests add column if not exists created_at timestamptz not null default now();
alter table public.resource_requests add column if not exists updated_at timestamptz not null default now();

alter table public.resource_requests drop constraint if exists resource_requests_status_check;
alter table public.resource_requests add constraint resource_requests_status_check
  check (status in ('OPEN', 'FULFILLED', 'CLOSED', 'EXPIRED'));

create index if not exists resource_requests_status_idx on public.resource_requests(status);
create index if not exists resource_requests_created_at_idx on public.resource_requests(created_at desc);
create index if not exists resource_requests_expires_at_idx on public.resource_requests(expires_at);
create index if not exists resource_requests_requested_by_idx on public.resource_requests(requested_by_id);
create index if not exists resource_requests_subject_idx on public.resource_requests(subject);


-- Stage 8.8: Keep request board clean automatically.
-- Any request older than 7 days is removed when schema is run or when the app performs cleanup.
update public.resource_requests
set expires_at = created_at + interval '7 days'
where expires_at is null;

delete from public.resource_requests
where coalesce(expires_at, created_at + interval '7 days') <= now();

-- Stage 9: Security polish indexes and notes
-- Upload/request limits are enforced in API code using created_at counts.
-- Blocked users can login and view approved resources, but upload/request APIs reject them.
create index if not exists profiles_is_blocked_idx on public.profiles(is_blocked);
create index if not exists resources_uploader_created_at_idx on public.resources(uploaded_by_id, created_at desc);
create index if not exists requests_user_created_at_idx on public.resource_requests(requested_by_id, created_at desc);

-- Stage 9.1: User unblock support
-- No new columns are required. Admin UI/API toggles profiles.is_blocked and resets profiles.warning_count.
-- USER_UNBLOCKED actions are stored in audit_logs.

-- Stage 10: security/audit compatibility columns for admin audit dashboard.
alter table public.audit_logs add column if not exists actor_id uuid;
alter table public.audit_logs add column if not exists actor_email text;
alter table public.audit_logs add column if not exists resource_id uuid;
alter table public.audit_logs add column if not exists request_id uuid;
alter table public.audit_logs add column if not exists target_user_id uuid;
alter table public.audit_logs add column if not exists metadata_search text;

update public.audit_logs
set metadata_search = coalesce(metadata_search, metadata::text)
where metadata_search is null;

create index if not exists audit_logs_action_idx on public.audit_logs(action);
create index if not exists audit_logs_actor_email_idx on public.audit_logs(actor_email);
create index if not exists audit_logs_resource_id_idx on public.audit_logs(resource_id);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
