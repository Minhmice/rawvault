import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SEED_VERSION = "slice2-qa-v1";
const DEFAULT_USER_EMAIL = "qa+slice2@rawvault.local";
const DEFAULT_USER_PASSWORD = "RawVault123!";
const PROD_HOST_BLOCKLIST = new Set(["app.rawvault.com", "rawvault.com"]);

const LINKED_ACCOUNT_TEMPLATES = [
  {
    key: "gdrive-primary",
    provider: "gdrive",
    provider_account_id: "qa-gdrive-primary",
    account_email: "qa.slice2+gdrive@rawvault.local",
    quota_total_bytes: 53687091200,
    quota_used_bytes: 12884901888,
    is_active: true,
    health_status: "healthy",
    last_synced_at: "2026-03-10T08:45:00Z",
  },
  {
    key: "onedrive-archive",
    provider: "onedrive",
    provider_account_id: "qa-onedrive-archive",
    account_email: "qa.slice2+onedrive@rawvault.local",
    quota_total_bytes: 21474836480,
    quota_used_bytes: 2143289344,
    is_active: false,
    health_status: "degraded",
    last_synced_at: "2026-03-09T22:10:00Z",
  },
];

const FOLDER_TEMPLATES = [
  {
    key: "root-projects",
    parent_key: null,
    name: "Projects",
    path: "/Projects",
    is_favorite: true,
    is_pinned: true,
    created_at: "2026-03-01T08:00:00Z",
  },
  {
    key: "projects-client-a",
    parent_key: "root-projects",
    name: "Client A",
    path: "/Projects/Client A",
    is_favorite: false,
    is_pinned: false,
    created_at: "2026-03-02T10:30:00Z",
  },
  {
    key: "root-references",
    parent_key: null,
    name: "References",
    path: "/References",
    is_favorite: false,
    is_pinned: true,
    created_at: "2026-03-03T06:15:00Z",
  },
];

const FILE_TEMPLATES = [
  {
    key: "brief-ready",
    folder_key: "projects-client-a",
    account_key: "gdrive-primary",
    name: "brief-v2.pdf",
    ext: "pdf",
    mime: "application/pdf",
    size_bytes: 2412096,
    storage_provider: "gdrive",
    provider_file_id_original: "gd_qa_brief_v2_original",
    provider_file_id_thumb: "gd_qa_brief_v2_thumb",
    provider_file_id_preview: "gd_qa_brief_v2_preview",
    preview_status: "ready",
    sync_status: "synced",
    error_code: null,
    metadata: { pages: 12, source: "drive", owner: "qa" },
    is_favorite: true,
    is_pinned: true,
    created_at: "2026-03-05T08:42:00Z",
  },
  {
    key: "deck-processing",
    folder_key: "projects-client-a",
    account_key: "onedrive-archive",
    name: "pitch-deck.pptx",
    ext: "pptx",
    mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size_bytes: 7340032,
    storage_provider: "onedrive",
    provider_file_id_original: "od_qa_pitch_deck_original",
    provider_file_id_thumb: null,
    provider_file_id_preview: null,
    preview_status: "processing",
    sync_status: "syncing",
    error_code: null,
    metadata: { slides: 28, source: "onedrive", owner: "qa" },
    is_favorite: false,
    is_pinned: false,
    created_at: "2026-03-06T11:05:00Z",
  },
  {
    key: "frame-failed",
    folder_key: "root-references",
    account_key: "gdrive-primary",
    name: "frame-0034.cr3",
    ext: "cr3",
    mime: "image/x-canon-cr3",
    size_bytes: 41943040,
    storage_provider: "gdrive",
    provider_file_id_original: "gd_qa_frame_0034_original",
    provider_file_id_thumb: null,
    provider_file_id_preview: null,
    preview_status: "failed",
    sync_status: "failed",
    error_code: "preview_generation_timeout",
    metadata: { width: 6000, height: 4000, camera: "EOS R6" },
    is_favorite: false,
    is_pinned: false,
    created_at: "2026-03-07T09:10:00Z",
  },
  {
    key: "todo-pending",
    folder_key: "root-projects",
    account_key: "gdrive-primary",
    name: "todo-notes.txt",
    ext: "txt",
    mime: "text/plain",
    size_bytes: 1536,
    storage_provider: "gdrive",
    provider_file_id_original: "gd_qa_todo_notes_original",
    provider_file_id_thumb: null,
    provider_file_id_preview: null,
    preview_status: "pending",
    sync_status: "pending",
    error_code: null,
    metadata: { lines: 64, source: "manual_import" },
    is_favorite: false,
    is_pinned: false,
    created_at: "2026-03-08T14:25:00Z",
  },
];

