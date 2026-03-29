"use client";

import { useState } from "react";
import CreateCampaignModal from "@/components/cms/CreateCampaignModal";

interface Hotel {
  id: string;
  name: string;
  category: string;
}

interface CampaignsPageClientProps {
  hotels: Hotel[];
  showButtonOnly?: boolean;
}

export default function CampaignsPageClient({ hotels, showButtonOnly }: CampaignsPageClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium transition-opacity shadow-lg shadow-[#e85d45]/20 hover:opacity-90"
        style={{ background: "linear-gradient(135deg, #e85d45, #d49a12)" }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path
            fillRule="evenodd"
            d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
        {!showButtonOnly && "New Campaign"}
        {showButtonOnly && "Create Campaign"}
      </button>

      {isOpen && (
        <CreateCampaignModal hotels={hotels} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
