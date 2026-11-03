# Forma AI — Master Product Blueprint

> **Product direction:** An AI-powered dynamic form and workflow platform that makes structured data collection easier to create, distribute, manage, and understand.

This document is the central product brief for Forma AI. It preserves the original idea—schema-driven dynamic forms, natural-language extraction through Magic Input, validation, and human review—while defining the long-term SaaS product direction.

## 1. Product vision

Forma AI helps individuals and organizations build dynamic forms, collect structured information, manage submissions, and turn collected data into useful insights. AI should reduce repetitive work without removing user control.

**Product principle:** AI proposes; users review and approve. Form definitions, extracted values, generated insights, and automated actions must be validated and permission-checked.

## 2. Original product idea — preserved

The original core remains central:

- JSON-schema-driven dynamic forms.
- Conditional questions and field validation.
- Natural-language extraction through **Magic Input**.
- Mapping extracted values to predefined form fields.
- Human review and correction before submission.
- Draft saving and resuming.

The SaaS expansion builds around this foundation; it does not replace it with a generic chatbot or dashboard.

## 3. Product pillars

1. **Form creation and management:** visual builder, schema-driven renderer, reusable templates, drafts, publishing, sharing, validation, and version history.
2. **Data collection:** public form links, responsive form experiences, submissions, upload handling, and configurable limits.
3. **Dashboard and analytics:** live workspace metrics, recent forms, recent submissions, trends, completion analysis, and actionable insights.
4. **Forma Assistant (NOVA):** workspace help, form assistance, schema generation, field and validation suggestions, and analysis of authorized submission data.
5. **Workflow and automation:** notifications, conditional actions, approvals, webhooks, and integrations.
6. **Account and workspace management:** profile, preferences, roles, teams, security, onboarding, usage, and eventually billing.

## 4. Product navigation — target

### Workspace
- Dashboard
- My Forms
- Create Form
- Saved Drafts
- Responses
- Analytics
- Activity History

### Intelligence
- Forma Assistant (NOVA)

### Account and administration
- Notifications
- Settings
- Workspace and Team
- Plans and Billing (future commercial module)
- Help and Documentation

Navigation should be permission-aware. A module should only appear when it is available to the current account or workspace.

## 5. Dashboard experience

The dashboard is a data-driven workspace overview, not a static collection of sample numbers.

Planned sections:
- Personalized welcome and workspace context.
- Dynamic form, submission, and active-form statistics.
- Quick actions for creating a form, using a template, or asking NOVA.
- Recent and frequently used forms.
- Recent submissions.
- Submission trends and form performance.
- AI Magic Input for describing a form.
- Notifications and recent activity.

Metrics must come from persisted application data. Response rate, abandonment, and completion-time metrics require explicit event instrumentation and must not be guessed from submission totals.

## 6. Form lifecycle

1. Create from scratch, template, or AI-assisted prompt.
2. Build or review the form schema.
3. Configure field types, validation, and conditional logic.
4. Preview and test.
5. Save as draft.
6. Publish and share.
7. Collect submissions.
8. Review, filter, export, and analyze responses.
9. Revise through a new form version while preserving appropriate historical records.

AI-generated schemas must be validated and shown to the user for review before saving or publishing.

## 7. Forma Assistant — NOVA

Keep the existing NOVA identity as the assistant within Forma AI.

Target capabilities:
- General workspace help.
- Form creation guidance.
- Structured form-schema generation.
- Field and validation suggestions.
- Form improvement recommendations.
- Context-aware assistance based on the current page and selected resource.
- Summaries and analysis of authorized submission data.
- Suggested actions and workflow guidance.

NOVA is available through the existing floating assistant and dedicated full-page workspace. Both interfaces should use the same server-persisted conversations. The backend must authorize every referenced form, workspace, and submission dataset before providing context to the model.

## 8. Visual identity and experience

Adopt the supplied visual references as design inspiration:
- **Dark mode:** premium, high-contrast charcoal surfaces, subtle borders, restrained glow, clear data hierarchy.
- **Light mode:** warm off-white/cream surfaces, spacious cards, restrained yellow/sage highlights, readable typography.
- Preserve Forma AI's existing teal, sage, and warm-brown brand character.
- Avoid copying reference-specific staking or HR widgets; use layouts and visual principles only.
- Use a consistent component library, spacing scale, typography, states, and responsive behavior across every module.

Theme options: Light, Dark, and System. Preference should persist across refreshes and, when signed in, across devices through the user's account preference.

## 9. Target technical architecture

Use a **modular monolith** initially:
- React + Vite frontend.
- Node.js + Express API.
- MongoDB Atlas + Mongoose.
- Server-side AI provider integration (Gemini currently used by NOVA).
- Shared domain services and authorization.
- External object storage, email, monitoring, and integrations when needed.

Keep domain boundaries clear so modules can evolve independently without prematurely introducing microservices.

