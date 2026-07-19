import * as React from "react";

/**
 * Returns true once the component has mounted on the client.
 * Essential for preventing SSR vs Client hydration mismatches in Next.js
 * when reading from localStorage, Zustand persist, or dynamic browser APIs.
 */
export function useHasMounted() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return mounted;
}
