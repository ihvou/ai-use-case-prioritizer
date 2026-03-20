import { useState } from "react";
import Spinner from "./Spinner";
import SourcesList from "./SourcesList";

export default function FollowUpThread({ thread, inputVal, onInputChange, onSubmit, loading }) {
  const [collapsed, setCollapsed] = useState(false);
  const hasMessages = thread?.length > 0;
  return (
    <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--ck-line-strong)" }}>
      {hasMessages && (
        <div style={{ marginBottom: 8 }}>
          <button
            onClick={() => setCollapsed(v => !v)}
            style={{ background: "none", border: "none", color: "var(--ck-muted)", fontSize: 11, padding: "0 0 6px", cursor: "pointer" }}>
            {collapsed
              ? `> ${thread.length} follow-up message${thread.length > 1 ? "s" : ""} - expand`
              : "v Follow-up thread"}
          </button>
          {!collapsed && (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {thread.map((msg, i) => {
                const isPM = msg.role === "pm";
                return (
                  <div key={i} style={{
                    background: isPM ? "#edf2ff" : "#ebf8f0",
                    border: `1px solid ${isPM ? "#c9d4ff" : "#bddfcd"}`,
                    borderRadius: 8, padding: "8px 12px",
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 700, marginBottom: 4, color: isPM ? "var(--ck-blue)" : "#0f7a55" }}>
                      {isPM ? "Your Challenge" : "Analyst Response"}
                      {!isPM && msg.scoreAdjusted && msg.newScore != null &&
                        <span style={{ color: "#935f00", marginLeft: 8, fontWeight: 400 }}>
                          - Score revised to {msg.newScore}/5
                        </span>}
                    </div>
                    <p style={{ fontSize: 12, color: isPM ? "var(--ck-blue-ink)" : "#17583f", margin: "0 0 4px", lineHeight: 1.65 }}>
                      {msg.text || msg.response}
                    </p>
                    {!isPM && msg.sources?.length > 0 && <SourcesList sources={msg.sources} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
        <textarea
          value={inputVal}
          onChange={e => onInputChange(e.target.value)}
          placeholder={'Challenge this score... e.g. "Salesforce already does this - does that change the score?" (Cmd/Ctrl+Enter to send)'}
          onKeyDown={e => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && inputVal?.trim() && !loading) onSubmit();
          }}
          style={{
            flex: 1, background: "var(--ck-surface-soft)", border: "1px solid var(--ck-line-strong)", borderRadius: 7,
            color: "var(--ck-text)", padding: "7px 10px", fontSize: 11, resize: "none",
            minHeight: 50, lineHeight: 1.5, outline: "none", fontFamily: "inherit",
          }}
        />
        <button
          onClick={onSubmit}
          disabled={!inputVal?.trim() || loading}
          style={{
            background: inputVal?.trim() && !loading ? "var(--ck-blue)" : "var(--ck-surface-soft)",
            border: "none",
            color: inputVal?.trim() && !loading ? "#fff" : "var(--ck-muted)",
            padding: "8px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600,
            flexShrink: 0, display: "flex", alignItems: "center", gap: 5,
          }}>
          {loading ? <><Spinner size={10} color="var(--ck-blue)" /><span style={{ color: "var(--ck-blue)" }}>...</span></> : "Send ->"}
        </button>
      </div>
    </div>
  );
}
