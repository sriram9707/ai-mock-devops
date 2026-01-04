---
id: observability-sre-principles
tags: [auto-tagged]
---

# Observability & SRE Principles: Interviewer Reference

This document provides deep knowledge for conducting scenario-based interviews on observability, monitoring, and SRE practices. For SRE roles, focus heavily on SLIs, SLOs, SLAs, and error budgets.

---

## How to Use This Document

- **Entry/Senior DevOps:** Focus on monitoring tools, alerting, and basic troubleshooting.
- **SRE:** Focus heavily on SLIs/SLOs/SLAs, error budgets, incident management, and reliability engineering.

---

## The Three Pillars of Observability

### Metrics
**What they are:** Numeric measurements over time (counters, gauges, histograms).

**Key tools:** Prometheus, Grafana, Datadog, CloudWatch

**Example:**
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Latency (p99)
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

### Logs
**What they are:** Timestamped records of discrete events.

**Key tools:** ELK Stack (Elasticsearch, Logstash, Kibana), Loki, Splunk, CloudWatch Logs

**Best practices:**
- Structured logging (JSON)
- Correlation IDs for tracing requests
- Log levels (DEBUG, INFO, WARN, ERROR)
- Centralized aggregation

### Traces
**What they are:** End-to-end journey of a request through distributed systems.

**Key tools:** Jaeger, Zipkin, AWS X-Ray, OpenTelemetry

**Key concepts:**
- Span: Single operation
- Trace: Collection of spans forming a request path
- Context propagation: Passing trace IDs between services

---

## Scenario Pattern: Production Debugging

### Incident: High Latency in Production

**What's happening:** Users report slow response times. Need to identify the bottleneck.

**Debugging flow:**
1. Check metrics: Which service has high latency?
2. Check traces: Where in the request path is time spent?
3. Check logs: Any errors or warnings?
4. Correlate: Use trace ID to find related logs

**Natural follow-up directions:**

If candidate checks metrics → "Metrics show Service A has p99 latency of 5s. How do you drill down?"
- Expected: Check traces for Service A, look at downstream dependencies, check database queries, check external API calls

If candidate mentions traces → "Traces show 4s spent in database calls. What do you do?"
- Expected: Check query patterns, look for N+1 queries, check indexes, verify connection pool settings

### Incident: Intermittent Errors

**What's happening:** Error rate spikes randomly, then returns to normal.

**Debugging approach:**
1. Correlate error spikes with other events (deployments, traffic spikes)
2. Sample error logs during spike
3. Check if errors are from specific users/regions/services
4. Look for resource exhaustion (memory, connections, file descriptors)

**Natural follow-up directions:**

If candidate checks logs → "Logs show 'connection refused' to downstream service during spikes. What's happening?"
- Expected: Connection pool exhaustion, downstream service overloaded, circuit breaker tripping. Check downstream service health.

---

## SRE Fundamentals: SLIs, SLOs, SLAs

### Definitions

**SLI (Service Level Indicator):** A quantitative measure of service behavior.
- Examples: Request latency, error rate, availability, throughput

**SLO (Service Level Objective):** Target value for an SLI.
- Example: "99.9% of requests complete in under 200ms"

**SLA (Service Level Agreement):** Contract with consequences for missing SLO.
- Example: "If availability drops below 99.9%, customer gets service credits"

**Error Budget:** Amount of unreliability allowed.
- If SLO is 99.9%, error budget is 0.1% (43.8 minutes/month)

### Scenario: Defining SLOs

"You're launching a new payment service. How do you define SLOs?"

**Expected approach:**
1. Identify critical user journeys
2. Define SLIs for each journey (latency, success rate)
3. Set SLO based on user expectations and business needs
4. Start conservative, adjust based on data

**Example SLOs for payment service:**
- Availability: 99.99% of payment requests succeed
- Latency: 99% of payments complete in under 500ms
- Correctness: 100% of successful payments are recorded accurately

**Natural follow-up directions:**

If candidate defines SLOs → "How do you measure these SLIs? Where do you instrument?"
- Expected: Client-side measurement (more accurate for user experience), server-side for debugging, synthetic monitoring for baseline

If candidate mentions "99.99%" → "What's the error budget for 99.99%? How do you use it?"
- Expected: 4.38 minutes/month. Use for planned maintenance, risky deployments, feature velocity decisions.

### Scenario: Error Budget Exhaustion

"Your service has used 80% of its monthly error budget in the first week. What do you do?"

**Expected approach:**
1. Freeze risky changes (feature deployments)
2. Focus on reliability improvements
3. Investigate what consumed the budget
4. Communicate with stakeholders

**Natural follow-up directions:**

If candidate mentions "freeze deployments" → "Product team has a critical feature that must ship. How do you handle this?"
- Expected: Risk assessment, can we ship with feature flags? Is the feature itself a reliability improvement? Escalate to leadership if needed.

If candidate mentions "investigate" → "Investigation shows a single 30-minute outage consumed most of the budget. What do you do?"
- Expected: Blameless postmortem, identify root cause, implement preventive measures, consider if SLO is appropriate

---

## Scenario Pattern: Alerting

### Incident: Alert Fatigue

**What's happening:** Team receives 100+ alerts daily, most are noise. Real issues get missed.

