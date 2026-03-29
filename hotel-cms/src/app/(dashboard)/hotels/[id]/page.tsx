import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionOrRedirect } from "@/lib/auth";
import HotelTabs from "@/components/hotel-tabs";
import EditHotelForm from "@/components/cms/EditHotelForm";
import DeleteHotelButton from "@/components/cms/DeleteHotelButton";
import LinksEditor from "@/components/cms/LinksEditor";
import LocalePageSection from "@/components/cms/LocalePageSection";
import PublishButton from "@/components/cms/PublishButton";

export const dynamic = 'force-dynamic';

async function getHotel(id: string) {
  return prisma.hotel.findUnique({
    where: { id },
    include: {
      pages: {
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { sections: true } } },
      },
      _count: { select: { rooms: true, media: true, versions: true } },
    },
  });
}


export default async function HotelPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const [hotel, { org }] = await Promise.all([
    getHotel(id),
    getSessionOrRedirect(),
  ]);

  if (!hotel) notFound();

  const orgSlug = (org as any)?.slug ?? "";

  // Serialize Prisma model for client components (Dates converted to ISO strings upstream)
  const serializedHotel = {
    id: hotel.id,
    name: hotel.name,
    category: hotel.category,
    contactInfo: (hotel.contactInfo ?? {}) as {
      phone?: string;
      email?: string;
      address?: string;
      city?: string;
      country?: string;
    },
    seoConfig: (hotel.seoConfig ?? {}) as {
      title?: string;
      description?: string;
    },
    links: (hotel.links ?? {}) as Record<string, string>,
  };

  const publishedAt = hotel.publishedAt ? hotel.publishedAt.toISOString() : null;
  const hotelSlug = hotel.hotelSlug ?? null;

  const enabledLocales = (() => {
    try {
      const raw = hotel.enabledLocales;
      if (Array.isArray(raw)) return raw as string[];
      if (typeof raw === "string") return JSON.parse(raw) as string[];
      return ["en"];
    } catch {
      return ["en"];
    }
  })();

  const defaultLocale = hotel.defaultLocale ?? "en";

  const allPages = hotel.pages.map((page) => ({
    id: page.id,
    hotelId: page.hotelId,
    slug: page.slug,
    locale: page.locale,
    pageType: page.pageType,
    sortOrder: page.sortOrder,
    metaTags: page.metaTags as Record<string, string> | null,
    createdAt: page.createdAt.toISOString(),
    updatedAt: page.updatedAt.toISOString(),
    _count: { sections: page._count.sections },
  }));

  return (
    <div className="space-y-6 animate-in">
      {/* ── Hero Header ─────────────────────────────────────── */}
      <div className="glass-card-static rounded-2xl overflow-hidden animate-in">
        {/* Top gradient band */}
        <div className="h-28 relative" style={{ background: "linear-gradient(135deg, #e85d45, #d49a12, #7c5cbf)" }}>
          <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(255,255,255,0.9) 100%)" }} />
        </div>
        {/* Profile section — overlaps the gradient */}
        <div className="px-8 pb-6 -mt-14 relative">
          <div className="flex items-end gap-5 mb-6">
            <div
              className="w-20 h-20 shrink-0 rounded-2xl flex items-center justify-center text-3xl font-bold text-white border-4 border-white"
              style={{
                background: "linear-gradient(135deg, #e85d45, #d49a12)",
                boxShadow: "0 4px 16px #e85d4540",
              }}
            >
              {hotel.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-3xl font-semibold tracking-tight text-foreground">{hotel.name}</h2>
                <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize" style={{ background: "#7c5cbf18", color: "#7c5cbf" }}>{hotel.category}</span>
              </div>
              {hotelSlug && (
                <p className="text-sm text-muted mt-1">/{hotelSlug}</p>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0 pb-1">
              <PublishButton hotelId={hotel.id} publishedAt={publishedAt} hotelSlug={hotelSlug} orgSlug={orgSlug} />
              <DeleteHotelButton hotelId={hotel.id} hotelName={hotel.name} />
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Pages", value: hotel.pages.length, icon: "📄" },
              { label: "Rooms", value: hotel._count.rooms, icon: "🛏" },
              { label: "Media", value: hotel._count.media, icon: "🖼" },
              { label: "Versions", value: hotel._count.versions, icon: "📋" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: "var(--elevated)" }}>
                <span className="text-lg">{stat.icon}</span>
                <div>
                  <p className="text-xl font-bold tracking-tight text-foreground tabular-nums leading-none">{stat.value}</p>
                  <p className="text-[11px] font-medium text-muted mt-0.5">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Contact & Edit ──────────────────────────────────── */}
      <div className="glass-card-static rounded-2xl p-6 animate-in animate-in-delay-1">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-6 text-sm text-muted">
            {(serializedHotel.contactInfo as any)?.email && (
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-muted/60"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" /><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" /></svg>
                {(serializedHotel.contactInfo as any).email}
              </span>
            )}
            {(serializedHotel.contactInfo as any)?.phone && (
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-muted/60"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                {(serializedHotel.contactInfo as any).phone}
              </span>
            )}
            {(serializedHotel.contactInfo as any)?.address && (
              <span className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-muted/60"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                {(serializedHotel.contactInfo as any).address}
              </span>
            )}
          </div>
          <EditHotelForm hotel={serializedHotel} />
        </div>
      </div>

      {/* ── Main Content: 3-column ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pages & Tabs — spans 7 columns */}
        <div className="lg:col-span-7">
          <div className="glass-card-static rounded-2xl overflow-hidden animate-in animate-in-delay-2">
            <div className="px-6 pt-5">
              <HotelTabs hotelId={id} />
            </div>
            <div className="p-6">
              <LocalePageSection
                hotelId={id}
                allPages={allPages}
                enabledLocales={enabledLocales}
                defaultLocale={defaultLocale}
              />
            </div>
          </div>
        </div>

        {/* Right: Smart Links — spans 5 columns */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-8 space-y-6">
            <div className="glass-card-static rounded-2xl overflow-hidden animate-in animate-in-delay-3">
              <div className="px-6 py-5 border-b border-border/50">
                <h3 className="text-base font-semibold tracking-tight text-foreground">Smart Links</h3>
                <p className="text-xs text-muted mt-1">Booking, social media, and contact links</p>
              </div>
              <div className="p-6">
                <LinksEditor
                  hotelId={id}
                  links={(serializedHotel.links || {}) as Record<string, string>}
                  contactInfo={(serializedHotel.contactInfo || {}) as Record<string, any>}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
