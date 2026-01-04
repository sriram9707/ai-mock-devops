---
id: debug-ingress-502-504-errors
tags: [auto-tagged]
---

# Kubernetes ingress and DNS debugging guide

## Symptoms
- External users receive 404/502 while internal services work.
- TLS handshake failures or certificate mismatch warnings at the edge.
- Only some paths or hostnames fail, often after a config change or deployment.

## Rapid triage steps
1. **Ingress object validation**
   - Confirm `ingressClassName` matches the controller (nginx, ALB, GKE). A new default class can silently redirect traffic.
   - Check annotations for recent changes—ALB/NLB ingress can reject due to invalid target group or certificate ARNs.
2. **DNS and load balancer health**
   - Query authoritative DNS (`dig +trace <host>`) to confirm CNAME/A records and TTLs; look for stale records.
   - Verify load balancer target health; ensure the Service type and port mapping match the ingress backend.
3. **Admission and policy checks**
   - Validate manifests with `kubectl apply --server-dry-run -f` to catch schema errors.
   - Check NetworkPolicies for namespace or podSelector mismatches that block ingress controller callbacks.

## Common fixes
- Regenerate certificates with the correct Subject Alternative Names; re-sync secrets used by ingress controllers.
- Align `pathType` with controller behavior (e.g., `Prefix` vs `Exact`) to avoid accidental shadowing by wildcards.
- For ALB ingress, ensure target group health check paths are reachable and use HTTP 200/301; misaligned paths cause deregistration.
- Redeploy ingress controller to pick up ConfigMap changes (e.g., NGINX custom snippets) after config drift.

## Verification steps
- Run `kubectl describe ingress <name>` and capture events for failed rule syncs.
- Curl via internal node or pod: `curl -H "Host: <host>" http://<node_ip>:<nodeport>/healthz` to bypass DNS.
- Confirm that traffic distribution matches expectations by inspecting load balancer access logs or service mesh telemetry.
