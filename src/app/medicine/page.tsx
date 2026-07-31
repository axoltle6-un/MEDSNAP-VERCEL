import type { Metadata } from "next";
import Link from "next/link";
import { getAllMedicinePages } from "@/lib/medicine-pages";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://medsnap.vercel.app"
).replace(/\/+$/, "");

export const metadata: Metadata = {
  title: "Medicine Directory — Pakistani (DRAP) & Chinese (NMPA) Brands | MedSnap",
  description:
    "Browse every medicine in the MedSnap directory: Pakistani DRAP-registered brands like Rigix, Myteka and Risek, plus Chinese NMPA products and Traditional Chinese Medicine formulas. Uses, dosage, ingredients and side effects.",
  alternates: { canonical: `${SITE}/medicine` },
  openGraph: {
    title: "Medicine Directory | MedSnap",
    description:
      "Pakistani (DRAP) and Chinese (NMPA) medicine brands with uses, dosage and ingredients.",
    url: `${SITE}/medicine`,
    type: "website",
  },
};

/**
 * Directory index.
 *
 * Without this, the ~160 brand pages are orphans — reachable only from the
 * sitemap. Search engines weight internal links heavily when deciding what to
 * crawl and how much authority to pass, so a real hub page materially affects
 * whether those pages get indexed at all.
 */
export default function MedicineIndex() {
  const pages = getAllMedicinePages();
  const pk = pages.filter((p) => p.region === "pk");
  const cn = pages.filter((p) => p.region === "cn");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE}/medicine#collection`,
    name: "MedSnap Medicine Directory",
    description:
      "Directory of Pakistani (DRAP) and Chinese (NMPA) registered medicines with uses, dosage and ingredients.",
    url: `${SITE}/medicine`,
    hasPart: pages.slice(0, 50).map((p) => ({
      "@type": "Drug",
      name: p.brand,
      activeIngredient: p.generic,
      url: `${SITE}/medicine/${p.slug}`,
    })),
  };

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">MedSnap</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Medicines</span>
      </nav>

      <header className="mb-10">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          Medicine directory
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {pages.length} medicines registered in Pakistan (DRAP) and China
          (NMPA), with active ingredients, uses and dosage forms. Clinical data
          is cross-referenced against openFDA, RxNorm and DailyMed.
        </p>
      </header>

      <Section
        title={`Pakistani medicines (DRAP) — ${pk.length}`}
        blurb="Brands commonly dispensed in Pakistani pharmacies, mapped to their international generic names."
        items={pk}
      />

      <Section
        title={`Chinese medicines (NMPA) — ${cn.length}`}
        blurb="Chinese brands and Traditional Chinese Medicine patent formulas, indexed by pinyin and Chinese characters."
        items={cn}
      />

      <footer className="mt-12 border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        For information only, not medical advice. Always read the package insert
        and consult a pharmacist or doctor.
      </footer>
    </main>
  );
}

function Section({
  title,
  blurb,
  items,
}: {
  title: string;
  blurb: string;
  items: ReturnType<typeof getAllMedicinePages>;
}) {
  if (!items.length) return null;
  return (
    <section className="mb-12">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mb-4 mt-1 text-sm text-muted-foreground">{blurb}</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/medicine/${p.slug}`}
              className="block rounded-xl border border-border/60 bg-card p-3 transition-colors hover:border-primary/40"
            >
              <span className="font-semibold">{p.brand}</span>
              {p.localName && (
                <span className="ml-1.5 text-muted-foreground">{p.localName}</span>
              )}
              <span className="block truncate text-xs text-muted-foreground">
                {p.generic}
                {p.strength ? ` · ${p.strength}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
