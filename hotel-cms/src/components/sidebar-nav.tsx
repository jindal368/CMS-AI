"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M2 4a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H3a1 1 0 01-1-1V4zM2 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6zM12 9a1 1 0 00-1 1v6a1 1 0 001 1h5a1 1 0 001-1v-6a1 1 0 00-1-1h-5z" />
      </svg>
    ),
  },
  {
    label: "Hotels",
    href: "/hotels",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path
          fillRule="evenodd"
          d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Components",
    href: "/components",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path d="M10 3.5a1.5 1.5 0 013 0V4a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-.5a1.5 1.5 0 000 3h.5a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-.5a1.5 1.5 0 00-3 0v.5a1 1 0 01-1 1H6a1 1 0 01-1-1v-3a1 1 0 00-1-1h-.5a1.5 1.5 0 010-3H4a1 1 0 001-1V6a1 1 0 011-1h3a1 1 0 001-1v-.5z" />
      </svg>
    ),
  },
  {
    label: "AI",
    href: "/dashboard",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
        <path
          fillRule="evenodd"
          d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

const avatarGradients = [
  ["#e85d45", "#d49a12"],
  ["#3b7dd8", "#7c5cbf"],
  ["#0fa886", "#d49a12"],
  ["#7c5cbf", "#e85d45"],
  ["#d49a12", "#3b7dd8"],
];

type Hotel = {
  id: string;
  name: string;
};

type SidebarNavProps = {
  user?: { role: string };
};

export default function SidebarNav({ user }: SidebarNavProps) {
  const pathname = usePathname();
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    fetch("/api/hotels")
      .then((res) => res.json())
      .then((data) => {
        const list: Hotel[] = Array.isArray(data) ? data : (data.hotels ?? []);
        setHotels(list.slice(0, 5));
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="flex flex-col items-center w-14 h-full bg-[#ffffff] border-r border-[#e2dfe8] py-3 shrink-0">
      {/* Logo badge */}
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg mb-4 shrink-0"
        style={{
          background: "linear-gradient(135deg, #e85d45, #d49a12)",
        }}
      >
        <span className="text-white font-bold text-sm leading-none">H</span>
      </div>

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-1 w-full px-2">
        {navItems.map((item) => {
          const isActive =
            item.label === "Dashboard" || item.label === "AI"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                isActive
                  ? "bg-[#e85d45]/10 text-[#e85d45]"
                  : "text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5]"
              }`}
            >
              {item.icon}
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1a2e] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {item.label}
              </span>
            </Link>
          );
        })}
        {user?.role === "admin" && (
          <Link
            href="/team"
            className={`group relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              pathname.startsWith("/team")
                ? "bg-[#e85d45]/10 text-[#e85d45]"
                : "text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5]"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
            </svg>
            <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1a2e] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Team
            </span>
          </Link>
        )}
        {user?.role === "admin" && (
          <Link
            href="/campaigns"
            className={`group relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              pathname.startsWith("/campaigns")
                ? "bg-[#e85d45]/10 text-[#e85d45]"
                : "text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5]"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v6a1 1 0 00.804.98l10 2A1 1 0 0018 13V3zM4 7.5A1.5 1.5 0 002.5 9v2A1.5 1.5 0 004 12.5h1V7.5H4z" />
            </svg>
            <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1a2e] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Campaigns
            </span>
          </Link>
        )}
        {user?.role === "admin" && (
          <Link
            href="/brand"
            className={`group relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
              pathname.startsWith("/brand")
                ? "bg-[#e85d45]/10 text-[#e85d45]"
                : "text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5]"
            }`}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path
                fillRule="evenodd"
                d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1a2e] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
              Brand
            </span>
          </Link>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Separator */}
      <div className="w-8 h-px bg-[#e2dfe8] mb-3 shrink-0" />

      {/* Hotel avatars */}
      <div className="flex flex-col items-center gap-1.5 mb-3">
        {hotels.map((hotel, idx) => {
          const [from, to] = avatarGradients[idx % avatarGradients.length];
          return (
            <Link
              key={hotel.id}
              href={`/hotels/${hotel.id}`}
              className="group relative flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
              style={{
                background: `linear-gradient(135deg, ${from}, ${to})`,
              }}
            >
              <span className="text-white font-semibold text-xs leading-none">
                {hotel.name.charAt(0).toUpperCase()}
              </span>
              <span className="absolute left-full ml-2 px-2 py-1 rounded-md bg-[#1a1a2e] text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                {hotel.name}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Separator */}
      <div className="w-8 h-px bg-[#e2dfe8] mb-3 shrink-0" />

      {/* User avatar */}
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[#f0eef5] shrink-0">
        <span className="text-[#7c5cbf] font-semibold text-xs leading-none">
          A
        </span>
      </div>
    </aside>
  );
}