**Expected approach:**
1. Audit existing alerts: Which are actionable?
2. Delete or tune non-actionable alerts
3. Implement alert hierarchy (page vs ticket vs log)
4. Use SLO-based alerting

**Natural follow-up directions:**

If candidate mentions "SLO-based alerting" → "Explain how you would alert on SLO burn rate."
- Expected: Alert when error budget is being consumed too fast. Example: "Alert if we'll exhaust monthly budget in 2 hours at current rate."

```promql
# Multi-window burn rate alert
(
  (1 - (sum(rate(http_requests_total{status!~"5.."}[1h])) / sum(rate(http_requests_total[1h])))) > (14.4 * 0.001)
  and
  (1 - (sum(rate(http_requests_total{status!~"5.."}[5m])) / sum(rate(http_requests_total[5m])))) > (14.4 * 0.001)
)
```

If candidate mentions "delete alerts" → "How do you decide which alerts to keep?"
- Expected: Does it require immediate human action? Does it indicate user impact? Can it be automated?

### Incident: Missing Critical Alert

**What's happening:** Major outage occurred but no one was paged.

**Investigation:**
1. Was there an alert configured?
2. Did the alert fire?
3. Did the notification reach on-call?
4. Was the alert acknowledged?

**Natural follow-up directions:**

If candidate checks alert config → "Alert was configured for >10% error rate, but actual was 8% (still bad). What's wrong?"
- Expected: Threshold too high, should use SLO-based alerting, consider rate of change not just absolute value

---

## Scenario Pattern: Incident Management

### Incident: Production Outage

**What's happening:** Service is down, users are affected.

**Expected incident response:**
1. **Detect:** Alert fires or user reports
2. **Triage:** Assess severity, assign incident commander
3. **Mitigate:** Restore service (rollback, failover, scale)
4. **Communicate:** Status page, stakeholder updates
5. **Resolve:** Fix root cause
6. **Learn:** Blameless postmortem

**Natural follow-up directions:**

If candidate mentions "rollback" → "You rolled back but the issue persists. What now?"
- Expected: The change wasn't the cause. Check other recent changes, infrastructure issues, external dependencies. Widen investigation.

If candidate mentions "postmortem" → "Walk me through your postmortem process."
- Expected: Blameless, timeline of events, root cause analysis (5 whys), action items with owners and deadlines, share learnings

### Scenario: Postmortem Action Items

"Your postmortem identified 10 action items. Six months later, only 2 are done. How do you fix this?"

**Expected approach:**
- Prioritize ruthlessly (which prevent recurrence?)
- Assign clear owners and deadlines
- Track in regular review meetings
- Consider: Are action items realistic? Too many?

**Follow-up:** "How do you balance postmortem action items with feature work?"
- Expected: Error budget policy, dedicated reliability sprints, SRE team capacity, leadership buy-in

---

## Monitoring Stack Deep-Dive

### Prometheus + Grafana

**Scenario: Prometheus Scaling Issues**
"Your Prometheus server is running out of memory with 1M active time series. How do you scale?"

**Expected approaches:**
- Reduce cardinality (fewer labels, drop unused metrics)
- Federation (multiple Prometheus servers)
- Remote storage (Thanos, Cortex, Mimir)
- Recording rules for expensive queries

**Follow-up:** "What causes high cardinality and why is it a problem?"
- Expected: Labels with many unique values (user IDs, request IDs). Each combination is a time series. Memory grows linearly.

### ELK Stack / Loki

**Scenario: Log Search is Slow**
"Searching logs takes minutes. How do you optimize?"

**Expected approaches:**
- Index optimization (Elasticsearch)
- Use labels effectively (Loki)
- Reduce log volume (sampling, log levels)
- Archive old logs to cold storage

**Follow-up:** "What's the difference between Elasticsearch and Loki architectures?"
- Expected: Elasticsearch indexes full text (powerful but expensive). Loki only indexes labels (cheaper, grep-like queries).

---

## Level-Specific Conversation Starters

### Entry/Senior DevOps
"Walk me through how you would set up monitoring for a new microservice."
- Listen for: Metrics, logs, health checks, dashboards, alerts
- Follow up on: What metrics are most important? How do you avoid alert fatigue?

### SRE
"Your service has an SLO of 99.9% availability. Last month you achieved 99.5%. Walk me through your analysis and response."
- Listen for: Error budget calculation, root cause analysis, stakeholder communication, improvement plan
- Follow up on: How do you prevent this from recurring? How do you communicate with product team?

"Design an SLO framework for a company with 50 microservices."
- Listen for: SLI selection, SLO setting process, measurement infrastructure, error budget policies
- Follow up on: How do you handle services with different criticality? How do you get buy-in?

---

## Red Flags vs Green Flags

### Red Flags
- "We alert on everything just to be safe"
- No understanding of SLIs/SLOs (for SRE role)
- Blames individuals in postmortems
- "We don't have time for postmortems"
- Only knows one monitoring tool

### Green Flags
- Understands the three pillars and when to use each
- Can explain SLIs, SLOs, SLAs, and error budgets (SRE)
- Advocates for blameless postmortems
- Thinks about alert actionability
- Considers user experience in monitoring design
- Mentions correlation between metrics, logs, and traces
