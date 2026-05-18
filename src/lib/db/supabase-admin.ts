import { createClient } from "@supabase/supabase-js";

export type ResourceStatus = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "BLOCKED";

export type ResourceRow = {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: string;
  resource_type: string;
  tags: string[];
  file_name: string;
  file_type: string;
  file_size: number;
  file_url: string | null;
  storage_key: string | null;
  file_hash: string | null;
  status: ResourceStatus;
  moderation_reason: string;
  uploaded_by_id: string | null;
  uploaded_by_name: string;
  uploaded_by_email: string | null;
  reviewed_by_id: string | null;
  reviewed_at: string | null;
  summary: string | null;
  keywords: string[];
  extracted_text: string | null;
  summary_status: "GENERATED" | "PARTIAL" | "NO_TEXT" | "FAILED" | "PENDING";
  summary_generated_at: string | null;
  created_at: string;
};

type NewResource = Omit<ResourceRow, "id" | "created_at" | "reviewed_by_id" | "reviewed_at" | "summary" | "keywords" | "extracted_text" | "summary_status" | "summary_generated_at"> & {
  reviewed_by_id?: string | null;
  reviewed_at?: string | null;
  summary?: string | null;
  keywords?: string[];
  extracted_text?: string | null;
  summary_status?: ResourceRow["summary_status"];
  summary_generated_at?: string | null;
};

const demoResources: ResourceRow[] = [
  {
    id: "demo-1",
    title: "Database Management Systems Notes",
    description: "Complete DBMS notes covering ER model, SQL, normalization, and transactions.",
    subject: "DBMS",
    branch: "CSE",
    semester: "5th",
    resource_type: "Notes",
    tags: ["DBMS", "SQL", "Normalization"],
    file_name: "dbms-notes.pdf",
    file_type: "pdf",
    file_size: 2400000,
    file_url: null,
    storage_key: null,
    file_hash: null,
    status: "APPROVED",
    moderation_reason: "Demo safe academic resource.",
    uploaded_by_id: null,
    uploaded_by_name: "Anjali Sharma",
    uploaded_by_email: null,
    reviewed_by_id: null,
    reviewed_at: null,
    summary: "This demo resource explains DBMS fundamentals including ER models, SQL, normalization, transactions, and database design concepts.",
    keywords: ["DBMS", "SQL", "Normalization"],
    extracted_text: null,
    summary_status: "GENERATED",
    summary_generated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
];

declare global {
  // eslint-disable-next-line no-var
  var __campusResources: ResourceRow[] | undefined;
}

function getMemoryStore(): ResourceRow[] {
  if (!globalThis.__campusResources) {
    globalThis.__campusResources = [...demoResources];
  }

  return globalThis.__campusResources;
}

export function hasSupabaseConfig() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdmin() {
  if (!hasSupabaseConfig()) return null;

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listResources(): Promise<ResourceRow[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return getMemoryStore().filter((resource) => resource.status === "APPROVED");
  }

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("status", "APPROVED")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ResourceRow[];
}

export async function listAllResourcesForAdmin(): Promise<ResourceRow[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) return getMemoryStore();

  const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as ResourceRow[];
}

export async function listResourcesByUploader(userId: string): Promise<ResourceRow[]> {
  const supabase = getSupabaseAdmin();

  if (!supabase) return getMemoryStore().filter((resource) => resource.uploaded_by_id === userId);

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("uploaded_by_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ResourceRow[];
}

export async function getResourceById(id: string): Promise<ResourceRow | null> {
  const supabase = getSupabaseAdmin();

  if (!supabase) return getMemoryStore().find((resource) => resource.id === id) || null;

  const { data, error } = await supabase.from("resources").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return (data || null) as ResourceRow | null;
}

export async function findResourceByHash(fileHash: string): Promise<ResourceRow | null> {
  const supabase = getSupabaseAdmin();

  if (!fileHash) return null;

  if (!supabase) {
    return (
      getMemoryStore().find(
        (resource) => resource.file_hash === fileHash && resource.status !== "REJECTED" && resource.status !== "BLOCKED",
      ) || null
    );
  }

  const { data, error } = await supabase
    .from("resources")
    .select("*")
    .eq("file_hash", fileHash)
    .in("status", ["PENDING_REVIEW", "APPROVED"])
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data || null) as ResourceRow | null;
}

export const findApprovedResourceByHash = findResourceByHash;

