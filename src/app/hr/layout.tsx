import { AppShell } from "@/components/layout/app-shell";

export default function HrLayout({ children }: { children: React.ReactNode }) {
  return <AppShell role="hr">{children}</AppShell>;
}
