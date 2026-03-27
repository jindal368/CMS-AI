"use client";

import { useState } from "react";
import { COMPONENT_REGISTRY } from "@/lib/component-registry";

interface Section {
  id: string;
  sortOrder: number;
  isVisible: boolean;
  componentVariant: string;
  props: Record<string, unknown>;
  pageId: string;
  createdAt: string;
  updatedAt: string;
}

interface AddSectionModalProps {
  pageId: string;
  existingSortOrder: number;
  onAdd: (section: Section) => void;
  onClose: () => void;
}

const tierInfo: Record<number, { label: string; color: string }> = {
  0: { label: "T0", color: "text-[#0fa886] bg-[#0fa886]/10 border-[#0fa886]/20" },
  1: { label: "T1", color: "text-[#3b7dd8] bg-[#3b7dd8]/10 border-[#3b7dd8]/20" },
  2: { label: "T2", color: "text-[#7c5cbf] bg-[#7c5cbf]/10 border-[#7c5cbf]/20" },
  3: { label: "T3", color: "text-[#d49a12] bg-[#d49a12]/10 border-[#d49a12]/20" },
};

const typeColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  hero:    { bg: "bg-[#e85d45]/10", text: "text-[#e85d45]", border: "border-[#e85d45]/20", icon: "▲" },
  rooms:   { bg: "bg-[#0fa886]/10", text: "text-[#0fa886]", border: "border-[#0fa886]/20", icon: "▣" },
  gallery: { bg: "bg-[#7c5cbf]/10", text: "text-[#7c5cbf]", border: "border-[#7c5cbf]/20", icon: "▦" },
  booking: { bg: "bg-[#d49a12]/10", text: "text-[#d49a12]", border: "border-[#d49a12]/20", icon: "◈" },
  reviews: { bg: "bg-[#3b7dd8]/10", text: "text-[#3b7dd8]", border: "border-[#3b7dd8]/20", icon: "★" },
  map:     { bg: "bg-[#e85d45]/10", text: "text-[#e85d45]", border: "border-[#e85d45]/20", icon: "◎" },
  footer:  { bg: "bg-[#7c7893]/10", text: "text-[#7c7893]", border: "border-[#7c7893]/20", icon: "≡" },
};

const ALL_TYPES = ["all", "hero", "rooms", "gallery", "booking", "reviews", "map", "footer"];

export default function AddSectionModal({
  pageId,
  existingSortOrder,
  onAdd,
  onClose,
}: AddSectionModalProps) {
  const [selectedType, setSelectedType] = useState("all");
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered =
    selectedType === "all"
      ? COMPONENT_REGISTRY
      : COMPONENT_REGISTRY.filter((c) => c.type === selectedType);

  const handleAdd = async (variant: string) => {
    const component = COMPONENT_REGISTRY.find((c) => c.variant === variant);
    if (!component) return;

    setAdding(variant);
    setError(null);
    try {
      const res = await fetch("/api/sections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageId,
          sortOrder: existingSortOrder,
          isVisible: true,
          componentVariant: variant,
          props: component.defaultProps,
        }),
      });
      if (!res.ok) throw new Error("Failed to add section");
      const data = await res.json();
      onAdd({
        ...data,
        props: data.props ?? component.defaultProps,
        createdAt: data.createdAt ?? new Date().toISOString(),
        updatedAt: data.updatedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add section");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[#ffffff] border border-[#e2dfe8] rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2dfe8] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#1a1a2e]">Add Section</h2>
            <p className="text-xs text-[#7c7893] mt-0.5">
              Choose a component to add to your page
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#7c7893] hover:text-[#1a1a2e] hover:bg-[#f0eef5] transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 px-6 py-3 border-b border-[#e2dfe8] overflow-x-auto shrink-0">
          {ALL_TYPES.map((type) => {
            const info = typeColors[type];
            const isActive = selectedType === type;
            return (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all whitespace-nowrap ${
                  isActive
                    ? type === "all"
                      ? "bg-[#e85d45]/10 text-[#e85d45] border border-[#e85d45]/30"
                      : `${info.bg} ${info.text} border ${info.border}`
                    : "bg-[#f0eef5] text-[#7c7893] hover:text-[#5a5670] border border-transparent"
                }`}
              >
                {type !== "all" && info && (
                  <span className="text-xs">{info.icon}</span>
                )}
                {type}
                <span className="opacity-60">
                  ({type === "all" ? COMPONENT_REGISTRY.length : COMPONENT_REGISTRY.filter((c) => c.type === type).length})
                </span>
              </button>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 px-3 py-2 rounded-lg bg-[#e85d45]/10 border border-[#e85d45]/20 text-xs text-[#e85d45] shrink-0">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((component) => {
              const info = typeColors[component.type] ?? typeColors.footer;
              const tier = tierInfo[component.tierRequirement] ?? tierInfo[0];
              const isAdding = adding === component.variant;

              return (
                <button
                  key={component.variant}
                  onClick={() => handleAdd(component.variant)}
                  disabled={!!adding}
                  className="group relative flex flex-col items-start p-4 rounded-xl bg-[#f0eef5] hover:bg-[#e8e5f0] border border-[#e2dfe8] hover:border-[#d4d0de] transition-all text-left disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {/* Type icon + tier badge */}
                  <div className="flex items-center justify-between w-full mb-3">
                    <div className={`w-8 h-8 rounded-lg ${info.bg} ${info.border} border flex items-center justify-center`}>
                      <span className={`text-sm ${info.text}`}>{info.icon}</span>
                    </div>
                    <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${tier.color}`}>
                      {tier.label}
                    </span>
                  </div>

                  {/* Name */}
                  <h3 className={`text-sm font-semibold mb-1 ${info.text} group-hover:opacity-90`}>
                    {component.variant.replace(/_/g, " ")}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-[#7c7893] leading-relaxed mb-3 flex-1">
                    {component.description}
                  </p>

                  {/* Category affinity */}
                  <div className="flex flex-wrap gap-1">
                    {component.categoryAffinity.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="text-xs px-1.5 py-0.5 rounded-full bg-[#e2dfe8] text-[#9994ad] capitalize"
                      >
                        {cat}
                      </span>
                    ))}
                    {component.categoryAffinity.length > 3 && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#e2dfe8] text-[#9994ad]">
                        +{component.categoryAffinity.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Add overlay */}
                  <div className={`absolute inset-0 rounded-xl flex items-center justify-center transition-opacity ${
                    isAdding ? "opacity-100 bg-[#f0eef5]/80" : "opacity-0 group-hover:opacity-0"
                  }`}>
                    {isAdding && (
                      <svg className="w-5 h-5 text-[#e85d45] animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                  </div>

                  {/* Hover add indicator */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-5 h-5 rounded-full bg-[#e85d45] flex items-center justify-center">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-white">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
