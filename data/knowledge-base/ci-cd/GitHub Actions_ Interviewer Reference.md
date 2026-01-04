---
id: github-actions-basics
tags: [auto-tagged]
---

# GitHub Actions: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on GitHub Actions CI/CD. Focus on practical implementation, troubleshooting, and best practices.

---

## How to Use This Document

- **Entry Level:** Focus on basic workflow syntax, common actions, and simple pipelines.
- **Senior/Medior:** Focus on advanced patterns, optimization, security, and branching strategies.
- **SRE/Architect:** Focus on scalability, self-hosted runners, organizational patterns, and cost optimization.

---

## Core Concepts: Workflow Structure

### Workflow Components

```yaml
name: CI Pipeline                    # Workflow name
on:                                  # Triggers
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  workflow_dispatch:                 # Manual trigger

jobs:
  build:                             # Job name
    runs-on: ubuntu-latest           # Runner
    steps:
      - uses: actions/checkout@v4    # Action
      - name: Run tests              # Step name
        run: npm test                # Shell command
```

### Key Concepts
- **Workflow:** YAML file in `.github/workflows/`
- **Job:** Set of steps that run on the same runner
- **Step:** Individual task (action or shell command)
- **Action:** Reusable unit of code
- **Runner:** Server that executes jobs (GitHub-hosted or self-hosted)

### What Entry Level Should Know
- Basic workflow syntax
- Common triggers (push, pull_request)
- How to use pre-built actions
- How to run shell commands

### What Senior Level Should Know
- Job dependencies and parallelization
- Matrix builds
- Caching strategies
- Secrets management
- Reusable workflows

### What SRE Should Know
- Self-hosted runner management
- Security hardening
- Cost optimization
- Organizational workflow patterns
- Compliance and audit requirements

---

## Scenario Pattern: Pipeline Failures

### Incident: Build Failing on PR but Works Locally

**What's happening:** Developer says "it works on my machine" but CI fails.

**Common causes:**
- Different Node/Python/etc. version
- Missing environment variables
- Different OS (macOS local vs Linux CI)
- Cached dependencies locally that aren't in package.json
- File path case sensitivity (macOS vs Linux)

**Natural follow-up directions:**

If candidate mentions "check the logs" → "Logs show 'module not found' for a package that's definitely in package.json. What's happening?"
- Expected: Package might be in devDependencies but CI runs with `--production`, lockfile out of sync, or package version incompatibility

If candidate mentions "environment differences" → "How do you ensure local and CI environments match?"
- Expected: Use same Node version (`.nvmrc`, `actions/setup-node`), use Docker for consistency, document required env vars, use lockfiles

If candidate mentions "works on main but not PR" → "The same code works when merged to main but fails on PR. Why?"
- Expected: Different triggers might have different permissions, PR from fork has limited secrets access, base branch differences

### Incident: Pipeline Suddenly Slow

**What's happening:** CI that used to take 5 minutes now takes 20 minutes.

**Debugging approach:**
```yaml
# Add timing to steps
- name: Install dependencies
  run: |
    echo "::group::Installing"
    time npm ci
    echo "::endgroup::"
```

**Natural follow-up directions:**

If candidate mentions "check step times" → "The 'Install dependencies' step went from 30s to 10 minutes. What happened?"
- Expected: Cache miss (cache key changed), npm registry slow, new heavy dependency added, lockfile regenerated

If candidate mentions caching → "How does GitHub Actions caching work and what are the gotchas?"
- Expected: Cache key matching, cache size limits (10GB), cache eviction policy (LRU, 7 days), cache scope (branch-specific)

---

## Scenario Pattern: Secrets & Security

### Incident: Secret Exposed in Logs

**What's happening:** A secret value appeared in the workflow logs.

**How secrets work:**
- Secrets are masked in logs (replaced with ***)
- But: echoing, string manipulation, or base64 encoding can expose them
- Secrets aren't available to workflows triggered by forks (security feature)

**Natural follow-up directions:**

If candidate mentions "secrets are masked" → "The secret was masked but someone base64 decoded it from the logs. How do you prevent this?"
- Expected: Never echo secrets, use `add-mask` for dynamic secrets, audit workflow files, use OIDC instead of long-lived secrets where possible

If candidate mentions "rotate the secret" → "What's your process for rotating a compromised secret?"
- Expected: Revoke immediately, rotate in the provider (AWS, npm, etc.), update GitHub secret, audit for unauthorized use, review how it was exposed

### Incident: Workflow Permissions Too Broad

**What's happening:** Security audit flagged that workflows have write access they don't need.

**Best practices:**
```yaml
permissions:
  contents: read           # Minimal permissions
  pull-requests: write     # Only what's needed

# Or at job level
jobs:
  build:
    permissions:
      contents: read
```

**Natural follow-up directions:**

If candidate mentions "GITHUB_TOKEN" → "What's the difference between GITHUB_TOKEN and a Personal Access Token?"
- Expected: GITHUB_TOKEN is scoped to the repo, auto-generated, expires after job. PAT is user-scoped, longer-lived, more dangerous if leaked.

If candidate mentions "least privilege" → "How do you audit what permissions a workflow actually needs?"
- Expected: Start with no permissions and add as needed, review action documentation, check API calls in the workflow, use GitHub's security features

---

## Branching & Versioning Strategies

### GitFlow

**Structure:**
- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New features
- `release/*`: Release preparation
- `hotfix/*`: Production fixes

