"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HotelTabsProps {
  hotelId: string;
}

export default function HotelTabs({ hotelId }: HotelTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Pages", href: `/hotels/${hotelId}` },
    { label: "Rooms", href: `/hotels/${hotelId}/rooms` },
    { label: "Media", href: `/hotels/${hotelId}/media` },
    { label: "Theme", href: `/hotels/${hotelId}/theme` },
    { label: "Versions", href: `/hotels/${hotelId}/versions` },
  ];

  return (
    <div className="flex gap-1 border-b border-[#e2dfe8]">
      {tabs.map((tab) => {
        const isActive =
          tab.label === "Pages"
            ? pathname === `/hotels/${hotelId}`
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-[#e85d45] text-[#e85d45]"
                : "border-transparent text-[#7c7893] hover:text-[#1a1a2e]"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
