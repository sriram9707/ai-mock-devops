---
id: jenkins-job-configuration
tags: [auto-tagged]
---

# Jenkins: Interviewer Reference

This document provides deep knowledge for conducting natural, scenario-based interviews on Jenkins CI/CD. Focus on practical implementation, troubleshooting, and migration patterns.

---

## How to Use This Document

- **Entry Level:** Focus on basic Jenkinsfile syntax, pipeline concepts, and common plugins.
- **Senior/Medior:** Focus on shared libraries, advanced pipeline patterns, and troubleshooting.
- **SRE/Architect:** Focus on scalability, high availability, security, and migration strategies.

---

## Core Concepts: Pipeline Types

### Declarative Pipeline (Recommended)

```groovy
pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        DEPLOY_ENV = 'production'
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'npm ci'
                sh 'npm run build'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Unit Tests') {
                    steps {
                        sh 'npm run test:unit'
                    }
                }
                stage('Integration Tests') {
                    steps {
                        sh 'npm run test:integration'
                    }
                }
            }
        }
        
        stage('Deploy') {
            when {
                branch 'main'
            }
            steps {
                sh './deploy.sh'
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        failure {
            slackSend channel: '#alerts', message: "Build failed: ${env.JOB_NAME}"
        }
    }
}
```

### Scripted Pipeline (Legacy but Flexible)

```groovy
node {
    stage('Build') {
        checkout scm
        sh 'npm ci'
        sh 'npm run build'
    }
    
    stage('Test') {
        try {
            sh 'npm test'
        } catch (e) {
            currentBuild.result = 'UNSTABLE'
        }
    }
}
```

### What Entry Level Should Know
- Difference between Declarative and Scripted
- Basic stages, steps, and agents
- How to use `sh` and `bat` steps
- Basic `when` conditions

### What Senior Level Should Know
- Shared libraries
- Parallel execution
- Credentials management
- Pipeline as Code best practices
- Troubleshooting failed builds

### What SRE Should Know
- Jenkins architecture (controller/agents)
- High availability setup
- Security hardening
- Plugin management and updates
- Migration strategies

---

## Scenario Pattern: Pipeline Failures

### Incident: Build Fails with "Script Not Permitted"

**What's happening:** Pipeline fails with "Scripts not permitted to use method" error.

**Cause:** Jenkins sandbox blocks potentially dangerous Groovy methods.

**Solutions:**
1. Approve the method in "Manage Jenkins > In-process Script Approval"
2. Use `@NonCPS` annotation for non-serializable code
3. Move logic to shared library (runs outside sandbox)

**Natural follow-up directions:**

If candidate mentions "script approval" → "What are the security implications of approving scripts?"
- Expected: Approved scripts run with Jenkins' permissions, could access secrets, modify system. Should review carefully, prefer shared libraries.

If candidate mentions shared libraries → "How do shared libraries help with security?"
- Expected: Libraries run outside sandbox, can be reviewed/controlled centrally, reduces need for script approvals in individual pipelines

### Incident: Pipeline Hangs Indefinitely

**What's happening:** Pipeline starts but never completes. No error, just stuck.

**Common causes:**
- Waiting for user input (`input` step without timeout)
- Agent not available (no matching label)
- Deadlock in parallel stages
- External service not responding

**Natural follow-up directions:**

If candidate checks agent availability → "Agents are available but job still pending. What else?"
- Expected: Check executor availability, check if job is in queue, check for resource locks, check Jenkins logs

If candidate mentions "input step" → "How do you add a timeout to an input step?"
```groovy
timeout(time: 1, unit: 'HOURS') {
    input message: 'Deploy to production?'
}
```

---

## Scenario Pattern: Credentials & Security

### Incident: Need to Use AWS Credentials in Pipeline

**What's happening:** Pipeline needs to deploy to AWS but credentials shouldn't be in code.

