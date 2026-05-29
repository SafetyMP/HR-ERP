import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "@/components/layout/page-header";

describe("PageHeader", () => {
  it("renders title and description", () => {
    render(
      <PageHeader
        eyebrow="Time off"
        title="Your PTO"
        description="Balance and requests"
      />,
    );
    expect(screen.getByRole("heading", { name: "Your PTO" })).toBeInTheDocument();
    expect(screen.getByText("Balance and requests")).toBeInTheDocument();
    expect(screen.getByText("Time off")).toBeInTheDocument();
  });
});
