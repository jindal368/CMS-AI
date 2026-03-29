"use client";

import { useState, useEffect, useCallback } from "react";

interface ToastMessage {
  id: number;
  text: string;
  type: "success" | "error" | "info";
  exiting?: boolean;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  success: { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
  error: { bg: "#fef2f2", border: "#fecaca", text: "#b91c1c" },
  info: { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
};

let nextId = 0;

export function toast(text: string, type: "success" | "error" | "info" = "info") {
  window.dispatchEvent(
    new CustomEvent("app-toast", { detail: { text, type } })
  );
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  useEffect(() => {
    function handleToast(e: Event) {
      const { text, type } = (e as CustomEvent).detail;
      const id = nextId++;
      setToasts((prev) => [...prev, { id, text, type }]);
      setTimeout(() => removeToast(id), 3000);
    }
    window.addEventListener("app-toast", handleToast);
    return () => window.removeEventListener("app-toast", handleToast);
  }, [removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = TYPE_STYLES[t.type];
        return (
          <div
            key={t.id}
            className="pointer-events-auto"
            style={{
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "13px",
              fontWeight: 500,
              background: s.bg,
              border: `1px solid ${s.border}`,
              color: s.text,
              boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
              animation: t.exiting
                ? "toast-out 200ms ease-in both"
                : "toast-in 400ms var(--easing-smooth) both",
              maxWidth: "360px",
            }}
          >
            {t.text}
          </div>
        );
      })}
    </div>
  );
}
