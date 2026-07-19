// Test that SMTP email sending actually works
// Reads SMTP config from environment variables (set in .env.local)
import { config } from "dotenv";
config({ path: ".env.local" });

(async () => {
  try {
    const { sendEmail, sendVerificationCodeEmail, isEmailConfigured } = await import("../src/lib/email.ts");
    console.log("Email configured?", isEmailConfigured());

    // Test 1: Plain email
    console.log("\n--- Test 1: Plain email ---");
    const r1 = await sendEmail({
      to: "teamaxoltle@gmail.com",
      subject: "MedSnap SMTP Test ✓",
      text: "This is a test email from MedSnap. If you received this, SMTP is working!",
    });
    console.log("Result:", r1);

    // Test 2: Verification code email (the actual format users get)
    console.log("\n--- Test 2: Verification code email ---");
    const r2 = await sendVerificationCodeEmail(
      "teamaxoltle@gmail.com",
      "123456",
      "verify-email"
    );
    console.log("Result:", r2);

    if (r1.sent && r2.sent) {
      console.log("\n✅ SUCCESS — check your Gmail inbox at teamaxoltle@gmail.com");
      console.log("   You should see two test emails within ~30 seconds.");
    } else {
      console.log("\n❌ FAILED — see errors above");
    }
    process.exit(r1.sent && r2.sent ? 0 : 1);
  } catch (err) {
    console.error("FAIL:", err);
    process.exit(1);
  }
})();
