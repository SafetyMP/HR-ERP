import {
  DEMO_PREVIEW_PERSONAS,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";

const DEMO_SUBJECT_ID = DEMO_PREVIEW_PERSONAS.employee.subjectId;

/** Demo preview sessions use a shared synthetic subject id across personas. */
export function inferDemoPersonaFromSession(
  subjectId: string | undefined,
  roles: readonly string[],
): DemoPreviewPersona | null {
  if (subjectId !== DEMO_SUBJECT_ID) return null;
  if (roles.includes("hr_admin")) return "hr";
  if (roles.includes("manager")) return "manager";
  if (roles.includes("employee")) return "employee";
  return null;
}
