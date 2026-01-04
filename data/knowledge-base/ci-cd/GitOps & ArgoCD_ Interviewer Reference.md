---
id: gitops-sync-issues-argocd
tags: [auto-tagged]
---

# GitOps & ArgoCD: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on GitOps principles and ArgoCD implementation. Focus on practical deployment patterns and troubleshooting.

---

## How to Use This Document

- **Entry Level:** Focus on GitOps concepts, basic ArgoCD usage, and simple deployments.
- **Senior/Medior:** Focus on multi-environment strategies, secrets management, and troubleshooting.
- **SRE/Architect:** Focus on multi-cluster, disaster recovery, and organizational patterns.

---

## Core Concepts: GitOps Principles

### What is GitOps?

**Core principles:**
1. **Declarative:** Entire system described declaratively (YAML/JSON)
2. **Versioned:** Desired state stored in Git (single source of truth)
3. **Automated:** Approved changes auto-applied to system
4. **Continuously Reconciled:** Software agents ensure actual state matches desired state

### Push vs Pull Model

**Push (Traditional CI/CD):**
- CI pipeline pushes changes to cluster
- Pipeline needs cluster credentials
- Security concern: credentials in CI system

**Pull (GitOps):**
- Agent in cluster pulls changes from Git
- Cluster credentials stay in cluster
- More secure, better audit trail

### What Entry Level Should Know
- Basic GitOps concepts
- Why Git as source of truth
- How ArgoCD syncs applications

### What Senior Level Should Know
- Multi-environment promotion strategies
- Secrets management patterns
- Sync policies and hooks
- Rollback strategies

### What SRE Should Know
- Multi-cluster management
- Disaster recovery
- ApplicationSets for scale
- Security and compliance

---

## ArgoCD Core Components

### Application CRD

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo.git
    targetRevision: main
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: my-app
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
      - CreateNamespace=true
```

### Key Concepts
- **Application:** Kubernetes resource representing a deployed app
- **Project:** Logical grouping with RBAC and source/destination restrictions
- **Sync:** Process of applying Git state to cluster
- **Health:** Status of deployed resources
- **Refresh:** Checking Git for changes

---

## Scenario Pattern: Sync Failures

### Incident: Application Stuck in "OutOfSync"

**What's happening:** ArgoCD shows OutOfSync but won't sync automatically.

**Common causes:**
- Sync policy not set to automated
- Resource hook failed
- Validation error in manifests
- Destination namespace doesn't exist
- RBAC preventing ArgoCD from applying resources

**Debugging:**
```bash
argocd app get my-app
argocd app sync my-app --dry-run
kubectl get application my-app -n argocd -o yaml
```

**Natural follow-up directions:**

If candidate checks sync status → "Dry-run shows 'resource X is not permitted in project'. What's wrong?"
- Expected: ArgoCD Project restrictions. Check project's `sourceRepos`, `destinations`, and `clusterResourceWhitelist`.

If candidate mentions "automated sync" → "You have `automated: true` but it's still OutOfSync. Why?"
- Expected: Check if `selfHeal` is enabled, check sync windows, check if there's a sync error that's blocking

### Incident: Sync Succeeded but App Not Working

**What's happening:** ArgoCD shows "Synced" and "Healthy" but application returns errors.

**Key insight:** ArgoCD health checks are based on Kubernetes resource status, not application-level health.

**Natural follow-up directions:**

If candidate mentions "health check" → "How do you add custom health checks for your application?"
- Expected: Custom health checks in ArgoCD config, or use Kubernetes readiness probes properly, or add health check hooks

If candidate mentions "rollback" → "How do you rollback to a previous version in ArgoCD?"
- Expected: `argocd app rollback my-app <revision>`, or revert Git commit and let ArgoCD sync. Discuss which is preferred (Git revert for audit trail).

---

## Scenario Pattern: Multi-Environment Promotion

### Incident: Need to Promote from Dev to Staging to Prod

**What's happening:** Same application needs to deploy to multiple environments with different configs.

**Pattern 1: Directory-based (Kustomize)**
```
repo/
├── base/
│   ├── deployment.yaml
│   └── kustomization.yaml
└── overlays/
    ├── dev/
    │   └── kustomization.yaml
    ├── staging/
    │   └── kustomization.yaml
    └── prod/
        └── kustomization.yaml
```

**Pattern 2: Branch-based**
- `dev` branch → dev cluster
- `staging` branch → staging cluster
- `main` branch → prod cluster

**Pattern 3: Separate repos**
- App repo: source code + CI
- Config repo: Kubernetes manifests per environment

**Natural follow-up directions:**

If candidate mentions Kustomize → "How do you handle secrets that differ per environment?"
- Expected: Don't store secrets in Git. Use Sealed Secrets, External Secrets Operator, or Vault integration.

If candidate mentions "promotion" → "How do you automate promotion from dev to staging?"
- Expected: PR from dev overlay to staging overlay, or use ArgoCD Image Updater, or CI pipeline that updates manifests

---

## Scenario Pattern: Secrets Management

### Incident: Need to Store Secrets for GitOps

**What's happening:** Can't commit plain secrets to Git, but GitOps requires everything in Git.

**Solutions:**

**1. Sealed Secrets:**
```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: my-secret
spec:
  encryptedData:
    password: AgBy8hCi...  # Encrypted, safe to commit
