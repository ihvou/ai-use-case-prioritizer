## [x] FR - Intent-Aware Interaction Panel

**Problem**

The current Challenge input treats every user message identically - sending it to the Analyst as a score challenge regardless of what the user actually intended. A colleague leaving a note for another reviewer accidentally triggers a score revision. A user asking for an explanation gets a defensive rebuttal instead of a plain-language answer. A request to rewrite a brief in simpler language causes the model to re-evaluate the underlying reasoning. A pasted URL gets hallucinated rather than read. A request to search again silently uses training memory instead of live web. The input is a single blunt instrument handling six meaningfully different intents.

**Solution**

The Analyst automatically classifies the intent of every user message before responding. No selector or dropdown required - the user types naturally and the model determines what kind of response is appropriate. Six intent types are recognised:

**Challenge** - the user is contesting the score or reasoning with a counter-argument or counter-evidence. The Analyst evaluates the argument, defends or concedes with new evidence, and proposes a score revision if warranted. The score never changes silently - the PM sees a proposed revision and explicitly accepts or dismisses it.

**Question** - the user wants an explanation of the analysis, not a contest of it. The Analyst responds in plain explanatory language with no defensive posture and no score consideration. "Why is this a 3 and not a 4?" gets an explanation, not a rebuttal.

**Reframe** - the user wants the wording updated without reconsidering the reasoning. "Rewrite this for a CFO audience" or "remove the technical jargon" produces updated text only. Score and underlying reasoning are untouched.

**Add evidence** - the user provides a URL or pasted text as new evidence. The app fetches the URL content server-side and injects it into the model's context. The Analyst processes real content, explains what it changes and what it does not, and proposes a score revision if the evidence warrants it. PM confirms before any score change applies.

**Note / comment** - the user is leaving an annotation for a colleague, not directing a message at the model. The note is stored and displayed in the thread. No model response is generated. No score impact.

**Re-search** - the user requests a fresh live web search for this dimension. A targeted search pass runs using queries specific to the dimension's evidence gap. Fresh sources are returned, the dimension is re-evaluated, and any proposed score change requires PM confirmation.

The clean principle across all intents: the model proposes, the PM disposes. No intent ever silently mutates a score.

---

## [x] FR - Separate Evidence Enumeration from Scoring

**Problem**

The Analyst currently does research and scoring in a single pass - it constructs a narrative and derives a score from it simultaneously. Whichever angle the model happens to approach first anchors the entire reasoning chain. A use case about AI-powered PDP creation might be approached through conversion impact in one run and operational cost savings in another, producing meaningfully different scores for the same use case. The score is an emergent property of the narrative rather than a deterministic function of the evidence. This makes results feel random and undermines trust in the tool as a decision instrument.

**Solution**

Phase 1 is split into two sequential steps. In the first step the Analyst enumerates evidence only - it produces a structured list of all relevant facts, case studies, deployments, market data points, and sources it can find for the dimension, without scoring. No narrative, no conclusion, no score. In the second step the Analyst applies the rubric mechanically to the enumerated evidence list and derives a score. The score becomes a transparent function of explicit evidence rather than an implicit narrative.

This means the same evidence produces the same score on re-run. Variance is reduced because the model can no longer anchor on a randomly chosen framing - it must first surface all available evidence and then score against criteria. It also creates a natural foundation for argument-based representation, since the enumerated evidence list is already structured as discrete facts rather than continuous prose.

---

## [x] FR - Argument-Based Dimension Representation

**Problem**

Dimension analysis is currently presented as a prose narrative - a brief summary and a multi-paragraph full analysis. This format makes it hard to quickly grasp why a score was set at a specific level, which specific facts support it, and what would need to change for the score to move. A PM reviewing 11 dimensions across multiple use cases cannot efficiently audit the reasoning or identify which claims to challenge. The analysis is a black box with a number attached.

**Solution**

Each dimension is represented as a structured set of arguments rather than a prose narrative. Arguments are divided into two groups:

**Supporting evidence** - facts, case studies, and data points that push the score up. Each argument has a bold one-line claim, one to two sentences of context and explanation, and one or more citations.

**Limiting factors** - gaps, risks, and counter-evidence that cap the score from going higher. Same structure: bold claim, explanation, citations.

The score sits between the floor established by supporting evidence and the ceiling established by limiting factors. This makes the reasoning immediately legible - a PM can scan the bold claims and understand the score without reading full paragraphs, then expand individual arguments for detail.

Each argument is independently challengeable. A user can challenge a specific supporting claim ("this case study is from a vendor whitepaper, not independently verified") or a specific limiting factor ("this SaaS gap you mentioned was closed in their 2024 release"). The Analyst responds to the specific argument, not the whole dimension. If a supporting argument is successfully challenged and discarded, the Analyst re-evaluates whether the score still holds given the remaining evidence - it does not automatically drop, but must justify the score with what remains.

