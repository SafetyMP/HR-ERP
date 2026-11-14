import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  activeNavItem,
  navForRole,
  navGroupsForRole,
  searchNavigation,
  type AppRole,
} from "../../../src/lib/navigation/role-nav";

const roles: AppRole[] = ["employee", "hr", "manager"];

describe("workspace navigation", () => {
  it.each(roles)(
    "keeps %s links unique and connected to existing pages",
    (role) => {
      const items = navForRole(role);
      expect(new Set(items.map((item) => item.href)).size).toBe(items.length);
      for (const item of items) {
        expect(
          existsSync(
            path.join(process.cwd(), "src/app", item.href, "page.tsx"),
          ),
          item.href,
        ).toBe(true);
        expect(activeNavItem(role, item.href)?.href).toBe(item.href);
      }
      expect(navGroupsForRole(role).flatMap((group) => group.items)).toEqual(
        items,
      );
    },
  );

  it("keeps the most specific page active on nested and trailing-slash routes", () => {
    expect(
      activeNavItem("employee", "/employee/paystub/history/2026-10")?.label,
    ).toBe("Pay history");
    expect(
      activeNavItem("hr", "/hr/payroll-runs/synthetic-period")?.label,
    ).toBe("Payroll runs");
    expect(
      activeNavItem("manager", "/manager/recruiting/jobs/example")?.label,
    ).toBe("Recruiting");
    expect(activeNavItem("employee", "/employee/pto/")?.label).toBe("Time off");
  });

  it("does not match unrelated prefixes or other workspaces", () => {
    expect(activeNavItem("employee", "/employee/ptox")).toBeUndefined();
    expect(activeNavItem("hr", "/hr/payroll-runs-old")).toBeUndefined();
    expect(activeNavItem("employee", "/hr/dashboard")).toBeUndefined();
  });

  it("finds human task synonyms, scopes results and handles no results", () => {
    expect(
      searchNavigation("employee", " VACATION ")
        .flatMap((g) => g.items)
        .map((i) => i.href),
    ).toContain("/employee/pto");
    expect(
      searchNavigation("employee", "paystub")
        .flatMap((g) => g.items)
        .map((i) => i.label),
    ).toContain("Pay statement");
    expect(
      searchNavigation("hr", "election")
        .flatMap((g) => g.items)
        .map((i) => i.label),
    ).toContain("Benefit change requests");
    expect(searchNavigation("employee", "payroll close")).toEqual([]);
    expect(searchNavigation("hr", "unfindableword")).toEqual([]);
    expect(searchNavigation("employee", "")).toEqual(
      navGroupsForRole("employee"),
    );
  });

  it("makes previously hidden employee support and benefit changes discoverable", () => {
    expect(navForRole("employee").map((item) => item.href)).toEqual(
      expect.arrayContaining([
        "/employee/hr-request",
        "/employee/organization",
        "/employee/benefits/election-change",
      ]),
    );
  });
});
