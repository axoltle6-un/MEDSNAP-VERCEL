import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getAllMedicinePages,
  getMedicinePage,
  pageTitle,
  pageDescription,
} from "@/lib/medicine-pages";
import { getClassInfo } from "@/lib/drug-class-info";
import { getMedicineImageFor, proxiedImageUrl } from "@/lib/medicine-images";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://medsnap.vercel.app"
).replace(/\/+$/, "");

/**
 * Pre-render every brand at build time.
 *
 * These are static HTML documents, not client-rendered app screens: a crawler
 * gets the full content on first byte with no JavaScript execution required.
 * That is the entire point — the SPA at "/" was a single indexable page.
 */
export function generateStaticParams() {
  return getAllMedicinePages().map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = getMedicinePage(slug);
  if (!page) return { title: "Medicine not found | MedSnap" };

  const url = `${SITE}/medicine/${page.slug}`;
  const title = pageTitle(page);
  const description = pageDescription(page);

  // Keywords mirror how people actually search for these locally —
  // "<brand> uses", "<brand> price", "<brand> side effects".
  const keywords = [
    page.brand,
    `${page.brand} uses`,
    `${page.brand} side effects`,
    `${page.brand} dosage`,
    `${page.brand} ${page.regionLabel}`,
    page.generic,
    ...page.aliases,
    ...(page.localName ? [page.localName] : []),
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "MedSnap AI",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function MedicinePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = getMedicinePage(slug);
  if (!page) notFound();

  const url = `${SITE}/medicine/${page.slug}`;
  const info = getClassInfo(page.drugClass);
  const image = getMedicineImageFor(page.brand);

  // Questions people actually type. Rendered as visible content AND as
  // FAQPage schema, which is what makes a page eligible for the expandable
  // FAQ treatment in search results.
  const faqs = [
    {
      q: `What is ${page.brand} used for?`,
      a: page.usedFor.length
        ? `${page.brand} contains ${page.generic}. It is used for: ${page.usedFor.join("; ")}.`
        : `${page.brand} contains ${page.generic}, a ${page.drugClass || "prescription medicine"}. Check the package insert for the approved indications in ${page.regionLabel}.`,
    },
    {
      q: `How does ${page.brand} work?`,
      a: info.howItWorks,
    },
    {
      q: `How should I take ${page.brand}?`,
      a: `${info.howToTake} Always follow the dose on your pack or from your prescriber.`,
    },
    {
      q: `What are the side effects of ${page.brand}?`,
      a: `Common: ${info.commonSideEffects.join(", ")}. Seek medical advice for: ${info.seriousSideEffects.join("; ")}.`,
    },
    {
      q: `Is ${page.brand} available over the counter in ${page.regionLabel}?`,
      a: page.otc
        ? `${page.brand} is generally available without a prescription in ${page.regionLabel}, but a pharmacist can advise whether it suits you.`
        : `${page.brand} is normally supplied on prescription in ${page.regionLabel}. Speak to a doctor or pharmacist.`,
    },
    ...(page.alsoSoldAs.length
      ? [{
          q: `What are the alternatives to ${page.brand}?`,
          a: `Other brands containing the same active ingredient in ${page.regionLabel} include ${page.alsoSoldAs.join(", ")}. They are not always interchangeable — check with a pharmacist.`,
        }]
      : []),
  ];

  // Drug schema, so the page is eligible for rich results. Only fields we
  // genuinely hold are emitted — no invented ratings or clinical claims.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Drug",
        "@id": `${url}#drug`,
        name: page.brand,
        alternateName: [...page.aliases, ...(page.localName ? [page.localName] : [])],
        activeIngredient: page.generic,
        ...(page.drugClass ? { drugClass: page.drugClass } : {}),
        ...(page.manufacturer
          ? { manufacturer: { "@type": "Organization", name: page.manufacturer } }
          : {}),
        ...(page.form ? { dosageForm: page.form } : {}),
        ...(page.strength ? { strengthValue: page.strength } : {}),
        ...(page.usedFor.length ? { indication: page.usedFor.join("; ") } : {}),
        isAvailableGenerically: Boolean(page.alsoSoldAs.length),
        prescriptionStatus: page.otc
          ? "OTC"
          : "PrescriptionOnly",
        ...(image ? { image: image.u } : {}),
        url,
      },
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "MedSnap", item: SITE },
          { "@type": "ListItem", position: 2, name: "Medicines", item: `${SITE}/medicine` },
          { "@type": "ListItem", position: 3, name: page.brand, item: url },
        ],
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
        <Link href="/" className="hover:underline">MedSnap</Link>
        <span className="mx-2">/</span>
        <Link href="/medicine" className="hover:underline">Medicines</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{page.brand}</span>
      </nav>

      <header className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            {page.regionLabel}
          </span>
          {page.otc && (
            <span className="rounded-full bg-safe-soft px-3 py-1 text-xs font-semibold text-safe">
              Over the counter
            </span>
          )}
          {page.tcm && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              Traditional Chinese Medicine
            </span>
          )}
        </div>

        {image && (
          <figure className="mb-5 overflow-hidden rounded-2xl border border-border bg-white p-4">
            {/* Plain <img>: these are remote hosts and the page is statically
                prerendered, so next/image would add a runtime optimiser hop
                for no benefit. width/height prevent layout shift (CLS). */}
            <img
              src={proxiedImageUrl(image.u)}
              alt={
                image.t === "product"
                  ? `${page.brand} (${page.generic}) packaging or tablets`
                  : `Chemical structure of ${page.generic}, the active ingredient in ${page.brand}`
              }
              width={400}
              height={300}
              loading="eager"
              className="mx-auto h-auto max-h-56 w-auto object-contain"
            />
            <figcaption className="mt-3 text-center text-xs text-muted-foreground">
              {image.t === "product"
                ? `${page.brand} — image via Wikimedia Commons`
                : `2D chemical structure of ${page.generic.split(/[+(]/)[0].trim()} — via NIH PubChem`}
            </figcaption>
          </figure>
        )}

        <h1 className="font-display text-3xl font-extrabold tracking-tight">
          {page.brand}
          {page.localName && (
            <span className="ml-2 text-2xl text-muted-foreground">{page.localName}</span>
          )}
        </h1>

        <p className="mt-2 text-lg text-muted-foreground">
          {page.generic}
          {page.strength ? ` · ${page.strength}` : ""}
          {page.form ? ` · ${page.form}` : ""}
        </p>
      </header>

      {page.usedFor.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">What is {page.brand} used for?</h2>
          <ul className="space-y-2">
            {page.usedFor.map((u, i) => (
              <li key={i} className="flex gap-2 text-sm leading-relaxed">
                <span className="text-primary">•</span>
                <span>{u}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">{page.brand} details</h2>
        <dl className="grid gap-3 sm:grid-cols-2">
          <Detail label="Active ingredient" value={page.generic} />
          {page.strength && <Detail label="Strength" value={page.strength} />}
          {page.form && <Detail label="Form" value={page.form} />}
          {page.drugClass && <Detail label="Drug class" value={page.drugClass} />}
          {page.manufacturer && <Detail label="Manufacturer" value={page.manufacturer} />}
          <Detail label="Registered in" value={page.regionLabel} />
        </dl>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">How does {page.brand} work?</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{info.howItWorks}</p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">How to take {page.brand}</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">{info.howToTake}</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Always follow the dose printed on your pack or given by your
          prescriber — it can differ from the general guidance above.
        </p>
      </section>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <h2 className="mb-2 text-base font-bold">Common side effects</h2>
          <ul className="space-y-1.5">
            {info.commonSideEffects.map((x, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {x}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-danger/30 bg-danger-soft/30 p-4">
          <h2 className="mb-2 text-base font-bold text-danger">Seek medical advice</h2>
          <ul className="space-y-1.5">
            {info.seriousSideEffects.map((x, i) => (
              <li key={i} className="text-sm text-muted-foreground">• {x}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">Who should be careful with {page.brand}?</h2>
        <ul className="space-y-2">
          {info.cautions.map((x, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span className="text-warn">•</span><span>{x}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-xl font-bold">{page.brand} interactions</h2>
        <ul className="space-y-2">
          {info.interactions.map((x, i) => (
            <li key={i} className="flex gap-2 text-sm leading-relaxed text-muted-foreground">
              <span className="text-primary">•</span><span>{x}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-muted-foreground">
          This is not a complete list. Tell your pharmacist about every medicine
          and supplement you take.
        </p>
      </section>

      {page.composition && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">Composition</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{page.composition}</p>
        </section>
      )}

      {page.alsoSoldAs.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xl font-bold">
            Other brands containing {page.generic.split(/[+(]/)[0].trim()}
          </h2>
          <div className="flex flex-wrap gap-2">
            {page.alsoSoldAs.map((b) => (
              <Link
                key={b}
                href={`/medicine/${b.toLowerCase().replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-")}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-primary/40 hover:text-primary"
              >
                {b}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 text-xl font-bold">
          Frequently asked questions about {page.brand}
        </h2>
        <div className="space-y-4">
          {faqs.map((f, i) => (
            <div key={i} className="rounded-xl border border-border/60 bg-card p-4">
              <h3 className="text-sm font-bold">{f.q}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-2 text-lg font-bold">Identify this medicine from a photo</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Not sure the pack in your hand is {page.brand}? Scan it and get a full
          report cross-checked against openFDA, RxNorm and DailyMed.
        </p>
        <Link
          href="/capture"
          className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-semibold text-white"
        >
          Scan a medicine
        </Link>
      </section>

      <footer className="border-t border-border pt-6 text-xs leading-relaxed text-muted-foreground">
        <p className="mb-2">
          <strong>Source:</strong>{" "}
          <a href={page.regulatorUrl} rel="noopener noreferrer" target="_blank" className="underline">
            {page.regulator}
          </a>
          . Clinical data cross-referenced with openFDA, RxNorm and DailyMed.
        </p>
        <p>
          <strong>Medical disclaimer:</strong> This page is for information only
          and is not medical advice. Always read the package insert and consult a
          qualified pharmacist or doctor before taking any medicine.
        </p>
      </footer>
    </main>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm font-medium">{value}</dd>
    </div>
  );
}
