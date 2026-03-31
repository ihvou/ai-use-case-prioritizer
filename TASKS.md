## [ ] FR - In-App Cost Estimator

**Problem**

PMs cannot see expected or actual analysis cost per use case directly in the app. Cost/quality trade-off discussions happen outside the product and are hard to validate against real run behavior (web-search calls, retries, low-confidence extra cycles, discovery validation passes).

**Solution**

Add an in-app cost estimator that uses run metadata (`analysisMeta`) plus configurable pricing inputs to calculate:
- estimated cost before run (based on expected pipeline steps),
- actual cost after run (based on real call counts and token usage proxies),
- incremental delta for optional modes/features (for example dual-search provider mode).

Expose this in a compact UI panel and in exports/debug logs with a clear breakdown by phase:
- analyst passes,
- critic pass,
- low-confidence targeted cycle,
- discovery + candidate validation,
- web-search tool-call costs.
