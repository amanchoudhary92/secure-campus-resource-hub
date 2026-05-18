# Project Impact and Presentation Guide

This project should be presented as a security-focused full-stack platform, not as a simple notes-sharing website.

## Short pitch

A secure full-stack academic resource sharing platform where students can upload, request, and download approved study material. Admins moderate uploads before public visibility, while private storage, signed URLs, duplicate detection, RLS, audit logs, and user blocking protect the platform from misuse.

## Problem solved

Students often rely on scattered WhatsApp groups, old drives, and personal networks for notes and previous-year papers. This causes duplication, low discoverability, and unsafe/unverified resource sharing.

## Solution delivered

The platform centralizes academic resources and adds a moderation-first workflow:

- students upload resources,
- backend validates and stores them privately,
- admins review and approve/reject/block,
- only approved resources become public,
- downloads use short-lived signed URLs,
- suspicious actions are logged.

## Resume bullets

- Built a full-stack academic resource platform using Next.js, TypeScript, Supabase Auth, PostgreSQL, and private Supabase Storage.
- Implemented role-based access control for students and admins with protected admin routes, admin-only APIs, and Supabase Row Level Security policies.
- Designed a secure upload moderation workflow with server-side file validation, duplicate hash detection, pending review, admin approval/rejection, and blocked-user handling.
- Replaced permanent public file URLs with short-lived signed download URLs generated through backend API permission checks.
- Added audit logs, duplicate upload dashboard, request expiry, upload/request limits, and AI-style document summarisation to improve moderation and discovery.

## Interview explanation

I built a secure campus resource sharing platform where students can upload notes, PYQs, lab files, and request missing materials. Unlike a basic upload-download app, every upload goes through server-side validation, duplicate hash detection, and an admin moderation workflow before becoming public. Files are stored in a private Supabase Storage bucket and downloads are served through short-lived signed URLs. I also implemented role-based access, RLS policies, audit logs, user block/unblock, request expiry, and duplicate upload tracking.

## GitHub topics

Use these repository topics:

```text
nextjs
typescript
supabase
postgresql
tailwindcss
full-stack
rbac
row-level-security
file-upload
audit-logs
signed-urls
admin-dashboard
```
