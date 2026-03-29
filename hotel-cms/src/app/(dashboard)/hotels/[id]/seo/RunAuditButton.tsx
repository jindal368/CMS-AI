"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface RunAuditButtonProps {
  hotelId: string;
}

export default function RunAuditButton({ hotelId }: RunAuditButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      await fetch(`/api/seo/audit/${hotelId}`, { method: "POST" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
    >
      {loading ? "Running…" : "Run Audit"}
    </button>
  );
}
