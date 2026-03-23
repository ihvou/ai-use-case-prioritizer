# Task Backlog - AI Use Case Researcher

Updated: 2026-03-23

Status legend: `[ ]` todo, `[~]` in progress, `[x]` done

## P0 - Reliability

### [~] T-01 JSON resilience and truncation handling
- [x] 12k output budget for Analyst passes
- [x] JSON repair + condensed retry paths
- [x] parse diagnostics + downloadable debug logs
- [ ] UI indicator when fallback retry is triggered
- [ ] badge dimensions with likely condensed/truncated content
- [ ] evaluate split Phase 1 calls to reduce truncation risk

### [ ] T-02 Partial-failure recovery
- [ ] If Critic fails, still publish Analyst result as partial
- [ ] If final Analyst response fails, keep critique visible and mark partial

### [ ] T-03 Timeout UX
- [ ] phase elapsed timer
- [ ] soft warning when calls exceed expected runtime

## P1 - Product

### [ ] T-04 Persistence and portfolio management
- [ ] localStorage persistence for completed/error analyses
- [ ] delete/re-analyze per row
- [ ] clear-all control

### [ ] T-05 Table operations
- [ ] sort by weighted score
- [ ] sort by individual dimensions

### [ ] T-06 Discover tab enhancements
- [ ] filter discovered candidates by targeted dimensions
- [ ] show quick estimated confidence delta for each candidate
- [ ] allow bulk "Analyse selected" from Discover

### [ ] T-07 Follow-up mode controls
- [ ] optional live-search toggle for follow-up challenges
- [ ] show whether follow-up answer used live search or fallback

### [ ] T-08 Compare view
- [ ] side-by-side comparison for 2-3 use cases
- [ ] visual chart (radar or normalized bars)

## P2 - Output and Reporting

### [~] T-09 Export improvements
- [x] summary/detail CSV
- [x] full HTML/PDF reports
- [x] single-use-case HTML/PDF/Image ZIP
- [x] single-use-case HTML pre-generation and open-in-tab
- [ ] optional executive deck template export
- [ ] compact recency/quality metadata in source chips

## P3 - Platform

### [ ] T-10 Multi-provider model routing
- [ ] provider/model configuration in UI or env-driven profile
- [ ] graceful fallback strategy per phase

### [ ] T-11 CI automation
- [ ] GitHub Actions: build + lint + preview checks

## Completed Highlights

- [x] 11-dimension weighted scoring with rubrics
- [x] evidence + risks + sources per dimension
- [x] Analyst/Critic debate with final reconciliation
- [x] per-dimension confidence level and reason
- [x] mode-aware Critic live web audit (disabled in standard)
- [x] Discover phase with targeted related use case generation
- [x] one-click re-analysis from Discover candidates
- [x] on-demand debug log export
