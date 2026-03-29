"use client";

import { useState } from "react";
import { COMPONENT_REGISTRY } from "@/lib/component-registry";

interface LockedSection {
  id: string;
  label: string;
  position: "top" | "bottom";
  variant: string;
  props: Record<string, unknown>;
}

interface LockedSectionManagerProps {
  lockedSections: LockedSection[];
  onUpdate: () => void;
}

const EMPTY_FORM = {
  label: "",
  position: "top" as "top" | "bottom",
  variant: COMPONENT_REGISTRY[0]?.variant ?? "",
  propsJson: "{}",
};

export default function LockedSectionManager({
  lockedSections: initialSections,
  onUpdate,
}: LockedSectionManagerProps) {
  const [sections, setSections] = useState<LockedSection[]>(initialSections);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [label, setLabel] = useState(EMPTY_FORM.label);
  const [position, setPosition] = useState<"top" | "bottom">(EMPTY_FORM.position);
  const [variant, setVariant] = useState(EMPTY_FORM.variant);
  const [propsJson, setPropsJson] = useState(EMPTY_FORM.propsJson);

  function openAddForm() {
    setEditingId(null);
    setLabel(EMPTY_FORM.label);
    setPosition(EMPTY_FORM.position);
    setVariant(EMPTY_FORM.variant);
    setPropsJson(EMPTY_FORM.propsJson);
    setFormError(null);
    setShowForm(true);
  }

  function openEditForm(section: LockedSection) {
    setEditingId(section.id);
    setLabel(section.label);
    setPosition(section.position);
    setVariant(section.variant);
    setPropsJson(JSON.stringify(section.props, null, 2));
    setFormError(null);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setFormError(null);
  }

  async function saveToApi(updated: LockedSection[]) {
    const res = await fetch("/api/brand/sections", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lockedSections: updated }),
    });
    if (!res.ok) throw new Error("Failed to save");
    return updated;
  }

  async function handleSaveForm() {
    setFormError(null);

    if (!label.trim()) {
      setFormError("Label is required.");
      return;
    }

    let parsedProps: Record<string, unknown>;
    try {
      parsedProps = JSON.parse(propsJson);
      if (typeof parsedProps !== "object" || Array.isArray(parsedProps)) {
        throw new Error("Props must be a JSON object");
      }
    } catch {
      setFormError("Props must be valid JSON (object).");
      return;
    }

    setSaving(true);
    try {
      let updated: LockedSection[];
      if (editingId) {
        updated = sections.map((s) =>
          s.id === editingId
            ? { id: editingId, label: label.trim(), position, variant, props: parsedProps }
            : s
        );
      } else {
        const newSection: LockedSection = {
          id: crypto.randomUUID(),
          label: label.trim(),
          position,
          variant,
          props: parsedProps,
        };
        updated = [...sections, newSection];
      }

      await saveToApi(updated);
      setSections(updated);
      setShowForm(false);
      setEditingId(null);
      onUpdate();
    } catch {
      setFormError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this locked section?")) return;

    const updated = sections.filter((s) => s.id !== id);
    try {
      await saveToApi(updated);
      setSections(updated);
      onUpdate();
    } catch {
      // silent — could show a toast in the future
    }
  }

  const defaultPropsForVariant = (v: string): string => {
    const comp = COMPONENT_REGISTRY.find((c) => c.variant === v);
    return comp ? JSON.stringify(comp.defaultProps, null, 2) : "{}";
  };

  return (
    <div className="space-y-4">
      {/* Section list */}
      {sections.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center mb-3">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-muted">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No locked sections</p>
          <p className="text-xs text-muted">
            Add sections that must appear on every hotel page.
          </p>
        </div>
      )}

      {sections.length > 0 && (
        <div className="space-y-2">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-center justify-between gap-3 p-4 bg-elevated rounded-xl"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span
                  className={`shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    section.position === "top"
                      ? "bg-[#7c5cbf]/15 text-[#7c5cbf]"
                      : "bg-[#0fa886]/15 text-[#0fa886]"
                  }`}
                >
                  {section.position === "top" ? "Top" : "Bottom"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{section.label}</p>
                  <p className="text-xs text-muted font-mono truncate">{section.variant}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditForm(section)}
                  className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border transition-colors"
                  title="Edit"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(section.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-[#e85d45] hover:bg-[#e85d45]/10 transition-colors"
                  title="Delete"
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Inline form */}
      {showForm && (
        <div className="p-5 bg-elevated rounded-xl border border-border space-y-4">
          <h4 className="text-sm font-semibold text-foreground">
            {editingId ? "Edit Locked Section" : "Add Locked Section"}
          </h4>

          {formError && (
            <p className="text-xs text-[#e85d45] bg-[#e85d45]/10 px-3 py-2 rounded-lg">
              {formError}
            </p>
          )}

          <div>
            <label className="block text-xs text-muted mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Booking Banner"
              className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Position</label>
            <select
              value={position}
              onChange={(e) => setPosition(e.target.value as "top" | "bottom")}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
            >
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Component Variant</label>
            <select
              value={variant}
              onChange={(e) => {
                setVariant(e.target.value);
                setPropsJson(defaultPropsForVariant(e.target.value));
              }}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-sm outline-none transition-colors"
            >
              {COMPONENT_REGISTRY.map((comp) => (
                <option key={comp.variant} value={comp.variant}>
                  {comp.variant} — {comp.description}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1.5">Props (JSON)</label>
            <textarea
              value={propsJson}
              onChange={(e) => setPropsJson(e.target.value)}
              rows={6}
              placeholder={'{\n  "headline": "Book Direct & Save",\n  "cta": "Check Availability"\n}'}
              className="w-full px-3 py-2 rounded-lg bg-card border border-border focus:border-[#7c5cbf] text-foreground text-xs font-mono outline-none transition-colors resize-y"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={cancelForm}
              className="px-4 py-2 rounded-lg text-sm text-muted hover:text-foreground hover:bg-border transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveForm}
              disabled={saving}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                saving
                  ? "bg-[#7c5cbf]/20 text-[#7c5cbf] cursor-not-allowed opacity-70"
                  : "bg-[#7c5cbf] hover:bg-[#b89dfb] text-white"
              }`}
            >
              {saving && (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              {saving ? "Saving…" : editingId ? "Update" : "Add Section"}
            </button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!showForm && (
        <button
          type="button"
          onClick={openAddForm}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-border text-sm text-muted hover:text-foreground hover:border-[#7c5cbf] hover:bg-elevated transition-all w-full justify-center"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Add Locked Section
        </button>
      )}
    </div>
  );
}
