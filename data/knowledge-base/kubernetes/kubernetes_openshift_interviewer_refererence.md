---
id: basic-kubectl-debugging
tags: [auto-tagged]
---

# Kubernetes & OpenShift: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on container orchestration. Adapt your approach based on candidate level and what they mention in their introduction.

---

## How to Use This Document

- **Entry Level:** Focus on basic concepts, kubectl commands, and common troubleshooting. Start with "what is" then move to "what happens when."
- **Senior/Medior:** Focus on production scenarios, edge cases, and architectural decisions. Start with incidents and drill down on their debugging approach.
- **SRE/Architect:** Focus on cluster design, multi-tenancy, disaster recovery, and operational excellence. Explore trade-offs and systemic thinking.

**Key Rule:** If candidate mentions specific tools (EKS, GKE, AKS, OpenShift), tailor scenarios to that platform.

---

## Core Concepts: What the Interviewer Should Know

### Cluster Architecture

**Control Plane Components:**
- **kube-apiserver:** Front door to the cluster. All kubectl commands go here. Validates and processes API requests.
- **etcd:** Distributed key-value store. Holds all cluster state. Loss of etcd = loss of cluster.
- **kube-scheduler:** Decides which node runs a pod. Considers resources, affinity, taints, topology.
- **kube-controller-manager:** Runs controllers (Deployment, ReplicaSet, Node, Service Account). Reconciliation loops.
- **cloud-controller-manager:** Integrates with cloud provider APIs (load balancers, volumes, nodes).

**Node Components:**
- **kubelet:** Agent on each node. Ensures containers are running as specified in PodSpecs.
- **kube-proxy:** Maintains network rules. Implements Service abstraction (iptables or IPVS mode).
- **Container Runtime:** Docker, containerd, CRI-O. Runs the actual containers.

### What Entry Level Should Know
- Can name the main components
- Understands that kubectl talks to API server
- Knows pods run on nodes

### What Senior Level Should Know
- How components interact during pod scheduling
- What happens when etcd is unavailable
- How to troubleshoot control plane issues
- HA control plane architecture

### What SRE/Architect Should Know
- etcd backup and restore procedures
- Control plane sizing and performance tuning
- Multi-cluster architectures
- Upgrade strategies with zero downtime

---

## Scenario Pattern: Deployment Issues

### Incident: Deployment Stuck at 0 Available Replicas

**What's happening:** Deployment created, ReplicaSet exists, but no pods are running or pods won't start.

**Debugging flow:**
```bash
kubectl get deployment <name> -o yaml    # Check spec and status
kubectl get replicaset -l app=<name>     # Check RS status
kubectl get pods -l app=<name>           # Check pod status
kubectl describe pod <pod-name>          # Check events
kubectl logs <pod-name> --previous       # Check crash logs
```

**Natural follow-up directions:**

If candidate says "check pod status" → "The pods are in ImagePullBackOff. What are the possible causes and how do you fix each?"
- Expected: Wrong image name, private registry without imagePullSecret, network issues to registry, rate limiting (Docker Hub)

If candidate says "check events" → "Events show 'FailedScheduling: 0/5 nodes available'. What now?"
- Expected: Check node resources, node selectors, taints/tolerations, PVC binding

If candidate says "check logs" → "Logs show the app started but then OOMKilled. How do you determine the right memory limit?"
- Expected: Profile the app, check actual usage with metrics, understand JVM heap vs container memory, load testing

### Incident: Rolling Update Stuck

**What's happening:** Deployment update triggered, new pods created but old pods not terminating. Rollout stuck at X/Y.

**Key concepts:**
- `maxUnavailable`: How many pods can be down during update
- `maxSurge`: How many extra pods can be created during update
- `minReadySeconds`: How long pod must be ready before considered available

**Natural follow-up directions:**

If candidate mentions "readiness probe" → "The new pods pass readiness but the rollout is still stuck. What else?"
- Expected: Check if old pods are stuck terminating (finalizers, preStop hooks), check PDB blocking termination

If candidate mentions "check rollout status" → "kubectl rollout status shows 'Waiting for deployment to finish: 2 out of 3 new replicas have been updated'. Why might one replica not update?"
- Expected: Node doesn't have resources for the new pod, affinity rules can't be satisfied, PVC can't be bound

---

## Scenario Pattern: Service & Networking

### Incident: Service Not Routing Traffic to Pods

