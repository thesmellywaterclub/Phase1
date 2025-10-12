const DEFAULT_LOCALE = "en-IN"
const DEFAULT_CURRENCY = "INR"

type FormatCurrencyOptions = {
  locale?: string
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

export function formatINR(
  amount: number | null | undefined,
  {
    locale = DEFAULT_LOCALE,
    currency = DEFAULT_CURRENCY,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  }: FormatCurrencyOptions = {}
): string {
  if (amount === null || amount === undefined) {
    return "—"
  }

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}

export function formatPaise(
  amount: number | null | undefined,
  options?: FormatCurrencyOptions
): string {
  return formatINR(amount, options)
}
