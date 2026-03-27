"use client";

import { useState, useRef, useEffect, forwardRef } from "react";

// ─── Shared types ──────────────────────────────────────────────────────────────

interface ClassifyResult {
  classification: {
    tier: number;
    action: string;
    confidence: number;
    reasoning: string;
  };
  model: string;
  estimatedCost: number;
}

interface OperationResult {
  op: string;
  success: boolean;
  details: Record<string, unknown>;
}

interface ExecuteResult {
  classification: unknown;
  operationResults: OperationResult[];
  reasoning?: string;
  operations?: string[];
  model?: string;
}

export interface LogEntry {
  timestamp: number;
  type: "info" | "step" | "success" | "error" | "data";
  message: string;
}

export interface DiffEntry {
  field: string;
  oldValue: string;
  newValue: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const tierInfo: Record<
  number,
  { label: string; color: string; bg: string; border: string; desc: string; model: string }
> = {
  0: {
    label: "Tier 0",
    color: "text-[#0fa886]",
    bg: "bg-[#0fa886]/10",
    border: "border-[#0fa886]/30",
    desc: "Direct DB write — no LLM needed",
    model: "none",
  },
  1: {
    label: "Tier 1",
    color: "text-[#3b7dd8]",
    bg: "bg-[#3b7dd8]/10",
    border: "border-[#3b7dd8]/30",
    desc: "Fast model — copy & text edits",
    model: "Nemotron 120B",
  },
  2: {
    label: "Tier 2",
    color: "text-[#7c5cbf]",
    bg: "bg-[#7c5cbf]/10",
    border: "border-[#7c5cbf]/30",
    desc: "Reasoning model — layout & component changes",
    model: "Nemotron 120B",
  },
  3: {
    label: "Tier 3",
    color: "text-[#d49a12]",
    bg: "bg-[#d49a12]/10",
    border: "border-[#d49a12]/30",
    desc: "Full redesign — multi-page generation",
    model: "Nemotron 120B",
  },
};

const logColors: Record<LogEntry["type"], string> = {
  info: "text-[#7c7893]",
  step: "text-[#3b7dd8]",
  success: "text-[#0fa886]",
  error: "text-[#e85d45]",
  data: "text-[#7c5cbf]",
};

const logIcons: Record<LogEntry["type"], string> = {
  info: "○",
  step: "▸",
  success: "✓",
  error: "✗",
  data: "┊",
};

type Phase = "idle" | "classifying" | "preview" | "executing" | "done" | "error";

// ─── AICommandInput ────────────────────────────────────────────────────────────

interface AICommandInputProps {
  hotelId: string;
  pageId?: string;
  sectionId?: string;
  onLog: (entry: LogEntry) => void;
  onDiff: (entries: DiffEntry[]) => void;
  onActionApplied: () => void;
}

export const AICommandInput = forwardRef<HTMLInputElement, AICommandInputProps>(
  function AICommandInput({ hotelId, pageId, sectionId, onLog, onDiff, onActionApplied }, ref) {
    const [command, setCommand] = useState("");
    const [phase, setPhase] = useState<Phase>("idle");
    const [classified, setClassified] = useState<ClassifyResult | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const addLog = (type: LogEntry["type"], message: string) => {
      onLog({ timestamp: Date.now(), type, message });
    };

    const formatTime = (ts: number) => {
      const d = new Date(ts);
      return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    };
    // formatTime is used implicitly via addLog — suppress unused warning
    void formatTime;

    const handleClassify = async () => {
      if (!command.trim()) return;
      setPhase("classifying");
      setErrorMsg(null);
      setClassified(null);
      onDiff([]);

      addLog("info", `Analyzing: "${command.trim()}"`);
      addLog("step", "Running intent classifier (rule engine)...");

      try {
        const res = await fetch("/api/ai/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hotelId, action: command.trim() }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Classification failed");
        }
        const data = await res.json();
        setClassified(data);

        const tier = data.classification.tier;
        const tierMeta = tierInfo[tier];
        addLog("success", `Classified → ${tierMeta?.label} (${tierMeta?.model})`);
        addLog("data", `Action: ${data.classification.action} | Confidence: ${(data.classification.confidence * 100).toFixed(0)}%`);
        addLog("info", `Reasoning: "${data.classification.reasoning}"`);
        if (tier > 0) addLog("step", "Awaiting approval to call LLM...");

        setPhase("preview");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Classification failed";
        addLog("error", msg);
        setErrorMsg(msg);
        setPhase("error");
      }
    };

    const handleApprove = async () => {
      setPhase("executing");
      setErrorMsg(null);

      const tierMeta = classified ? tierInfo[classified.classification.tier] : null;
      addLog("step", `Calling ${tierMeta?.model ?? "AI"} via OpenRouter...`);
      addLog("info", "Building prompt with full website context...");
      addLog("info", "This may take 30-90 seconds for complex changes.");

      // Progress timer — shows elapsed time in logs every 10s
      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        addLog("info", `Still generating... ${elapsed}s elapsed`);
      }, 10000);