**What's happening:** Pods are Running and Ready, Service exists, but no traffic reaches the pods.

**Debugging flow:**
```bash
kubectl get endpoints <service-name>     # Check if pods are in endpoints
kubectl get pods -l <selector> -o wide   # Verify label match
kubectl describe svc <service-name>      # Check selector and ports
kubectl get networkpolicy -A             # Check for blocking policies
```

**Natural follow-up directions:**

If candidate checks endpoints → "Endpoints list is empty but pods are running with correct labels. What's wrong?"
- Expected: Pods not ready (readiness probe failing), pods in different namespace, selector typo

If candidate mentions "network policy" → "How do you debug network policies without disabling them?"
- Expected: Check policy selectors, use kubectl describe on the policy, test with a debug pod, check if default deny exists

If candidate mentions "kube-proxy" → "How would you verify kube-proxy is working correctly?"
- Expected: Check kube-proxy logs, verify iptables rules (`iptables -t nat -L`), check if running in iptables vs IPVS mode

### Incident: Ingress Not Working

**What's happening:** Ingress resource created, but external traffic doesn't reach the service.

**Key concepts:**
- Ingress Controller must be installed (nginx, traefik, HAProxy, cloud-native)
- Ingress class annotation/spec
- TLS termination and certificate management
- Backend service must be working first

**Natural follow-up directions:**

If candidate checks ingress controller → "The ingress controller pods are running but returning 502. What's the issue?"
- Expected: Backend service not reachable from ingress controller namespace, service port mismatch, backend pods not ready

If candidate mentions TLS → "You're getting certificate errors. How do you troubleshoot cert-manager?"
- Expected: Check Certificate and CertificateRequest resources, check cert-manager logs, verify DNS challenge or HTTP challenge setup

---

## Scenario Pattern: Storage Issues

### Incident: Pod Stuck in ContainerCreating Due to Volume

**What's happening:** Pod scheduled to node but stuck in ContainerCreating. Events show volume mount issues.

**Debugging flow:**
```bash
kubectl describe pod <name>              # Check events for volume errors
kubectl get pvc <name>                   # Check PVC status (Bound?)
kubectl get pv                           # Check PV status and reclaim policy
kubectl describe pvc <name>              # Check events on PVC
```

**Common issues:**
- PVC not bound (no matching PV, StorageClass issues)
- Volume already mounted on another node (RWO access mode)
- Node doesn't have access to storage backend
- CSI driver not installed or not working

**Natural follow-up directions:**

