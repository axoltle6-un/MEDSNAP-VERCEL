// Small formatting helpers shared across screens.

export function formatRelative(epochMs: number, now: number = Date.now()): string {
  const diff = now - epochMs;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr${hr > 1 ? "s" : ""} ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} day${day > 1 ? "s" : ""} ago`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk} wk${wk > 1 ? "s" : ""} ago`;
  const date = new Date(epochMs);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date(now).getFullYear() ? undefined : "numeric",
  });
}

export function formatDateTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDate(epochMs: number): string {
  return new Date(epochMs).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function classNamesForConfidence(confidence: "high" | "medium" | "low") {
  switch (confidence) {
    case "high":
      return "bg-safe-soft text-safe border-safe/30";
    case "medium":
      return "bg-warn-soft text-warn-foreground border-warn/30";
    case "low":
      return "bg-danger-soft text-danger border-danger/30";
  }
}
