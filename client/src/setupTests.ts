import "fake-indexeddb/auto";

// Polyfill for structuredClone which localforage/IndexedDB might use in newer environments
if (typeof structuredClone === "undefined") {
  (globalThis as any).structuredClone = function (obj: any) {
    return JSON.parse(JSON.stringify(obj));
  };
}
