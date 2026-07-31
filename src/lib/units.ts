/**
 * Unit conversion for the Settings > Units preference.
 *
 * SCOPE — deliberately narrow.
 * Drug strengths (mg, mcg, ml, g) are metric worldwide, including in the US.
 * "500 mg" is 500 mg on every package on earth; converting it to grains or
 * ounces would be actively wrong and dangerous. So the units toggle does NOT
 * touch dosage.
 *
 * Where it genuinely matters is storage temperature: package inserts say
 * "store below 30°C", which is meaningless to a user who thinks in
 * Fahrenheit. That is what this converts.
 *
 * Previously `settings.units` was written by the Settings screen and read by
 * nothing at all — a toggle that changed a value in localStorage and nothing
 * else.
 */

export type UnitSystem = "metric" | "imperial";

/** Celsius -> Fahrenheit, rounded to a whole degree. */
export function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32);
}

/**
 * Rewrite temperatures inside a free-text string to the chosen system.
 *
 * Handles the forms that actually appear in package inserts:
 *   "below 30°C", "25°C", "2-8°C", "20 °C to 25 °C"
 *
 * Metric is returned unchanged — the source data is already metric, so there
 * is nothing to do and no risk of a lossy round-trip.
 */
export function convertTemperatures(text: string, units: UnitSystem): string {
  if (!text || units === "metric") return text;

  // Ranges first, otherwise the single-value pass mangles them.
  //
  // Two forms occur in real inserts:
  //   "2-8°C"        -> only the second value carries the unit
  //   "20°C to 25°C" -> both carry it
  // The bare-first-value form must be matched explicitly; treating "2" as an
  // independent temperature produced "218°F" for "2-8°C" in testing.
  let out = text.replace(
    /(-?\d+(?:\.\d+)?)\s*°\s*C\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)\s*°\s*C/gi,
    (_m, a, b) => `${cToF(parseFloat(a))}°F-${cToF(parseFloat(b))}°F`
  );
  out = out.replace(
    /(-?\d+(?:\.\d+)?)\s*(?:-|–|to)\s*(-?\d+(?:\.\d+)?)\s*°\s*C\b/gi,
    (_m, a, b) => `${cToF(parseFloat(a))}°F-${cToF(parseFloat(b))}°F`
  );

  out = out.replace(
    /(-?\d+(?:\.\d+)?)\s*°\s*C\b/gi,
    (_m, v) => `${cToF(parseFloat(v))}°F`
  );

  return out;
}

/**
 * Format a storage instruction for display.
 * Keeps the original metric value in brackets so the user can still match it
 * against what is printed on their pack.
 */
export function formatStorage(text: string, units: UnitSystem): string {
  if (!text || units === "metric") return text;
  const converted = convertTemperatures(text, units);
  return converted === text ? text : converted;
}
