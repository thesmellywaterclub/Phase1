import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const initiatives = [
  {
    title: "Catalog freshness",
    description: "Add or update brands, hero products, and seasonal drops.",
    href: "/admin/catalog",
    action: "Manage products",
  },
  {
    title: "Seller enablement",
    description: "Ensure every published SKU has at least one active seller offer.",
    href: "/seller",
    action: "Review offers",
  },
  {
    title: "Quality review",
    description: "Audit hero imagery, notes, and descriptions for accuracy.",
    href: "/products",
    action: "Preview storefront",
  },
] as const;

const playbook = [
  "Sync with merchandising every Monday for upcoming launches.",
  "Keep at least one 50 ml variant in stock for discovery sets.",
  "Use descriptive slugs – lowercase, hyphenated, and brand-specific.",
  "Notes are comma separated; skip blanks to avoid noisy metadata.",
];

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        {initiatives.map((item) => (
          <Card key={item.title} className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-slate-900">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">{item.description}</p>
              <Button asChild className="w-full" variant="secondary">
                <Link href={item.href}>{item.action}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Launch checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal space-y-3 pl-6 text-sm text-slate-700">
              <li>Create or select the brand, then add the hero product.</li>
              <li>Add at least one variant SKU and share it with onboarding sellers.</li>
              <li>Upload imagery (600px+) and confirm descriptive copy + notes.</li>
              <li>Flip the product to active once offers and QA sign-off are complete.</li>
            </ol>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-slate-900">
              Playbook snippets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm text-slate-600">
              {playbook.map((tip) => (
                <li key={tip} className="rounded-lg bg-slate-100 px-3 py-2">
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
