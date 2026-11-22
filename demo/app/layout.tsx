import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./demo.css";

export const metadata: Metadata = {
  title: "HR ERP · The leave-balance release review",
  description:
    "Review two changes to an employee’s leave balance, follow the request through HR and weigh the cost of a review pilot.",
};

export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
