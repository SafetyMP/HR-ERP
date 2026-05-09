"use client";

import { toast } from "sonner";

import type { NormalizedApiError } from "./api-client";

export function toastApiError(err: NormalizedApiError) {
  toast.error(err.title, {
    description: err.description,
    duration: err.retryable ? 8000 : 6000,
  });
}