**Pattern:**
```groovy
pipeline {
    agent any
    stages {
        stage('Deploy') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'aws-creds',
                        usernameVariable: 'AWS_ACCESS_KEY_ID',
                        passwordVariable: 'AWS_SECRET_ACCESS_KEY'
                    )
                ]) {
                    sh 'aws s3 sync ./dist s3://my-bucket'
                }
            }
        }
    }
}
```

**Natural follow-up directions:**

If candidate uses `withCredentials` → "What happens if someone adds `echo $AWS_SECRET_ACCESS_KEY` to the pipeline?"
- Expected: Jenkins masks credentials in logs, but not foolproof. Base64 encoding or writing to file could expose them. Code review is essential.

If candidate mentions "credential types" → "What's the difference between 'Username with password' and 'Secret text' credential types?"
- Expected: Username/password for services needing both, secret text for tokens/API keys. Also: SSH keys, certificates, etc.

### Incident: Securing Jenkins Controller

**What's happening:** Security audit found Jenkins controller accessible to everyone.

**Key security measures:**
- Enable authentication (LDAP, SAML, etc.)
- Use Role-Based Access Control (RBAC)
- Disable CLI over remoting
- Enable CSRF protection
- Use HTTPS
- Restrict agent-to-controller access

**Natural follow-up directions:**

If candidate mentions RBAC → "How do you implement least-privilege access for 50 development teams?"
- Expected: Folder-based permissions, project-based matrix authorization, integrate with LDAP groups, audit regularly

---

## Scenario Pattern: Shared Libraries

### Incident: Duplicated Pipeline Code Across Projects

**What's happening:** 20 projects have similar Jenkinsfiles with copy-pasted code.

**Shared Library Structure:**
```
(root)
├── vars/
│   ├── buildNode.groovy      # Global variables (called as steps)
│   └── deployToK8s.groovy
├── src/
│   └── org/
│       └── mycompany/
│           └── Utils.groovy  # Classes
└── resources/
    └── scripts/
        └── deploy.sh         # Static resources
```

**Usage in Jenkinsfile:**
```groovy
@Library('my-shared-library') _

pipeline {
    agent any
    stages {
        stage('Build') {
            steps {
                buildNode(version: '18')
            }
        }
        stage('Deploy') {
            steps {
                deployToK8s(
                    cluster: 'prod',
                    namespace: 'myapp'
                )
            }
        }
    }
}
```

**Natural follow-up directions:**

If candidate explains shared libraries → "How do you version shared libraries? What if a change breaks existing pipelines?"
- Expected: Use tags/branches, `@Library('lib@v1.0.0')`, test changes before merging, semantic versioning, backward compatibility

If candidate mentions `vars/` → "What's the difference between `vars/` and `src/` directories?"
- Expected: `vars/` contains global variables (called as steps), `src/` contains classes (need to import). `vars/` is simpler for common use cases.

---

## Scenario Pattern: Agent Management

### Incident: Builds Slow Due to Agent Contention

**What's happening:** Jobs wait in queue because agents are busy.

**Solutions:**
- Add more agents
- Use cloud agents (EC2, Kubernetes)
- Optimize pipeline to use fewer executors
- Use agent labels to distribute load

**Natural follow-up directions:**

If candidate mentions "cloud agents" → "How do you set up auto-scaling Jenkins agents on Kubernetes?"
- Expected: Kubernetes plugin, pod templates, agents spin up on demand, terminate after job. Discuss cold start times.

If candidate mentions "labels" → "How do you design an agent labeling strategy for different workloads?"
- Expected: Labels for OS, capabilities (docker, gpu), environment (prod-deploy), size (large, small). Combine labels for specific needs.

### Incident: Agent Keeps Disconnecting

**What's happening:** Agent shows as offline intermittently, builds fail.

**Debugging:**
```bash
# On agent machine
tail -f /var/log/jenkins/jenkins.log
# Or check agent logs in Jenkins UI

# Check connectivity
curl -v http://jenkins-controller:8080/

# Check Java process
ps aux | grep jenkins
```

