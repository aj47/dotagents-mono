# Inbox Management Automation Plan

## Objectives
- Multi-account monitoring with configurable features, polling every 10 minutes, and backfill for new domains.
- Preprocess every incoming message using deterministic sanitization and semantic scanning, blocking SSRF and never fetching links.
- Apply editable rubric for scoring leads, label non-leads, and support rescoring.
- Maintain score and stage labels with stage tracking state machine, audit trail, and CRM drift detection.
- Generate reply drafts via templated writer/reviewer LLM pipeline with deterministic content gating and fail-safe.
- Research sender domains (DNS resolution and credibility markers) with caching.
- Escalate high-signal leads to CRM/notifications.

## Architecture Sketch
1. **Polling Service**: Periodic job per account that checks Gmail via Zele/API, enforces sanitization, and queues for scoring.
2. **Sanitization Layer**: Deterministic filters + model scanner; integrates SSRF prevention and link fetching policy.
3. **Scoring Engine**: Reads rubric Markdown, computes fit/clarity/budget/trust/timeline, assigns action bucket, and classifies non-leads.
4. **Label Management**: Persist score labels once; update stage labels as deals progress; track CRM stage via API and detect drift.
5. **Stage State Machine**: Encoded valid transitions with audit log storage (local DB or file) and CRM sync.
6. **Draft Workflow**: Template selector, writer LLM, reviewer LLM, deterministic gate, fallback to canonical template.
7. **Sender Research Cache**: DNS resolution, site fetch, credibility scoring; cached per domain.
8. **Escalation Workflow**: On high-signal, push to CRM/notification channel (Slack/push) and log.

## Next Actions
- Build CLI/infrastructure to poll Gmail with Zele and process messages per pipeline.
- Formalize rubric Markdown file and scoring logic.
- Implement labeling/stage tracking, draft generator, research cache, escalation triggers.
- Add automation scheduler for repeat task and monitoring dashboard.
