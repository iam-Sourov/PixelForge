// Ensure window.fetch is writable and has a setter so libraries or iframe wrappers
// trying to assign `window.fetch = ...` or `self.fetch = ...` will not throw:
// "Uncaught TypeError: Cannot set property fetch of #<Window> which has only a getter"

if (typeof window !== "undefined") {
  try {
    const curFetch = window.fetch;
    if (typeof curFetch === "function") {
      let activeFetch = curFetch.bind(window);
      try {
        Object.defineProperty(window, "fetch", {
          get() {
            return activeFetch;
          },
          set(newFetch: typeof window.fetch) {
            activeFetch = typeof newFetch === "function" ? newFetch : activeFetch;
          },
          configurable: true,
          enumerable: true,
        });
      } catch {
        // If window.fetch cannot be redefined directly on window
      }

      if (typeof Window !== "undefined" && Window.prototype) {
        try {
          const protoDesc = Object.getOwnPropertyDescriptor(Window.prototype, "fetch");
          if (protoDesc && (!protoDesc.set || !protoDesc.writable) && protoDesc.configurable) {
            Object.defineProperty(Window.prototype, "fetch", {
              get() {
                return activeFetch;
              },
              set(newFetch: typeof window.fetch) {
                activeFetch = typeof newFetch === "function" ? newFetch : activeFetch;
              },
              configurable: true,
              enumerable: true,
            });
          }
        } catch {
          // ignore
        }
      }
    }

    // Intercept and prevent uncaught errors regarding getter-only fetch
    const suppressFetchError = (e: ErrorEvent) => {
      const msg = (e && (e.message || (e.error && e.error.message))) || "";
      if (typeof msg === "string" && msg.includes("fetch") && msg.includes("getter")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return true;
      }
    };
    window.addEventListener("error", suppressFetchError, true);
    window.addEventListener(
      "unhandledrejection",
      (e: PromiseRejectionEvent) => {
        const reason = e && e.reason;
        const msg = (reason && (reason.message || String(reason))) || "";
        if (typeof msg === "string" && msg.includes("fetch") && msg.includes("getter")) {
          e.preventDefault();
        }
      },
      true
    );
  } catch {
    // ignore
  }
}
