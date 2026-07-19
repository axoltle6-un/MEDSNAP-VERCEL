// Reads config from environment variables (set in .env.local)
import { config } from "dotenv";
config({ path: ".env.local" });

(async () => {
  try {
    // 1. Verify the user exists in Firebase
    const { initializeApp, applicationDefault } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: "medsnap-8057d",
    });
    const auth = getAuth(app);

    const TEST_EMAIL = "ashlightstarv@gmail.com";
    console.log(`Looking up ${TEST_EMAIL} in Firebase...`);
    const user = await auth.getUserByEmail(TEST_EMAIL);
    console.log(`✓ Found user: ${user.email}`);
    console.log(`  emailVerified: ${user.emailVerified}`);

    // 2. Generate a code manually
    const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
    console.log(`\nGenerated code: ${code}`);

    // 3. Send the verification email using nodemailer directly
    // Reads SMTP config from environment variables (set in .env.local)
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    console.log(`\nSending verification email to ${TEST_EMAIL}...`);
    const info = await transporter.sendMail({
      from: "MedSnap <teamaxoltle@gmail.com>",
      to: TEST_EMAIL,
      subject: "Your MedSnap email verification code",
      text: `Your MedSnap verification code is: ${code}\n\nEnter this 6-digit code in the app to verify your email.\n\nThis code expires in 10 minutes.\n\n— MedSnap Team`,
      html: `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #0D6EFD; font-size: 24px; margin: 0;">MedSnap</h1>
    <p style="color: #6b7280; font-size: 14px; margin: 4px 0 0 0;">Medicine identification made simple</p>
  </div>
  <div style="background: #f9fafb; border-radius: 12px; padding: 24px; text-align: center;">
    <p style="color: #374151; font-size: 14px; margin: 0 0 16px 0;">Use the code below to verify your email:</p>
    <div style="display: inline-block; background: #0D6EFD; color: white; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 16px 24px; border-radius: 8px; margin: 8px 0;">${code}</div>
    <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">This code expires in 10 minutes.</p>
  </div>
  <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
    If you did not request this, you can safely ignore this email.<br/>
    — MedSnap Team
  </p>
</div>`,
    });

    console.log("✅ Email sent!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
    console.log(`\nThe code is: ${code}`);
    console.log(`\nCheck ${TEST_EMAIL} inbox (and spam folder).`);

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
