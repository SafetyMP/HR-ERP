/** Feature 004 — server-driven UI policy so clients cannot spoof HR-maintained affordances. */

export const PROFILE_FIELD_KEYS = [
  "legalGivenName",
  "legalFamilyName",
  "preferredName",
  "workEmail",
  "personalEmail",
  "phone",
  "mailingAddressLine1",
  "mailingAddressLine2",
  "mailingCity",
  "mailingRegion",
  "mailingPostalCode",
  "mailingCountry",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyContactRelationship",
] as const;

export type ProfileFieldKey = (typeof PROFILE_FIELD_KEYS)[number];

export type FieldMaintenanceClass = "hr_maintained" | "self_editable";

export const PROFILE_FIELD_POLICY: Record<ProfileFieldKey, FieldMaintenanceClass> = {
  legalGivenName: "hr_maintained",
  legalFamilyName: "hr_maintained",
  preferredName: "self_editable",
  workEmail: "hr_maintained",
  personalEmail: "self_editable",
  phone: "self_editable",
  mailingAddressLine1: "self_editable",
  mailingAddressLine2: "self_editable",
  mailingCity: "self_editable",
  mailingRegion: "self_editable",
  mailingPostalCode: "self_editable",
  mailingCountry: "self_editable",
  emergencyContactName: "self_editable",
  emergencyContactPhone: "self_editable",
  emergencyContactRelationship: "self_editable",
};
