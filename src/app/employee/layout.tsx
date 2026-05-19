import { AppShell } from "@/components/layout/app-shell";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="employee">{children}</AppShell>;
}