function deterministicUuid(value) {
  const hash = createHash("sha1").update(`${SEED_VERSION}:${value}`).digest("hex");
  const raw = hash.slice(0, 32);
  const timeLow = raw.slice(0, 8);
  const timeMid = raw.slice(8, 12);
  const timeHi = ((Number.parseInt(raw.slice(12, 16), 16) & 0x0fff) | 0x5000)
    .toString(16)
    .padStart(4, "0");
  const clockSeq = ((Number.parseInt(raw.slice(16, 20), 16) & 0x3fff) | 0x8000)
    .toString(16)
    .padStart(4, "0");
  const node = raw.slice(20, 32);

  return `${timeLow}-${timeMid}-${timeHi}-${clockSeq}-${node}`;
}

function assertSeedSafety(supabaseUrl, action) {
  const allowSeed = process.env.RAWVAULT_SEED_ALLOW === "true";
  if (!allowSeed) {
    throw new Error("Set RAWVAULT_SEED_ALLOW=true to run this script.");
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Seeding is blocked when NODE_ENV=production.");
  }

  const hostname = new URL(supabaseUrl).hostname.toLowerCase();
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const allowRemote = process.env.RAWVAULT_SEED_ALLOW_REMOTE === "true";

  if (!isLocal && !allowRemote) {
    throw new Error(
      `Refusing to seed non-local host (${hostname}). Set RAWVAULT_SEED_ALLOW_REMOTE=true for dev/test projects.`,
    );
  }

  if (PROD_HOST_BLOCKLIST.has(hostname)) {
    throw new Error(`Host ${hostname} is blocklisted for this seed script.`);
  }

  if (!isLocal && allowRemote) {
    const projectRef = (process.env.RAWVAULT_SEED_PROJECT_REF ?? "").trim();
    if (!projectRef) {
      throw new Error(
        "Remote seed requires RAWVAULT_SEED_PROJECT_REF (target Supabase project ref) for safety.",
      );
    }

    const expectedHost = `${projectRef}.supabase.co`;
    if (hostname !== expectedHost) {
      throw new Error(
        `Supabase host mismatch. Expected ${expectedHost}, received ${hostname}. Refusing to seed.`,
      );
    }
  }

  if (action === "reset" && process.env.RAWVAULT_SEED_ALLOW_RESET !== "true") {
    throw new Error("Reset is blocked. Set RAWVAULT_SEED_ALLOW_RESET=true to continue.");
  }
}

function decodeJwtPayload(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(normalized, "base64").toString("utf-8");
    const payload = JSON.parse(decoded);
    return payload && typeof payload === "object" ? payload : null;
  } catch {
    return null;
  }
}

function isServiceRoleKey(key) {
  if (key.startsWith("sb_secret_")) {
    return true;
  }

  const payload = decodeJwtPayload(key);
  return payload?.role === "service_role";
}

function isAlreadyRegisteredError(error) {
  return String(error?.message ?? "")
    .toLowerCase()
    .includes("already been registered");
}

async function ensureSeedUser(adminClient, authClient, email, password) {
  const { data, error } = await adminClient.auth.admin.generateLink({
    type: "signup",
    email,
    password,
  });

  let userId = data?.user?.id ?? null;
  if (error && !isAlreadyRegisteredError(error)) {
    throw error;
  }
  if (error && isAlreadyRegisteredError(error)) {
    const { data: signInData, error: signInError } = await authClient.auth.signInWithPassword({
      email,
      password,
    });
    if (signInError || !signInData?.user?.id) {
      throw new Error(
        `Seed user exists but sign-in failed with provided password: ${signInError?.message ?? "unknown sign-in failure"}`,
      );
    }
    userId = signInData.user.id;
  }
  if (!userId) {
    throw new Error("Auth admin did not return a seeded user id.");
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    password,
    email_confirm: true,
    user_metadata: {
      seeded_by: "slice2-dev",
      seed_version: SEED_VERSION,
    },
  });
  if (updateError) {
    throw updateError;
  }

  return {
    id: userId,
    email,
  };
}

async function resetForUser(supabase, userId) {
  const { error: filesError } = await supabase.from("files").delete().eq("user_id", userId);
  if (filesError) {
    throw filesError;
  }

  const { error: foldersError } = await supabase.from("folders").delete().eq("user_id", userId);
  if (foldersError) {
    throw foldersError;
  }

  const { error: linkedError } = await supabase
    .from("linked_accounts")
    .delete()
    .eq("user_id", userId);
  if (linkedError) {
    throw linkedError;
  }
}

