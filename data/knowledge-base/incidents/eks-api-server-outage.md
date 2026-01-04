---
id: eks-api-server-latency-outage
tags: [auto-tagged]
---

# EKS API server outage runbook (incident reference)

## Scenario summary
- Symptoms: kubectl, CI/CD deploys, and cluster autoscaler fail with `connection refused` or TLS handshake errors against the API server endpoint.
- Blast radius: all control-plane mediated actions are blocked; existing pods continue running until reschedules are needed.
- Goal: restore API availability quickly while protecting workloads from cascading failures.

## Immediate detection and triage
1. Confirm scope
   - Check multiple availability zones and node groups to rule out single-AZ network isolation.
   - Validate DNS resolution for the EKS endpoint and VPC resolver health.
2. Switch to read-only access paths
   - Prefer `aws eks update-kubeconfig --region <region>` + `kubectl get --raw /livez` from a bastion in the same VPC.
   - Avoid draining or evicting pods blindly; favor observation.
3. Identify common control-plane blockers
   - Recent IAM policy or OIDC provider changes denying `eks:DescribeCluster`.
   - Security group updates that removed control-plane-to-node rules on TCP 443.
   - VPC endpoint for `com.amazonaws.<region>.eks` misconfigured or deleted.

## Mitigation options
- **Redeploy cluster endpoint access**: Temporarily enable public endpoint with CIDR allowlist if the private endpoint path is broken; revert once fixed.
- **Rollback IAM changes**: Reapply the last known-good `AWSAuth` configmap and cluster role bindings; ensure system:masters access for break-glass.
- **Node bootstrap validation**: From an existing node, curl the API server with the node role credentials to confirm TLS and authentication.
- **Control plane health checks**: Use AWS Health Dashboard and `aws eks describe-cluster` to confirm plane status; open a Sev-2 with AWS if degraded.

## Protecting workloads during outage
- Freeze deploys and auto-scaling changes; pause GitOps reconciliation to prevent excessive retries.
- Keep ingress controllers and load balancers stable; do not rotate certificates unless they are the root cause (expiration/ACM revocation).
- If cluster-autoscaler is down, temporarily increase pod disruption budgets or disable PodDisruptionBudgets to avoid stuck rollouts.

## Recovery validation
- Smoke test CRUD: `kubectl get namespaces`, create/delete a dummy configmap, and ensure API latency is < 500ms.
- Confirm node heartbeats and scheduler activity by watching pod transitions in a non-critical namespace.
- Re-enable deployment automation gradually; run a canary rollout first.

## Post-incident follow-up
- Add synthetic probes for API `/readyz` and `/livez` from inside the VPC with alerting.
- Track AWS change notifications and update runbooks for IAM/OIDC and endpoint configuration drift.
- Capture timelines: change that triggered outage, detection time, mitigation steps, and residual risks.