export async function createResource(resource: NewResource): Promise<ResourceRow> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const created: ResourceRow = {
      ...resource,
      id: `local-${Date.now()}`,
      reviewed_by_id: resource.reviewed_by_id ?? null,
      reviewed_at: resource.reviewed_at ?? null,
      summary: resource.summary ?? null,
      keywords: resource.keywords ?? [],
      extracted_text: resource.extracted_text ?? null,
      summary_status: resource.summary_status ?? "PENDING",
      summary_generated_at: resource.summary_generated_at ?? null,
      created_at: new Date().toISOString(),
    };
    getMemoryStore().unshift(created);
    return created;
  }

  const { data, error } = await supabase.from("resources").insert(resource).select("*").single();
  if (error) throw new Error(error.message);
  return data as ResourceRow;
}

export async function updateResourceStatus(input: {
  id: string;
  status: ResourceStatus;
  reason: string;
  reviewedById: string;
}): Promise<ResourceRow> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const resource = getMemoryStore().find((item) => item.id === input.id);
    if (!resource) throw new Error("Resource not found.");
    resource.status = input.status;
    resource.moderation_reason = input.reason;
    resource.reviewed_by_id = input.reviewedById;
    resource.reviewed_at = new Date().toISOString();
    return resource;
  }

  const { data, error } = await supabase
    .from("resources")
    .update({
      status: input.status,
      moderation_reason: input.reason,
      reviewed_by_id: input.reviewedById,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ResourceRow;
}


export async function deleteResourceRecord(id: string): Promise<ResourceRow> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const store = getMemoryStore();
    const index = store.findIndex((item) => item.id === id);
    if (index === -1) throw new Error("Resource not found.");
    const [deleted] = store.splice(index, 1);
    return deleted;
  }

  const { data, error } = await supabase
    .from("resources")
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as ResourceRow;
}

export type AuditLogRow = {
  id: string;
  action: string;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  actor_id: string | null;
  actor_email: string | null;
  resource_id: string | null;
  request_id: string | null;
  target_user_id: string | null;
  metadata: Record<string, unknown>;
  metadata_search: string | null;
  created_at: string;
};

export async function createAuditLog(input: {
  action: string;
  reason?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
  userAgent?: string | null;
  actorId?: string | null;
  actorEmail?: string | null;
  resourceId?: string | null;
  requestId?: string | null;
  targetUserId?: string | null;
}) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("audit_logs")
    .insert({
      action: input.action,
      reason: input.reason || null,
      ip_address: input.ipAddress || null,
      user_agent: input.userAgent || null,
      actor_id: input.actorId || null,
      actor_email: input.actorEmail || null,
      resource_id: input.resourceId || null,
      request_id: input.requestId || null,
      target_user_id: input.targetUserId || null,
      metadata: input.metadata || {},
      metadata_search: JSON.stringify(input.metadata || {}),
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as AuditLogRow;
}


function startOfTodayIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

export async function countUserUploadsToday(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const start = new Date(startOfTodayIso()).getTime();
    return getMemoryStore().filter((resource) => resource.uploaded_by_id === userId && new Date(resource.created_at).getTime() >= start).length;
  }

  const { count, error } = await supabase
    .from("resources")
    .select("id", { count: "exact", head: true })
    .eq("uploaded_by_id", userId)
    .gte("created_at", startOfTodayIso());

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function countUserRequestsToday(userId: string): Promise<number> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    const start = new Date(startOfTodayIso()).getTime();
    return getRequestMemoryStore().filter((request) => request.requested_by_id === userId && new Date(request.created_at).getTime() >= start).length;
  }

  const { count, error } = await supabase
    .from("resource_requests")
    .select("id", { count: "exact", head: true })
    .eq("requested_by_id", userId)
    .gte("created_at", startOfTodayIso());

  if (error) throw new Error(error.message);
  return count || 0;
}

export async function incrementUserWarning(userId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("warning_count")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const nextWarningCount = Number(profile?.warning_count || 0) + 1;
  const { error } = await supabase.from("profiles").update({ warning_count: nextWarningCount }).eq("id", userId);
  if (error) throw new Error(error.message);
}

export async function blockUserById(input: { userId: string; reason: string }): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("role, warning_count")
    .eq("id", input.userId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!profile) throw new Error("User profile not found.");
  if (profile.role === "ADMIN") throw new Error("Admin users cannot be blocked from this action.");

  const { error } = await supabase
    .from("profiles")
    .update({ is_blocked: true, warning_count: Number(profile.warning_count || 0) + 1 })
    .eq("id", input.userId);

  if (error) throw new Error(error.message);
}



export type AdminProfileRow = {
  id: string;
  full_name: string;
  username: string | null;
  email: string;
  role: "STUDENT" | "ADMIN";
  branch: string | null;
  semester: string | null;
  enrollment_no: string | null;
  avatar_url: string | null;
  is_blocked: boolean;
  warning_count: number;
  created_at: string;
};