**Workflow triggers:**
```yaml
on:
  push:
    branches:
      - main
      - develop
      - 'release/**'
  pull_request:
    branches:
      - main
      - develop
```

### Trunk-Based Development

**Structure:**
- `main`: Single source of truth
- Short-lived feature branches (< 1 day)
- Feature flags for incomplete work

**Workflow triggers:**
```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

**Natural follow-up directions:**

If candidate mentions GitFlow → "What are the downsides of GitFlow? When would you not use it?"
- Expected: Complex for small teams, long-lived branches cause merge conflicts, slower release cycles. Better for scheduled releases, not continuous deployment.

If candidate mentions trunk-based → "How do you handle incomplete features in trunk-based development?"
- Expected: Feature flags, branch by abstraction, small incremental changes, comprehensive testing

### Semantic Versioning

**Format:** `MAJOR.MINOR.PATCH` (e.g., 2.1.3)
- **MAJOR:** Breaking changes
- **MINOR:** New features, backward compatible
- **PATCH:** Bug fixes, backward compatible

**Automation example:**
```yaml
- name: Bump version
  uses: anothrNick/github-tag-action@v1
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
    WITH_V: true
    DEFAULT_BUMP: patch
```

**Natural follow-up directions:**

If candidate mentions semantic versioning → "How do you automate version bumping based on commit messages?"
- Expected: Conventional commits, semantic-release, commit message parsing, automated changelog generation

If candidate mentions "release process" → "Walk me through your ideal release process from feature branch to production."
- Expected: PR with tests, code review, merge to main, automated versioning, build artifacts, deploy to staging, smoke tests, production deploy, monitoring

---

## Scenario Pattern: Matrix Builds & Optimization

### Incident: Need to Test Across Multiple Versions

**What's happening:** Application needs to support Node 16, 18, and 20.

**Matrix build:**
```yaml
jobs:
  test:
    strategy:
      matrix:
        node: [16, 18, 20]
        os: [ubuntu-latest, windows-latest]
      fail-fast: false              # Don't cancel other jobs if one fails
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
```

**Natural follow-up directions:**

If candidate uses matrix → "Your matrix has 6 combinations and each takes 10 minutes. How do you speed this up?"
- Expected: Parallelize (already happening), cache dependencies, only run full matrix on main/PR (not every push), use `fail-fast: true` for quick feedback

If candidate mentions caching → "How do you cache node_modules effectively across matrix jobs?"
- Expected: Cache key should include OS, Node version, and lockfile hash. Each matrix combination might need its own cache.

---

## Scenario Pattern: Self-Hosted Runners

### Incident: GitHub-Hosted Runners Too Slow/Expensive

**What's happening:** Build times are long and costs are high.

**Self-hosted runner considerations:**
- **Pros:** Faster (local network), cheaper at scale, custom hardware, persistent environment
- **Cons:** Maintenance burden, security responsibility, scaling complexity

**Natural follow-up directions:**

If candidate suggests self-hosted → "What security concerns do you have with self-hosted runners?"
- Expected: Runners have access to secrets, malicious PRs could run code on your infrastructure, need to isolate runners, use ephemeral runners for public repos

If candidate mentions "ephemeral runners" → "How do you implement ephemeral self-hosted runners?"
- Expected: Actions Runner Controller (ARC) on Kubernetes, AWS autoscaling groups, clean environment per job, no persistent state

If candidate mentions cost → "How do you calculate when self-hosted becomes cheaper than GitHub-hosted?"
- Expected: Factor in: compute costs, maintenance time, networking, storage, scaling needs. Usually worth it at high volume or special requirements.

---

## Handy Workflow Patterns

### Caching Dependencies
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.npm
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-node-
```

### Conditional Steps
```yaml
- name: Deploy to production
  if: github.ref == 'refs/heads/main' && github.event_name == 'push'
  run: ./deploy.sh
```

### Reusable Workflows
```yaml
# .github/workflows/reusable-build.yml
on:
  workflow_call:
    inputs:
      environment:
        required: true
        type: string

# Caller workflow
jobs:
  call-build:
    uses: ./.github/workflows/reusable-build.yml
    with:
      environment: production
```

### Artifacts
```yaml
- uses: actions/upload-artifact@v3
  with:
    name: build-output
    path: dist/
    retention-days: 5
```

---

## Level-Specific Conversation Starters

### Entry Level
"Walk me through how you would set up a basic CI pipeline for a Node.js application."
- Listen for: Checkout, setup-node, install, test, basic triggers
- Follow up on: How do you handle different branches? What if a test fails?

### Senior Level
"Your team's CI pipeline takes 30 minutes. Product is complaining about slow feedback. How do you optimize it?"
- Listen for: Parallelization, caching, matrix optimization, identifying bottlenecks
- Follow up on: How do you measure improvement? What trade-offs are you making?

### SRE Level
"Design a CI/CD strategy for a monorepo with 10 microservices and 50 developers."
- Listen for: Path-based triggers, reusable workflows, caching strategy, runner scaling
- Follow up on: How do you handle dependencies between services? How do you manage costs?

---

## Red Flags vs Green Flags

### Red Flags
- Commits secrets to workflow files
- Doesn't understand why workflows need permissions
- "Just use `ubuntu-latest`" without considering implications
- No caching strategy
- Doesn't know how to debug failing workflows

### Green Flags
- Understands security implications of CI/CD
- Uses caching effectively
- Knows when to use matrix builds vs separate workflows
- Considers cost and performance trade-offs
- Has a clear branching and versioning strategy
- Mentions monitoring and observability for pipelines
