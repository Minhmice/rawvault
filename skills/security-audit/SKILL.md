---
name: security-audit
description: Use for authZ/authN, input validation, secrets, dependency review. Assign to security, backend-a when touching auth.
version: 1
triggers:
  keywords: ["auth", "authZ", "authN", "validation", "secrets", "dependency", "vulnerability"]
  paths: []
checklist:
  - Every protected endpoint checks permissions; validate/sanitize input; no secrets in code; run npm audit
anti_patterns:
  - Trusting client for role; raw concatenation in queries; secrets in logs or errors
examples: "Fail closed; parameterized queries; env for secrets; redact in logs."
---

# Security Audit

Quick review checklist for security-sensitive changes.

## AuthN / AuthZ

- Authentication: verify identity; use standard mechanisms (session, JWT, etc.); no custom crypto for auth.
- Authorization: every protected endpoint must check permissions; fail closed (deny by default).
- Do not trust client for role or scope; validate server-side.

## Input validation and injection

- All user input validated and sanitized; use parameterized queries for DB; avoid raw concatenation.
- Watch for SSRF (outbound URLs from user input), path traversal (user-controlled paths), XSS (escape output).

## Secrets and sensitive data

- No secrets in code or repo; use env vars or secret manager. Redact in logs.
- No sensitive data in error messages or client responses.

## Dependency hygiene

- Keep dependencies updated; check for known vulnerabilities (e.g. npm audit, dependabot).
- Flag high-risk findings; require fix or documented exception before ship.

## Search prompts

Use these (or similar) semantic search queries before a security review:

- Where is authentication or authorization checked for this endpoint?
- Where is user input validated or sanitized before use?
- Where are secrets or environment variables read or used?

## Output

Provide: **quick review result** (pass / fail with list of issues), **severity** (high/medium/low), and **required fixes** before gate pass.
