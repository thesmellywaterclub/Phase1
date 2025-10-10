import * as React from "react";

import { cn } from "@/lib/utils";

type CheckboxProps = React.ComponentPropsWithoutRef<"input"> & {
  onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, onCheckedChange, ...props }, ref) => (
    <span className={cn("inline-flex items-center", className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer sr-only"
        onChange={(event) => {
          onCheckedChange?.(event.target.checked);
          props.onChange?.(event);
        }}
        {...props}
      />
      <span
        className={cn(
          "inline-flex size-4 items-center justify-center rounded border border-gray-300 bg-white transition peer-checked:border-pink-600 peer-checked:bg-pink-600 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-pink-600"
        )}
      >
        <span className="size-2 rounded-sm bg-white opacity-0 transition peer-checked:opacity-100" />
      </span>
    </span>
  )
);

Checkbox.displayName = "Checkbox";

export { Checkbox };
