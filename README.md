# AI Use Case Researcher

AI Use Case Researcher helps product and GTM teams assess enterprise AI opportunities for **custom outsourcing delivery**.
It converts broad ideas into evidence-backed scores, debate outcomes, and next best related use cases.

## Core Workflow

1. **Input**: PM enters a broad use case prompt.
2. **Phase 1 - Analyst**: scores all 11 dimensions with evidence, risks, sources, and per-dimension confidence (`high`/`medium`/`low`).
3. **Phase 2 - Critic**: pressure-tests Analyst claims and scores.
4. **Phase 3 - Analyst Response**: updates reasoning and final per-dimension scores after critique.
5. **Phase 4 - Discover**: generates 3-5 related candidates targeted at weak dimensions.

After completion, PM can:
- review Overview / Dimensions / Debate & Challenges / Discover / Progress tabs,
- challenge any dimension in-thread,
- run full analysis for a discovered candidate via **Analyse ->**,
- export portfolio or single-use-case reports.

## Analysis Modes

- `standard` (fastest): memory-based analysis, no live web for Analyst/Critic/Discover.
- `live_search`: Analyst + Critic + Discover attempt live web search with fallback.
- `hybrid` (default): baseline Analyst pass + web Analyst pass + reconcile, then Critic and Discover in web-enabled mode.

## Scoring Model

11 weighted dimensions:
- `roi` (18)
- `ai_fit` (14)
- `evidence` (13)
- `ttv` (11)
- `data_readiness` (9)
- `feasibility` (9)
- `market_size` (7)
- `build_vs_buy` (9)
- `regulatory` (8)
- `change_mgmt` (8)
- `reusability` (7)

Each dimension includes:
- score (`1-5`)
- brief summary
- full analysis
- risks
- sources
- confidence + reason

## Export Options

Global **Export** menu:
- `HTML Report`
- `PDF Report`
- `Summary CSV`
- `Detail CSV`
- `Logs JSON`

Single-use-case panel:
- `Export HTML` (pre-generated after completion, opens in a new tab)
- `Export PDF`
- `Export Images ZIP`

## Tech Stack

- Frontend: React + Vite
- API routes: Vercel serverless functions (`api/analyst.js`, `api/critic.js`)
- Models:
  - Analyst: OpenAI `gpt-5.4-mini`
  - Critic: OpenAI `gpt-5.4`
- Web search path: OpenAI Responses API tools (`web_search` / `web_search_preview`) with fallback
- Storage: in-memory UI state (no persistence yet)

## Repository Layout

```txt
ai-use-case-prioritizer/
  api/
    analyst.js
    critic.js
  src/
    App.jsx
    components/
      ConfidenceBadge.jsx
      DebateTab.jsx
      DiscoverTab.jsx
      DimensionsTab.jsx
      ExpandedRow.jsx
      OverviewTab.jsx
      ProgressTab.jsx
      ...
    constants/
      dimensions.js
    hooks/
      useAnalysis.js
      useFollowUp.js
    lib/
      api.js
      debug.js
      dimensionView.js
      export.js
      json.js
      rubric.js
      scoring.js
    prompts/
      system.js
```

## Local Setup

```bash
npm install
npx vercel dev
```

App URL: `http://localhost:3000`

### Environment

Create `.env.local`:

```bash
OPENAI_API_KEY=sk-...
```

## Deploy (Vercel)

1. Push to GitHub
2. Import repo into Vercel
3. Add `OPENAI_API_KEY` in Project Settings -> Environment Variables
4. Keep auto-deploy enabled for `main`

## Current Constraints

- No local/session persistence yet.
- Long LLM JSON outputs can still require retry/repair.
- Live web paths may fallback to non-web mode when tool route is unavailable.
- Hybrid mode is slower and more expensive than standard mode.
- PDF output depends on browser print behavior.