      // 3 minute timeout
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 180000);

      try {
        const res = await fetch("/api/ai/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hotelId, action: command.trim(), pageId, sectionId }),
          signal: controller.signal,
        });
        clearTimeout(timeout);
        clearInterval(progressTimer);
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Execution failed");
        }
        const data = (await res.json()) as ExecuteResult;

        addLog("success", `LLM responded in ${elapsed}s`);
        if (data.operations && data.operations.length > 0) {
          addLog("data", `Operations emitted: ${data.operations.join(", ")}`);
        }
        if (data.reasoning) {
          addLog("info", `AI reasoning: "${data.reasoning}"`);
        }

        // Build diffs from operation results
        const newDiffs: DiffEntry[] = [];
        const opResults = data.operationResults || [];

        for (const opResult of opResults) {
          if (!opResult.success) {
            addLog("error", `Operation ${opResult.op} failed: ${opResult.details.error}`);
            continue;
          }
          addLog("step", `Executed: ${opResult.op}`);
          const d = opResult.details;

          switch (opResult.op) {
            case "update_text":
              newDiffs.push({
                field: d.field as string,
                oldValue: String(d.oldValue ?? "(empty)"),
                newValue: String(d.newValue ?? ""),
              });
              if (Array.isArray(d.alternatives) && d.alternatives.length > 0) {
                addLog("data", `Alternatives: ${(d.alternatives as string[]).map((a: string) => `"${a}"`).join(", ")}`);
              }
              break;

            case "update_props": {
              const changed = (d.changedFields as string[]) || [];
              const oldProps = (d.oldProps as Record<string, unknown>) || {};
              const newProps = (d.newProps as Record<string, unknown>) || {};
              for (const field of changed) {
                newDiffs.push({
                  field,
                  oldValue: String(oldProps[field] ?? "(empty)"),
                  newValue: String(newProps[field] ?? ""),
                });
              }
              break;
            }

            case "swap_component":
              newDiffs.push({ field: "component", oldValue: d.oldVariant as string, newValue: d.newVariant as string });
              break;

            case "add_section":
              newDiffs.push({ field: "new section", oldValue: "(none)", newValue: `${d.variant} at position ${d.sortOrder}` });
              break;

            case "remove_section":
              newDiffs.push({ field: "removed section", oldValue: d.removedVariant as string, newValue: "(deleted)" });
              break;

            case "update_theme":
              newDiffs.push({ field: "theme", oldValue: "(previous)", newValue: `Updated: ${(d.fieldsUpdated as string[]).join(", ")}` });
              break;

            case "update_meta": {
              const oldMeta = (d.oldMeta as Record<string, string>) || {};
              const newMeta = (d.newMeta as Record<string, string>) || {};
              for (const key of Object.keys(newMeta)) {
                if (oldMeta[key] !== newMeta[key]) {
                  newDiffs.push({ field: `meta.${key}`, oldValue: oldMeta[key] ?? "(empty)", newValue: newMeta[key] });
                }
              }
              break;
            }

            case "reorder_sections":
              newDiffs.push({ field: "section order", oldValue: "(previous order)", newValue: `${d.reordered} sections reordered` });
              break;
          }
        }

        const successCount = opResults.filter((r: OperationResult) => r.success).length;
        const failCount = opResults.filter((r: OperationResult) => !r.success).length;

        onDiff(newDiffs);
        addLog("success", `${successCount} operation(s) applied${failCount > 0 ? `, ${failCount} failed` : ""}. Version snapshot created.`);
        addLog("info", "Preview refreshing...");

        setPhase("done");
        onActionApplied();
      } catch (err) {
        clearTimeout(timeout);
        clearInterval(progressTimer);
        const msg =
          err instanceof DOMException && err.name === "AbortError"
            ? "Request timed out after 3 minutes. The AI may still be processing — try refreshing the preview."
            : err instanceof Error
              ? err.message
              : "Execution failed";
        addLog("error", msg);
        setErrorMsg(msg);
        setPhase("error");
      }
    };

    const handleReject = () => {
      addLog("info", "Action cancelled by user.");
      setPhase("idle");
      setClassified(null);
    };

    const handleReset = () => {
      setPhase("idle");
      setClassified(null);
      setErrorMsg(null);
      setCommand("");
      onDiff([]);
    };

    const tierMeta = classified ? (tierInfo[classified.classification.tier] ?? tierInfo[0]) : null;
    const isDisabled = phase !== "idle" && phase !== "error";

    return (
      <div className="flex items-center gap-2 flex-1">
        {/* Input */}
        <div className="relative flex-1">
          <input
            ref={ref}
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && phase === "idle" && handleClassify()}
            placeholder="⌘K Ask AI to change anything..."
            disabled={isDisabled}
            className="flex-1 h-9 w-full pl-3 pr-8 text-sm rounded-lg bg-white/60 border border-white/50 focus:border-[#7c5cbf]/50 focus:ring-1 focus:ring-[#7c5cbf]/20 text-[#1a1a2e] placeholder-[#9994ad] outline-none transition-all disabled:opacity-60"
          />
          {command && phase === "idle" && (
            <button
              onClick={() => setCommand("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#9994ad] hover:text-[#7c7893]"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>

        {/* Tier badge (after classification) */}
        {tierMeta && (
          <span className={`text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap ${tierMeta.color} ${tierMeta.bg} ${tierMeta.border}`}>
            {tierMeta.label}
          </span>
        )}

        {/* Action buttons */}
        {phase === "idle" && (
          <button
            onClick={handleClassify}
            disabled={!command.trim()}
            className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-[#7c5cbf] hover:bg-[#6a4aad] text-white text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            Analyze
          </button>
        )}
        {phase === "classifying" && (
          <button disabled className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-[#7c5cbf]/50 text-white text-xs font-medium cursor-not-allowed whitespace-nowrap">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Analyzing…
          </button>
        )}
        {phase === "preview" && (
          <>
            <button
              onClick={handleApprove}
              className="h-9 flex items-center gap-1 px-3 rounded-lg bg-[#0fa886] hover:bg-[#0d9474] text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Execute
            </button>
            <button
              onClick={handleReject}
              className="h-9 px-3 rounded-lg bg-[#e85d45]/10 hover:bg-[#e85d45]/20 text-[#e85d45] text-xs font-medium border border-[#e85d45]/30 transition-colors whitespace-nowrap"
            >
              Cancel
            </button>
          </>
        )}
        {phase === "executing" && (
          <button disabled className="h-9 flex items-center gap-1.5 px-3 rounded-lg bg-[#7c5cbf]/50 text-white text-xs font-medium cursor-not-allowed whitespace-nowrap">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Running…
          </button>
        )}
        {(phase === "done" || phase === "error") && (
          <button
            onClick={handleReset}
            className="h-9 px-3 rounded-lg bg-white/60 hover:bg-white/80 text-[#7c7893] hover:text-[#1a1a2e] text-xs font-medium border border-white/50 transition-colors whitespace-nowrap"
          >
            {phase === "error" && errorMsg ? "Error — Reset" : "New Command"}
          </button>
        )}
      </div>
    );
  }
);

// ─── FloatingLogs ──────────────────────────────────────────────────────────────

interface FloatingLogsProps {
  logs: LogEntry[];
  onClear: () => void;
  onClose: () => void;
  show: boolean;
}

export function FloatingLogs({ logs, onClear, onClose, show }: FloatingLogsProps) {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (!show) return null;

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="floating-panel absolute bottom-3 right-3 w-80 max-h-[40%] z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/40 shrink-0">
        <span className="text-[10px] font-semibold text-[#9994ad] uppercase tracking-widest">
          Logs {logs.length > 0 && `(${logs.length})`}
        </span>
        <div className="flex items-center gap-2">
          <button onClick={onClear} className="text-[10px] text-[#9994ad] hover:text-[#7c7893] transition-colors">
            Clear
          </button>
          <button onClick={onClose} className="text-[#9994ad] hover:text-[#1a1a2e] transition-colors">
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-[1.6]">
        {logs.length === 0 ? (
          <p className="text-[#9994ad] text-center py-2">No logs yet.</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[#9994ad] shrink-0 select-none w-[52px]">{formatTime(log.timestamp)}</span>
              <span className={`shrink-0 w-3 text-center ${logColors[log.type]}`}>{logIcons[log.type]}</span>
              <span className={logColors[log.type]}>{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
}

// ─── FloatingDiff ──────────────────────────────────────────────────────────────

interface FloatingDiffProps {
  diffs: DiffEntry[];
  onClose: () => void;
  show: boolean;
}

export function FloatingDiff({ diffs, onClose, show }: FloatingDiffProps) {
  if (!show) return null;

  return (
    <div className="floating-panel absolute bottom-3 left-3 w-[360px] max-h-[40%] z-20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/40 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-[#9994ad] uppercase tracking-widest">Changes</span>
          {diffs.length > 0 && (
            <span className="text-[10px] text-[#0fa886]">+{diffs.length} modified</span>
          )}
        </div>
        <button onClick={onClose} className="text-[#9994ad] hover:text-[#1a1a2e] transition-colors">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Diff entries */}
      <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px]">
        {diffs.length === 0 ? (
          <p className="text-[#9994ad] text-center py-2">No changes yet.</p>
        ) : (
          diffs.map((diff, i) => (
            <div key={i} className="mb-2 rounded-lg border border-[#e2dfe8] overflow-hidden">
              <div className="px-3 py-1 bg-[#f0eef5] text-[10px] font-semibold text-[#7c7893]">{diff.field}</div>
              <div className="px-3 py-1.5 bg-[#fef2f2] border-b border-[#e2dfe8] flex gap-2">
                <span className="text-[#e85d45] shrink-0 font-bold">−</span>
                <span className="text-[#b91c1c] break-all">{diff.oldValue}</span>
              </div>
              <div className="px-3 py-1.5 bg-[#f0fdf4] flex gap-2">
                <span className="text-[#0fa886] shrink-0 font-bold">+</span>
                <span className="text-[#166534] break-all">{diff.newValue}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
