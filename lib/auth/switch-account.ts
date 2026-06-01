import { demoPreviewLandingEnabled } from "@/lib/auth/demo-preview-config";

function devLocalSignInEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN === "true"
  );
}

/** Where to send users after sign-out when switching demo / dev personas. */
export function switchAccountRedirectTarget(): string {
  if (devLocalSignInEnabled() || demoPreviewLandingEnabled()) {
    return "/";
  }
  return `/api/auth/login?returnTo=${encodeURIComponent("/")}`;
}