If candidate mentions "PVC not bound" → "The PVC is Pending. StorageClass exists. What could be wrong?"
- Expected: StorageClass provisioner not working, quota exceeded, zone mismatch (EBS can't attach cross-AZ)

If candidate mentions "RWO" → "You need the same volume on multiple pods. What are your options?"
- Expected: Use RWX (NFS, EFS), use StatefulSet with volumeClaimTemplates, redesign to not share storage

If candidate mentions "CSI" → "How do you troubleshoot a CSI driver that's not provisioning volumes?"
- Expected: Check CSI controller logs, check CSI node plugin logs, verify RBAC for CSI service accounts

---

## Scenario Pattern: RBAC & Security

### Incident: User Can't Access Resources

**What's happening:** User or ServiceAccount getting "Forbidden" errors when trying to access resources.

**Debugging flow:**
```bash
kubectl auth can-i <verb> <resource> --as=<user>           # Test permissions
kubectl auth can-i <verb> <resource> --as=system:serviceaccount:<ns>:<sa>
kubectl get rolebindings,clusterrolebindings -A | grep <user/sa>
kubectl describe rolebinding <name>                         # Check subjects and roleRef
```

**Natural follow-up directions:**

If candidate checks RoleBinding → "The RoleBinding exists but user still can't access. What else?"
- Expected: RoleBinding is namespaced but user needs cluster-wide access (need ClusterRoleBinding), Role doesn't have the right verbs/resources

If candidate mentions ServiceAccount → "A pod can't list secrets even though you created a Role allowing it. Why?"
- Expected: Role is in wrong namespace, RoleBinding references wrong ServiceAccount name, pod not using the right ServiceAccount

If candidate mentions "least privilege" → "How do you audit what permissions are actually being used vs what's granted?"
- Expected: Enable audit logging, use tools like rbac-lookup or kubectl-who-can, review with security team regularly

---

## OpenShift-Specific Concepts

### Routes vs Ingress

**Routes:** OpenShift-native way to expose services externally. Managed by the Router (HAProxy-based).
**Key differences from Ingress:**
- Routes are a first-class OpenShift resource
- Built-in TLS termination options (edge, passthrough, reencrypt)
- Integrated with OpenShift's internal CA
- Can do blue-green and A/B deployments natively

**Natural follow-up if candidate mentions OpenShift:**

"You're migrating from vanilla Kubernetes to OpenShift. Your Ingress resources aren't working. Why?"
- Expected: Need to use Routes or install an Ingress controller, OpenShift Router handles Routes not Ingress by default

### Security Context Constraints (SCCs)

**What they are:** OpenShift's way to control pod security (more powerful than PodSecurityPolicies/Standards).

**Common SCCs:**
- `restricted`: Most restrictive, default for most pods
- `anyuid`: Allows running as any UID (needed for some legacy apps)
- `privileged`: Full access (dangerous, avoid in production)

**Natural follow-up directions:**

If candidate mentions SCC → "Your pod works in dev but fails in prod with 'unable to validate against any security context constraint'. Why?"
- Expected: Dev might have more permissive SCCs, prod uses restricted. Need to either fix the container to not need elevated privileges or create a custom SCC.

"How do you decide between modifying the container vs granting a more permissive SCC?"
- Expected: Prefer fixing the container (security best practice). Only grant elevated SCCs if absolutely necessary and scope it narrowly.

---

## Level-Specific Conversation Starters

### Entry Level
"Tell me about your experience with Kubernetes. What kind of workloads have you deployed?"
- Listen for: Basic understanding of pods, deployments, services
- Follow up on: Whatever they mention—if they say "deployed a web app," ask about how they exposed it

"Walk me through how you would deploy a simple web application to Kubernetes."
- Listen for: Deployment, Service, maybe Ingress
- Follow up on: What happens if the pod crashes? How do you check logs?

### Senior Level
"Your team's deployment pipeline is failing intermittently. Pods deploy but then get evicted within minutes. How do you investigate?"
- Listen for: Systematic approach—check events, logs, resource limits, node pressure
- Follow up on: What if it's OOMKilled? What if it's node pressure? How do you prevent this?

"You need to run a stateful application (like PostgreSQL) on Kubernetes. What considerations do you have?"
- Listen for: StatefulSets, PVCs, backup strategies, HA considerations
- Follow up on: How do you handle failover? What about backup and restore?

### SRE/Architect Level
"Design a multi-tenant Kubernetes platform for 50 development teams. What are your key considerations?"
- Listen for: Namespace isolation, RBAC, resource quotas, network policies, cost allocation
- Follow up on: How do you prevent noisy neighbors? How do you handle cluster upgrades?

"Your organization wants to achieve 99.99% uptime for a critical application on Kubernetes. What's your architecture?"
- Listen for: Multi-cluster, multi-region, PDBs, proper health checks, chaos engineering
- Follow up on: How do you handle cluster failures? What's your DR strategy?

---

## Red Flags vs Green Flags

### Red Flags
- "I just restart the pod when there's an issue"
- Can't explain the difference between Deployment and Pod
- Doesn't mention checking events or logs when debugging
- "We run everything as root because it's easier"
- No understanding of resource limits and their importance

### Green Flags
- Mentions checking events and logs as first debugging steps
- Understands the relationship between Deployment → ReplicaSet → Pod
- Considers security implications (RBAC, network policies, SCCs)
- Talks about resource management and capacity planning
- Mentions monitoring and alerting for cluster health
- Discusses trade-offs (e.g., "we could use X but Y is better for our use case because...")

---

## Handy Commands Reference

**Debugging:**
```bash
kubectl get events --sort-by='.lastTimestamp'
kubectl logs <pod> --previous
kubectl exec -it <pod> -- /bin/sh
kubectl run debug --image=busybox -it --rm -- sh
kubectl top pods / kubectl top nodes
```

**Investigation:**
```bash
kubectl get all -n <namespace>
kubectl describe <resource> <name>
kubectl get <resource> -o yaml
kubectl explain <resource.field>
```

**RBAC:**
```bash
kubectl auth can-i --list --as=<user>
kubectl auth can-i create pods --as=system:serviceaccount:default:mysa
```

**Networking:**
```bash
kubectl get endpoints
kubectl get networkpolicy -A
kubectl exec <pod> -- curl -v <service>:<port>
```
