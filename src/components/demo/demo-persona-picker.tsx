"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, UserRound, Users } from "lucide-react";

import {
  DEMO_PREVIEW_PERSONAS,
  demoPreviewBootstrapHref,
  type DemoPreviewPersona,
} from "@/lib/auth/demo-preview-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PERSONA_ICONS: Record<DemoPreviewPersona, typeof UserRound> = {
  employee: UserRound,
  manager: Users,
  hr: Briefcase,
};

const DEMO_PREVIEW_ORDER: DemoPreviewPersona[] = ["employee", "manager", "hr"];

type Props = {
  returnTo?: string;
  className?: string;
};

export function DemoPersonaPicker({ returnTo, className }: Props) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-3", className)}>
      {DEMO_PREVIEW_ORDER.map((persona) => {
        const spec = DEMO_PREVIEW_PERSONAS[persona];
        const Icon = PERSONA_ICONS[persona];
        const landing = returnTo ?? spec.defaultReturnTo;
        return (
          <Card
            key={persona}
            className="group border-primary/15 bg-card/80 shadow-sm transition-shadow hover:shadow-md"
          >
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" aria-hidden />
                </span>
                <CardTitle className="text-base">{spec.label}</CardTitle>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {spec.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild className="w-full gap-2" size="sm">
                <Link href={demoPreviewBootstrapHref(persona, landing)}>
                  Start as {spec.label.toLowerCase()}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