export async function listProfilesForAdmin(): Promise<AdminProfileRow[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("role", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as AdminProfileRow[];
}
export async function unblockUserById(input: { userId: string; resetWarnings?: boolean }): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("role, warning_count")
    .eq("id", input.userId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!profile) throw new Error("User profile not found.");

  const update: { is_blocked: boolean; warning_count?: number } = { is_blocked: false };
  if (input.resetWarnings !== false) update.warning_count = 0;

  const { error } = await supabase.from("profiles").update(update).eq("id", input.userId);
  if (error) throw new Error(error.message);
}


export type PlatformStats = {
  registeredUsers: number;
  studentUsers: number;
  adminUsers: number;
  totalResources: number;
  approvedResources: number;
  pendingResources: number;
  rejectedOrBlockedResources: number;
};

async function countRows(table: string, filter?: { column: string; value: string }) {
  const supabase = getSupabaseAdmin();
  if (!supabase) return 0;

  let query = supabase.from(table).select("id", { count: "exact", head: true });
  if (filter) query = query.eq(filter.column, filter.value);

  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const resources = getMemoryStore();
    return {
      registeredUsers: 0,
      studentUsers: 0,
      adminUsers: 0,
      totalResources: resources.length,
      approvedResources: resources.filter((r) => r.status === "APPROVED").length,
      pendingResources: resources.filter((r) => r.status === "PENDING_REVIEW").length,
      rejectedOrBlockedResources: resources.filter((r) => r.status === "REJECTED" || r.status === "BLOCKED").length,
    };
  }

  const [
    registeredUsers,
    studentUsers,
    adminUsers,
    totalResources,
    approvedResources,
    pendingResources,
    rejectedResources,
    blockedResources,
  ] = await Promise.all([
    countRows("profiles"),
    countRows("profiles", { column: "role", value: "STUDENT" }),
    countRows("profiles", { column: "role", value: "ADMIN" }),
    countRows("resources"),
    countRows("resources", { column: "status", value: "APPROVED" }),
    countRows("resources", { column: "status", value: "PENDING_REVIEW" }),
    countRows("resources", { column: "status", value: "REJECTED" }),
    countRows("resources", { column: "status", value: "BLOCKED" }),
  ]);

  return {
    registeredUsers,
    studentUsers,
    adminUsers,
    totalResources,
    approvedResources,
    pendingResources,
    rejectedOrBlockedResources: rejectedResources + blockedResources,
  };
}


export type DuplicateFileGroup = {
  file_hash: string;
  upload_count: number;
  resources: ResourceRow[];
};

export async function listDuplicateFileGroups(input?: {
  status?: string;
  uploaderEmail?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<DuplicateFileGroup[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return [];

  let query = supabase
    .from("resources")
    .select("*")
    .not("file_hash", "is", null)
    .order("created_at", { ascending: false });

  if (input?.status && input.status !== "ALL") query = query.eq("status", input.status);
  if (input?.uploaderEmail) query = query.ilike("uploaded_by_email", `%${input.uploaderEmail}%`);
  if (input?.dateFrom) query = query.gte("created_at", input.dateFrom);
  if (input?.dateTo) query = query.lte("created_at", input.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const groups = new Map<string, ResourceRow[]>();
  for (const row of (data || []) as ResourceRow[]) {
    if (!row.file_hash) continue;
    const current = groups.get(row.file_hash) || [];
    current.push(row);
    groups.set(row.file_hash, current);
  }

  return [...groups.entries()]
    .filter(([, resources]) => resources.length > 1)
    .map(([file_hash, resources]) => ({ file_hash, upload_count: resources.length, resources }))
    .sort((a, b) => b.upload_count - a.upload_count);
}

export async function listAuditLogsForAdmin(input?: {
  action?: string;
  query?: string;
  actorEmail?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ logs: AuditLogRow[]; count: number; page: number; pageSize: number }> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return { logs: [], count: 0, page: 1, pageSize: 25 };

  const page = Math.max(1, input?.page || 1);
  const pageSize = Math.min(100, Math.max(5, input?.pageSize || 25));
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });

  if (input?.action && input.action !== "ALL") query = query.eq("action", input.action);
  if (input?.actorEmail) query = query.ilike("actor_email", `%${input.actorEmail}%`);
  if (input?.resourceId) query = query.eq("resource_id", input.resourceId);
  if (input?.dateFrom) query = query.gte("created_at", input.dateFrom);
  if (input?.dateTo) query = query.lte("created_at", input.dateTo);

  if (input?.query) {
    const q = input.query.replace(/[%_,]/g, "").trim();
    if (q) {
      query = query.or(`reason.ilike.%${q}%,action.ilike.%${q}%,actor_email.ilike.%${q}%,metadata_search.ilike.%${q}%`);
    }
  }

  const { data, error, count } = await query.range(from, to);
  if (error) throw new Error(error.message);

  return { logs: (data || []) as AuditLogRow[], count: count || 0, page, pageSize };
}

export async function testDatabaseConnection() {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    return {
      ok: true,
      mode: "demo-memory",
      message: "Supabase env is missing, so the app is running in local demo memory mode.",
    };
  }

  const { error } = await supabase.from("resources").select("id").limit(1);

  if (error) return { ok: false, mode: "supabase", message: error.message };

  return { ok: true, mode: "supabase", message: "Supabase database connected successfully." };
}

