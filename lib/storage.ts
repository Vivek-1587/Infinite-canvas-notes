import type { StorageEstimateView } from "@/lib/types";

export async function getStorageEstimate(): Promise<StorageEstimateView | null> {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) {
    return null;
  }

  const estimate = await navigator.storage.estimate();
  const quota = estimate.quota ?? 0;
  const usage = estimate.usage ?? 0;

  return {
    quota,
    usage,
    usageRatio: quota > 0 ? usage / quota : 0
  };
}