Arguments can also be discarded by the PM without debate if they are clearly irrelevant to the specific use case context. Discarded arguments are visually struck through and preserved in the thread for audit purposes rather than deleted.

---

## [x] FR - Research Brief for Low-Confidence Dimensions

**Problem**

When the Analyst flags a dimension as low confidence, the current output tells the PM that evidence is sparse but gives no guidance on what to do about it. "Low confidence - fewer than two verifiable deployments found" is a dead end. The PM knows the score is uncertain but has no path to resolving that uncertainty. The tool effectively says "we do not know" without helping the PM find out.

**Solution**

Every low-confidence dimension automatically generates a research brief alongside the confidence flag. The brief contains three things:

**What evidence is missing** - a specific description of the evidence gap that would be needed to score the dimension with medium or high confidence. Not a generic statement but a precise one: "No verified ROI figures exist for mid-market retailers in this use case - all available evidence is from enterprise deployments above $500M revenue."

**Where to look** - a prioritised list of specific sources most likely to contain the missing evidence: named analyst reports, industry publications, practitioner communities, vendor case study libraries, regulatory databases, or internal sources such as past delivery post-mortems and client conversations.

**Suggested search queries** - three to four specific search queries a human researcher or a targeted search pass could run to find the missing evidence. These queries are derived from the specific gap identified, not generic dimension-level searches.

The research brief transforms a low-confidence flag from a dead end into an actionable research task. It also sets up the targeted re-search cycle: if the PM or a colleague finds the missing evidence and provides it via the Add Evidence intent, or if a targeted search pass is triggered, the dimension can be re-evaluated against the newly found evidence.

---

## [x] FR - Discovery: Limiting Factors Informed Generation + Pre-Score Validation

**Problem**

Related use case candidates are currently generated by asking the model to suggest variants that should improve weak dimensions - but the model only knows which dimensions scored low, not why they scored low. This produces generic adjacent ideas rather than targeted alternatives. A use case where Build vs. Buy scored low because Salesforce dominates the broad category needs a different candidate than one where Build vs. Buy scored low because the use case description was too vague and the model defaulted to the most-covered interpretation. The tool cannot distinguish between these situations, so candidates are effectively random. In practice they score no better than the original.

**Solution**

Two changes to the discovery pass:

**Limiting-factor-informed generation** - the discovery prompt receives not just the weak dimension scores but the specific limiting factors behind each weak score. The model generates candidates that explicitly address those stated limiting factors rather than the dimension label in the abstract. Each candidate must justify which specific limiting factor it resolves and how.

**Pre-score validation before surfacing** - after generating candidates, each one is run through a lightweight scoring pass covering only the dimensions it claims to improve. Candidates that do not actually score higher on those dimensions are filtered out before being shown to the PM. Only validated candidates surface in the Discover tab. Each candidate card shows the pre-scores for the claimed improvement dimensions so the PM can see the predicted gain before deciding whether to run a full analysis.

The result is that candidates shown to the PM have been screened, not just predicted. The "Analyse ->" action becomes a confirmation of a validated opportunity rather than a gamble on an unverified suggestion.

---

## [x] FR - Targeted Extra Cycle for Low-Confidence Dimensions

**Problem**

Running the same analysis prompt again for a low-confidence dimension produces similar output with different wording - the model will be sparse for the same reason it was sparse the first time. The evidence does not exist in its training data or was not surfaced by the initial search pass. Blind re-running wastes tokens and creates false confidence through variety of wording rather than depth of evidence.

**Solution**

For each dimension that remains low confidence after Phase 1, a targeted extra cycle runs with a fundamentally different approach from the initial pass. The cycle has three steps:

**Query generation** - a small prompt asks the model: given that this dimension scored low confidence because of this specific gap, what are the three most precise search queries that would find the missing evidence? Queries are specific to the gap, not generic to the dimension.

**Targeted search** - those queries are executed via live web search. Results are returned as raw content, not model-summarised.

**Focused re-evaluation** - the raw search results are injected into a dimension-specific re-scoring prompt. The model re-evaluates the dimension with the new evidence explicitly in context, updates the arguments if new supporting or limiting factors emerge, and reassesses the confidence level.

If confidence comes back medium or high after this cycle, the dimension is updated with the new score, arguments, and sources. If it stays low, that is now a validated low - the model searched specifically for the missing evidence and confirmed it is not publicly available. The research brief for that dimension becomes more precise as a result, since the model now knows which specific queries returned nothing useful and can direct the PM toward non-public sources such as analyst reports, gated databases, or internal post-mortems.

The targeted extra cycle runs automatically for low-confidence dimensions when the analysis mode is live search or hybrid. In standard mode it is skipped since live search is unavailable.
