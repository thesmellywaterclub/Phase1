import * as React from "react"

import { cn } from "@/lib/utils"

function Separator({
  className,
  orientation = "horizontal",
  decorative = false,
  ...props
}: React.ComponentProps<"div"> & {
  orientation?: "horizontal" | "vertical"
  decorative?: boolean
}) {
  return (
    <div
      data-slot="separator"
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "bg-muted",
        orientation === "horizontal"
          ? "h-px w-full"
          : "h-full w-px",
        className
      )}
      {...props}
    />
  )
}

export { Separator }
