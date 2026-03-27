import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import HotelTabs from "@/components/hotel-tabs";
import ThemeEditor from "@/components/cms/ThemeEditor";

export const dynamic = 'force-dynamic';

async function getHotelWithTheme(hotelId: string) {
  return prisma.hotel.findUnique({
    where: { id: hotelId },
    select: {
      id: true,
      name: true,
      theme: true,
    },
  });
}

export default async function ThemePage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const hotelData = await getHotelWithTheme(id);
  if (!hotelData) notFound();

  const { name, theme } = hotelData;

  // Serialize theme data from Prisma result
  const serializedTheme = theme
    ? {
        colorTokens:
          theme.colorTokens != null && typeof theme.colorTokens === "object"
            ? (theme.colorTokens as {
                primary: string;
                secondary: string;
                accent: string;
                bg: string;
                text: string;
              })
            : null,
        typography:
          theme.typography != null && typeof theme.typography === "object"
            ? (theme.typography as {
                headingFont: string;
                bodyFont: string;
                scale: "small" | "medium" | "large";
              })
            : null,
        spacing: (theme.spacing ?? null) as
          | "compact"
          | "balanced"
          | "spacious"
          | null,
        baseTemplate: (theme.baseTemplate ?? null) as
          | "luxury"
          | "boutique"
          | "business"
          | "resort"
          | null,
      }
    : null;

  const editorTheme =
    serializedTheme &&
    serializedTheme.colorTokens &&
    serializedTheme.typography &&
    serializedTheme.spacing &&
    serializedTheme.baseTemplate
      ? {
          colorTokens: serializedTheme.colorTokens,
          typography: serializedTheme.typography,
          spacing: serializedTheme.spacing,
          baseTemplate: serializedTheme.baseTemplate,
        }
      : null;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-[#7c7893]">
        <Link href="/hotels" className="hover:text-[#1a1a2e] transition-colors">
          Hotels
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <Link
          href={`/hotels/${id}`}
          className="hover:text-[#1a1a2e] transition-colors"
        >
          {name}
        </Link>
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
          <path
            fillRule="evenodd"
            d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
            clipRule="evenodd"
          />
        </svg>
        <span className="text-[#1a1a2e]">Theme</span>
      </nav>

      {/* Tab panel */}
      <div className="bg-[#ffffff] border border-[#e2dfe8] rounded-xl overflow-hidden">
        <div className="px-5 pt-4">
          <HotelTabs hotelId={id} />
        </div>

        <div className="p-5">
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-[#1a1a2e]">
              Theme Editor
            </h3>
            <p className="text-xs text-[#7c7893] mt-0.5">
              Customize the visual identity for {name}
            </p>
          </div>

          <ThemeEditor hotelId={id} theme={editorTheme} />
        </div>
      </div>
    </div>
  );
}
