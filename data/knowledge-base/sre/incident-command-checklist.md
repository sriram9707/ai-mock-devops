---
id: basic-incident-response
tags: [auto-tagged]
---

# SRE incident command checklist

## Roles and comms
- Assign Incident Commander (IC), Communications, and Ops/Tech leads within the first 5 minutes.
- Establish a single source of truth: Slack channel + Zoom/Meet bridge + incident doc with timestamps.
- Define update cadence (every 15 minutes for Sev-1) and the target audience (execs vs. responders).

## Stabilization priorities
1. **Safety and blast radius**
   - Stop harmful automation (deployments, auto-remediations) until causality is understood.
   - Capture failing requests and rate-limit or shed load if user impact is escalating.
2. **User impact clarity**
   - Quantify affected users, error budgets, and SLO breach windows; confirm via telemetry, not guesses.
3. **Hypothesis-driven actions**
   - Require a one-sentence hypothesis before executing risky changes; log who ran what and when.

## Decision points
- Do we need a rollback vs. a feature flag disablement? Choose the lowest-risk action first.
- Is failover viable? Verify data replication lag and downstream dependencies before traffic shifts.
- When to engage vendors/cloud support: control-plane outages, managed service degradations, or ambiguous network failures.

## Recovery confirmation
- Define clear exit criteria: SLI recovery, alert clearance, and no ongoing error-budget burn for two consecutive intervals.
- Run a smoke test suite that matches critical user journeys; avoid hand-waving "looks good" conclusions.
- Keep the incident open through a cooling period to catch recurrences.

## Post-incident actions
- Timeline with exact commands, dashboards, and configuration changes.
- Issue/bug tickets for follow-up work: detection gaps, runbook fixes, and test coverage.
- Schedule a blameless review within 72 hours; capture mitigations, ownership, and due dates.
