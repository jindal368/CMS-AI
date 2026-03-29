"use client";

import Portal from "@/components/ui/Portal";

interface ConflictModalProps {
  sectionId: string;
  overrideType: "enhanced" | "custom";
  onResolve: (action: "keep" | "discard" | "reapply") => void;
  onClose: () => void;
}

export default function ConflictModal({
  sectionId: _sectionId,
  overrideType,
  onResolve,
  onClose,
}: ConflictModalProps) {
  const editKind = overrideType === "custom" ? "CSS/HTML" : "CSS/HTML";

  return (
    <Portal>
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel — glass-card-static */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-card border border-border rounded-2xl shadow-xl shadow-black/10 p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#d49a12]/15 border border-[#d49a12]/25 flex items-center justify-center">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-4.5 h-4.5 text-[#d49a12]"
              style={{ width: "1.125rem", height: "1.125rem" }}
            >
              <path
                fillRule="evenodd"
                d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-foreground leading-snug">
              Custom Edits Detected
            </h2>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              This section has custom <span className="font-medium text-foreground">{editKind}</span> edits.
              A CMS change is being applied — choose how to handle the conflict.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded-lg text-muted hover:text-foreground hover:bg-elevated transition-colors"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: "1rem", height: "1rem" }}>
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-border mb-4" />

        {/* Options */}
        <div className="space-y-2.5">
          {/* Keep — amber */}
          <button
            onClick={() => onResolve("keep")}
            className="w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border border-[#d49a12]/30 bg-[#d49a12]/8 hover:bg-[#d49a12]/14 hover:border-[#d49a12]/50 text-left transition-all group"
            style={{ backgroundColor: "rgba(212,154,18,0.06)" }}
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#d49a12]/15 border border-[#d49a12]/25 flex items-center justify-center mt-0.5">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-[#d49a12]"
                style={{ width: "0.875rem", height: "0.875rem" }}
              >
                <path
                  fillRule="evenodd"
                  d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#d49a12] group-hover:text-[#b8850f] transition-colors">
                Keep custom edits
              </p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Applies the CMS change but preserves your custom {editKind} overrides.
              </p>
            </div>
          </button>

          {/* Discard — coral */}
          <button
            onClick={() => onResolve("discard")}
            className="w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border border-[#e85d45]/30 hover:border-[#e85d45]/50 text-left transition-all group"
            style={{ backgroundColor: "rgba(232,93,69,0.05)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(232,93,69,0.10)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(232,93,69,0.05)")
            }
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#e85d45]/15 border border-[#e85d45]/25 flex items-center justify-center mt-0.5">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-[#e85d45]"
                style={{ width: "0.875rem", height: "0.875rem" }}
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#e85d45] transition-colors">
                Discard custom edits
              </p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Clears all overrides and applies the CMS change as a fresh component.
              </p>
            </div>
          </button>

          {/* Re-apply — purple */}
          <button
            onClick={() => onResolve("reapply")}
            className="w-full flex items-start gap-3 px-3.5 py-3 rounded-xl border border-[#7c5cbf]/30 hover:border-[#7c5cbf]/50 text-left transition-all group"
            style={{ backgroundColor: "rgba(124,92,191,0.05)" }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(124,92,191,0.10)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "rgba(124,92,191,0.05)")
            }
          >
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-[#7c5cbf]/15 border border-[#7c5cbf]/25 flex items-center justify-center mt-0.5">
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                className="text-[#7c5cbf]"
                style={{ width: "0.875rem", height: "0.875rem" }}
              >
                <path
                  fillRule="evenodd"
                  d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0v2.43l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[#7c5cbf] transition-colors">
                Re-apply with AI
              </p>
              <p className="text-xs text-muted mt-0.5 leading-relaxed">
                Clears overrides, applies the CMS change, then AI re-styles the component to match your preferences.
              </p>
            </div>
          </button>
        </div>

        {/* Cancel */}
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 rounded-lg text-xs font-medium text-muted hover:text-foreground hover:bg-elevated transition-colors border border-transparent hover:border-border"
        >
          Cancel — keep current state
        </button>
      </div>
    </div>
    </Portal>
  );
}
