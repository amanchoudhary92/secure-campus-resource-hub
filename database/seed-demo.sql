-- Optional demo seed data for screenshots/testing only.
-- This file does NOT create login credentials or passwords.
-- Do NOT use personal admin accounts as public demo accounts.
-- Create temporary test users from the app or Supabase Auth dashboard first, then update the emails below if needed.
-- Recommended: do not publish demo credentials in README or GitHub.

-- Placeholder test emails. Replace locally if you want seed data attached to your own temporary test users.
--   admin@example.com
--   student1@example.com
--   student2@example.com

insert into public.profiles (id, full_name, username, email, role, branch, semester, enrollment_no, is_blocked, warning_count)
select id, 'Private Admin', 'private_admin', email, 'ADMIN', 'CSE', '5th', 'ADMIN001', false, 0
from auth.users
where email = 'admin@example.com'
on conflict (id) do update set role = 'ADMIN', full_name = excluded.full_name, username = excluded.username;

insert into public.profiles (id, full_name, username, email, role, branch, semester, enrollment_no, is_blocked, warning_count)
select id, 'Student One', 'student1', email, 'STUDENT', 'CSE', '5th', 'CSE001', false, 0
from auth.users
where email = 'student1@example.com'
on conflict (id) do update set role = 'STUDENT', full_name = excluded.full_name, username = excluded.username;

insert into public.profiles (id, full_name, username, email, role, branch, semester, enrollment_no, is_blocked, warning_count)
select id, 'Student Two', 'student2', email, 'STUDENT', 'CSE', '3rd', 'CSE002', false, 0
from auth.users
where email = 'student2@example.com'
on conflict (id) do update set role = 'STUDENT', full_name = excluded.full_name, username = excluded.username;

insert into public.resources (
  title, description, subject, branch, semester, resource_type, tags, file_name, file_type, file_size,
  file_url, storage_key, file_hash, status, moderation_reason, uploaded_by_id, uploaded_by_name, uploaded_by_email,
  summary, keywords, summary_status, summary_generated_at
)
values
  (
    'Demo Approved DBMS Notes',
    'Sample approved academic resource for README screenshots.',
    'DBMS', 'CSE', '5th', 'Notes', array['DBMS','SQL'], 'demo-approved-dbms.pdf', 'pdf', 123456,
    null, null, 'demo-hash-approved-001', 'APPROVED', 'Seed approved demo resource.',
    (select id from public.profiles where email='student1@example.com'), 'Student One', 'student1@example.com',
    'This demo DBMS resource covers relational databases, SQL basics, normalization, and transaction concepts.', array['DBMS','SQL','Normalization'], 'GENERATED', now()
  ),
  (
    'Demo Pending CN Lab File',
    'Sample pending resource waiting for admin review.',
    'Computer Networks', 'CSE', '5th', 'Lab File', array['CN','Lab'], 'demo-pending-cn.pdf', 'pdf', 234567,
    null, null, 'demo-hash-pending-001', 'PENDING_REVIEW', 'Waiting for admin review.',
    (select id from public.profiles where email='student2@example.com'), 'Student Two', 'student2@example.com',
    'This lab file appears to contain networking practicals and routing exercises.', array['CN','Routing'], 'GENERATED', now()
  ),
  (
    'Demo Rejected Low Quality Notes',
    'Sample rejected resource for moderation screenshots.',
    'Operating Systems', 'CSE', '4th', 'Notes', array['OS'], 'demo-rejected-os.pdf', 'pdf', 345678,
    null, null, 'demo-hash-rejected-001', 'REJECTED', 'Low quality / incomplete academic content.',
    (select id from public.profiles where email='student1@example.com'), 'Student One', 'student1@example.com',
    'Rejected demo resource.', array['OS'], 'PARTIAL', now()
  )
on conflict do nothing;

insert into public.audit_logs (action, reason, actor_email, metadata, metadata_search)
values
  ('RESOURCE_APPROVED', 'Seed demo approval log.', 'admin@example.com', '{"demo":true}'::jsonb, '{"demo":true}'),
  ('RESOURCE_REJECTED', 'Seed demo rejection log.', 'admin@example.com', '{"demo":true}'::jsonb, '{"demo":true}'),
  ('DOWNLOAD_CREATED', 'Seed demo download log.', 'student1@example.com', '{"demo":true}'::jsonb, '{"demo":true}')
on conflict do nothing;
