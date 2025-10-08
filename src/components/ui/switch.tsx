import * as React from "react";

import { cn } from "@/lib/utils";

type SwitchProps = {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
};

export function Switch({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
  className,
}: SwitchProps) {
  const [internalChecked, setInternalChecked] = React.useState(
    defaultChecked ?? false
  );
  const isControlled = checked !== undefined;
  const currentChecked = isControlled ? checked : internalChecked;

  const handleToggle = () => {
    if (disabled) return;
    const next = !currentChecked;
    if (!isControlled) {
      setInternalChecked(next);
    }
    onCheckedChange?.(next);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={currentChecked}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        "relative inline-flex h-6 w-11 items-center rounded-full border border-transparent transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60",
        currentChecked ? "bg-pink-600" : "bg-gray-300",
        className
      )}
    >
      <span
        className={cn(
          "absolute h-5 w-5 translate-x-1 rounded-full bg-white shadow transition",
          currentChecked ? "translate-x-5" : "translate-x-1"
        )}
      />
    </button>
  );
}
