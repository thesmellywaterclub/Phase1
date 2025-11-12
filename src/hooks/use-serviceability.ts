import { useCallback, useEffect, useRef, useState } from "react";

import {
  calculateShippingCharges,
  checkDeliveryServiceability,
  type ServiceabilityResult,
} from "@/data/shipments";

const PINCODE_REGEX = /^\d{6}$/;

function normalizePin(pin: string | null | undefined): string {
  return (pin ?? "").replace(/\D/g, "").slice(0, 6);
}

type ServiceabilityOptions = {
  declaredValuePaise?: number;
  weightGrams?: number;
  paymentType?: "Prepaid" | "COD";
};

export function useServiceability(
  pincode: string,
  options: ServiceabilityOptions = {}
) {
  const [serviceability, setServiceability] = useState<ServiceabilityResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const lastCheckedPin = useRef<string | null>(null);
  const inFlightPin = useRef<string | null>(null);
  const optionsRef = useRef<ServiceabilityOptions>(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  const runCheck = useCallback(
    async (targetPin?: string) => {
      const normalized = normalizePin(targetPin ?? pincode);
      if (!PINCODE_REGEX.test(normalized)) {
        setError(normalized ? "Enter a valid PIN code" : null);
        return null;
      }

      if (
        normalized === lastCheckedPin.current ||
        normalized === inFlightPin.current
      ) {
        return serviceability;
      }

      try {
        inFlightPin.current = normalized;
        setIsChecking(true);
        setError(null);
        const snapshot = optionsRef.current;
        const result = await checkDeliveryServiceability(normalized, {
          paymentType: snapshot.paymentType ?? "Prepaid",
          declaredValuePaise: snapshot.declaredValuePaise,
          weightGrams: snapshot.weightGrams,
        });
        let enriched = result;
        try {
          const charges = await calculateShippingCharges(normalized, {
            paymentType: snapshot.paymentType ?? "Prepaid",
            declaredValuePaise: snapshot.declaredValuePaise,
            weightGrams: snapshot.weightGrams,
          });
          enriched = {
            ...result,
            charges: {
              total:
                charges.charges.total ?? result.charges.total ?? null,
              base:
                charges.charges.base ?? result.charges.base ?? null,
              cod: charges.charges.cod ?? result.charges.cod ?? null,
            },
          };
        } catch (quoteError) {
          console.warn("[serviceability] shipping charge quote failed", quoteError);
        }

        setServiceability(enriched);
        lastCheckedPin.current = normalized;
        return enriched;
      } catch (checkError) {
        const message =
          checkError instanceof Error
            ? checkError.message
            : "Unable to check delivery right now.";
        setError(message);
        return null;
      } finally {
        inFlightPin.current = null;
        setIsChecking(false);
      }
    },
    [pincode, serviceability]
  );

  useEffect(() => {
    const normalized = normalizePin(pincode);
    if (!normalized) {
      setServiceability(null);
      setError(null);
      lastCheckedPin.current = null;
      return;
    }

    if (!PINCODE_REGEX.test(normalized)) {
      return;
    }

    if (
      normalized === lastCheckedPin.current ||
      normalized === inFlightPin.current
    ) {
      return;
    }

    void runCheck(normalized);
  }, [pincode, runCheck]);

  return {
    serviceability,
    serviceabilityError: error,
    isCheckingServiceability: isChecking,
    checkServiceability: runCheck,
  };
}
