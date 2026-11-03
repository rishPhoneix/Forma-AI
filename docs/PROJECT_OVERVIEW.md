# Forma AI — Project Overview

## Purpose

Forma AI is an AI-assisted dynamic form engine evolving into an intelligent SaaS workspace. It simplifies structured data collection through schema-driven forms, conditional questions, validation, natural-language extraction, and AI-assisted workflows while keeping users in control.

## Original problem

Traditional forms require users to interpret questions and enter information field by field. This can be repetitive, time-consuming, and error-prone.

## Original solution — preserved

- JSON-schema-driven dynamic forms.
- Conditional questions and field validation.
- Natural-language extraction through Magic Input.
- Mapping extracted values to predefined form fields.
- Human review and correction before submission.
- Draft saving and resuming.

## Expanded product direction

The longer-term SaaS product adds:
- A data-driven dashboard.
- Form and submission management.
- Analytics and reporting.
- Forma Assistant (NOVA).
- Context-aware AI form assistance and schema generation.
- Submission insights.
- Global Light, Dark, and System themes.
- Settings, notifications, and interactive onboarding.
- Workspace/team collaboration.
- Workflow automation and integrations.
- Usage metering and subscription management.

These are roadmap items unless specifically marked as implemented and verified in [the implementation status](ROADMAP_AND_STATUS.md).

## Technology foundation

- Frontend: React and Vite.
- Form management: React Hook Form.
- Client state: Zustand.
- Backend: Node.js and Express.
- Database: MongoDB Atlas and Mongoose.
- Validation: Zod.
- AI: Gemini currently powers the NOVA chat implementation; provider credentials remain on the server.

## High-level architecture

The React frontend communicates with the Express API. The backend authenticates and authorizes requests, validates input, coordinates form and AI workflows, and persists application data through MongoDB. AI-generated values and schemas are untrusted until validated and reviewed by the user.

The target architecture is a modular monolith with clear domains for users, workspaces, forms, submissions, analytics, assistant, activity, notifications, onboarding, and future automation/billing.

## Security principles

- Store credentials in backend environment variables.
- Validate requests and AI-generated output on the server.
- Enforce resource and future workspace-level authorization.
- Keep sensitive information out of source control and unnecessary logs.
- Minimize data sent to AI providers.
- Require human review for generated form schemas and consequential actions.

## Further documentation

- [Master product blueprint](../PROJECT.md)
- [Product architecture](PRODUCT_ARCHITECTURE.md)
- [Design system](DESIGN_SYSTEM.md)
- [NOVA assistant architecture](AI_ASSISTANT.md)
- [Data model](DATA_MODEL.md)
- [Security and operations](SECURITY_AND_OPERATIONS.md)
- [Roadmap and implementation status](ROADMAP_AND_STATUS.md)
