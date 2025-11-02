import type { ReactNode } from "react";

import { SellerShell } from "@/components/seller/shell";

export default function SellerConsoleLayout({ children }: { children: ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
