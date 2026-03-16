/**
 * Workspace preferences API contracts.
 * GET /api/workspace/preferences response and PATCH request shapes.
 */

import { z } from "zod";

export const localeSchema = z.enum(["en", "vi"]);
export type Locale = z.infer<typeof localeSchema>;

export const layoutModeSchema = z.enum(["grid", "list"]);
export type LayoutMode = z.infer<typeof layoutModeSchema>;

export const workspacePreferencesResponseSchema = z.object({
  locale: localeSchema,
  themeId: z.string().nullable(),
  layoutMode: layoutModeSchema,
  componentConfig: z.record(z.string(), z.unknown()).nullable(),
  animationConfig: z.record(z.string(), z.unknown()).nullable(),
});
export type WorkspacePreferencesResponse = z.infer<
  typeof workspacePreferencesResponseSchema
>;

export const updateWorkspacePreferencesRequestSchema = z
  .object({
    locale: localeSchema.optional(),
    themeId: z.string().nullable().optional(),
    layoutMode: layoutModeSchema.optional(),
    componentConfig: z.record(z.string(), z.unknown()).nullable().optional(),
    animationConfig: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update.",
  });
export type UpdateWorkspacePreferencesRequest = z.infer<
  typeof updateWorkspacePreferencesRequestSchema
>;
