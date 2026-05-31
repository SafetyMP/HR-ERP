import type { Page } from "@playwright/test";

/** Session token for ESS friction budget suite (demo employee). */
export function essE2eJwt(): string | undefined {
  return process.env.HR_ERP_ESS_E2E_JWT?.trim() || undefined;
}

export async function seedEssSession(page: Page, jwt: string): Promise<void> {
  await page.addInitScript((token: string) => {
    sessionStorage.setItem("hrerp_bearer_token", token);
  }, jwt);
}

export function elapsedMs(start: number): number {
  return Date.now() - start;
}
