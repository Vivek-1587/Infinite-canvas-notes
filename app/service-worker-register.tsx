"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    const enabled = process.env.NEXT_PUBLIC_ENABLE_SW !== "false";
    if (
      !enabled ||
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        await navigator.serviceWorker.getRegistration("/sw.js");
      }
    };

    void register();
  }, []);

  return null;
}
