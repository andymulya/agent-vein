import { createContext, useCallback, useContext, useRef, useState } from "react";

const ToastContext = createContext(null);

/**
 * Toast context. showPreviewToast is the "connect your wallet first"
 * fallback used by buttons when no wallet is connected yet.
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
      '<span style="color:#ffc44d">WALLET</span> — connect your Agent Wallet first (BSC mainnet).',
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
