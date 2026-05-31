import { ApiError } from "@/lib/api/v1/errors";

/**
 * Track D APIs (compensation, workflow, engagement, positions) are scaffold-only
 * until PO briefs fund them — see docs/product/deferred-platform-track.md
 *
 * Production: denied unless TRACK_D_API_ENABLED=1 (Human authorization).
 * Non-production: allowed for QA/architecture previews.
 */
export function assertTrackDApiAllowed(): void {
  if (process.env.TRACK_D_API_ENABLED === "1") {
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    return;
  }
  throw new ApiError(404, {
    code: "not_found",
    message: "track_d_api_not_shipped",
  });
}
