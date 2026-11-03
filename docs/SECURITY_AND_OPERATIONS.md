# Forma AI — Security, Privacy, and Operations

## 1. Security objectives

Protect account credentials, workspace data, form definitions, submissions, uploaded files, and AI conversation history. Security must be enforced by the backend; hiding a button in React is not authorization.

## 2. Authentication and sessions

- Hash passwords with a modern password hashing library.
- Use short-lived access tokens and a considered refresh/session strategy.
- Validate token signature, expiry, and relevant claims.
- Support logout and session revocation.
- Implement email verification and password reset before commercial launch.
- Consider multi-factor authentication for higher-trust plans.
- Avoid storing long-lived sensitive credentials in browser storage where a safer session design is feasible.

The current project has JWT and bcryptjs foundations. Review actual token storage, expiry, refresh, and revocation behaviour before calling authentication production-ready.

## 3. Authorization and tenant isolation

- Verify user identity on private endpoints.
- Verify workspace membership and role for every workspace resource.
- Verify resource ownership/association when accessing forms, submissions, conversations, files, and exports.
- Do not trust IDs or role claims supplied by the browser without server-side checks.
- Public form submission access must be limited to published forms and allowed actions.
- Test cross-user and cross-workspace access explicitly.

## 4. Input and output validation

- Validate request body, query parameters, and route parameters.
- Apply payload size limits.
- Validate form schemas and field configuration.
- Validate AI-generated structured output against strict allowlists.
- Sanitize or safely render user-supplied rich content.
- Treat uploaded files and extracted text as untrusted.
- Never execute model-generated code or scripts.

## 5. AI privacy and safety

- Keep provider API keys in backend environment variables.
- Send only the minimum context needed for the task.
- Check permissions before loading form or submission context.
- Avoid sending unnecessary personal or sensitive submission values to an AI provider.
- Disclose relevant AI processing and retention behaviour to users.
- Handle provider quota, timeout, and failure conditions.
- Validate generated form schemas and require human review before saving or publishing.
- Do not let model output directly trigger privileged actions.

## 6. API abuse controls

- Rate-limit login, registration, public submission, extraction, and AI endpoints.
- Add spam and abuse controls to public forms.
- Enforce file type, size, and count restrictions.
- Consider idempotency for submission and automation operations.
- Avoid exposing internal stack traces or secret values.
- Configure CORS for known production origins rather than leaving unrestricted production defaults.

## 7. Data protection

- Use HTTPS in production.
- Restrict database network access and credentials.
- Back up data and test restoration.
- Define retention and deletion policies.
- Support user data export and account deletion.
- Keep audit metadata minimal and avoid copying sensitive submission payloads into logs.
- Encrypt integration credentials and other secrets at rest.

## 8. Observability and reliability

Before production:
- Structured server logs.
- Error monitoring.
- Health checks.
- Database connection monitoring.
- AI provider latency and failure metrics.
- Rate-limit and abuse metrics.
- Backup verification.
- Deployment rollback procedure.
- Alerting for critical failures.

Never log API keys, passwords, JWTs, or full sensitive form submissions.

## 9. Environment and source control

- Keep `.env` out of Git.
- Maintain a safe `.env.example` containing names and placeholders only.
- Rotate exposed credentials.
- Separate development, staging, and production credentials.
- Review dependency vulnerabilities without blindly applying breaking force upgrades.
- Do not commit local dependency folders, build artifacts, or private user data.

## 10. Production readiness checklist

- [ ] Authentication/session review completed.
- [ ] Workspace authorization tests pass.
- [ ] Public form abuse protections enabled.
- [ ] AI context access checks pass.
- [ ] AI output validation passes.
- [ ] File upload restrictions pass.
- [ ] Production CORS and HTTPS configured.
- [ ] Secrets and environment variables reviewed.
- [ ] Backups and restore procedure tested.
- [ ] Monitoring and error reporting configured.
- [ ] Privacy, retention, export, and deletion policies documented.
- [ ] Deployment rollback tested.
