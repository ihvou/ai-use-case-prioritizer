# AI Use Case Researcher

AI Use Case Researcher helps product and GTM teams assess enterprise AI opportunities for **custom outsourcing delivery**.
It converts broad ideas into evidence-backed scores, debate outcomes, and next best related use cases.

## Core Workflow

1. **Input**: PM enters a broad use case prompt.
2. **Phase 1 - Analyst (2-step)**:
   - **Step 1 - Evidence enumeration**: collects structured per-dimension facts, deployments, metrics, and source-backed signals (no scoring in this step).
   - **Step 2 - Rubric scoring from enumerated evidence**: applies the rubric to the enumerated evidence and produces scores, confidence, rationale, risks, and sources.
3. **Phase 2 - Critic**: pressure-tests Analyst claims and scores.
4. **Phase 3 - Analyst Response**: updates reasoning and final per-dimension scores after critique.
5. **Phase 4 - Discover**: generates 3-5 related candidates targeted at weak dimensions.

After completion, PM can:
- review Overview / Dimensions / Debate & Challenges / Discover / Progress tabs,
- use follow-up in-thread with intent-aware handling (challenge, question, reframe, add evidence, note/comment, re-search),
- inspect each dimension as structured arguments (supporting evidence vs limiting factors),
- challenge a specific argument directly or discard an argument (discarded items remain visible for audit),
- review and explicitly **accept** or **dismiss** any proposed score change (no silent score mutation),
- run full analysis for a discovered candidate via **Analyse ->**,
- export portfolio or single-use-case reports.

## Analysis Pipeline (Fixed)

The app now runs a single quality-first pipeline. There is no user-facing mode selector.

Every analysis run executes:
1. Analyst baseline pass (memory-only): evidence enumeration then scoring
2. Analyst web pass (live-search assisted): evidence enumeration then scoring
3. Hybrid reconcile pass: merge baseline + web evidence, then re-score
4. Targeted confidence cycle for weak dimensions:
   - Triggered for `low` confidence dimensions
   - Also triggered for `medium` confidence dimensions when `missingEvidence` is specific
5. Critic web audit pass
6. Analyst final response pass
7. Final consistency check pass
8. Discover generation + candidate pre-validation

Live web is attempted where applicable and can fallback to non-web completion when the tool path fails; fallback reasons are captured in debug logs.

## Prompt Structure and JSON Contracts

Prompting is role-based and schema-driven:
- System prompts live in `src/prompts/system.js`:
  - `SYS_ANALYST`
  - `SYS_CRITIC`
  - `SYS_ANALYST_RESPONSE`
  - `SYS_FOLLOWUP`
- Each call expects JSON-only output with explicit schema templates to reduce malformed responses.

Per-phase prompt design:
- Phase 1 Step 1 (evidence enumeration):
  - Enumerates evidence only (no scores)
  - Requires source typing (`vendor|press|independent`)
  - Adds dynamic mandatory search depth for top-weighted dimensions (computed from current dimension weights, not hard-coded IDs)
- Phase 1 Step 2 (scoring from evidence):
  - Scores strictly from Step 1 evidence payload
  - Forbids adding new facts during scoring
  - Requires confidence level + reason per dimension
- Phase 2 Critic:
  - Audits analyst claims and suggested scores
  - Mandate is adversarial verification, not full re-research from scratch
- Phase 3 Analyst response:
  - Requires `decision: defend|concede` for each dimension
  - Applies explicit confidence revision constraints
  - Then a separate consistency-check pass can adjust final scores
- Follow-up thread:
  - First classifies intent (`challenge|question|reframe|add_evidence|note|re_search`)
  - Then runs intent-specific prompt logic
  - Score changes are proposals that PM explicitly accepts or dismisses

## Model Request Profile (Approximate)

### Models
- Analyst route (`api/analyst.js`): OpenAI `gpt-5.4-mini`
- Critic route (`api/critic.js`): OpenAI `gpt-5.4`
- Live-search calls use Responses API tools (`web_search` / `web_search_preview`) with fallback to non-tool completion.

### Analysis run request pattern

Core run (all 11 dimensions are batch-processed, not one call per dimension):

| Stage | Route / model | Typical calls | Notes |
|---|---|---:|---|
| Baseline analyst pass | Analyst / `gpt-5.4-mini` | 2 | Evidence + scoring |
| Web analyst pass | Analyst / `gpt-5.4-mini` | 2 | Evidence (live web) + scoring |
| Reconcile analyst pass | Analyst / `gpt-5.4-mini` | 2 | Reconcile evidence + scoring |
| Targeted confidence cycle | Analyst / `gpt-5.4-mini` | +3 per targeted dimension | Query plan + targeted live search + re-score |
| Critic audit | Critic / `gpt-5.4` | 1 | +1 retry on parse failure |
| Analyst response | Analyst / `gpt-5.4-mini` | 1 | +up to 2 retries on parse failure |
| Consistency check | Analyst / `gpt-5.4-mini` | 1 | Post-response score audit |
| Discover generation | Analyst / `gpt-5.4-mini` | 1 | +1 retry on parse failure |
| Discover validation | Analyst / `gpt-5.4-mini` | +1 per candidate | Up to 5 candidates |

No-retry formula:
- `total_calls ~= 10 + (3 * targeted_dimensions) + validated_candidates`

Examples:
- Low-variance run (`targeted_dimensions=0`, `validated_candidates=3`): about `13` model calls
- Typical run (`targeted_dimensions=2`, `validated_candidates=4`): about `20` model calls
- Deep run (`targeted_dimensions=4`, `validated_candidates=5`): about `27` model calls

Retry behavior can add extra calls when strict JSON repair retries are needed.

### Follow-up request pattern (per PM message)

- Intent classification: `1` analyst call
- Intent execution:
  - `note`: `0` extra model calls
  - `question|reframe|challenge`: `+1` analyst call
  - `add_evidence`: `+1` analyst call (+ up to 3 source-fetch HTTP calls to `/api/fetch-source`)
  - `re_search`: `+1` analyst live-search call

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
- `arguments.supporting[]`: evidence claims that push score up
- `arguments.limiting[]`: constraints that cap score
- argument audit state: active/discarded, discard reason, and thread-linked updates

## Export Options

Global **Export** menu:
- `HTML Report`
- `PDF Report`
- `Portfolio JSON`
- `Logs JSON`

Global toolbar:
- `Import JSON` (single use case or portfolio envelope)

Single-use-case panel:
- `Export HTML` (generated on demand, opens in a new tab)
- `Export PDF`
- `Export Images ZIP`
- `Export JSON`

Report pages include argument sections per dimension:
- `Supporting Evidence`
- `Limiting Factors`
- discarded arguments shown as discarded (not deleted)

## Tech Stack

- Frontend: React + Vite
- API routes: Vercel serverless functions (`api/analyst.js`, `api/critic.js`, `api/fetch-source.js`)
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
    fetch-source.js
  src/
    App.jsx
    components/
      ConfidenceBadge.jsx
      ArgumentList.jsx
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
      arguments.js
      debug.js
      dimensionView.js
      export.js
      followUpIntent.js
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
- Quality-first pipeline can be costlier/slower on runs with many targeted-dimension cycles and discovery validations.
- PDF output depends on browser print behavior.
