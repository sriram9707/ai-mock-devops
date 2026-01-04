---
id: node-failures-and-pod-eviction
tags: [auto-tagged]
---

# Pod Lifecycle: Interviewer Reference

This document helps the interviewer understand pod lifecycle concepts deeply so they can have natural, adaptive conversations with candidates. This is NOT a script—use this knowledge to ask relevant follow-ups based on what the candidate says.

---

## How to Use This Document

- **Entry Level:** Focus on fundamentals. If candidate mentions "pod stuck in pending," explore if they know basic debugging commands and common causes.
- **Senior Level:** Focus on edge cases and trade-offs. Push them on "what if" scenarios and ask about production experience.
- **SRE Level:** Focus on systemic thinking. Ask about prevention, monitoring, alerting, and how they'd design systems to avoid these issues.

---

## Core Concept: Pod Phases

Pods go through phases: Pending → Running → Succeeded/Failed. Understanding why a pod is in a particular phase is fundamental to debugging.

### What Entry Level Should Know
- Basic phases and what they mean
- How to check pod status (`kubectl get pods`, `kubectl describe pod`)
- Common reasons for Pending (not enough resources, image pull issues)

### What Senior Level Should Know
- All the above, plus:
- How scheduling works (resource requests vs node capacity)
- PVC binding and zone affinity issues
- How to read and interpret pod events

### What SRE Level Should Know
- All the above, plus:
- Resource fragmentation across nodes
- Priority classes and preemption
- How to set up monitoring/alerting for scheduling failures
- Capacity planning to prevent scheduling issues

---

## Incident Pattern: Pod Won't Schedule

**What actually happens:** Pod stays in Pending because the scheduler can't find a suitable node.

**Common causes (in order of frequency):**
1. Not enough CPU or memory on any node
2. Node selector or affinity rules too restrictive
3. PVC waiting to be bound (especially in multi-zone clusters)
4. Taints on nodes without matching tolerations
5. Pod priority too low and being preempted

**Debugging commands:**
- `kubectl describe pod <name>` — check Events section
- `kubectl describe node <name>` — check Allocatable vs Allocated
- `kubectl get pvc` — check if PVCs are Bound

**Natural follow-up directions based on candidate response:**

If they mention "check resources" → ask about resource fragmentation (cluster has 8 CPUs free but spread across 4 nodes, pod needs 4)

If they mention "node selector" → ask about a scenario where they need to schedule on GPU nodes but GPU nodes are full

If they mention "PVC" → ask about zone-locked volumes and how that affects scheduling in multi-AZ clusters

---

## Incident Pattern: Container Keeps Crashing

**What actually happens:** Container starts, runs briefly, then exits. Kubernetes restarts it, creating a CrashLoopBackOff pattern.

**Common causes:**
1. Application error (check logs)
2. OOMKilled (container exceeded memory limit)
3. Missing configuration (ConfigMap/Secret not mounted)
4. Dependency not available (database not ready)
5. Liveness probe too aggressive

**Key exit codes to know:**
- Exit 1: Generic error
- Exit 137: Killed (usually OOMKilled or SIGKILL)
- Exit 139: Segfault
- Exit 143: SIGTERM (graceful shutdown)

**Natural follow-up directions:**

If they mention "check logs" → ask what they'd do if logs show nothing (exit 137 with no error message)

If they mention "OOMKilled" → ask why a container might use more memory in Kubernetes than locally (JVM heap vs container limit, native memory, shared node pressure)

If they mention "increase memory" → ask about memory leaks and how they'd identify one

---

## Incident Pattern: App Running But No Traffic

**What actually happens:** Pods show Running and Ready, but users can't reach the application.

**Common causes:**
1. Readiness probe failing (pod not in Service endpoints)
2. Service selector doesn't match pod labels
3. Network policy blocking traffic
4. Ingress misconfiguration
5. Load balancer health check failing

**Natural follow-up directions:**

If they mention "check endpoints" → ask what they'd do if endpoints are populated but traffic still doesn't work

