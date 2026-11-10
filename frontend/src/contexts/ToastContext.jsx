import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

/**
 * Preview toast — every action button shows "contract not deployed yet"
 * until the contracts are live. No wallet connection happens in preview.
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);

  const showToast = useCallback((html) => {
    setToast(html);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 3400);
  }, []);

  const showPreviewToast = useCallback(() => {
    showToast(
      '<span style="color:#ffc44d">PREVIEW</span> — contract not yet deployed. This button activates after launch.',
    );
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toast, showToast, showPreviewToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
