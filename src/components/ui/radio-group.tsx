import * as React from "react";

import { cn } from "@/lib/utils";

type RadioGroupContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const RadioGroupContext =
  React.createContext<RadioGroupContextValue | null>(null);

type RadioGroupProps = React.ComponentPropsWithoutRef<"div"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

function RadioGroup({
  className,
  value,
  defaultValue,
  onValueChange,
  ...props
}: RadioGroupProps) {
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? "");
  const isControlled = value !== undefined;
  const currentValue = isControlled ? value : internalValue;

  const setValue = React.useCallback(
    (next: string) => {
      if (!isControlled) {
        setInternalValue(next);
      }
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  return (
    <RadioGroupContext.Provider value={{ value: currentValue, setValue }}>
      <div
        role="radiogroup"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </RadioGroupContext.Provider>
  );
}

type RadioGroupItemProps = React.ComponentPropsWithoutRef<"input"> & {
  value: string;
};

const RadioGroupItem = React.forwardRef<HTMLInputElement, RadioGroupItemProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(RadioGroupContext);
    if (!context) {
      throw new Error("RadioGroupItem must be used within a RadioGroup");
    }
    const checked = context.value === value;

    return (
      <span className="inline-flex items-center">
        <input
          ref={ref}
          type="radio"
          value={value}
          checked={checked}
          onChange={() => context.setValue(value)}
          className="sr-only"
          {...props}
        />
        <span
          className={cn(
            "inline-flex size-4 items-center justify-center rounded-full border border-gray-300 transition",
            checked ? "border-pink-600" : "border-gray-300"
          )}
        >
          <span
            className={cn(
              "size-2 rounded-full bg-pink-600 transition",
              checked ? "opacity-100" : "opacity-0"
            )}
          />
        </span>
      </span>
    );
  }
);

RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
