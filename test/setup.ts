import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

Object.defineProperty(globalThis, "ResizeObserver", {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
});

Object.defineProperty(globalThis.navigator, "storage", {
  configurable: true,
  value: {
    estimate: vi.fn(async () => ({
      quota: 1024 * 1024 * 1024,
      usage: 1024 * 256
    }))
  }
});

afterEach(() => {
  cleanup();
});
