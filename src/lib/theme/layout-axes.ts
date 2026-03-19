export type Density = "comfortable" | "compact";

export type RadiusMode = "default" | "rounded" | "sharp";

export const DEFAULT_DENSITY: Density = "comfortable";
export const DEFAULT_RADIUS_MODE: RadiusMode = "default";

export function isDensity(value: unknown): value is Density {
  return value === "comfortable" || value === "compact";
}

export function isRadiusMode(value: unknown): value is RadiusMode {
  return value === "default" || value === "rounded" || value === "sharp";
}

export function parseDensity(value: unknown, fallback: Density = DEFAULT_DENSITY): Density {
  return isDensity(value) ? value : fallback;
}

export function parseRadiusMode(value: unknown, fallback: RadiusMode = DEFAULT_RADIUS_MODE): RadiusMode {
  return isRadiusMode(value) ? value : fallback;
}

export type LayoutAxesState = {
  density: Density;
  radiusMode: RadiusMode;
};

export const DEFAULT_LAYOUT_AXES: LayoutAxesState = {
  density: DEFAULT_DENSITY,
  radiusMode: DEFAULT_RADIUS_MODE,
};

