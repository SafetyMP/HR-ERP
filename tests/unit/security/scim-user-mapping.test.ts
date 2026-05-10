import { describe, expect, it } from "vitest";

import { EmployeeStatus } from "@/app/generated/prisma/client";

import {
  employeeToScim,
  parseScimUser,
  scimError,
  scimListResponse,
  SCIM_USER_SCHEMA,
} from "@/lib/scim/user-mapping";

const baseEmployee = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "ada@example.com",
  firstName: "Ada",
  lastName: "Lovelace",
  preferredName: null,
  status: EmployeeStatus.ACTIVE,
  createdAt: new Date(Date.UTC(2026, 0, 1)),
  updatedAt: new Date(Date.UTC(2026, 0, 2)),
};

describe("employeeToScim", () => {
  it("emits a SCIM core User envelope with location meta", () => {
    const resource = employeeToScim(baseEmployee, "https://hr.example.com");
    expect(resource.schemas).toEqual([SCIM_USER_SCHEMA]);
    expect(resource.id).toBe(baseEmployee.id);
    expect(resource.userName).toBe("ada@example.com");
    expect(resource.active).toBe(true);
    expect(resource.emails[0]?.primary).toBe(true);
    expect(resource.meta.location).toBe(
      "https://hr.example.com/api/scim/v2/Users/11111111-1111-4111-8111-111111111111",
    );
  });

  it("marks INACTIVE employees as `active=false`", () => {
    const resource = employeeToScim(
      { ...baseEmployee, status: EmployeeStatus.INACTIVE },
      "https://hr.example.com",
    );
    expect(resource.active).toBe(false);
  });
});

describe("parseScimUser", () => {
  it("derives email from primary entry then falls back to userName", () => {
    const parsed = parseScimUser({
      schemas: [SCIM_USER_SCHEMA],
      userName: "userName@example.com",
      name: { givenName: "First", familyName: "Last" },
      emails: [
        { value: "alt@example.com", primary: false },
        { value: "primary@example.com", primary: true },
      ],
    });
    expect(parsed.email).toBe("primary@example.com");
    expect(parsed.firstName).toBe("First");
    expect(parsed.lastName).toBe("Last");
    expect(parsed.active).toBe(true);
  });

  it("falls back to userName when no emails are present", () => {
    const parsed = parseScimUser({ userName: "fallback@example.com" });
    expect(parsed.email).toBe("fallback@example.com");
  });

  it("rejects payloads without userName", () => {
    expect(() => parseScimUser({} as unknown)).toThrow();
  });
});

describe("scimListResponse / scimError", () => {
  it("shapes ListResponse with correct schema constant", () => {
    const list = scimListResponse([{ id: "x" }], 1, 1, 100);
    expect(list.schemas).toEqual([
      "urn:ietf:params:scim:api:messages:2.0:ListResponse",
    ]);
    expect(list.totalResults).toBe(1);
  });

  it("shapes Error with status string", () => {
    const err = scimError(404, "user_not_found");
    expect(err.status).toBe("404");
    expect(err.detail).toBe("user_not_found");
  });
});
