/**
 * Native Mobile Hardware Bridge for Capacitor Android & iOS
 *
 * Provides native camera capture, haptic vibration feedback, and status bar control
 * when running as an installed mobile app, while falling back gracefully on web browsers.
 */

export async function isNativeMobile(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export async function triggerHapticFeedback(): Promise<void> {
  try {
    if (await isNativeMobile()) {
      const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
      await Haptics.impact({ style: ImpactStyle.Medium });
    } else if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(15);
    }
  } catch {
    // Non-fatal fallback
  }
}

export async function captureNativePhoto(): Promise<string | null> {
  try {
    if (await isNativeMobile()) {
      const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
      const image = await Camera.getPhoto({
        quality: 85,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      return image.dataUrl || null;
    }
  } catch (err) {
    console.warn("[captureNativePhoto] Camera cancelled or unavailable:", err);
  }
  return null;
}
