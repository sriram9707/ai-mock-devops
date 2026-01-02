# CI/CD pipeline rollback strategies (interviewer reference)

## Common failure modes to simulate
- Artifact integrity issues: SHA mismatch between build and deploy steps, or unsigned container images blocked by admission.
- Configuration drift: staging uses latest Helm chart; production still references an older values file.
- Deployment orchestration bugs: blue/green cutover fails to flip traffic; canary metrics never trigger promotion.

## Rollback patterns and when to use them
- **Immediate deployment cancelation**: Halt the pipeline when health checks fail pre-traffic (e.g., Kubernetes readiness probes, smoke tests). Safe when no user traffic was shifted.
- **Traffic rollback (blue/green or canary)**: Re-point the load balancer/ingress back to the previous stable version; preserve the failed replica set for debugging.
- **Configuration rollback**: Reapply the last known-good configuration commit (values.yaml, Terraform module pin) rather than rebuilding artifacts.
- **Data-aware rollback**: For schema changes, prefer forward-compatible migrations and feature flags; if not possible, require backup + restore plan and explicit downtime.

## Observability and guardrails
- Automate pre-traffic checks: container image scan, manifest policy validation (OPA/Kyverno), and ephemeral environment smoke tests.
- Define SLO-based rollback triggers: error rate, latency, and saturation thresholds for at least two consecutive windows.
- Capture deployment context: git SHA, build number, image digest, feature flags, and migration IDs as annotations/labels for traceability.

## Interview drill-down prompts
- How do you prevent rollbacks from reintroducing known vulnerabilities in older images?
- What signals must be green before promoting a canary, and how do you gate on them automatically?
- How do you coordinate application rollbacks with infrastructure-as-code changes that shipped in the same release?
- Describe how you would debug a Helm rollback that succeeded but left lingering Kubernetes resources (e.g., CRDs, Jobs).
