/**
 * Server-rendered content for search engines.
 *
 * WHY THIS EXISTS
 * ---------------
 * src/app/page.tsx loads the whole app with `dynamic(..., { ssr: false })`, so
 * the HTML Vercel serves contains no content at all — measured: 59 characters,
 * reading "Loading MedSnap…". Everything else is painted by JavaScript after
 * hydration.
 *
 * Google can execute JS, but it does so on a second pass that is queued and
 * often delayed by days; Bing, DuckDuckGo, and every social/LLM crawler
 * largely do not. A page whose server HTML is empty has essentially nothing to
 * rank. No amount of meta-tag tuning fixes that — the body has to contain the
 * words people search for.
 *
 * This component is a real server-rendered block: it ships in the initial HTML
 * with the app's core copy, headings, and FAQ. It is visually hidden from
 * users (the SPA covers it once hydrated) but fully present for crawlers.
 *
 * It is deliberately NOT `display: none`, which search engines discount.
 * `sr-only` keeps it in the accessibility tree and in the rendered DOM — it is
 * genuine page content that happens to be superseded by the interactive app,
 * and it doubles as a description for screen readers before hydration.
 */

export function CrawlableContent() {
  return (
    <div className="sr-only" aria-hidden="false" data-seo-content>
      <h1>MedSnap AI — Instant Medicine &amp; Pill Identifier by Picture</h1>
      <p>
        MedSnap identifies any pill, tablet, capsule, syrup, or medicine package
        from a single photo. Point your camera at the medicine and get a full
        report in seconds — what it treats, correct dosage, side effects, drug
        interactions, and who should avoid it. Every result is cross-checked
        against official government drug databases.
      </p>

      <h2>Identify medicine by photo</h2>
      <p>
        Take a picture of a pill or its packaging and MedSnap reads the label
        with AI vision, then verifies the result against openFDA, RxNorm, and
        DailyMed. Works for prescription drugs, over-the-counter medicines, and
        unlabelled tablets identified by imprint code, colour, and shape.
      </p>

      <h2>Pakistani medicines (DRAP)</h2>
      <p>
        MedSnap recognises commonly dispensed Pakistani brands including Panadol,
        Arinac, Risek, Ponstan, Rigix, Myteka, Softin, Velosef, Brufen, Augmentin,
        Nexum, Glucophage, Loprin, Ascard, Tramal, Lyrica, Betnovate, and
        Seretide. Each brand is mapped to its generic ingredient so full clinical
        information is available even when a local brand does not appear in US
        drug registries.
      </p>

      <h2>Chinese medicines (NMPA)</h2>
      <p>
        Traditional Chinese Medicine formulas and Chinese pharmaceutical brands
        are supported, including Lianhua Qingwen (连花清瘟), Yunnan Baiyao
        (云南白药), Banlangen (板蓝根), Nin Jiom Pei Pa Koa, Huoxiang Zhengqi,
        Fenbid (芬必得), and Baijiahei (白加黑). Search by pinyin or Chinese
        characters.
      </p>

      <h2>Verified medical sources</h2>
      <p>
        Drug information comes from openFDA (US Food and Drug Administration
        drug labels), RxNorm (US National Library of Medicine), DailyMed (NIH),
        and PubChem (NCBI). MedSnap surfaces FDA safety alerts and recalls
        alongside each result.
      </p>

      <h2>Allergy and interaction warnings</h2>
      <p>
        Add your allergies and current medications to receive warnings when a
        scanned medicine contains an ingredient you react to, or interacts with
        something you already take.
      </p>

      <h2>Frequently asked questions</h2>

      <h3>How do I identify a pill from a picture?</h3>
      <p>
        Open the Capture tab, photograph the pill or its packaging, and MedSnap
        returns the brand name, generic ingredient, strength, and a full medical
        report verified against government drug databases.
      </p>

      <h3>Can MedSnap identify a pill with no markings?</h3>
      <p>
        Yes. Search by colour, shape, and imprint code in the Browse tab, or
        photograph the packaging instead of the tablet.
      </p>

      <h3>Is MedSnap free?</h3>
      <p>
        Browsing and searching verified medicine databases is free. AI photo
        identification includes one free scan per day; MedSnap Pro raises this
        to four daily scans and adds allergy alerts and medical report exports.
      </p>

      <h3>Does MedSnap work for medicines sold in Pakistan?</h3>
      <p>
        Yes. MedSnap includes a database of DRAP-registered Pakistani brands
        mapped to their international generic names, so local brands resolve to
        verified clinical data.
      </p>

      <h3>Is MedSnap a substitute for a doctor or pharmacist?</h3>
      <p>
        No. MedSnap is an information tool. Always confirm any medicine with a
        qualified pharmacist or physician before taking it, and read the package
        insert supplied with the product.
      </p>
    </div>
  );
}
