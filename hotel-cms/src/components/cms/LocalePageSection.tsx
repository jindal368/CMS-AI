"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import LocaleSwitcher from "./LocaleSwitcher";
import AddLanguageModal from "./AddLanguageModal";
import PageActions from "./PageActions";

interface SerializedPage {
  id: string;
  hotelId: string;
  slug: string;
  locale: string;
  pageType: string;
  sortOrder: number;
  metaTags: Record<string, string> | null;
  createdAt: string;
  updatedAt: string;
  _count: { sections: number };
}

interface LocalePageSectionProps {
  hotelId: string;
  allPages: SerializedPage[];
  enabledLocales: string[];
  defaultLocale: string;
}

export default function LocalePageSection({
  hotelId,
  allPages,
  enabledLocales,
  defaultLocale,
}: LocalePageSectionProps) {
  const router = useRouter();
  const [currentLocale, setCurrentLocale] = useState(defaultLocale);
  const [showAddLanguage, setShowAddLanguage] = useState(false);

  const filteredPages = allPages.filter((p) => p.locale === currentLocale);

  const handleAdded = () => {
    router.refresh();
  };

  return (
    <>
      {/* Locale toolbar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <LocaleSwitcher
            enabledLocales={enabledLocales}
            currentLocale={currentLocale}
            onLocaleChange={setCurrentLocale}
          />
        </div>
        <button
          onClick={() => setShowAddLanguage(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#7c5cbf]/10 hover:bg-[#7c5cbf]/20 text-[#7c5cbf] text-xs font-semibold transition-colors border border-[#7c5cbf]/20"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Language
        </button>
      </div>

      {/* Pages filtered by locale */}
      <PageActions hotelId={hotelId} pages={filteredPages} />

      {/* Add Language Modal */}
      {showAddLanguage && (
        <AddLanguageModal
          hotelId={hotelId}
          enabledLocales={enabledLocales}
          onClose={() => setShowAddLanguage(false)}
          onAdded={handleAdded}
        />
      )}
    </>
  );
}
