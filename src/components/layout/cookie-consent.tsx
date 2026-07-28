"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { useHasMounted } from "@/hooks/use-has-mounted";
import { applyConsent, readConsentCookie } from "@/lib/consent";

/**
 * Cookie consent banner — shows on first visit after hydration completes.
 */
export function CookieConsent() {
  const mounted = useHasMounted();
  const cookieConsent = useAppStore((s) => s.cookieConsent);
  const setCookieConsent = useAppStore((s) => s.setCookieConsent);
  const navigate = useAppStore((s) => s.navigate);

  /**
   * Enforce the stored decision on every load.
   *
   * The banner used to only set a value in the store — nothing read it, so
   * "Accept" and "Reject" behaved identically. Now the choice is reconciled
   * with a real first-party cookie and analytics is enabled/disabled to match.
   */
  React.useEffect(() => {
    if (!mounted) return;

    const cookieValue = readConsentCookie();

    if (cookieValue) {
      // Cookie is authoritative — re-apply it (and heal the store if needed).
      if (cookieValue !== cookieConsent) setCookieConsent(cookieValue);
      void applyConsent(cookieValue);
    } else if (cookieConsent) {
      // Store has a decision from before cookies were wired up — honour it.
      void applyConsent(cookieConsent);
    }
  }, [mounted, cookieConsent, setCookieConsent]);

  const decide = React.useCallback(
    (value: "accepted" | "rejected") => {
      setCookieConsent(value);
      void applyConsent(value);
    },
    [setCookieConsent]
  );

  // Prevent SSR vs Client hydration mismatch by delaying banner render until client mount
  if (!mounted) return null;

  const show = cookieConsent === null && readConsentCookie() === null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 z-[90] p-4 md:p-6"
        >
          <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-white p-4 shadow-lifted md:p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Cookie className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold">We use cookies</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  MedSnap uses cookies to keep you signed in, remember your preferences,
                  and improve your experience. We don't sell your data.{" "}
                  <button
                    onClick={() => navigate("legal-privacy")}
                    className="font-medium text-primary hover:underline"
                  >
                    Learn more
                  </button>
                </p>
                <div className="mt-3 flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => decide("accepted")}
                    className="h-9 rounded-lg px-4 text-xs font-semibold"
                  >
                    Accept all
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => decide("rejected")}
                    className="h-9 rounded-lg px-4 text-xs font-medium"
                  >
                    Reject
                  </Button>
                </div>
              </div>
              <button
                onClick={() => decide("rejected")}
                className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
