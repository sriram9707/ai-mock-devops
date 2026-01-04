---
id: gitlab-ci-pipelines
tags: [auto-tagged]
---

# GitLab CI: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on GitLab CI/CD. Focus on practical implementation, troubleshooting, and best practices.

---

## How to Use This Document

- **Entry Level:** Focus on basic `.gitlab-ci.yml` syntax, stages, and jobs.
- **Senior/Medior:** Focus on advanced features, optimization, and pipeline design.
- **SRE/Architect:** Focus on runner management, security, and organizational patterns.

---

## Core Concepts: Pipeline Structure

### Basic Structure

```yaml
stages:
  - build
  - test
  - deploy

variables:
  NODE_VERSION: "18"

build-job:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 week

test-job:
  stage: test
  script:
    - npm test
  dependencies:
    - build-job

deploy-job:
  stage: deploy
  script:
    - ./deploy.sh
  only:
    - main
  environment:
    name: production
    url: https://myapp.com
```

### Key Concepts
- **Stages:** Define the order of execution (jobs in same stage run in parallel)
- **Jobs:** Individual units of work
- **Artifacts:** Files passed between jobs/stages
- **Variables:** Configuration values (project, group, or instance level)
- **Runners:** Execute the jobs (shared, group, or project-specific)

### What Entry Level Should Know
- Basic YAML syntax for `.gitlab-ci.yml`
- Stages and job ordering
- How to use `script` and `image`
- Basic `only/except` rules

### What Senior Level Should Know
- `rules` syntax (replacement for only/except)
- DAG (Directed Acyclic Graph) with `needs`
- Caching strategies
- Parent-child pipelines
- Merge request pipelines

### What SRE Should Know
- Runner architecture and scaling
- Security scanning integration
- Compliance pipelines
- Cost optimization
- Multi-project pipelines

---

## Scenario Pattern: Pipeline Failures

### Incident: Job Fails with "No Such File or Directory"

**What's happening:** A job that depends on artifacts from a previous job can't find the files.

**Common causes:**
- Artifacts not defined in the producing job
- Artifacts expired
- `dependencies` not set correctly
- Job ran on different runner without artifact transfer

**Natural follow-up directions:**

If candidate checks artifacts → "Artifacts are defined but the next job still can't find them. What else?"
- Expected: Check `dependencies` keyword, artifacts might have expired, check if jobs are in different stages, verify artifact paths

If candidate mentions `needs` → "What's the difference between `dependencies` and `needs`?"
- Expected: `dependencies` controls artifact download, `needs` controls job ordering (DAG). Using `needs` without `dependencies` still downloads artifacts by default.

### Incident: Pipeline Takes Too Long

**What's happening:** Pipeline that should take 10 minutes takes 45 minutes.

**Debugging approach:**
```yaml
# Check job durations in pipeline view
# Look for:
# - Jobs waiting for runners
# - Sequential jobs that could be parallel
# - Unnecessary dependencies
```

**Natural follow-up directions:**

If candidate mentions "parallelization" → "Your test stage has 5 jobs that run sequentially. How do you parallelize them?"
- Expected: Put them in the same stage (auto-parallel), use `parallel` keyword for matrix, use `needs` to break stage dependencies

If candidate mentions caching → "How does GitLab caching differ from artifacts?"
- Expected: Cache is for dependencies (node_modules), persists across pipelines, best-effort. Artifacts are for build outputs, passed between jobs, guaranteed.

---

## Scenario Pattern: Merge Request Pipelines

### Incident: Pipeline Runs Twice on MR

**What's happening:** When creating an MR, two pipelines run—one for the branch push and one for the MR.

**Solution:**
```yaml
workflow:
  rules:
    - if: $CI_PIPELINE_SOURCE == "merge_request_event"
    - if: $CI_COMMIT_BRANCH && $CI_OPEN_MERGE_REQUEST_IID
      when: never
    - if: $CI_COMMIT_BRANCH
```

**Natural follow-up directions:**

If candidate mentions `workflow:rules` → "Explain how these rules prevent duplicate pipelines."
- Expected: First rule runs MR pipelines, second rule prevents branch pipeline if MR exists, third rule runs branch pipeline otherwise

If candidate mentions "detached pipelines" → "What's a detached MR pipeline and when would you use it?"
- Expected: Runs on the MR ref (merge result), not the branch. Useful for testing the merged result before actual merge.

---

## Scenario Pattern: Environment & Deployment

### Incident: Need Different Configs for Different Environments

**What's happening:** Same application needs to deploy to dev, staging, and production with different configurations.

**Pattern:**
```yaml
.deploy-template:
  script:
    - echo "Deploying to $ENVIRONMENT"
    - ./deploy.sh $ENVIRONMENT

deploy-dev:
  extends: .deploy-template
  variables:
    ENVIRONMENT: development
  environment:
    name: development
    url: https://dev.myapp.com
  rules:
    - if: $CI_COMMIT_BRANCH == "develop"

deploy-staging:
  extends: .deploy-template
  variables:
    ENVIRONMENT: staging
  environment:
    name: staging
    url: https://staging.myapp.com
  rules:
    - if: $CI_COMMIT_BRANCH == "main"

deploy-prod:
  extends: .deploy-template
  variables:
    ENVIRONMENT: production
  environment:
    name: production
    url: https://myapp.com
  rules:
    - if: $CI_COMMIT_TAG
  when: manual
```

