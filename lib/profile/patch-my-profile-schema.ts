import { z } from "zod";

/**
 * PATCH body: omit a key to leave unchanged; send `null` to clear a nullable field.
 * Strings are trimmed; empty string after trim coerced to `null`.
 */
const trimmedNullable = z
  .union([
    z.string().max(500).transform((s) => {
      const t = s.trim();
      return t.length === 0 ? null : t;
    }),
    z.null(),
  ])
  .optional();

const emailNullable = z
  .union([
    z.string().transform((s) => {
      const t = s.trim();
      return t.length === 0 ? null : t;
    }),
    z.null(),
  ])
  .optional()
  .superRefine((val, ctx) => {
    if (val === undefined || val === null) return;
    const parsed = z.string().email().safeParse(val);
    if (!parsed.success) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "invalid_email" });
    }
  });

export const patchMyProfileSchema = z
  .object({
    preferredName: trimmedNullable,
    personalEmail: emailNullable,
    phone: z
      .union([
        z.string().max(80).transform((s) => {
          const t = s.trim();
          return t.length === 0 ? null : t;
        }),
        z.null(),
      ])
      .optional(),
    mailingAddressLine1: trimmedNullable,
    mailingAddressLine2: trimmedNullable,
    mailingCity: trimmedNullable,
    mailingRegion: trimmedNullable,
    mailingPostalCode: trimmedNullable,
    mailingCountry: trimmedNullable,
    emergencyContactName: trimmedNullable,
    emergencyContactPhone: trimmedNullable,
    emergencyContactRelationship: trimmedNullable,
  })
  .strict();

export type PatchMyProfileInput = z.infer<typeof patchMyProfileSchema>;

export function parsePatchMyProfileBody(body: unknown): PatchMyProfileInput {
  return patchMyProfileSchema.parse(body);
}
