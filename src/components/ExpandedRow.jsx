import { useState } from "react";
import Spinner from "./Spinner";
import OverviewTab from "./OverviewTab";
import DimensionsTab from "./DimensionsTab";
import DebateTab from "./DebateTab";
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
  const [tab, setTab] = useState("overview");

  return (
    <div style={{ borderTop: "2px solid #5b21b633" }}>
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #1e2a3a", background: "#0f1420", padding: "0 16px" }}>
        {[
          { id: "overview", label: "Overview" },
          { id: "dimensions", label: "Dimensions" },
          { id: "debate", label: "Debate & Challenges" },
        ].map(t => (
          <button
            key={t.id}
            onClick={e => { e.stopPropagation(); setTab(t.id); }}
            style={{
              background: "none",
              border: "none",
              borderBottom: tab === t.id ? "2px solid #a855f7" : "2px solid transparent",
              color: tab === t.id ? "#a855f7" : "#4b5563",
              padding: "9px 16px", fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}>
            {t.label}
          </button>
        ))}
        <div style={{ marginLeft: "auto", fontSize: 10, padding: "0 8px", display: "flex", alignItems: "center", gap: 10 }}>
          {uc.status === "analyzing"
            ? <span style={{ color: "#a855f7", display: "flex", alignItems: "center", gap: 6 }}>
                <Spinner size={10} /> {PHASE_LABELS[uc.phase] || "Processing..."}
              </span>
            : <span style={{ color: "#2d3748" }}>
                Analyst: OpenAI GPT-5.4 mini | Critic: OpenAI GPT-5.4 | Sources may include model memory and live web - verify before use
                {uc.analysisMeta?.analysisMode && (
                  <span style={{ marginLeft: 6 }}>
                    | Mode: {uc.analysisMeta.analysisMode === "hybrid" ? "hybrid reliability" : uc.analysisMeta.analysisMode}
                  </span>
                )}
                {uc.analysisMeta?.liveSearchRequested && (
                  <span style={{ marginLeft: 6, color: "#60a5fa" }}>
                    | Live search {uc.analysisMeta?.liveSearchUsed ? `on (${uc.analysisMeta?.webSearchCalls || 0} calls)` : "fallback"}
                  </span>
                )}
                {uc.analysisMeta?.hybridStats && (
                  <span style={{ marginLeft: 6, color: "#a78bfa" }}>
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
                  background: "#0a0d17",
                  border: "1px solid #1f2937",
                  color: "#7dd3fc",
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
                  background: "#0a0d17",
                  border: "1px solid #1f2937",
                  color: "#93c5fd",
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
                  background: "#0a0d17",
                  border: "1px solid #1f2937",
                  color: "#a5b4fc",
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

      <div style={{ padding: 16, background: "#080b14" }}>
        {uc.status === "error" && (
          <div style={{ background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 8, padding: "10px 14px", color: "#fca5a5", fontSize: 13, marginBottom: 14 }}>
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
      </div>
    </div>
  );
}