### Frontend domains
- App shell and navigation
- Authentication and account
- Dashboard
- Forms and form rendering
- Responses and analytics
- Assistant and conversations
- Activity and notifications
- Settings and preferences
- Onboarding
- Workspace and team
- Automation and integrations
- Billing (future)

### Backend domains
- Authentication and users
- Workspaces and membership
- Forms and form versions
- Submissions and files
- Analytics
- Assistant and conversations
- Activity logs
- Notifications
- Onboarding progress
- Automation and webhooks
- Plans, usage, and billing (future)

## 10. SaaS tenancy direction

**Recommended target:** individual-first launch with a team-ready workspace model.

Plan for:
- Personal workspaces.
- Organization workspaces.
- Workspace membership and roles such as owner, admin, editor, and viewer.
- Workspace-scoped forms, submissions, activity, and settings.
- Authorization checks on every read and write.

This workspace model is a target architecture decision to validate before implementation. Existing user-owned records must be migrated carefully; do not assume the current database is already multi-tenant.

## 11. Data and domain concepts

Core entities:
- User
- Workspace
- WorkspaceMember
- Form
- FormVersion
- Submission
- Conversation
- Message
- ActivityLog
- Notification
- UserPreference
- OnboardingProgress

Future entities:
- Automation
- WebhookEndpoint
- IntegrationConnection
- Plan
- Subscription
- UsageRecord
- Invoice

See [docs/DATA_MODEL.md](docs/DATA_MODEL.md).

## 12. Security and trust principles

- Keep database credentials, JWT secrets, and AI API keys on the server.
- Authenticate users and authorize access at the workspace/resource level.
- Validate requests and AI-generated schemas server-side.
- Treat user input, uploaded files, extracted values, and model output as untrusted.
- Minimize sensitive data sent to AI providers.
- Apply rate limits and abuse controls to public forms and AI endpoints.
- Record important security and workspace events.
- Provide clear data retention, export, and deletion processes.
- Never publish or execute AI-generated actions without user approval and server-side validation.

See [docs/SECURITY_AND_OPERATIONS.md](docs/SECURITY_AND_OPERATIONS.md).

## 13. Implementation status

Status is intentionally separated into verified work, existing foundations, and planned work. A page, dependency, or design concept alone does not prove an end-to-end feature is complete.

### Implemented and locally verified in the development work
- React/Vite frontend and Express backend.
- MongoDB Atlas connection.
- Existing authentication and protected API foundation.
- Gemini-backed NOVA chat endpoint.
- Floating and full-page NOVA interfaces.
- Shared conversation history in both navigation directions.
- Conversation creation, search, rename, and deletion.
- Rename and deletion persistence after refresh.
- Markdown rendering in assistant responses.
- Blank and completed submission PDF generation.
- Route-level lazy loading.
- Dynamic jsPDF imports and reduced FormBuilder entry chunk.
- Successful frontend production build.

### Existing foundations requiring broader regression testing
- Form creation, editing, rendering, validation, submission, responses, activity history, and authentication flows.
- Existing dashboard and saved-form experiences.
- Existing extraction/Magic Input functionality.

### Planned — not yet implemented or not yet verified end-to-end
- Full SaaS dashboard redesign with live analytics.
- Unified Light/Dark/System theme provider and account synchronization.
- Context-aware NOVA.
- AI form-schema generation with review and approval.
- Submission-data analysis with workspace authorization.
- Dedicated Settings and Notifications modules.
- Interactive onboarding tours.
- Expanded form templates, versioning, conditional workflows, and analytics.
- Workspace/team membership and roles.
- Webhooks and integrations.
- Usage metering, plans, subscriptions, and billing.
- Production deployment, monitoring, backups, and security review.

See [docs/ROADMAP_AND_STATUS.md](docs/ROADMAP_AND_STATUS.md) for the phased plan and acceptance criteria.

## 14. Product quality principles

1. Real data over hard-coded dashboard metrics.
2. One shared design system across all pages.
3. One authorization model across all backend domains.
4. Human approval for AI-generated schemas and consequential actions.
5. Reusable components and domain services instead of disconnected features.
6. Responsive, accessible interfaces in both themes.
7. Clear loading, empty, error, and success states.
8. Test workflows end-to-end before marking them complete.
9. Add infrastructure only when a real requirement justifies it.
10. Preserve the original dynamic form engine as the product's core.

## 15. Documentation map

- [Project overview](docs/PROJECT_OVERVIEW.md)
- [Product architecture](docs/PRODUCT_ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [NOVA assistant architecture](docs/AI_ASSISTANT.md)
- [Data model](docs/DATA_MODEL.md)
- [Security and operations](docs/SECURITY_AND_OPERATIONS.md)
- [Roadmap and implementation status](docs/ROADMAP_AND_STATUS.md)

---

**Forma AI — AI-assisted forms with human review, evolving into an intelligent SaaS workspace.**
