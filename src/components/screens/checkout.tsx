"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Check, CreditCard, Lock, Shield, Loader2, Sparkles, ChevronLeft,
  Download, Receipt, Wallet, Apple,
} from "lucide-react";
import { useAppStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { safeFetch } from "@/lib/safe-fetch";
import { toast } from "sonner";
import { AnimatedSuccessCheckmark } from "@/components/ui/animated-checkmark";

const COUNTRY_TAX_RATES: Record<string, { rate: number; name: string }> = {
  US: { rate: 0.08, name: "United States" }, GB: { rate: 0.20, name: "United Kingdom" },
  DE: { rate: 0.19, name: "Germany" }, FR: { rate: 0.20, name: "France" },
  CA: { rate: 0.05, name: "Canada" }, AU: { rate: 0.10, name: "Australia" },
  IN: { rate: 0.18, name: "India" }, PK: { rate: 0.17, name: "Pakistan" },
  AE: { rate: 0.05, name: "UAE" }, SA: { rate: 0.15, name: "Saudi Arabia" },
  NL: { rate: 0.21, name: "Netherlands" }, ES: { rate: 0.21, name: "Spain" },
  IT: { rate: 0.22, name: "Italy" }, JP: { rate: 0.10, name: "Japan" },
  CN: { rate: 0.13, name: "China" }, SG: { rate: 0.09, name: "Singapore" },
  MY: { rate: 0.06, name: "Malaysia" }, ID: { rate: 0.11, name: "Indonesia" },
  PH: { rate: 0.12, name: "Philippines" }, TH: { rate: 0.07, name: "Thailand" },
  BD: { rate: 0.15, name: "Bangladesh" }, IE: { rate: 0.23, name: "Ireland" },
  PT: { rate: 0.23, name: "Portugal" }, SE: { rate: 0.25, name: "Sweden" },
  NO: { rate: 0.25, name: "Norway" }, DK: { rate: 0.25, name: "Denmark" },
  FI: { rate: 0.255, name: "Finland" }, CH: { rate: 0.081, name: "Switzerland" },
  NZ: { rate: 0.15, name: "New Zealand" }, ZA: { rate: 0.15, name: "South Africa" },
  BR: { rate: 0.17, name: "Brazil" }, MX: { rate: 0.16, name: "Mexico" },
  EG: { rate: 0.14, name: "Egypt" }, NG: { rate: 0.075, name: "Nigeria" },
  KE: { rate: 0.16, name: "Kenya" }, TR: { rate: 0.20, name: "Turkey" },
  PL: { rate: 0.23, name: "Poland" }, BE: { rate: 0.21, name: "Belgium" },
  AT: { rate: 0.20, name: "Austria" }, GR: { rate: 0.24, name: "Greece" },
  CZ: { rate: 0.21, name: "Czech Republic" }, RO: { rate: 0.19, name: "Romania" },
  HU: { rate: 0.27, name: "Hungary" },
};

const COUNTRY_LIST = Object.entries(COUNTRY_TAX_RATES)
  .map(([code, data]) => ({ code, ...data }))
  .sort((a, b) => a.name.localeCompare(b.name));

type PaymentMethod = "card" | "paypal" | "applepay" | "googlepay";

export function CheckoutScreen() {
  const navigate = useAppStore((s) => s.navigate);
  const activatePro = useAppStore((s) => s.activatePro);
  const { user } = useAuth();

  const [plan, setPlan] = React.useState<"monthly" | "yearly">("monthly");
  const [country, setCountry] = React.useState("US");
  const [promoCode, setPromoCode] = React.useState("");
  const [promoApplied, setPromoApplied] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [stripeAvailable, setStripeAvailable] = React.useState<boolean | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>("card");
  const [showReceipt, setShowReceipt] = React.useState(false);
  const [receiptData, setReceiptData] = React.useState<any>(null);

  const [cardNumber, setCardNumber] = React.useState("");
  const [expiry, setExpiry] = React.useState("");
  const [cvv, setCvv] = React.useState("");
  const [cardName, setCardName] = React.useState(user?.displayName || "");
  const [saveInfo, setSaveInfo] = React.useState(true);

  if (!user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-5">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warn-soft">
            <Lock className="h-8 w-8 text-warn-foreground" />
          </div>
          <h1 className="font-display text-xl font-bold">Sign in required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need to be logged in to purchase a Pro subscription.
          </p>
          <Button onClick={() => navigate("auth")} className="mt-6 h-12 w-full rounded-xl font-semibold">
            Sign in to continue
          </Button>
          <button onClick={() => navigate("paywall")} className="mt-3 text-sm text-muted-foreground hover:text-foreground">
            ← Back to plans
          </button>
        </div>
      </div>
    );
  }

  React.useEffect(() => {
    fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan: "monthly", email: "test@test.com" }),
    }).then(r => r.json()).then(data => setStripeAvailable(!data.demoMode)).catch(() => setStripeAvailable(false));
  }, []);

  const basePrice = plan === "yearly" ? 99.99 : 19.99;
  const discount = promoApplied ? basePrice * 0.1 : 0;
  const subtotal = basePrice - discount;
  const taxRate = COUNTRY_TAX_RATES[country]?.rate || 0;
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount;

  function handleApplyPromo() {
    if (promoCode.trim().length > 0) { setPromoApplied(true); toast.success("Promo code applied — 10% off!"); }
    else { toast.error("Enter a promo code"); }
  }

  function formatCardNumber(val: string) {
    return val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(val: string) {
    const d = val.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
  }

  function validatePayment(): boolean {
    if (paymentMethod === "card") {
      if (cardNumber.replace(/\s/g, "").length < 16) { toast.error("Enter a valid card number"); return false; }
      if (expiry.replace(/\D/g, "").length < 4) { toast.error("Enter a valid expiry date"); return false; }
      if (cvv.length < 3) { toast.error("Enter a valid CVV"); return false; }
    }
    return true;
  }

  async function handlePay() {
    if (!validatePayment()) return;
    setLoading(true);
    try {
      if (stripeAvailable) {
        const result = await safeFetch("/api/stripe/checkout", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ plan, email: user?.email }),
        });
        if (result.ok && (result.data as any)?.url) { window.location.href = (result.data as any).url; return; }
      }

      // Simulate payment
      toast.info(`Processing ${paymentMethod === "card" ? "card" : paymentMethod === "paypal" ? "PayPal" : paymentMethod === "applepay" ? "Apple Pay" : "Google Pay"} payment…`);
      await new Promise(r => setTimeout(r, 2000));

      // Generate receipt
      const receipt = {
        id: `MS-${Date.now().toString(36).toUpperCase()}`,
        date: new Date().toISOString(),
        plan,
        basePrice,
        discount,
        subtotal,
        taxRate,
        taxAmount,
        total,
        country: COUNTRY_TAX_RATES[country]?.name || country,
        paymentMethod,
        email: user?.email,
      };
      setReceiptData(receipt);
      activatePro(plan);
      setShowReceipt(true);
      toast.success("Payment successful — Pro activated!");
    } catch {
      toast.error("Payment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // === RECEIPT SCREEN ===
  if (showReceipt && receiptData) {
    return <ReceiptScreen receipt={receiptData} navigate={navigate} />;
  }

  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "card", label: "Credit Card", icon: <CreditCard className="h-5 w-5" />, desc: "Visa, Mastercard, Amex" },
    { id: "paypal", label: "PayPal", icon: <span className="text-sm font-bold text-[#003087]">Pay<span className="text-[#009cde]">Pal</span></span>, desc: "Pay with your PayPal account" },
    { id: "applepay", label: "Apple Pay", icon: <Apple className="h-5 w-5" />, desc: "Pay with Touch ID / Face ID" },
    { id: "googlepay", label: "Google Pay", icon: <Wallet className="h-5 w-5" />, desc: "Pay with your Google account" },
  ];

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Top bar */}
      <div className="sticky top-0 z-30 border-b border-border bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("paywall")} className="rounded-full p-1.5 text-muted-foreground hover:bg-muted">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="font-display font-bold">MedSnap</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-safe">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-safe text-white"><Check className="h-3 w-3" /></div>
              <span className="hidden sm:inline">Plan</span>
            </div>
            <div className="h-0.5 w-6 bg-primary" />
            <div className="flex items-center gap-1.5 text-primary font-medium">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white text-[10px]">2</div>
              <span className="hidden sm:inline">Payment</span>
            </div>
            <div className="h-0.5 w-6 bg-border" />
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-border text-[10px]">3</div>
              <span className="hidden sm:inline">Done</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-6">
        <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
          {/* LEFT: Payment */}
          <div className="space-y-5">
            {/* Plan selector */}
            <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold">Select Plan</h3>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => setPlan("monthly")} className={cn("rounded-xl border-2 p-3 text-left transition-all", plan === "monthly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="text-lg font-bold">$19.99<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                </button>
                <button onClick={() => setPlan("yearly")} className={cn("relative rounded-xl border-2 p-3 text-left transition-all", plan === "yearly" ? "border-primary bg-primary/5" : "border-border hover:border-primary/30")}>
                  <span className="absolute -top-2 right-2 rounded-full bg-safe px-1.5 py-0.5 text-[9px] font-bold text-white">SAVE 58%</span>
                  <p className="text-xs text-muted-foreground">Yearly</p>
                  <p className="text-lg font-bold">$99.99<span className="text-xs font-normal text-muted-foreground">/yr</span></p>
                </button>
              </div>
            </div>

            {/* Payment methods */}
            <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold">Select Payment Option</h3>
              <div className="space-y-2">
                {paymentMethods.map(pm => (
                  <div key={pm.id}>
                    <button
                      onClick={() => setPaymentMethod(pm.id)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-xl border-2 p-3 transition-all",
                        paymentMethod === pm.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className={cn("flex h-5 w-5 items-center justify-center rounded-full border-2", paymentMethod === pm.id ? "border-primary bg-primary" : "border-muted-foreground/30")}>
                        {paymentMethod === pm.id && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                      </div>
                      <div className="flex h-8 w-8 items-center justify-center">{pm.icon}</div>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{pm.label}</p>
                        <p className="text-[10px] text-muted-foreground">{pm.desc}</p>
                      </div>
                      {pm.id === "card" && (
                        <div className="flex gap-1">
                          {["VISA", "MC", "AMEX"].map(b => <span key={b} className="rounded bg-muted px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">{b}</span>)}
                        </div>
                      )}
                    </button>

                    {/* Card form (only for credit card) */}
                    {pm.id === "card" && paymentMethod === "card" && (
                      <div className="mt-3 space-y-3 pl-1">
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Card Number</Label>
                          <Input value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} placeholder="0000 0000 0000 0000" className="h-11 rounded-xl border-border font-mono tracking-wider" maxLength={19} />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Expiry</Label>
                            <Input value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} placeholder="MM / YYYY" className="h-11 rounded-xl border-border font-mono" maxLength={9} />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">CVV/CVC</Label>
                            <Input type="password" value={cvv} onChange={e => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="•••" className="h-11 rounded-xl border-border font-mono" maxLength={4} />
                          </div>
                          <div>
                            <Label className="text-[11px] text-muted-foreground">Country</Label>
                            <select value={country} onChange={e => setCountry(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-primary focus:outline-none">
                              {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div>
                          <Label className="text-[11px] text-muted-foreground">Cardholder Name</Label>
                          <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="Cardholder Name" className="h-11 rounded-xl border-border" />
                        </div>
                      </div>
                    )}

                    {/* Country selector for non-card methods */}
                    {pm.id !== "card" && paymentMethod === pm.id && (
                      <div className="mt-3 pl-1">
                        <Label className="text-[11px] text-muted-foreground">Country (for tax calculation)</Label>
                        <select value={country} onChange={e => setCountry(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-white px-3 text-sm focus:border-primary focus:outline-none">
                          {COUNTRY_LIST.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2">
                <input type="checkbox" checked={saveInfo} onChange={e => setSaveInfo(e.target.checked)} className="h-4 w-4 rounded border-border accent-primary" />
                <span className="text-xs text-muted-foreground">Save my information for faster checkout</span>
              </label>

              <Button onClick={handlePay} disabled={loading} className="mt-4 h-12 w-full rounded-xl text-sm font-bold">
                {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Pay ${total.toFixed(2)}
              </Button>
              <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
                <Shield className="h-3 w-3" /> Secured by 256-bit SSL encryption
              </p>
            </div>
          </div>

          {/* RIGHT: Summary */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold">Your Cart (1)</h3>
              <div className="flex items-center gap-3 rounded-xl bg-muted/40 p-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">MedSnap Pro</p>
                  <p className="text-xs text-muted-foreground">{plan === "yearly" ? "Yearly subscription" : "Monthly subscription"}</p>
                  <p className="text-[10px] text-muted-foreground">4 scans/day · Cloud sync · Priority AI</p>
                </div>
                <p className="text-sm font-bold">${basePrice.toFixed(2)}</p>
              </div>
              <div className="mt-4">
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Promo Code or Gift Card</p>
                <div className="flex gap-2">
                  <Input value={promoCode} onChange={e => { setPromoCode(e.target.value); setPromoApplied(false); }} placeholder="Enter code" className="h-10 rounded-xl border-border" disabled={promoApplied} />
                  <Button onClick={handleApplyPromo} disabled={promoApplied || !promoCode.trim()} variant="outline" className="h-10 rounded-xl px-4">
                    {promoApplied ? <Check className="h-4 w-4 text-safe" /> : "Apply"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-white p-4 shadow-soft">
              <h3 className="mb-3 text-sm font-semibold">Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${subtotal.toFixed(2)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-safe">
                    <span>Promo discount (10%)</span><span>-${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(1)}% — {COUNTRY_TAX_RATES[country]?.name || "N/A"})</span>
                  <span className="font-medium">${taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="font-medium text-safe">FREE</span>
                </div>
                <div className="my-2 border-t border-border" />
                <div className="flex justify-between">
                  <span className="font-bold">Total</span>
                  <span className="text-lg font-bold text-primary">${total.toFixed(2)}</span>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-muted-foreground">{plan === "yearly" ? "Billed annually. Cancel anytime." : "Billed monthly. Cancel anytime."}</p>
            </div>

            {!stripeAvailable && (
              <div className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
                <p className="font-semibold">Test Mode</p>
                <p className="mt-0.5">Enter any details to simulate payment. When Stripe keys are configured, real payments will be processed.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// === RECEIPT COMPONENT ===
function ReceiptScreen({ receipt, navigate }: { receipt: any; navigate: (s: any) => void }) {
  const date = new Date(receipt.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const time = new Date(receipt.date).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const methodName = receipt.paymentMethod === "card" ? "Credit Card" : receipt.paymentMethod === "paypal" ? "PayPal" : receipt.paymentMethod === "applepay" ? "Apple Pay" : "Google Pay";

  function downloadReceipt() {
    const text = `MedSnap Pro — Payment Receipt
================================

Receipt ID: ${receipt.id}
Date: ${date} at ${time}
Email: ${receipt.email}

PLAN: MedSnap Pro (${receipt.plan === "yearly" ? "Yearly" : "Monthly"})
PAYMENT METHOD: ${methodName}
COUNTRY: ${receipt.country}

--- BREAKDOWN ---
Base Price:       $${receipt.basePrice.toFixed(2)}
Promo Discount:   -$${receipt.discount.toFixed(2)}
Subtotal:         $${receipt.subtotal.toFixed(2)}
Tax (${(receipt.taxRate * 100).toFixed(1)}%):  $${receipt.taxAmount.toFixed(2)}
--------------------------------
TOTAL PAID:       $${receipt.total.toFixed(2)}

Thank you for choosing MedSnap Pro!
Your subscription is now active.

Manage your subscription in Settings.
MedSnap — AI Medicine Identifier`;

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `medsnap-receipt-${receipt.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Receipt downloaded");
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Animated Success Checkmark */}
        <div className="mx-auto mb-4 flex justify-center">
          <AnimatedSuccessCheckmark size={68} color="#10b981" />
        </div>

        <h1 className="text-center font-display text-2xl font-bold">Payment Successful!</h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">Your MedSnap Pro subscription is now active.</p>

        {/* Receipt card */}
        <div className="mt-6 rounded-2xl border border-border bg-white p-5 shadow-lifted">
          <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              <span className="font-display font-bold">Receipt</span>
            </div>
            <span className="text-[10px] font-mono text-muted-foreground">{receipt.id}</span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span className="font-medium">{time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email</span>
              <span className="font-medium truncate ml-2">{receipt.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan</span>
              <span className="font-medium">MedSnap Pro ({receipt.plan === "yearly" ? "Yearly" : "Monthly"})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment Method</span>
              <span className="font-medium">{methodName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Country</span>
              <span className="font-medium">{receipt.country}</span>
            </div>
          </div>

          <div className="my-3 border-t border-border" />

          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Base Price</span>
              <span>${receipt.basePrice.toFixed(2)}</span>
            </div>
            {receipt.discount > 0 && (
              <div className="flex justify-between text-safe">
                <span>Promo Discount</span><span>-${receipt.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${receipt.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({(receipt.taxRate * 100).toFixed(1)}%)</span>
              <span>${receipt.taxAmount.toFixed(2)}</span>
            </div>
            <div className="my-2 border-t border-border" />
            <div className="flex justify-between text-base font-bold">
              <span>Total Paid</span>
              <span className="text-primary">${receipt.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2">
          <Button onClick={downloadReceipt} variant="outline" className="h-12 w-full rounded-xl font-medium">
            <Download className="mr-2 h-4 w-4" /> Download Receipt
          </Button>
          <Button onClick={() => navigate("home")} className="h-12 w-full rounded-xl font-semibold shadow-glow">
            Start using MedSnap Pro →
          </Button>
        </div>

        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          A copy of this receipt has been saved to your account. Manage your subscription in Settings.
        </p>
      </motion.div>
    </div>
  );
}