```

**2. External Secrets Operator:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-secret
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: ClusterSecretStore
  target:
    name: my-secret
  data:
    - secretKey: password
      remoteRef:
        key: prod/my-app/db-password
```

**3. Vault with ArgoCD Vault Plugin:**
```yaml
# Annotations tell AVP to inject secrets
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
  annotations:
    avp.kubernetes.io/path: "secret/data/my-app"
stringData:
  password: <password>  # Replaced by AVP during sync
```

**Natural follow-up directions:**

If candidate mentions Sealed Secrets → "What happens if you lose the Sealed Secrets controller's private key?"
- Expected: Can't decrypt existing secrets. Need backup strategy for the key. Discuss key rotation.

If candidate mentions External Secrets → "How do you handle secret rotation with External Secrets?"
- Expected: ESO can poll for changes, set `refreshInterval`. Application needs to handle secret updates (restart or watch).

---

## Scenario Pattern: Multi-Cluster Management

### Incident: Need to Deploy Same App to 10 Clusters

**What's happening:** Managing applications across multiple clusters is becoming unmanageable.

**ApplicationSet:**
```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            environment: production
  template:
    metadata:
      name: 'my-app-{{name}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/repo.git
        targetRevision: main
        path: k8s/overlays/{{metadata.labels.region}}
      destination:
        server: '{{server}}'
        namespace: my-app
```

**Natural follow-up directions:**

If candidate mentions ApplicationSet → "How do you handle cluster-specific configurations with ApplicationSet?"
- Expected: Use generator parameters in path/values, combine with Kustomize overlays, use Helm values per cluster

If candidate mentions "cluster registration" → "How do you securely add a new cluster to ArgoCD?"
- Expected: `argocd cluster add`, service account with limited permissions, consider using cluster secrets with labels for ApplicationSet

---

## Scenario Pattern: Disaster Recovery

### Incident: ArgoCD Cluster is Down

**What's happening:** The cluster running ArgoCD is unavailable. Need to recover.

**Recovery strategy:**
1. **Git is the source of truth:** All Application definitions should be in Git
2. **ArgoCD config backup:** Export ArgoCD resources (Applications, Projects, Repos)
3. **Secrets backup:** Sealed Secrets keys, repo credentials

**Natural follow-up directions:**

If candidate mentions "Git as source of truth" → "Your ArgoCD Applications are defined in the UI, not Git. How do you fix this?"
- Expected: Export existing Applications to YAML, commit to Git, use App of Apps pattern going forward

If candidate mentions "App of Apps" → "Explain the App of Apps pattern and its benefits."
- Expected: One Application that manages other Applications. All config in Git, easy to bootstrap new ArgoCD instance, hierarchical management.

---

## Handy ArgoCD Patterns

### App of Apps
```yaml
# apps/Chart.yaml
apiVersion: v2
name: apps
version: 1.0.0

# apps/templates/my-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  # ... app definition
```

### Sync Waves (Ordering)
```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"  # Lower numbers sync first
```

### Resource Hooks
```yaml
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
```

### Ignore Differences
```yaml
spec:
  ignoreDifferences:
    - group: apps
      kind: Deployment
      jsonPointers:
        - /spec/replicas  # Ignore HPA-managed replicas
```

---

## Level-Specific Conversation Starters

### Entry Level
"Explain GitOps and how it differs from traditional CI/CD deployment."
- Listen for: Git as source of truth, pull vs push, declarative
- Follow up on: What are the benefits? What tools implement GitOps?

### Senior Level
"Your team uses ArgoCD for 50 microservices across dev, staging, and prod. How do you manage environment promotion?"
- Listen for: Directory structure, promotion strategy, automation
- Follow up on: How do you handle secrets? How do you rollback?

### SRE Level
"Design a GitOps strategy for a company with 20 Kubernetes clusters across 3 cloud providers."
- Listen for: Multi-cluster management, ApplicationSets, disaster recovery
- Follow up on: How do you handle cluster-specific configs? What's your DR strategy?

---

## Red Flags vs Green Flags

### Red Flags
- Stores plain secrets in Git
- Uses ArgoCD UI for all configuration (nothing in Git)
- Doesn't understand sync vs refresh
- No strategy for multi-environment promotion
- "Just delete and recreate" for troubleshooting

### Green Flags
- Everything in Git (App of Apps pattern)
- Has a secrets management strategy
- Understands sync policies and when to use manual vs auto
- Can troubleshoot sync failures systematically
- Considers disaster recovery and multi-cluster scenarios
- Mentions drift detection and self-healing