async function seedForUser(supabase, userId) {
  const linkedAccounts = LINKED_ACCOUNT_TEMPLATES.map((entry) => ({
    id: deterministicUuid(`${userId}:linked_account:${entry.key}`),
    user_id: userId,
    provider: entry.provider,
    provider_account_id: entry.provider_account_id,
    account_email: entry.account_email,
    quota_total_bytes: entry.quota_total_bytes,
    quota_used_bytes: entry.quota_used_bytes,
    is_active: entry.is_active,
    health_status: entry.health_status,
    last_synced_at: entry.last_synced_at,
    access_token_encrypted: null,
    refresh_token_encrypted: null,
    expires_at: null,
  }));

  const accountIds = new Map(linkedAccounts.map((row) => [row.provider_account_id, row.id]));
  const accountKeyToProviderAccountId = new Map(
    LINKED_ACCOUNT_TEMPLATES.map((entry) => [entry.key, entry.provider_account_id]),
  );

  const folders = FOLDER_TEMPLATES.map((entry) => ({
    id: deterministicUuid(`${userId}:folder:${entry.key}`),
    user_id: userId,
    parent_id: entry.parent_key ? deterministicUuid(`${userId}:folder:${entry.parent_key}`) : null,
    name: entry.name,
    path: entry.path,
    is_favorite: entry.is_favorite,
    is_pinned: entry.is_pinned,
    deleted_at: null,
    created_at: entry.created_at,
    updated_at: entry.created_at,
  }));

  const folderIds = new Map(FOLDER_TEMPLATES.map((entry) => [entry.key, deterministicUuid(`${userId}:folder:${entry.key}`)]));

  const files = FILE_TEMPLATES.map((entry) => {
    const providerAccountId = accountKeyToProviderAccountId.get(entry.account_key);
    if (!providerAccountId) {
      throw new Error(`Missing account mapping for ${entry.account_key}`);
    }

    const storageAccountId = accountIds.get(providerAccountId);
    if (!storageAccountId) {
      throw new Error(`Missing storage account id for ${entry.account_key}`);
    }

    const folderId = folderIds.get(entry.folder_key);
    if (!folderId) {
      throw new Error(`Missing folder mapping for ${entry.folder_key}`);
    }

    return {
      id: deterministicUuid(`${userId}:file:${entry.key}`),
      user_id: userId,
      folder_id: folderId,
      name: entry.name,
      ext: entry.ext,
      mime: entry.mime,
      size_bytes: entry.size_bytes,
      storage_provider: entry.storage_provider,
      storage_account_id: storageAccountId,
      provider_file_id_original: entry.provider_file_id_original,
      provider_file_id_thumb: entry.provider_file_id_thumb,
      provider_file_id_preview: entry.provider_file_id_preview,
      preview_status: entry.preview_status,
      sync_status: entry.sync_status,
      error_code: entry.error_code,
      metadata: entry.metadata,
      is_favorite: entry.is_favorite,
      is_pinned: entry.is_pinned,
      deleted_at: null,
      created_at: entry.created_at,
      updated_at: entry.created_at,
    };
  });

  const { error: linkedError } = await supabase
    .from("linked_accounts")
    .upsert(linkedAccounts, { onConflict: "id" });
  if (linkedError) {
    throw linkedError;
  }

  const { error: foldersError } = await supabase.from("folders").upsert(folders, { onConflict: "id" });
  if (foldersError) {
    throw foldersError;
  }

  const { error: filesError } = await supabase.from("files").upsert(files, { onConflict: "id" });
  if (filesError) {
    throw filesError;
  }

  return {
    linkedAccounts: linkedAccounts.length,
    folders: folders.length,
    files: files.length,
  };
}

async function main() {
  const action = process.argv[2] ?? "seed";
  if (!["seed", "reset", "reseed"].includes(action)) {
    throw new Error("Usage: node scripts/seed-slice2-dev.mjs [seed|reset|reseed]");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = process.env.RAWVAULT_SEED_USER_EMAIL ?? DEFAULT_USER_EMAIL;
  const password = process.env.RAWVAULT_SEED_USER_PASSWORD ?? DEFAULT_USER_PASSWORD;
  const shouldDropUser = process.env.RAWVAULT_SEED_DROP_USER === "true";

  if (!supabaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL.");
  }
  if (!serviceRoleKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  if (!isServiceRoleKey(serviceRoleKey)) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not a service_role credential. Use a real service role key, not anon/publishable.",
    );
  }

  assertSeedSafety(supabaseUrl, action === "reseed" ? "reset" : action);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const publicAuthKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;
  if (!publicAuthKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY) for seed-user sign-in fallback.",
    );
  }
  const authClient = createClient(supabaseUrl, publicAuthKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const user = await ensureSeedUser(supabase, authClient, email, password);
  const userId = user.id;
  if (!userId) {
    throw new Error("Seed user is missing id.");
  }

  if (action === "reset" || action === "reseed") {
    await resetForUser(supabase, userId);
    console.log(`Reset complete for user ${email} (${userId}).`);
  }

  if (action === "seed" || action === "reseed") {
    const counts = await seedForUser(supabase, userId);
    console.log(
      `Seed complete for user ${email} (${userId}): ${counts.linkedAccounts} linked_accounts, ${counts.folders} folders, ${counts.files} files.`,
    );
  }

  if ((action === "reset" || action === "reseed") && shouldDropUser) {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      throw error;
    }
    console.log(`Deleted seed auth user ${email} (${userId}) because RAWVAULT_SEED_DROP_USER=true.`);
  }
}

main().catch((error) => {
  console.error("[seed-slice2-dev] failed:", error.message ?? error);
  process.exit(1);
});
