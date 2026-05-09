import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-10 min-w-10 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:brightness-110 active:brightness-95 dark:hover:brightness-115",
        destructive:
          "border-2 border-foreground/25 bg-destructive text-destructive-foreground shadow-sm hover:brightness-110 active:brightness-95 dark:border-foreground/35",
        outline:
          "border-2 border-border bg-card text-card-foreground hover:bg-primary-muted dark:hover:bg-primary-muted",
        secondary:
          "border border-border bg-primary-muted text-foreground hover:brightness-95 dark:hover:brightness-110",
        ghost: "text-foreground hover:bg-primary-muted dark:hover:bg-primary-muted",
        link: "min-h-0 min-w-0 px-0 text-primary underline decoration-2 underline-offset-4 hover:brightness-125 dark:hover:brightness-125",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = "button", ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref as never}
        {...(asChild ? {} : { type })}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
