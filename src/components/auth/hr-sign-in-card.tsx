"use client";

import Link from "next/link";

import {
  DEMO_PREVIEW_PERSONAS,
  demoPreviewBootstrapHref,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";
import { useDemoPreviewEnabled } from "@/lib/auth/use-demo-preview-enabled";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  title: string;
  description: string;
  returnTo?: string;
  onDevTokenPaste?: (token: string) => void;
};

const DEMO_PREVIEW_ORDER: DemoPreviewPersona[] = ["employee", "manager", "hr"];

export function HrSignInCard({
  title,
  description,
  returnTo = "/",
  onDevTokenPaste,
}: Props) {
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const showDemoPreview = useDemoPreviewEnabled();
  const showDevTokenPaste =
    process.env.NODE_ENV !== "production" &&
    (process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN === "true");

  return (
    <Card className="mx-auto w-full max-w-lg shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild className="w-full" size="lg">
          <Link href={loginHref}>Sign in with your organization account</Link>
        </Button>
        {showDemoPreview ? (
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">Preview signed-in demo</p>
            <p className="mt-1 text-xs text-muted-foreground">
              One-click demo personas for buyer walkthroughs. Requires explicit env on
              Preview or Production (see docs).
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {DEMO_PREVIEW_ORDER.map((persona) => {
                const spec = DEMO_PREVIEW_PERSONAS[persona];
                return (
                  <Button key={persona} asChild variant="secondary" size="sm">
                    <Link href={demoPreviewBootstrapHref(persona, returnTo)}>
                      {spec.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        ) : null}
        {showDevTokenPaste && onDevTokenPaste ? (
          <details className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">
              Demo sign-in (dev JWT)
            </summary>
            <p className="mt-2 text-xs text-muted-foreground">
              Run{" "}
              <code className="font-mono">npm run jwt:dev:demo-employee</code>,{" "}
              <code className="font-mono">jwt:dev:demo-manager</code>, or{" "}
              <code className="font-mono">jwt:dev:demo-hr</code> (use{" "}
              <code className="font-mono">jwt:dev:vercel</code> on Production), then paste
              the token below.
            </p>
            <label className="mt-3 block text-xs font-medium" htmlFor="hrerp-dev-token">
              Paste bearer token
            </label>
            <Textarea
              id="hrerp-dev-token"
              className="mt-1 font-mono text-xs"
              rows={3}
              placeholder="Paste token from scripts/issue-dev-jwt.mjs"
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v) onDevTokenPaste(v);
              }}
            />
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
