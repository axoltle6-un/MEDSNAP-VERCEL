// Check Firebase users and test the full verification flow
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

    console.log("=== Listing all Firebase users ===");
    const listResult = await auth.listUsers(100);
    if (listResult.users.length === 0) {
      console.log("No users found in Firebase Auth.");
      console.log("You need to sign up in the app first before you can receive a verification email.");
    } else {
      console.log(`Found ${listResult.users.length} user(s):`);
      for (const u of listResult.users) {
        console.log(`  - ${u.email} (uid: ${u.uid})`);
        console.log(`    emailVerified: ${u.emailVerified}`);
        console.log(`    providers: ${u.providerData.map(p => p.providerId).join(", ")}`);
        console.log(`    created: ${new Date(Number(u.metadata.creationTime)).toISOString()}`);
      }
    }

    // Also try to look up teamaxoltle@gmail.com specifically
    console.log("\n=== Looking up teamaxoltle@gmail.com ===");
    try {
      const user = await auth.getUserByEmail("teamaxoltle@gmail.com");
      console.log("Found:", user.email, "emailVerified:", user.emailVerified);
    } catch {
      console.log("teamaxoltle@gmail.com is NOT a Firebase user yet.");
      console.log("Sign up in the app with this email to test verification.");
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
})();
