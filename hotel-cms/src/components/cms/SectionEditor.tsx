"use client";

import { useState, useEffect } from "react";
import { COMPONENT_REGISTRY } from "@/lib/component-registry";
import ConflictModal from "./ConflictModal";

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

interface SectionEditorProps {
  section: Section;
  onUpdate: (updated: Section) => void;
  onDelete: () => void;
  onClose: () => void;
}

const tierInfo: Record<number, { label: string; color: string; desc: string }> = {
  0: { label: "Tier 0", color: "text-[#0fa886] bg-[#0fa886]/10 border-[#0fa886]/20", desc: "Free" },
  1: { label: "Tier 1", color: "text-[#3b7dd8] bg-[#3b7dd8]/10 border-[#3b7dd8]/20", desc: "Basic" },
  2: { label: "Tier 2", color: "text-[#7c5cbf] bg-[#7c5cbf]/10 border-[#7c5cbf]/20", desc: "Pro" },
  3: { label: "Tier 3", color: "text-[#d49a12] bg-[#d49a12]/10 border-[#d49a12]/20", desc: "Enterprise" },
};

function PropField({
  name,
  schema,
  value,
  onChange,
}: {
  name: string;
  schema: Record<string, unknown>;
  value: unknown;
  onChange: (val: unknown) => void;
}) {
  const type = schema.type as string;
  const description = schema.description as string | undefined;
  const enumValues = schema.enum as string[] | undefined;
  const maxLength = schema.maxLength as number | undefined;
  const minimum = schema.minimum as number | undefined;
  const maximum = schema.maximum as number | undefined;

  const label = name
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-[#5a5670]">{label}</label>
        {description && (
          <span className="text-xs text-[#9994ad] italic truncate max-w-[140px]">{description}</span>
        )}
      </div>

      {type === "boolean" ? (
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            value ? "bg-[#0fa886]" : "bg-border"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              value ? "translate-x-4" : "translate-x-1"
            }`}
          />
        </button>
      ) : type === "number" ? (
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={String(value ?? "")}
            min={minimum}
            max={maximum}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-[#e85d45]/50 focus:ring-1 focus:ring-[#e85d45]/20 transition-colors"
          />
          {(minimum !== undefined || maximum !== undefined) && (
            <span className="text-xs text-[#9994ad] shrink-0">
              {minimum ?? ""}–{maximum ?? ""}
            </span>
          )}
        </div>
      ) : enumValues ? (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground focus:outline-none focus:border-[#e85d45]/50 focus:ring-1 focus:ring-[#e85d45]/20 transition-colors appearance-none cursor-pointer"
        >
          {enumValues.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="text"
          value={String(value ?? "")}
          maxLength={maxLength}
          onChange={(e) => onChange(e.target.value)}
          placeholder={description}
          className="w-full px-2.5 py-1.5 rounded-lg bg-background border border-border text-xs text-foreground placeholder-[#9994ad] focus:outline-none focus:border-[#e85d45]/50 focus:ring-1 focus:ring-[#e85d45]/20 transition-colors"
        />
      )}

      {maxLength && type === "string" && !enumValues && (
        <div className="flex justify-end">
          <span className="text-xs text-[#9994ad]">
            {String(value ?? "").length}/{maxLength}
          </span>
        </div>
      )}
    </div>
  );
}

interface ConflictState {
  overrideType: "enhanced" | "custom";
  pendingBody: Record<string, unknown>;
}

export default function SectionEditor({ section, onUpdate, onDelete, onClose }: SectionEditorProps) {
  const [props, setProps] = useState<Record<string, unknown>>(section.props);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [conflict, setConflict] = useState<ConflictState | null>(null);

  const componentDef = COMPONENT_REGISTRY.find((c) => c.variant === section.componentVariant);
  const tier = tierInfo[componentDef?.tierRequirement ?? 0];

  // Reset when section changes
  useEffect(() => {
    setProps(section.props);
    setSaveStatus("idle");
    setConfirmDelete(false);
  }, [section.id, section.props]);

  const handlePropChange = (key: string, value: unknown) => {
    setProps((prev) => ({ ...prev, [key]: value }));
  };

  const doSave = async (
    body: Record<string, unknown>,
    conflictResolution?: "keep" | "discard" | "reapply"
  ) => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const payload = conflictResolution
        ? { ...body, conflictResolution }
        : body;

      const res = await fetch(`/api/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 409) {
        const conflictData = await res.json();
        setConflict({
          overrideType: conflictData.overrideType ?? "custom",
          pendingBody: body,
        });
        return;
      }

      if (!res.ok) throw new Error("Failed to save");

      const data = await res.json();
      onUpdate({ ...section, props: data.data?.props ?? props });
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => doSave({ props });

  const handleConflictResolve = (action: "keep" | "discard" | "reapply") => {
    if (!conflict) return;
    setConflict(null);
    doSave(conflict.pendingBody, action);
  };

  const handleVisibilityToggle = async () => {
    const newVisibility = !section.isVisible;
    try {
      await fetch(`/api/sections/${section.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVisible: newVisibility }),
      });
      onUpdate({ ...section, isVisible: newVisibility });
    } catch {
      // Silent fail — parent state already managed
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete();
  };

  const propSchemaProperties = (componentDef?.propSchema as Record<string, unknown>)
    ?.properties as Record<string, Record<string, unknown>> | undefined;

  const componentType = section.componentVariant.split("_")[0];
  const typeColorMap: Record<string, string> = {
    hero: "#e85d45", rooms: "#0fa886", gallery: "#7c5cbf",
    booking: "#d49a12", reviews: "#3b7dd8", map: "#e85d45", footer: "#7c7893",
  };
  const typeColor = typeColorMap[componentType] ?? "#7c7893";

  return (
    <>
      {conflict && (
        <ConflictModal
          sectionId={section.id}
          overrideType={conflict.overrideType}
          onResolve={handleConflictResolve}
          onClose={() => setConflict(null)}
        />
      )}
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: typeColor }}
              >
                {componentType}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded border font-medium ${tier.color}`}
              >
                {tier.label}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-foreground mt-1 truncate">
              {section.componentVariant.replace(/_/g, " ")}
            </h3>
            {componentDef?.description && (
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {componentDef.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors shrink-0"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Category affinity chips */}
        {componentDef?.categoryAffinity && componentDef.categoryAffinity.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {componentDef.categoryAffinity.map((cat) => (
              <span
                key={cat}
                className="text-xs px-1.5 py-0.5 rounded-full bg-elevated text-[#9994ad] capitalize"
              >
                {cat}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Status strip */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-background border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">Sort #{section.sortOrder + 1}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleVisibilityToggle}
            className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md transition-colors ${
              section.isVisible
                ? "text-[#0fa886] bg-[#0fa886]/10 hover:bg-[#0fa886]/20"
                : "text-[#9994ad] bg-elevated hover:bg-border"
            }`}
          >
            {section.isVisible ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                Visible
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
                Hidden
              </>
            )}
          </button>
        </div>
      </div>

      {/* Props form */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {propSchemaProperties ? (
          Object.entries(propSchemaProperties).map(([key, fieldSchema]) => (
            <PropField
              key={key}
              name={key}
              schema={fieldSchema}
              value={props[key] ?? componentDef?.defaultProps[key]}
              onChange={(val) => handlePropChange(key, val)}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center mb-2">
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-[#9994ad]">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-xs text-muted">No editable props</p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-4 py-3 border-t border-border space-y-2">
        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
            saveStatus === "saved"
              ? "bg-[#0fa886]/20 text-[#0fa886] border border-[#0fa886]/30"
              : saveStatus === "error"
              ? "bg-[#e85d45]/20 text-[#e85d45] border border-[#e85d45]/30"
              : "bg-[#e85d45] hover:bg-[#e5604a] text-white"
          }`}
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
              Props Saved
            </>
          ) : saveStatus === "error" ? (
            "Save Failed — Retry"
          ) : (
            "Save Props"
          )}
        </button>

        {/* Delete button */}
        <button
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
            confirmDelete
              ? "bg-[#e85d45] text-white"
              : "bg-transparent text-[#e85d45]/70 hover:text-[#e85d45] hover:bg-[#e85d45]/10 border border-[#e85d45]/20"
          }`}
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {confirmDelete ? "Click again to confirm delete" : "Delete Section"}
        </button>
      </div>
    </div>
    </>
  );
}
