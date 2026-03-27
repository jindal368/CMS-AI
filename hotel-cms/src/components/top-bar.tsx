"use client";

import { usePathname } from "next/navigation";

function getTitle(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/") return "Dashboard";
  if (pathname.startsWith("/hotels")) {
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length === 1) return "Hotels";
    if (parts.length === 2) return "Hotel Details";
    if (parts[2] === "rooms") return "Rooms";
    if (parts[2] === "theme") return "Theme Editor";
    if (parts[2] === "media") return "Media Library";
    if (parts[2] === "versions") return "Versions";
    return "Hotel Details";
  }
  if (pathname.startsWith("/components")) return "Components";
  return "Dashboard";
}

export default function TopBar() {
  const pathname = usePathname();
  const title = getTitle(pathname);

  return (
    <header className="flex items-center justify-between h-14 px-6 border-b border-[#e2dfe8] bg-[#ffffff] shrink-0">
      <h1 className="text-sm font-semibold text-[#1a1a2e]">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#0fa886]" title="Connected" />
        <span className="text-xs text-[#7c7893]">Admin</span>
        <div className="w-7 h-7 rounded-full bg-[#f0eef5] border border-[#e2dfe8] flex items-center justify-center text-xs font-medium text-[#7c5cbf]">
          A
        </div>
      </div>
    </header>
  );
}
