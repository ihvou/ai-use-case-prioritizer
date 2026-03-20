import { useEffect, useState } from "react";
import Spinner from "./Spinner";
import OverviewTab from "./OverviewTab";
import DimensionsTab from "./DimensionsTab";
import DebateTab from "./DebateTab";
import ProgressTab from "./ProgressTab";
import { exportSingleUseCaseHtml, exportSingleUseCasePdf, exportSingleUseCaseImagesZip } from "../lib/export";

const PHASE_LABELS = {
  analyst: "Analyst researching...",
  analyst_baseline: "Analyst baseline pass...",
  analyst_web: "Analyst web pass...",
  analyst_reconcile: "Analyst reconcile pass...",
  critic: "Critic reviewing...",
  finalizing: "Analyst responding...",
};

export default function ExpandedRow({ uc, dims, fuInputs, onFuInputChange, fuLoading, onFollowUp }) {
  const [tab, setTab] = useState("progress");

  useEffect(() => {
    setTab("progress");
  }, [uc.id]);

  return (
    <div style={{ borderTop: "2px solid var(--ck-line-strong)" }}>
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--ck-line)", background: "var(--ck-surface-soft)", padding: "0 16px", flexWrap: "wrap" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "dimensions", label: "Dimensions" },
          { id: "debate", label: "Debate & Challenges" },
          { id: "progress", label: "Progress" },
        ].map(t => (
          <button
            key={t.id}
            onClick={e => { e.stopPropagation(); setTab(t.id); }}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid var(--ck-blue)" : "2px solid transparent",
              color: tab === t.id ? "var(--ck-blue)" : "var(--ck-muted)",
              padding: "9px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 10, padding: "6px 8px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {uc.status === "analyzing"
            ? <span style={{ color: "var(--ck-blue)", display: "flex", alignItems: "center", gap: 6 }}>
                <Spinner size={10} /> {PHASE_LABELS[uc.phase] || "Processing..."}
              </span>
            : <span style={{ color: "var(--ck-muted)" }}>
                Analyst: OpenAI GPT-5.4 mini | Critic: OpenAI GPT-5.4 | Sources may include model memory and live web - verify before use
                {uc.analysisMeta?.analysisMode && (
                  <span style={{ marginLeft: 6 }}>
                    | Mode: {uc.analysisMeta.analysisMode === "hybrid" ? "hybrid reliability" : uc.analysisMeta.analysisMode}
                  </span>
                )}
                {uc.analysisMeta?.liveSearchRequested && (
                  <span style={{ marginLeft: 6, color: "var(--ck-blue)" }}>
                    | Live search {uc.analysisMeta?.liveSearchUsed ? `on (${uc.analysisMeta?.webSearchCalls || 0} calls)` : "fallback"}
                  </span>
                )}
                {uc.analysisMeta?.hybridStats && (
                  <span style={{ marginLeft: 6, color: "var(--ck-blue-ink)" }}>
                    | Hybrid delta: {uc.analysisMeta.hybridStats.changedFromBaseline} dims
                  </span>
                )}
              </span>}
          {uc.status !== "analyzing" && (
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  exportSingleUseCaseHtml(uc, dims);
                }}
                style={{
                  background: "var(--ck-surface)",
                  border: "1px solid var(--ck-line)",
                  color: "var(--ck-blue)",
                  borderRadius: 6,
                  fontSize: 11,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}>
                Export HTML
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  exportSingleUseCasePdf(uc, dims);
                }}
                style={{
                  background: "var(--ck-surface)",
                  border: "1px solid var(--ck-line)",
                  color: "var(--ck-blue)",
                  borderRadius: 6,
                  fontSize: 11,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}>
                Export PDF
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void exportSingleUseCaseImagesZip(uc, dims);
                }}
                style={{
                  background: "var(--ck-surface)",
                  border: "1px solid var(--ck-line)",
                  color: "var(--ck-blue)",
                  borderRadius: 6,
                  fontSize: 11,
                  padding: "4px 8px",
                  cursor: "pointer",
                }}>
                Export Images ZIP
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding: 16, background: "var(--ck-bg)" }}>
        {uc.status === "error" && (
          <div style={{ background: "#fff0ee", border: "1px solid #f2c7be", borderRadius: 8, padding: "10px 14px", color: "#b42318", fontSize: 13, marginBottom: 14 }}>
            Warning: {uc.errorMsg}
          </div>
        )}
        {tab === "overview" && <OverviewTab uc={uc} dims={dims} />}
        {tab === "dimensions" && <DimensionsTab uc={uc} dims={dims} />}
        {tab === "debate" && (
          <DebateTab
            uc={uc} dims={dims}
            fuInputs={fuInputs} onFuInputChange={onFuInputChange}
            fuLoading={fuLoading} onFollowUp={onFollowUp}
          />
        )}
        {tab === "progress" && <ProgressTab uc={uc} />}
      </div>
    </div>
  );
}
