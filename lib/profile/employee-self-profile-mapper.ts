import type { Employee } from "@/app/generated/prisma/client";

import { PROFILE_FIELD_POLICY, type ProfileFieldKey } from "@/lib/profile/profile-field-policy";

export type EmployeeSelfProfilePayload = {
  legalGivenName: string | null;
  legalFamilyName: string | null;
  preferredName: string | null;
  workEmail: string;
  personalEmail: string | null;
  phone: string | null;
  mailingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
  };
  emergencyContact: {
    name: string | null;
    phone: string | null;
    relationship: string | null;
  };
};

export type MyProfileEnvelope = {
  profile: EmployeeSelfProfilePayload;
  fieldPolicy: Record<ProfileFieldKey, (typeof PROFILE_FIELD_POLICY)[ProfileFieldKey]>;
};

export function mapEmployeeRowToSelfProfile(row: Employee): EmployeeSelfProfilePayload {
  return {
    legalGivenName: row.firstName,
    legalFamilyName: row.lastName,
    preferredName: row.preferredName,
    workEmail: row.email,
    personalEmail: row.personalEmail,
    phone: row.phone,
    mailingAddress: {
      line1: row.mailingAddressLine1,
      line2: row.mailingAddressLine2,
      city: row.mailingCity,
      region: row.mailingRegion,
      postalCode: row.mailingPostalCode,
      country: row.mailingCountry,
    },
    emergencyContact: {
      name: row.emergencyContactName,
      phone: row.emergencyContactPhone,
      relationship: row.emergencyContactRelationship,
    },
  };
}

export function buildMyProfileEnvelope(profile: EmployeeSelfProfilePayload): MyProfileEnvelope {
  return {
    profile,
    fieldPolicy: { ...PROFILE_FIELD_POLICY },
  };
}
