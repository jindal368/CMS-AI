"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md glass-card-static p-8">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: "linear-gradient(135deg, #e85d45, #7c5cbf)" }}
        >
          H
        </div>
        <span className="text-xl font-semibold" style={{ color: "#1a1a2e" }}>
          hotelCMS
        </span>
      </div>

      <h1 className="text-2xl font-bold mb-1" style={{ color: "#1a1a2e" }}>
        Create your account
      </h1>
      <p className="text-sm mb-6" style={{ color: "#7c7893" }}>
        Set up your organization and get started.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Organization name
          </label>
          <input
            type="text"
            required
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            placeholder="Acme Hotels"
            className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Your name
          </label>
          <input
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane Smith"
            className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Email
          </label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
            className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium" style={{ color: "#1a1a2e" }}>
            Confirm password
          </label>
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="bg-[#f8f7fa] border border-[#e2dfe8] focus:border-[#7c5cbf] rounded-lg px-4 py-2.5 text-sm outline-none transition-colors"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-70"
          style={{ background: "linear-gradient(135deg, #e85d45, #c94d37)" }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Creating account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm" style={{ color: "#7c7893" }}>
        Already have an account?{" "}
        <Link href="/login" className="font-medium" style={{ color: "#7c5cbf" }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