**Natural follow-up directions:**

If candidate uses `extends` → "What's the difference between `extends` and YAML anchors?"
- Expected: `extends` is GitLab-specific, supports deep merging, cleaner syntax. Anchors are standard YAML, shallow merge only.

If candidate mentions `when: manual` → "How do you implement approval gates for production deployments?"
- Expected: `when: manual`, protected environments, required approvals in environment settings, `allow_failure: false` to block pipeline

---

## Scenario Pattern: Runners & Scaling

### Incident: Jobs Stuck in Pending

**What's happening:** Jobs stay in "pending" state for a long time before starting.

**Common causes:**
- No available runners with matching tags
- Runner is busy/overloaded
- Runner is offline
- Protected branch/tag requirements not met

**Debugging:**
```bash
# Check runner status in GitLab UI
# Settings > CI/CD > Runners

# On runner machine
gitlab-runner status
gitlab-runner verify
journalctl -u gitlab-runner
```

**Natural follow-up directions:**

If candidate checks runner tags → "Job requires tag 'docker' but no runners have it. How do you handle this?"
- Expected: Add tag to existing runner, deploy new runner with tag, or remove tag requirement if not needed

If candidate mentions "scaling" → "How do you auto-scale GitLab runners based on demand?"
- Expected: Docker Machine executor (deprecated), Kubernetes executor with autoscaling, AWS/GCP autoscaling groups, custom solutions

### Incident: Runner Security Concerns

**What's happening:** Security team is concerned about shared runners for sensitive projects.

**Considerations:**
- Shared runners can access secrets from any project using them
- Jobs from different projects might run on same runner
- Malicious code in one project could affect others

**Natural follow-up directions:**

If candidate mentions "project runners" → "What's the operational overhead of project-specific runners?"
- Expected: More runners to manage, higher cost, but better isolation. Consider group runners as middle ground.

If candidate mentions "Docker executor" → "How do you ensure job isolation with Docker executor?"
- Expected: Each job gets fresh container, but Docker socket sharing is dangerous, consider Kubernetes executor for better isolation

---

## Branching & Versioning in GitLab

### GitLab Flow

**Structure:**
- `main`: Production-ready
- `feature/*`: Feature branches
- Environment branches (optional): `staging`, `production`

**Key features:**
- Merge requests for all changes
- CI runs on MR
- Deploy on merge to specific branches

### Release Management

```yaml
release-job:
  stage: release
  image: registry.gitlab.com/gitlab-org/release-cli:latest
  rules:
    - if: $CI_COMMIT_TAG
  script:
    - echo "Creating release for $CI_COMMIT_TAG"
  release:
    tag_name: $CI_COMMIT_TAG
    description: "Release $CI_COMMIT_TAG"
    assets:
      links:
        - name: "Binary"
          url: "https://example.com/binary-$CI_COMMIT_TAG.zip"
```

**Natural follow-up directions:**

If candidate mentions tags → "How do you automate version tagging based on conventional commits?"
- Expected: Use semantic-release, gitlab-release-cli, or custom scripts that parse commit messages

---

## Handy Pipeline Patterns

### Caching Node Modules
```yaml
cache:
  key:
    files:
      - package-lock.json
  paths:
    - node_modules/
  policy: pull-push
```

### Parallel Testing
```yaml
test:
  parallel: 5
  script:
    - npm run test -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

### DAG Pipeline (needs)
```yaml
build-frontend:
  stage: build
  script: npm run build:frontend

build-backend:
  stage: build
  script: npm run build:backend

deploy:
  stage: deploy
  needs:
    - build-frontend
    - build-backend
  script: ./deploy.sh
```

### Include External Configs
```yaml
include:
  - project: 'my-group/ci-templates'
    ref: main
    file: '/templates/node.yml'
  - local: '/.gitlab/ci/test.yml'
  - remote: 'https://example.com/ci-template.yml'
```

---

## Level-Specific Conversation Starters

### Entry Level
"Walk me through how you would set up a basic CI pipeline for a Python application in GitLab."
- Listen for: Stages, jobs, script, image, basic understanding
- Follow up on: How do you run tests? How do you handle different branches?

### Senior Level
"Your team's pipeline has 20 jobs and takes 40 minutes. How do you optimize it?"
- Listen for: DAG with `needs`, caching, parallelization, identifying bottlenecks
- Follow up on: How do you measure the impact of changes? What trade-offs exist?

### SRE Level
"Design a CI/CD strategy for a company with 100 projects and strict compliance requirements."
- Listen for: Compliance pipelines, centralized templates, runner architecture, security scanning
- Follow up on: How do you enforce standards? How do you handle exceptions?

---

## Red Flags vs Green Flags

### Red Flags
- Doesn't understand the difference between stages and jobs
- Uses `only/except` instead of `rules` (outdated)
- No caching strategy
- Hardcodes secrets in `.gitlab-ci.yml`
- Doesn't know how to debug pending jobs

### Green Flags
- Uses `rules` with clear conditions
- Understands DAG and uses `needs` appropriately
- Has a caching strategy for dependencies
- Knows about protected variables and environments
- Can explain runner architecture and scaling
- Mentions security scanning and compliance features
