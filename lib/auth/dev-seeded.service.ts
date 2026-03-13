import type { SupabaseClient } from "@supabase/supabase-js";

import { isApiError, ApiError } from "@/lib/api/errors";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth/service";
import type { SignInResponse } from "@/lib/contracts";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

type SeededCredentials = {
  email: string;
  password: string;
};

type SeededFixtures = {
  linkedAccountId: string | null;
  folderId: string | null;
  fileId: string | null;
};

export type DevSeededSignInResponse = SignInResponse & {
  seededUser: {
    email: string;
    bootstrapUsed: boolean;
    fixturesSeeded: boolean;
  };
  fixtures: SeededFixtures;
};

const SEEDED_FOLDER_PATH = "/seeded-qa";
const SEEDED_FOLDER_NAME = "seeded-qa";
const SEEDED_FILE_NAME = "seeded-auth-check.txt";

function ensureDevelopmentOnly(): void {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.RAWVAULT_DEV_SEEDED_AUTH_ENABLED !== "true"
  ) {
    throw new ApiError(404, "NOT_FOUND", "Not found.");
  }
}

function getSeededCredentials(): SeededCredentials {
  const seededEmailFromSeedScript = process.env.RAWVAULT_SEED_USER_EMAIL;
  const seededPasswordFromSeedScript = process.env.RAWVAULT_SEED_USER_PASSWORD;

  return {
    email:
      seededEmailFromSeedScript ??
      process.env.RAWVAULT_DEV_SEEDED_EMAIL ??
      "qa+slice2@rawvault.local",
    password:
      seededPasswordFromSeedScript ??
      process.env.RAWVAULT_DEV_SEEDED_PASSWORD ??
      "RawVault123!",
  };
}

type AdminClient = NonNullable<ReturnType<typeof createServiceRoleSupabaseClient>>;

