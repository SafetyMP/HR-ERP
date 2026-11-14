import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./demo.css";

export const metadata: Metadata = {
  title: "HR ERP · Interactive demo",
  description:
    "Explore employee and HR workspaces with synthetic sample data. No account required.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