If they mention "readiness probe" → ask about a scenario where the probe passes but the app isn't actually ready (probe checks port, not actual health)

If they mention "network policy" → ask how they'd debug network policies without disabling them

---

## Incident Pattern: Deployment Causes Outage

**What actually happens:** Rolling update triggered, users experience errors during the rollout.

**Why this happens (even with rolling updates):**
1. New pods pass readiness but aren't truly ready
2. Old pods terminated before load balancer updates
3. Long-running requests killed mid-flight
4. Readiness probe too simple

**Key concepts:**
- `terminationGracePeriodSeconds`: How long to wait before SIGKILL
- `preStop` hook: Run before SIGTERM, useful for drain delay
- PodDisruptionBudget: Prevent too many pods from being down

**Natural follow-up directions:**

If they mention "readiness probe" → ask how they'd design a probe that truly verifies the app is ready (not just port open)

If they mention "graceful shutdown" → ask about handling long-running requests (what if a request takes 2 minutes?)

If they mention "preStop hook" → ask why you'd add a sleep in preStop (allow LB to drain before app stops accepting)

---

## Incident Pattern: Pods Getting Evicted

**What actually happens:** Kubernetes evicts pods from a node under resource pressure.

**Eviction order:**
1. BestEffort pods (no requests/limits)
2. Burstable pods (requests < limits) using more than requested
3. Guaranteed pods (requests = limits) — last resort

**Why it matters:**
- Critical workloads should be Guaranteed QoS
- Priority classes affect eviction order
- System daemons need resources too (don't allocate 100% of node)

**Natural follow-up directions:**

If they mention "set resource limits" → ask about the trade-off between Guaranteed (safe but wastes resources) vs Burstable (efficient but risky)

If they mention "priority class" → ask how they'd set priorities across different services (what's more important: API server or batch jobs?)

If they mention "node pressure" → ask how they'd monitor and alert on this before evictions happen

---

## Probes: The Nuances

**Liveness vs Readiness vs Startup:**
- Liveness: "Is the container alive?" Failure = restart container
- Readiness: "Can it handle traffic?" Failure = remove from Service
- Startup: "Has it finished starting?" Blocks liveness/readiness until success

**Common mistakes:**
- Liveness probe on a dependency (DB down = all pods restart = cascade failure)
- Readiness probe too aggressive (pod flaps in/out of Service)
- No startup probe for slow apps (liveness kills pod before it starts)

**Natural follow-up directions:**

If they mention "liveness probe" → ask what happens if the liveness probe checks a database connection and the DB goes down

If they mention "startup probe" → ask how they'd configure probes for an app that takes 5 minutes to warm up

If they mention "readiness probe" → ask about a scenario where the probe passes but the app is degraded (should it still receive traffic?)

---

## Level-Specific Conversation Starters

### Entry Level
Start with: "Tell me about a time you had to debug a pod that wasn't starting."
Listen for: Basic kubectl commands, understanding of pod states, methodical approach

### Senior Level
Start with: "Your deployment just caused a 30-second outage even though you have 5 replicas and a rolling update strategy. What happened?"
Listen for: Understanding of readiness probes, graceful shutdown, load balancer behavior, specific debugging steps

### SRE Level
Start with: "How would you design a Kubernetes deployment strategy that guarantees zero downtime, even during node failures?"
Listen for: PodDisruptionBudgets, anti-affinity rules, preStop hooks, health check design, monitoring strategy, blast radius thinking

---

## Red Flags vs Green Flags

**Red Flags (indicates less experience):**
- "I would just restart the pod"
- "I would increase the resources" (without investigating why)
- "I would disable the probe" (instead of fixing it)
- Can't explain why something works, just that it does

**Green Flags (indicates real experience):**
- Mentions checking logs first
- Asks clarifying questions about the environment
- Considers blast radius and impact
- Mentions monitoring, alerting, or prevention
- Discusses trade-offs, not just solutions
