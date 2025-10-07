import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/10 text-primary hover:bg-primary/15",
        outline: "border-input text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Badge = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="badge"
    className={cn(badgeVariants({ variant }), className)}
    {...props}
  />
))

Badge.displayName = "Badge"

export { Badge, badgeVariants }
