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
  const loginHref = `/api/auth/oidc/login?returnTo=${encodeURIComponent(returnTo)}`;
  const isDev = process.env.NODE_ENV === "development";

  return (
    <Card className="mx-auto w-full max-w-lg shadow-sm">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button asChild className="w-full">
          <Link href={loginHref}>Sign in with your organization account</Link>
        </Button>
        {isDev && onDevTokenPaste ? (
          <>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Development: mint a token with{" "}
              <code className="font-mono">npm run jwt:dev</code>, then paste below or open{" "}
              <code className="font-mono">
                /api/auth/dev-bootstrap?token=…&amp;returnTo={returnTo}
              </code>
              .
            </p>
            <label
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
              htmlFor="hrerp-dev-token"
            >
              Development bearer token
            </label>
            <textarea
              id="hrerp-dev-token"
              className="w-full rounded-md border border-zinc-300 bg-white p-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-950"
              rows={3}
              placeholder="Paste token from scripts/issue-dev-jwt.mjs"
              onChange={(e) => {
                const v = e.target.value.trim();
                if (v) onDevTokenPaste(v);
              }}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