async function bootstrapSeededUser(admin: AdminClient, creds: SeededCredentials): Promise<void> {
  const { data, error } = await admin.auth.admin.generateLink({
    type: "signup",
    email: creds.email,
    password: creds.password,
  });

  if (error) {
    throw new ApiError(
      500,
      "DEV_SEEDED_AUTH_BOOTSTRAP_FAILED",
      "Failed to bootstrap seeded auth user.",
      error.message,
    );
  }

  const seededUserId = data?.user?.id;
  if (!seededUserId) {
    throw new ApiError(
      500,
      "DEV_SEEDED_AUTH_BOOTSTRAP_FAILED",
      "Seeded auth bootstrap did not return a user id.",
    );
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(seededUserId, {
    password: creds.password,
    email_confirm: true,
    user_metadata: {
      rawvaultSeededUser: true,
    },
  });
  if (updateError) {
    throw new ApiError(
      500,
      "DEV_SEEDED_AUTH_BOOTSTRAP_FAILED",
      "Failed to finalize seeded auth user credentials.",
      updateError.message,
    );
  }
}

async function ensureLinkedAccountFixture(
  admin: SupabaseClient,
  userId: string,
  email: string,
): Promise<string> {
  const { data: existing, error: existingError } = await admin
    .from("linked_accounts")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", "gdrive")
    .order("created_at", { ascending: true })
    .limit(1);

  if (existingError) {
    throw new ApiError(
      500,
      "DEV_SEEDED_FIXTURE_FAILED",
      "Failed to read linked account fixtures.",
      existingError.message,
    );
  }

  const existingId = existing?.[0]?.id as string | undefined;
  if (existingId) {
    return existingId;
  }

  const { data, error } = await admin
    .from("linked_accounts")
    .insert({
      user_id: userId,
      provider: "gdrive",
      provider_account_id: `seeded-gdrive-${userId.slice(0, 8)}`,
      account_email: email,
      access_token_encrypted: null,
      refresh_token_encrypted: null,
      expires_at: null,
      quota_total_bytes: 1024 * 1024 * 1024 * 10,
      quota_used_bytes: 1024 * 1024 * 512,
      is_active: true,
      health_status: "healthy",
      last_synced_at: null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new ApiError(
      500,
      "DEV_SEEDED_FIXTURE_FAILED",
      "Failed to create linked account fixture.",
      error?.message ?? "No linked account id returned.",
    );
  }

  return data.id as string;
}

async function ensureFolderFixture(admin: SupabaseClient, userId: string): Promise<string> {
  const { data: existing, error: existingError } = await admin
    .from("folders")
    .select("id")
    .eq("user_id", userId)
    .eq("path", SEEDED_FOLDER_PATH)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw new ApiError(
      500,
      "DEV_SEEDED_FIXTURE_FAILED",
      "Failed to read folder fixtures.",
      existingError.message,
    );
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("folders")
    .insert({
      user_id: userId,
      parent_id: null,
      name: SEEDED_FOLDER_NAME,
      path: SEEDED_FOLDER_PATH,
      is_favorite: false,
      is_pinned: false,
      deleted_at: null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new ApiError(
      500,
      "DEV_SEEDED_FIXTURE_FAILED",
      "Failed to create folder fixture.",
      error?.message ?? "No folder id returned.",
    );
  }

  return data.id as string;
}

async function ensureFileFixture(
  admin: SupabaseClient,
  userId: string,
  folderId: string,
  linkedAccountId: string,
): Promise<string> {
  const { data: existing, error: existingError } = await admin
    .from("files")
    .select("id")
    .eq("user_id", userId)
    .eq("folder_id", folderId)
    .eq("name", SEEDED_FILE_NAME)
    .is("deleted_at", null)
    .maybeSingle();

  if (existingError) {
    throw new ApiError(
      500,
      "DEV_SEEDED_FIXTURE_FAILED",
      "Failed to read file fixtures.",
      existingError.message,
    );
  }

  if (existing?.id) {
    return existing.id as string;
  }

  const { data, error } = await admin
    .from("files")
    .insert({
      user_id: userId,
      folder_id: folderId,
      name: SEEDED_FILE_NAME,
      ext: "txt",
      mime: "text/plain",
      size_bytes: 2048,
      storage_provider: "gdrive",
      storage_account_id: linkedAccountId,
      provider_file_id_original: `seeded-file-${userId}`,
      provider_file_id_thumb: null,
      provider_file_id_preview: null,
      preview_status: "ready",
      sync_status: "synced",
      error_code: null,
      metadata: {
        seededBy: "dev-seeded-signin",
      },
      is_favorite: false,
      is_pinned: false,
      deleted_at: null,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new ApiError(
      500,
      "DEV_SEEDED_FIXTURE_FAILED",
      "Failed to create file fixture.",
      error?.message ?? "No file id returned.",
    );
  }

  return data.id as string;
}

async function ensureFixtures(
  seedClient: SupabaseClient,
  userId: string,
  email: string,
): Promise<SeededFixtures> {
  const linkedAccountId = await ensureLinkedAccountFixture(seedClient, userId, email);
  const folderId = await ensureFolderFixture(seedClient, userId);
  const fileId = await ensureFileFixture(seedClient, userId, folderId, linkedAccountId);

  return {
    linkedAccountId,
    folderId,
    fileId,
  };
}

export async function signInSeededDevUser(
  supabase: SupabaseClient,
): Promise<DevSeededSignInResponse> {
  ensureDevelopmentOnly();

  const creds = getSeededCredentials();
  const admin = createServiceRoleSupabaseClient();

  const buildResponse = (
    authResult: SignInResponse,
    bootstrapUsed: boolean,
    fixtures: SeededFixtures,
  ): DevSeededSignInResponse => ({
    ...authResult,
    seededUser: {
      email: creds.email,
      bootstrapUsed,
      fixturesSeeded: Boolean(fixtures.fileId),
    },
    fixtures,
  });

  try {
    const authResult = await signInWithPassword(supabase, creds);
    const seedClient = admin ?? supabase;
    const fixtures = await ensureFixtures(seedClient, authResult.user.id, creds.email);
    return buildResponse(authResult, false, fixtures);
  } catch (error) {
    if (!isApiError(error) || error.code !== "AUTH_SIGN_IN_FAILED") {
      throw error;
    }

    if (admin) {
      await bootstrapSeededUser(admin, creds);
    } else {
      try {
        await signUpWithPassword(supabase, creds);
      } catch (signUpError) {
        if (!isApiError(signUpError) || signUpError.code !== "AUTH_SIGN_UP_FAILED") {
          throw signUpError;
        }
      }
    }

    try {
      const authResult = await signInWithPassword(supabase, creds);
      const seedClient = admin ?? supabase;
      const fixtures = await ensureFixtures(seedClient, authResult.user.id, creds.email);
      return buildResponse(authResult, true, fixtures);
    } catch (retryError) {
      if (!isApiError(retryError) || retryError.code !== "AUTH_SIGN_IN_FAILED" || admin) {
        throw retryError;
      }

      throw new ApiError(
        503,
        "DEV_SEEDED_AUTH_BOOTSTRAP_UNAVAILABLE",
        "Seeded sign-in failed in development and automatic bootstrap could not complete.",
        {
          email: creds.email,
          hint: "Set SUPABASE_SERVICE_ROLE_KEY or create the seeded user manually, then retry.",
        },
      );
    }
  }
}
