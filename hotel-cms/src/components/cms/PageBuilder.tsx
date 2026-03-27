"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import SectionEditor from "./SectionEditor";
import AddSectionModal from "./AddSectionModal";
import { AICommandInput, FloatingLogs, FloatingDiff } from "./AIActionBar";
import type { LogEntry, DiffEntry } from "./AIActionBar";

interface Section {
  id: string;
  sortOrder: number;
  isVisible: boolean;
  componentVariant: string;
  props: Record<string, unknown>;
  pageId: string;
  createdAt: string;
  updatedAt: string;
  customCss?: string | null;
  customHtml?: string | null;
  customMode?: boolean;
}

interface PageData {
  id: string;
  slug: string;
  pageType: string;
  locale: string;
  hotelId: string;
  hotel: { id: string; name: string; category: string };
  sections: Section[];
  metaTags: Record<string, unknown>;
}

interface PageBuilderProps {
  page: PageData;
  hotelId: string;
}

const componentTypeColors: Record<string, string> = {
  hero: "text-[#e85d45]",
  rooms: "text-[#0fa886]",
  gallery: "text-[#7c5cbf]",
  booking: "text-[#d49a12]",
  reviews: "text-[#3b7dd8]",
  map: "text-[#e85d45]",
  footer: "text-[#7c7893]",
};

function getComponentType(variant: string): string {
  return variant.split("_")[0];
}

const pageTypeIcon: Record<string, string> = {
  home: "⌂", rooms: "▣", gallery: "▦", contact: "✉", about: "ⓘ",
  dining: "◈", spa: "◉", events: "◆", custom: "◇",
};

