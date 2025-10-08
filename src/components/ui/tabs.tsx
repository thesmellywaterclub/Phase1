import * as React from "react";

import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

type TabsProps = React.ComponentPropsWithoutRef<"div"> & {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
};

function Tabs({
  className,
  children,
  defaultValue,
  value,
  onValueChange,
  ...props
}: TabsProps) {
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

  const contextValue = React.useMemo(
    () => ({
      value: currentValue,
      setValue,
    }),
    [currentValue, setValue]
  );

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cn("space-y-4", className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

function useTabsContext(component: string) {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error(`${component} must be used within <Tabs>.`);
  }
  return context;
}

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    role="tablist"
    className={cn(
      "inline-flex h-12 items-center justify-center rounded-full bg-gray-100 p-1 text-gray-600",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

type TabsTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  value: string;
};

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: currentValue, setValue } = useTabsContext("TabsTrigger");
    const selected = currentValue === value;
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={selected}
        onClick={() => setValue(value)}
        className={cn(
          "inline-flex min-w-[120px] items-center justify-center rounded-full px-3 py-1.5 text-sm font-medium transition",
          selected
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-900",
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

type TabsContentProps = React.ComponentPropsWithoutRef<"div"> & {
  value: string;
};

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: currentValue } = useTabsContext("TabsContent");
    const hidden = currentValue !== value;
    return (
      <div
        ref={ref}
        role="tabpanel"
        hidden={hidden}
        className={cn("rounded-2xl", className)}
        {...props}
      >
        {!hidden && children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
