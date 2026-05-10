import { EmployeeStatus } from "@/app/generated/prisma/client";

export interface ScimName {
  formatted?: string;
  familyName?: string;
  givenName?: string;
  middleName?: string;
}

export interface ScimEmail {
  value: string;
  primary?: boolean;
  type?: string;
}

export interface ScimUserResource {
  schemas: string[];
  id: string;
  externalId?: string | null;
  userName: string;
  name?: ScimName;
  active: boolean;
  emails: ScimEmail[];
  meta: {
    resourceType: "User";
    created: string;
    lastModified: string;
    location: string;
    version?: string;
  };
}

export interface EmployeeRowForScim {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  preferredName: string | null;
  status: EmployeeStatus;
  createdAt: Date;
  updatedAt: Date;
}

export const SCIM_USER_SCHEMA = "urn:ietf:params:scim:schemas:core:2.0:User";

export function employeeToScim(
  row: EmployeeRowForScim,
  baseUrl: string,
): ScimUserResource {
  const formatted = [row.firstName, row.lastName].filter(Boolean).join(" ").trim();
  return {
    schemas: [SCIM_USER_SCHEMA],
    id: row.id,
    externalId: null,
    userName: row.email,
    name: {
      formatted: formatted || row.email,
      givenName: row.firstName ?? undefined,
      familyName: row.lastName ?? undefined,
    },
    active: row.status === EmployeeStatus.ACTIVE,
    emails: [
      {
        value: row.email,
        primary: true,
        type: "work",
      },
    ],
    meta: {
      resourceType: "User",
      created: row.createdAt.toISOString(),
      lastModified: row.updatedAt.toISOString(),
      location: `${baseUrl}/api/scim/v2/Users/${row.id}`,
    },
  };
}

export interface ScimUserCreateInput {
  schemas?: string[];
  userName: string;
  name?: ScimName;
  active?: boolean;
  emails?: ScimEmail[];
}

export interface ParsedScimUser {
  email: string;
  firstName: string | null;
  lastName: string | null;
  active: boolean;
}

export function parseScimUser(input: unknown): ParsedScimUser {
  if (!input || typeof input !== "object") {
    throw new Error("invalid_request");
  }
  const value = input as ScimUserCreateInput;
  const userName = value.userName?.trim();
  if (!userName) {
    throw new Error("userName_required");
  }
  const email =
    value.emails?.find((e) => e.primary)?.value ??
    value.emails?.[0]?.value ??
    userName;
  return {
    email,
    firstName: value.name?.givenName?.trim() || null,
    lastName: value.name?.familyName?.trim() || null,
    active: value.active !== false,
  };
}

export interface ScimListResponse<T> {
  schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"];
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  Resources: T[];
}

export function scimListResponse<T>(
  resources: T[],
  totalResults: number,
  startIndex: number,
  itemsPerPage: number,
): ScimListResponse<T> {
  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults,
    startIndex,
    itemsPerPage,
    Resources: resources,
  };
}

export interface ScimError {
  schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"];
  status: string;
  detail: string;
  scimType?: string;
}

export function scimError(status: number, detail: string, scimType?: string): ScimError {
  return {
    schemas: ["urn:ietf:params:scim:api:messages:2.0:Error"],
    status: String(status),
    detail,
    ...(scimType ? { scimType } : {}),
  };
}
