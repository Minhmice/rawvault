import { ApiError } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { handleRouteError, ok } from "@/lib/api/responses";
import { requireAuthenticatedUser } from "@/lib/auth/require-user";
import {
  type UpdateWorkspacePreferencesRequest,
  updateWorkspacePreferencesRequestSchema,
  workspacePreferencesResponseSchema,
  type WorkspacePreferencesResponse,
} from "@/lib/contracts/workspace-preferences.contracts";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const DEFAULT_PREFERENCES: WorkspacePreferencesResponse = {
  locale: "en",
  themeId: null,
  layoutMode: "grid",
  componentConfig: null,
  animationConfig: null,
};

function rowToResponse(row: {
  locale: string;
  theme_id: string | null;
  layout_mode: string;
  component_config: unknown;
  animation_config: unknown;
}): WorkspacePreferencesResponse {
  return workspacePreferencesResponseSchema.parse({
    locale: row.locale,
    themeId: row.theme_id,
    layoutMode: row.layout_mode,
    componentConfig: row.component_config,
    animationConfig: row.animation_config,
  });
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const { data: row, error } = await supabase
      .from("workspace_preferences")
      .select("locale, theme_id, layout_mode, component_config, animation_config")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw new ApiError(500, "PREFERENCES_FETCH_FAILED", "Failed to load workspace preferences.");
    }

    const response = row ? rowToResponse(row) : DEFAULT_PREFERENCES;
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await parseJsonBody<unknown>(request);
    const parsed = updateWorkspacePreferencesRequestSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(400, "VALIDATION_ERROR", "Invalid workspace preferences update.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }
    const payload = parsed.data as UpdateWorkspacePreferencesRequest;

    const supabase = await createServerSupabaseClient();
    const user = await requireAuthenticatedUser(supabase);

    const { data: existing } = await supabase
      .from("workspace_preferences")
      .select("locale, theme_id, layout_mode, component_config, animation_config")
      .eq("user_id", user.id)
      .maybeSingle();

    const current = existing
      ? {
          locale: existing.locale,
          theme_id: existing.theme_id,
          layout_mode: existing.layout_mode,
          component_config: existing.component_config,
          animation_config: existing.animation_config,
        }
      : {
          locale: "en",
          theme_id: null as string | null,
          layout_mode: "grid",
          component_config: null as unknown,
          animation_config: null as unknown,
        };

    const updates = {
      locale: payload.locale ?? current.locale,
      theme_id: payload.themeId !== undefined ? payload.themeId : current.theme_id,
      layout_mode: payload.layoutMode ?? current.layout_mode,
      component_config:
        payload.componentConfig !== undefined
          ? payload.componentConfig
          : current.component_config,
      animation_config:
        payload.animationConfig !== undefined
          ? payload.animationConfig
          : current.animation_config,
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error } = await supabase
      .from("workspace_preferences")
      .upsert(
        { user_id: user.id, ...updates },
        { onConflict: "user_id", ignoreDuplicates: false },
      )
      .select("locale, theme_id, layout_mode, component_config, animation_config")
      .single();

    if (error) {
      throw new ApiError(500, "PREFERENCES_UPDATE_FAILED", "Failed to update workspace preferences.");
    }

    const response = rowToResponse(updated);
    return ok(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
