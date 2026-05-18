-- Stage 10 security upgrades
-- Safe to run multiple times. Does not drop tables or delete data.

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
create index if not exists audit_logs_metadata_search_idx on public.audit_logs using gin (to_tsvector('simple', coalesce(metadata_search, '')));

-- Make the existing resource-files bucket private. Downloads must go through signed URL APIs.
update storage.buckets
set public = false
where id = 'resource-files';
