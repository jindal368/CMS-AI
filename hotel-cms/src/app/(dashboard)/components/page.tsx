import { COMPONENT_REGISTRY } from "@/lib/component-registry";
import type { ComponentData } from "@/lib/schemas";

export const dynamic = "force-dynamic";

const TIER_BADGE: Record<
  number,
  { label: string; color: string; bg: string }
> = {
  0: { label: "T0", color: "#0fa886", bg: "rgba(61,217,182,0.12)" },
  1: { label: "T1", color: "#3b7dd8", bg: "rgba(91,156,245,0.12)" },
  2: { label: "T2", color: "#d49a12", bg: "rgba(245,183,49,0.12)" },
  3: { label: "T3", color: "#e85d45", bg: "rgba(242,112,89,0.12)" },
};

const TYPE_ORDER = [
  "hero",
  "rooms",
  "gallery",
  "booking",
  "reviews",
  "map",
  "footer",
];

const TYPE_LABELS: Record<string, string> = {
  hero: "Hero",
  rooms: "Rooms",
  gallery: "Gallery",
  booking: "Booking",
  reviews: "Reviews",
  map: "Map",
  footer: "Footer",
};

function TierBadge({ tier }: { tier: number }) {
  const badge = TIER_BADGE[tier] ?? TIER_BADGE[0];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide"
      style={{ color: badge.color, backgroundColor: badge.bg }}
    >
      {badge.label}
    </span>
  );
}

function ComponentCard({ component, index }: { component: ComponentData; index: number }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-4 flex flex-col gap-3 hover:border-[#d4d0de] transition-colors animate-in animate-in-delay-${Math.min(index + 1, 5)}`}>
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {component.variant}
          </p>
          <p className="text-xs text-muted mt-0.5 capitalize">
            {component.type}
          </p>
        </div>
        <TierBadge tier={component.tierRequirement} />
      </div>

      {/* Description */}
      <p className="text-xs text-[#9d9aaa] leading-relaxed line-clamp-2">
        {component.description}
      </p>

      {/* Category affinity tags */}
      {component.categoryAffinity.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {component.categoryAffinity.map((cat) => (
            <span
              key={cat}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-elevated text-muted border border-border capitalize"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ComponentsPage() {
  // Group components by type, preserving TYPE_ORDER
  const grouped = TYPE_ORDER.reduce<Record<string, ComponentData[]>>(
    (acc, type) => {
      const items = COMPONENT_REGISTRY.filter((c) => c.type === type);
      if (items.length > 0) acc[type] = items;
      return acc;
    },
    {}
  );

  // Any types not in TYPE_ORDER go at the end
  const extraTypes = [
    ...new Set(COMPONENT_REGISTRY.map((c) => c.type)),
  ].filter((t) => !TYPE_ORDER.includes(t));
  extraTypes.forEach((type) => {
    grouped[type] = COMPONENT_REGISTRY.filter((c) => c.type === type);
  });

  const totalCount = COMPONENT_REGISTRY.length;

  return (
    <div className="space-y-8 max-w-[1600px]">
      {/* Page header */}
      <div className="animate-in">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Component Registry
        </h1>
        <p className="text-sm text-muted mt-1">
          {totalCount} pre-built component variant
          {totalCount !== 1 ? "s" : ""} available for page composition
        </p>
      </div>

      {/* Tier legend */}
      <div className="bg-card border border-border rounded-xl p-4">
        <p className="text-xs font-medium text-muted uppercase tracking-wider mb-3">
          Tier Requirements
        </p>
        <div className="flex flex-wrap gap-4">
          {Object.entries(TIER_BADGE).map(([tier, badge]) => (
            <div key={tier} className="flex items-center gap-2">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold"
                style={{ color: badge.color, backgroundColor: badge.bg }}
              >
                {badge.label}
              </span>
              <span className="text-xs text-muted">
                {tier === "0" && "All plans"}
                {tier === "1" && "Standard+"}
                {tier === "2" && "Pro+"}
                {tier === "3" && "Enterprise"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Grouped sections */}
      {Object.entries(grouped).map(([type, components]) => (
        <section key={type}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-foreground capitalize">
              {TYPE_LABELS[type] ?? type}
            </h2>
            <span className="text-xs text-muted bg-elevated border border-border px-2 py-0.5 rounded-full">
              {components.length}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {components.map((component, index) => (
              <ComponentCard key={component.variant} component={component} index={index} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
