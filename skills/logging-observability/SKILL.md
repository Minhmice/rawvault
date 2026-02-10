---
name: logging-observability
description: Use for log fields, tracing, metrics. Assign to backend-a, backend-b, devops, data.
version: 1
triggers:
  keywords: ["log", "trace", "metric", "requestId", "correlation", "observability"]
  paths: []
checklist:
  - Structured logs; request/correlation id; no secrets/PII; consistent field names
anti_patterns:
  - Logging secrets; inconsistent field names; no correlation id across services
examples: "JSON log: timestamp, level, message, requestId. Propagate requestId in headers."
---

# Logging and Observability

Conventions for logs and tracing so operations can debug and monitor.

## Log fields

- Use structured logging (JSON or key-value). Include: timestamp, level, message, request/correlation id when available.
- Do not log secrets or PII in plain text; redact or omit.
- Consistent field names across services (e.g. `requestId`, `userId`, `errorCode`).

## Tracing and correlation

- Propagate trace/correlation id across services and async jobs; include in logs and error reports.
- Use one id per request or job so logs can be grouped.

## Metrics and events

- Emit metrics for critical operations (latency, errors, throughput) with consistent naming.
- Use events for business-significant actions (e.g. order_created) when needed for analytics or alerts.

## Search prompts

Use these (or similar) semantic search queries before adding or changing logging:

- Where is structured logging or request id used in this service?
- How are errors or exceptions logged with context?
- Where are metrics or events emitted for this flow?

## Output

When adding or changing logging: list **log/trace/metric changes**, **field names**, and **where they are emitted** so runbooks and dashboards can be updated.
