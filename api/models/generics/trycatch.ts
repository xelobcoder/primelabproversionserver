export function wrapperTryCatch<T>(cb: () => T, errcb: (_err: any) => void = null): T | null {
    try {
      return cb();
    } catch (err) {
      if (errcb && typeof errcb == "function") {
        errcb(err);
      } else {
        console.error("Error uncaught in and unhandled", err);
      }
    }
  }