"use client";

import { LOCALE_NAMES } from "@/lib/i18n/languages";

interface LocaleSwitcherProps {
  enabledLocales: string[];
  currentLocale: string;
  onLocaleChange: (locale: string) => void;
}

export default function LocaleSwitcher({
  enabledLocales,
  currentLocale,
  onLocaleChange,
}: LocaleSwitcherProps) {
  return (
    <div className="flex gap-1">
      {enabledLocales.map((locale) => (
        <button
          key={locale}
          onClick={() => onLocaleChange(locale)}
          title={LOCALE_NAMES[locale] || locale}
          className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors ${
            locale === currentLocale
              ? "bg-[#e85d45] text-white"
              : "bg-[#f0eef5] text-[#7c7893] hover:bg-[#e2dfe8]"
          }`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
