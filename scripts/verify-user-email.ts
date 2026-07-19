// Mark ashlightstarv@gmail.com as emailVerified=true directly in Firebase
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/home/z/my-project/firebase-service-account.json";

(async () => {
  try {
    const { initializeApp, applicationDefault } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");
    const app = initializeApp({
      credential: applicationDefault(),
      projectId: "medsnap-8057d",
    });
    const auth = getAuth(app);

    const EMAIL = "ashlightstarv@gmail.com";
    console.log(`Looking up ${EMAIL}...`);
    const user = await auth.getUserByEmail(EMAIL);
    console.log(`Found: ${user.email} (uid: ${user.uid})`);
    console.log(`Current emailVerified: ${user.emailVerified}`);

    if (user.emailVerified) {
      console.log("✓ Already verified — nothing to do.");
      process.exit(0);
    }

    console.log("Marking email as verified...");
    await auth.updateUser(user.uid, { emailVerified: true });
    console.log("✅ Email verified successfully!");

    // Verify
    const updated = await auth.getUserByEmail(EMAIL);
    console.log(`New emailVerified: ${updated.emailVerified}`);

    console.log("\nYou can now sign in to the app with:");
    console.log(`  Email: ${EMAIL}`);
    console.log("  Password: (the password you used during signup)");

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
