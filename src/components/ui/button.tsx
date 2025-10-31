import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg font-accent tracking-wide rounded-full",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full",
        outline: "border-2 border-border bg-transparent text-foreground hover:bg-muted rounded-full",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90 hover:shadow-lg font-accent tracking-wide rounded-full",
        ghost: "hover:bg-muted hover:text-foreground rounded-full",
        link: "text-primary underline-offset-4 hover:underline",
        kusama: "bg-primary text-primary-foreground hover:shadow-[0_8px_24px_hsla(45,95%,58%,0.4)] hover:scale-105 transition-all font-accent tracking-wide rounded-full",
        polka: "bg-card border-2 border-primary text-foreground hover:bg-primary hover:text-primary-foreground transition-all rounded-full relative overflow-hidden before:absolute before:inset-0 before:bg-[radial-gradient(circle,hsl(var(--primary))_1px,transparent_1px)] before:bg-[length:8px_8px] before:opacity-20",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
