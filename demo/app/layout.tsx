import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./demo.css";
export const metadata: Metadata = {
  title: "Friday payroll close · HR ERP",
  description:
    "Reconcile a synthetic pay register, investigate exceptions and choose when to lock the period.",
};
export default function DemoLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
