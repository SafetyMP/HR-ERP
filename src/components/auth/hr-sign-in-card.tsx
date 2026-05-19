"use client";

import Link from "next/link";

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

export function HrSignInCard({
  title,
  description,
  returnTo = "/",
  onDevTokenPaste,
}: Props) {
  const loginHref = `/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
  const showDevTokenPaste =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ALLOW_DEMO_DEV_SIGNIN === "true";

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