export type ResourceRequestStatus = "OPEN" | "FULFILLED" | "CLOSED" | "EXPIRED";

export type ResourceRequestRow = {
  id: string;
  title: string;
  description: string;
  subject: string;
  branch: string;
  semester: string;
  resource_type: string;
  status: ResourceRequestStatus;
  requested_by_id: string | null;
  requested_by_name: string;
  requested_by_email: string | null;
  fulfilled_by_resource_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
};

type NewResourceRequest = Omit<ResourceRequestRow, "id" | "created_at" | "updated_at" | "fulfilled_by_resource_id" | "status" | "expires_at"> & {
  status?: ResourceRequestStatus;
  fulfilled_by_resource_id?: string | null;
  expires_at?: string | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __campusResourceRequests: ResourceRequestRow[] | undefined;
}

function getRequestMemoryStore(): ResourceRequestRow[] {
  if (!globalThis.__campusResourceRequests) {
    globalThis.__campusResourceRequests = [];
  }

  return globalThis.__campusResourceRequests;
}

export async function cleanupExpiredResourceRequests() {
  const supabase = getSupabaseAdmin();
  const nowIso = new Date().toISOString();

  if (!supabase) {
    const store = getRequestMemoryStore();
    const active = store.filter((item) => {
      const expiry = item.expires_at ? new Date(item.expires_at).getTime() : new Date(item.created_at).getTime() + 7 * 24 * 60 * 60 * 1000;
      return expiry > Date.now();
    });
    globalThis.__campusResourceRequests = active;
    return;
  }

  const { error } = await supabase
    .from("resource_requests")
    .delete()
    .or(`expires_at.lte.${nowIso},and(expires_at.is.null,created_at.lte.${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()})`);

  if (error) {
    // Do not block the page if cleanup fails; listing still filters expired rows below.
    console.error("Expired request cleanup failed:", error.message);
  }
}

export async function listResourceRequests(): Promise<ResourceRequestRow[]> {
  const supabase = getSupabaseAdmin();

  await cleanupExpiredResourceRequests();

  if (!supabase) {
    return getRequestMemoryStore()
      .filter((item) => {
        const expiry = item.expires_at ? new Date(item.expires_at).getTime() : new Date(item.created_at).getTime() + 7 * 24 * 60 * 60 * 1000;
        return expiry > Date.now();
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from("resource_requests")
    .select("*")
    .or(`expires_at.gt.${nowIso},expires_at.is.null`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data || []) as ResourceRequestRow[];
}

export async function createResourceRequest(request: NewResourceRequest): Promise<ResourceRequestRow> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const created: ResourceRequestRow = {
      ...request,
      id: `request-${Date.now()}`,
      status: request.status || "OPEN",
      fulfilled_by_resource_id: request.fulfilled_by_resource_id ?? null,
      expires_at: request.expires_at ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    getRequestMemoryStore().unshift(created);
    return created;
  }

  const { data, error } = await supabase.from("resource_requests").insert(request).select("*").single();
  if (error) throw new Error(error.message);
  return data as ResourceRequestRow;
}

export async function deleteResourceRequest(input: { id: string; userId: string; isAdmin: boolean }): Promise<ResourceRequestRow> {
  const supabase = getSupabaseAdmin();

  if (!supabase) {
    const store = getRequestMemoryStore();
    const index = store.findIndex((item) => item.id === input.id);
    if (index === -1) throw new Error("Request not found.");
    const request = store[index];
    if (!input.isAdmin && request.requested_by_id !== input.userId) {
      throw new Error("You can delete only your own request.");
    }
    store.splice(index, 1);
    return request;
  }

  const { data: request, error: fetchError } = await supabase
    .from("resource_requests")
    .select("*")
    .eq("id", input.id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!request) throw new Error("Request not found.");

  if (!input.isAdmin && request.requested_by_id !== input.userId) {
    throw new Error("You can delete only your own request.");
  }

  const { error } = await supabase.from("resource_requests").delete().eq("id", input.id);
  if (error) throw new Error(error.message);
  return request as ResourceRequestRow;
}
