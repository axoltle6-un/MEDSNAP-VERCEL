import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebase-admin";

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
    const { fetchUserDoc } = await import("@/lib/firestore-service");
    const userDoc = await fetchUserDoc(userRecord.uid);

    const isPro = (userDoc as any)?.isPro || false;
    const proPlan = (userDoc as any)?.proPlan || null;
    const proSince = (userDoc as any)?.proSince || null;

    return NextResponse.json({ isPro, proPlan, proSince });
  } catch {
    return NextResponse.json({ isPro: false });
  }
}
