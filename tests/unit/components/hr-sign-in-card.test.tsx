import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HrSignInCard } from "@/components/auth/hr-sign-in-card";

describe("HrSignInCard", () => {
  it("renders title and sign-in actions", () => {
    render(
      <HrSignInCard
        title="Earnings statement"
        description="Sign in to continue"
        returnTo="/employee/paystub"
        onDevTokenPaste={vi.fn()}
      />,
    );
    expect(screen.getByText("Earnings statement")).toBeInTheDocument();
    expect(screen.getByText("Sign in to continue")).toBeInTheDocument();
  });
});
