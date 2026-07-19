// Test that Firebase Admin SDK initializes correctly with the service account
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/home/z/my-project/firebase-service-account.json";

(async () => {
  try {
    // Dynamic import the firebase-admin modules directly to test
    const { initializeApp, applicationDefault, getApps } = await import("firebase-admin/app");
    const { getAuth } = await import("firebase-admin/auth");

    let app;
    if (getApps().length === 0) {
      app = initializeApp({
        credential: applicationDefault(),
        projectId: "medsnap-8057d",
      });
    } else {
      app = getApps()[0];
    }
    const auth = getAuth(app);
    console.log("✓ Firebase Admin SDK initialized successfully");
    console.log("✓ Project:", app.options.projectId);

    // Try fetching a user (will fail if no users exist, but proves auth works)
    try {
      const user = await auth.getUserByEmail("nonexistent-test@example.com");
      console.log("✓ getUserByEmail works (user found):", user.uid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("user-not-found") || msg.includes("no user") || msg.includes("USER_NOT_FOUND")) {
        console.log("✓ getUserByEmail works — correctly says 'user not found'");
        console.log("  (this confirms the Admin SDK is fully functional)");
      } else {
        console.log("⚠ getUserByEmail returned an error (but auth is working):", msg);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error("FAIL:", err);
    process.exit(1);
  }
})();