export default function PageBuilder({ page, hotelId }: PageBuilderProps) {
  const [sections, setSections] = useState<Section[]>(page.sections);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  // AI panel state — lifted up so toolbar + floating panels share it
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [diffs, setDiffs] = useState<DiffEntry[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [showDiff, setShowDiff] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const previewSlug = page.slug === "/" ? "home" : page.slug;
  const previewUrl = `/preview/${hotelId}/${previewSlug}`;

  // ⌘K / Ctrl+K shortcut → focus AI input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        aiInputRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const refreshPreview = useCallback(() => {
    if (iframeRef.current) {
      iframeRef.current.src = `${previewUrl}?t=${Date.now()}`;
    }
  }, [previewUrl]);

  const reloadSections = useCallback(async () => {
    try {
      const res = await fetch(`/api/pages/${page.id}`);
      if (!res.ok) return;
      const data = await res.json();
      const fetched = (data.sections ?? []).map((s: Record<string, unknown>) => ({
        ...s,
        createdAt: s.createdAt ?? new Date().toISOString(),
        updatedAt: s.updatedAt ?? new Date().toISOString(),
      }));
      setSections(fetched);
      if (selectedSection) {
        const updated = fetched.find((s: Section) => s.id === selectedSection.id);
        setSelectedSection(updated ?? null);
      }
    } catch {
      // silently fail
    }
  }, [page.id, selectedSection]);

  const handleVisibilityToggle = async (section: Section) => {
    const updated = { ...section, isVisible: !section.isVisible };
    setSections((prev) => prev.map((s) => (s.id === section.id ? updated : s)));
    if (selectedSection?.id === section.id) setSelectedSection(updated);
    try {
      await fetch(`/api/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: !section.isVisible }),
      });
      refreshPreview();
    } catch {
      setSections((prev) => prev.map((s) => (s.id === section.id ? section : s)));
    }
  };

  const handleDelete = async (sectionId: string) => {
    const prev = sections;
    setSections((s) => s.filter((sec) => sec.id !== sectionId));
    if (selectedSection?.id === sectionId) setSelectedSection(null);
    try {
      await fetch(`/api/sections/${sectionId}`, { method: "DELETE" });
      refreshPreview();
    } catch {
      setSections(prev);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newSections = [...sections];
    [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
    const reordered = newSections.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(reordered);
    try {
      await Promise.all([
        fetch(`/api/sections/${reordered[index - 1].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: index - 1 }),
        }),
        fetch(`/api/sections/${reordered[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: index }),
        }),
      ]);
      refreshPreview();
    } catch {
      setSections(sections);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === sections.length - 1) return;
    const newSections = [...sections];
    [newSections[index], newSections[index + 1]] = [newSections[index + 1], newSections[index]];
    const reordered = newSections.map((s, i) => ({ ...s, sortOrder: i }));
    setSections(reordered);
    try {
      await Promise.all([
        fetch(`/api/sections/${reordered[index].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: index }),
        }),
        fetch(`/api/sections/${reordered[index + 1].id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sortOrder: index + 1 }),
        }),
      ]);
      refreshPreview();
    } catch {
      setSections(sections);
    }
  };

  const handleSectionAdded = (newSection: Section) => {
    setSections((prev) => [...prev, newSection]);
    setShowAddModal(false);
    refreshPreview();
  };

  const handleSectionUpdated = (updated: Section) => {
    setSections((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setSelectedSection(updated);
    refreshPreview();
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      await Promise.all(
        sections.map((s, i) =>
          fetch(`/api/sections/${s.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sortOrder: i }),
          })
        )
      );
      setSaveStatus("saved");
      refreshPreview();
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  // Callbacks for AICommandInput
  const handleLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [...prev, entry]);
    setShowLogs(true);
  }, []);

  const handleDiff = useCallback((entries: DiffEntry[]) => {
    setDiffs(entries);
    if (entries.length > 0) setShowDiff(true);
  }, []);

  const handleActionApplied = useCallback(() => {
    reloadSections();
    refreshPreview();
  }, [reloadSections, refreshPreview]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-2 glass-card-static border-b border-white/30 z-10">
        {/* Back */}
        <Link
          href={`/hotels/${hotelId}`}
          className="text-[#7c7893] hover:text-[#1a1a2e] transition-colors shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
        </Link>

        <div className="w-px h-4 bg-white/40 shrink-0" />

        {/* Page info badge */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#7c7893] text-sm">{page.hotel.name}</span>
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 text-[#d4d0de]">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-sm">{pageTypeIcon[page.pageType] ?? "◇"}</span>
          <span className="text-sm font-semibold text-[#1a1a2e]">/{page.slug}</span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-white/60 text-[#7c7893] capitalize border border-white/40">
            {page.pageType}
          </span>
          {page.locale !== "en" && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-[#3b7dd8]/10 text-[#3b7dd8] uppercase border border-[#3b7dd8]/20">
              {page.locale}
            </span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* AI Command Input */}
        <AICommandInput
          ref={aiInputRef}
          hotelId={hotelId}
          pageId={page.id}
          sectionId={selectedSection?.id}
          onLog={handleLog}
          onDiff={handleDiff}
          onActionApplied={handleActionApplied}
        />

        {/* Log / Diff toggles */}
        <button
          onClick={() => setShowLogs((v) => !v)}
          className={`h-9 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${
            showLogs
              ? "bg-[#7c5cbf]/15 text-[#7c5cbf] border-[#7c5cbf]/30"
              : "bg-white/40 text-[#7c7893] border-white/40 hover:text-[#7c5cbf]"
          }`}
          title="Toggle logs panel"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
          {logs.length > 0 && <span>{logs.length}</span>}
        </button>

        {diffs.length > 0 && (
          <button
            onClick={() => setShowDiff((v) => !v)}
            className={`h-9 flex items-center gap-1 px-2.5 rounded-lg text-xs font-medium transition-all border shrink-0 ${
              showDiff
                ? "bg-[#0fa886]/15 text-[#0fa886] border-[#0fa886]/30"
                : "bg-white/40 text-[#7c7893] border-white/40 hover:text-[#0fa886]"
            }`}
            title="Toggle diff panel"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
            <span>{diffs.length}</span>
          </button>
        )}

        {/* Add Section */}
        <button
          onClick={() => setShowAddModal(true)}
          className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 text-[#e85d45] text-xs font-medium transition-colors border border-[#e85d45]/20 shrink-0"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Section
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`h-9 flex items-center gap-1.5 px-4 rounded-lg text-xs font-semibold transition-all shrink-0 ${
            saveStatus === "saved"
              ? "bg-[#0fa886]/20 text-[#0fa886] border border-[#0fa886]/30"
              : saveStatus === "error"
              ? "bg-[#e85d45]/20 text-[#e85d45] border border-[#e85d45]/30"
              : "bg-[#e85d45] hover:bg-[#e5604a] text-white border border-transparent"
          } disabled:opacity-60 disabled:cursor-not-allowed`}
        >
          {saving ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Saving…
            </>
          ) : saveStatus === "saved" ? (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Saved
            </>
          ) : saveStatus === "error" ? (
            "Error"
          ) : (
            <>
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
              </svg>
              Save
            </>
          )}
        </button>
      </div>

      {/* ── Main 3-panel ────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Sections list (w-60) */}
        <div className="w-60 shrink-0 bg-white/50 backdrop-blur-sm border-r border-white/30 flex flex-col overflow-hidden">
          <div className="px-3 py-2.5 border-b border-white/30 flex items-center justify-between shrink-0">
            <span className="text-xs font-semibold text-[#7c7893] uppercase tracking-wider">Sections</span>
            <span className="text-xs text-[#7c7893] bg-white/60 px-2 py-0.5 rounded-full border border-white/40">
              {sections.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
            {sections.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                <div className="w-10 h-10 rounded-full bg-white/60 flex items-center justify-center mb-3 border border-white/40">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-[#d4d0de]">
                    <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h6a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-xs text-[#7c7893]">No sections yet</p>
                <p className="text-xs text-[#d4d0de] mt-1">Click &quot;Add Section&quot; to get started</p>
              </div>
            ) : (
              sections.map((section, index) => {
                const type = getComponentType(section.componentVariant);
                const typeColor = componentTypeColors[type] ?? "text-[#7c7893]";
                const isSelected = selectedSection?.id === section.id;

                return (
                  <div
                    key={section.id}
                    onClick={() => setSelectedSection(isSelected ? null : section)}
                    className={`group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#e85d45]/10 border border-[#e85d45]/30"
                        : "bg-white/50 hover:bg-white/70 border border-white/30 hover:border-white/50"
                    }`}
                  >
                    {/* Drag handle */}
                    <div className="text-[#d4d0de] cursor-grab shrink-0">
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                        <path d="M7 2a2 2 0 110 4 2 2 0 010-4zM7 8a2 2 0 110 4 2 2 0 010-4zM7 14a2 2 0 110 4 2 2 0 010-4zM13 2a2 2 0 110 4 2 2 0 010-4zM13 8a2 2 0 110 4 2 2 0 010-4zM13 14a2 2 0 110 4 2 2 0 010-4z" />
                      </svg>
                    </div>

                    {/* Sort order */}
                    <span className="text-xs text-[#d4d0de] w-4 text-center tabular-nums shrink-0">
                      {index + 1}
                    </span>

                    {/* Component info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span className={`text-xs font-medium truncate ${typeColor}`}>
                          {section.componentVariant.replace(/_/g, " ")}
                        </span>
                        {(section.customCss || section.customHtml) && (
                          <span className="ml-1 px-1.5 py-0.5 text-[9px] rounded bg-[#7c5cbf]/15 text-[#7c5cbf] font-medium uppercase tracking-wider">
                            {section.customMode ? "custom" : "css"}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#d4d0de] capitalize">{type}</span>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                        disabled={index === 0}
                        className="p-1 rounded text-[#7c7893] hover:text-[#1a1a2e] hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move up"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                        disabled={index === sections.length - 1}
                        className="p-1 rounded text-[#7c7893] hover:text-[#1a1a2e] hover:bg-white/60 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move down"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleVisibilityToggle(section); }}
                        className={`p-1 rounded transition-colors ${
                          section.isVisible
                            ? "text-[#0fa886] hover:bg-[#0fa886]/10"
                            : "text-[#d4d0de] hover:text-[#7c7893] hover:bg-white/60"
                        }`}
                        title={section.isVisible ? "Hide section" : "Show section"}
                      >
                        {section.isVisible ? (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(section.id); }}
                        className="p-1 rounded text-[#d4d0de] hover:text-[#e85d45] hover:bg-[#e85d45]/10 transition-colors"
                        title="Delete section"
                      >
                        <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add section footer */}
          <div className="px-2 py-2.5 border-t border-white/30 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-dashed border-white/50 hover:border-[#e85d45]/40 text-[#7c7893] hover:text-[#e85d45] text-xs font-medium transition-all"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Section
            </button>
          </div>
        </div>

        {/* Center: Preview with floating panels */}
        <div className="flex-1 flex flex-col relative overflow-hidden">
          {/* URL bar */}
          <div className="shrink-0 px-3 py-1.5 bg-white/40 border-b border-white/20 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#7c7893] font-mono">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#e85d45]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#d49a12]/50" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#0fa886]/50" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/60 rounded border border-white/40">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3 shrink-0 text-[#9994ad]">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                {previewUrl}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[#7c7893] hover:text-[#0fa886] hover:bg-white/60 transition-colors"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
                Open
              </a>
              <button
                onClick={refreshPreview}
                className="p-1 rounded text-[#7c7893] hover:text-[#1a1a2e] hover:bg-white/60 transition-colors"
                title="Refresh preview"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>

          {/* iframe + floating panels */}
          <div className="flex-1 relative overflow-hidden">
            <iframe
              ref={iframeRef}
              src={previewUrl}
              className="absolute inset-0 w-full h-full border-0"
              title="Page preview"
            />
            <FloatingLogs
              logs={logs}
              onClear={() => setLogs([])}
              onClose={() => setShowLogs(false)}
              show={showLogs}
            />
            <FloatingDiff
              diffs={diffs}
              onClose={() => setShowDiff(false)}
              show={showDiff}
            />
          </div>
        </div>

        {/* Right: Section Editor (conditional) */}
        {selectedSection && (
          <div className="w-80 shrink-0 bg-white/60 backdrop-blur-sm border-l border-white/30 overflow-y-auto">
            <SectionEditor
              section={selectedSection}
              onUpdate={handleSectionUpdated}
              onDelete={() => handleDelete(selectedSection.id)}
              onClose={() => setSelectedSection(null)}
            />
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {showAddModal && (
        <AddSectionModal
          pageId={page.id}
          existingSortOrder={sections.length}
          onAdd={handleSectionAdded}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