**Natural follow-up directions:**

If candidate checks logs → "Logs show 'Connection reset'. What could cause this?"
- Expected: Network issues, firewall, proxy timeout, agent JVM crash, controller overloaded. Check both sides.

---

## Migration: Freestyle to Pipeline

### Why Migrate?
- Pipeline as Code (version controlled)
- Better visualization
- Parallel execution
- Shared libraries
- Replay and restart capabilities

### Migration Pattern

**Freestyle job configuration → Jenkinsfile:**
```groovy
// Freestyle: "Execute shell" build step
// Pipeline equivalent:
pipeline {
    agent { label 'linux' }  // Freestyle: "Restrict where this project can be run"
    
    triggers {
        pollSCM('H/5 * * * *')  // Freestyle: "Poll SCM"
    }
    
    stages {
        stage('Build') {
            steps {
                sh 'make build'  // Freestyle: "Execute shell"
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'dist/**'  // Freestyle: "Archive artifacts"
            junit 'test-results/*.xml'  // Freestyle: "Publish JUnit test results"
        }
        failure {
            mail to: 'team@example.com',  // Freestyle: "E-mail notification"
                 subject: "Build failed: ${env.JOB_NAME}"
        }
    }
}
```

**Natural follow-up directions:**

If candidate discusses migration → "What's your strategy for migrating 100 freestyle jobs to pipelines?"
- Expected: Prioritize by importance, start with simple jobs, use Job DSL or JCasC for automation, test thoroughly, run in parallel during transition

---

## Handy Pipeline Patterns

### Parallel with Fail-Fast
```groovy
stage('Test') {
    failFast true
    parallel {
        stage('Unit') { steps { sh 'npm run test:unit' } }
        stage('E2E') { steps { sh 'npm run test:e2e' } }
    }
}
```

### Retry on Failure
```groovy
stage('Deploy') {
    steps {
        retry(3) {
            sh './deploy.sh'
        }
    }
}
```

### Timeout
```groovy
stage('Long Running') {
    options {
        timeout(time: 1, unit: 'HOURS')
    }
    steps {
        sh './long-process.sh'
    }
}
```

### Stash/Unstash (Pass Files Between Agents)
```groovy
stage('Build') {
    agent { label 'builder' }
    steps {
        sh 'npm run build'
        stash includes: 'dist/**', name: 'build-output'
    }
}
stage('Deploy') {
    agent { label 'deployer' }
    steps {
        unstash 'build-output'
        sh './deploy.sh'
    }
}
```

---

## Level-Specific Conversation Starters

### Entry Level
"Explain the difference between Declarative and Scripted pipelines. Which would you use for a new project?"
- Listen for: Understanding of syntax differences, recommendation for Declarative
- Follow up on: When might you need Scripted? How do you handle complex logic in Declarative?

### Senior Level
"Your team has 30 microservices with similar build processes. How do you reduce duplication and ensure consistency?"
- Listen for: Shared libraries, templating, standardization
- Follow up on: How do you handle services that need exceptions? How do you version the shared code?

### SRE Level
"Design a highly available Jenkins setup for a company with 500 developers and strict uptime requirements."
- Listen for: Controller HA, agent scaling, backup strategy, disaster recovery
- Follow up on: How do you handle controller upgrades? What's your plugin management strategy?

---

## Red Flags vs Green Flags

### Red Flags
- Still using Freestyle jobs for new projects
- Hardcodes credentials in Jenkinsfile
- Doesn't know about shared libraries
- "Just restart Jenkins" as first troubleshooting step
- No understanding of agent architecture

### Green Flags
- Uses Declarative pipelines with shared libraries
- Understands credential management and security
- Can troubleshoot pipeline failures systematically
- Knows about Jenkins Configuration as Code (JCasC)
- Considers high availability and disaster recovery
- Has migration experience (Freestyle → Pipeline, or Jenkins → other CI)
