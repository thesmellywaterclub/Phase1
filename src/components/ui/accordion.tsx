import * as React from "react"

import { cn } from "@/lib/utils"

type AccordionContextType = {
  value: string | null
  onItemToggle: (value: string) => void
  collapsible: boolean
}

const AccordionContext = React.createContext<AccordionContextType | null>(null)

type AccordionProps = Omit<React.ComponentProps<"div">, "defaultValue" | "value"> & {
  type?: "single"
  collapsible?: boolean
  value?: string | null
  defaultValue?: string | null
  onValueChange?: (value: string) => void
}

function Accordion({
  className,
  type = "single",
  collapsible = false,
  value,
  defaultValue = null,
  onValueChange,
  ...props
}: AccordionProps) {
  if (type !== "single") {
    console.warn("Only single accordions are supported in this simplified component.")
  }

  const isControlled = value !== undefined
  const [internalValue, setInternalValue] = React.useState<string | null>(
    defaultValue
  )

  const currentValue = isControlled ? value ?? null : internalValue

  const handleToggle = React.useCallback(
    (itemValue: string) => {
      let nextValue: string | null = itemValue
      if (currentValue === itemValue) {
        nextValue = collapsible ? null : itemValue
      }

      if (!isControlled) {
        setInternalValue(nextValue)
      }

      onValueChange?.(nextValue ?? "")
    },
    [collapsible, currentValue, isControlled, onValueChange]
  )

  return (
    <AccordionContext.Provider
      value={{ value: currentValue, onItemToggle: handleToggle, collapsible }}
    >
      <div
        data-slot="accordion"
        className={cn("space-y-3", className)}
        {...props}
      />
    </AccordionContext.Provider>
  )
}

type AccordionItemContextType = {
  value: string
  open: boolean
  toggle: () => void
}

const AccordionItemContext =
  React.createContext<AccordionItemContextType | null>(null)

type AccordionItemProps = React.ComponentProps<"div"> & {
  value: string
}

function AccordionItem({ className, value, ...props }: AccordionItemProps) {
  const context = React.useContext(AccordionContext)

  if (!context) {
    throw new Error(
      "AccordionItem must be used within an Accordion component."
    )
  }

  const open = context.value === value

  const toggle = React.useCallback(() => {
    context.onItemToggle(value)
  }, [context, value])

  return (
    <AccordionItemContext.Provider value={{ value, open, toggle }}>
      <div
        data-slot="accordion-item"
        data-state={open ? "open" : "closed"}
        className={cn("rounded-xl border border-border/60 px-4", className)}
        {...props}
      />
    </AccordionItemContext.Provider>
  )
}

const AccordionTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionItemContext)

  if (!context) {
    throw new Error(
      "AccordionTrigger must be used within an AccordionItem component."
    )
  }

  return (
    <button
      ref={ref}
      type="button"
      data-slot="accordion-trigger"
      aria-expanded={context.open}
      onClick={context.toggle}
      className={cn(
        "flex w-full items-center justify-between gap-4 py-4 text-left text-sm font-medium transition hover:text-foreground",
        className
      )}
      {...props}
    >
      <span>{children}</span>
      <svg
        aria-hidden="true"
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          context.open ? "rotate-180" : "rotate-0"
        )}
        viewBox="0 0 24 24"
      >
        <path
          d="M6 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
})

AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(AccordionItemContext)

  if (!context) {
    throw new Error(
      "AccordionContent must be used within an AccordionItem component."
    )
  }

  return (
    <div
      ref={ref}
      data-slot="accordion-content"
      hidden={!context.open}
      className={cn(
        "pb-4 text-sm text-muted-foreground",
        context.open ? "block" : "hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
})

AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
