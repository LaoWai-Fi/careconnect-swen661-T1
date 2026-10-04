// Identifies the build that produced this bundle. Undefined outside Vite (Jest),
// where it falls back to "dev".
export const BUILD_ID: string =
  typeof __CARECONNECT_BUILD_ID__ === "string" ? __CARECONNECT_BUILD_ID__ : "dev"

/**
 * True when a saved care plan was written by a different build, so the app
 * should start from the stock sample plan instead. Dev runs ("dev") keep data.
 */
export function isFromOtherBuild(savedBuildId: unknown, current: string = BUILD_ID): boolean {
  if (current === "dev") return false
  return savedBuildId !== current
}
