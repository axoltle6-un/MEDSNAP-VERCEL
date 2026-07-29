import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/status?email=user@example.com
 *
 * Checks if a user has Pro subscription.
 * Reads from Firebase user document.
 */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";

  if (!email) {
    return NextResponse.json({ isPro: false });
  }

  const adminAuth = await getAdminAuth();
  if (!adminAuth) {
    return NextResponse.json({ isPro: false });
  }

  try {
    const userRecord = await adminAuth.getUserByEmail(email.toLowerCase().trim());

    // Read via the Admin SDK. The client SDK has no authenticated user on the
    // server, so this read was subject to security rules with no identity and
    // would return nothing under correct rules.
    const db = await getAdminDb();
    if (!db) return NextResponse.json({ isPro: false });

    const snap = await db.collection("users").doc(userRecord.uid).get();
    const userDoc = snap.exists ? snap.data() : null;

    const isPro = (userDoc as any)?.isPro || false;
    const proPlan = (userDoc as any)?.proPlan || null;
    const proSince = (userDoc as any)?.proSince || null;

    return NextResponse.json({ isPro, proPlan, proSince });
  } catch {
    return NextResponse.json({ isPro: false });
  }
}
