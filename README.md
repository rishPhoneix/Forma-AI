# Forma AI

**AI-powered dynamic forms and intelligent workflows.**

Forma AI began as an AI-assisted dynamic form engine. Its core purpose remains schema-driven form creation, conditional questions, validation, natural-language extraction through Magic Input, and human review of AI-suggested values. The product direction expands this foundation into a cohesive SaaS workspace for form creation, data collection, analytics, AI assistance, and workflow automation.

## Product vision and architecture

Start with the [Master Project Blueprint](PROJECT.md). It defines the product vision, original concept, target application architecture, design direction, NOVA assistant, data model, security principles, and roadmap.

Detailed documentation:
- [Product and application architecture](docs/PRODUCT_ARCHITECTURE.md)
- [Design system: Light, Dark, and System](docs/DESIGN_SYSTEM.md)
- [NOVA assistant architecture](docs/AI_ASSISTANT.md)
- [Data model and workspace tenancy](docs/DATA_MODEL.md)
- [Security, privacy, and operations](docs/SECURITY_AND_OPERATIONS.md)
- [Roadmap and implementation status](docs/ROADMAP_AND_STATUS.md)
- [Project overview](docs/PROJECT_OVERVIEW.md)

## Current technology foundation

| Layer | Technologies |
|---|---|
| Frontend | React 19, Vite, React Router |
| Form management | React Hook Form |
| Client state | Zustand |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Validation | Zod |
| AI | Gemini currently powers NOVA; provider credentials remain server-side |
| Assistant rendering | React Markdown, remark-gfm |
| PDF generation | jsPDF, html2canvas |

Check the detailed documentation and current source code before assuming a planned module or technology is already implemented.

## Repository structure

```text
Forma-AI/
+-- Front-end/
|   +-- forma-ai/           React and Vite application
+-- backend/                Express API, models, routes and services
+-- docs/                   Product and technical documentation
+-- PROJECT.md              Master product blueprint
+-- README.md               Repository entry point
```

## Getting started

### Prerequisites
- Node.js and npm
- Access to the configured MongoDB database
- Credentials for the configured AI provider if using AI functionality

### 1. Clone the repository

```bash
git clone https://github.com/rishPhoneix/Forma-AI.git
cd Forma-AI
```

### 2. Configure and start the backend

```bash
cd backend
npm install
copy .env.example .env
```

For macOS/Linux, use `cp .env.example .env`.

Configure the required environment variables in `backend/.env` with your own credentials. Never commit or share this file.

Start the backend:

```bash
npm run dev
```

To seed form definitions, open another terminal inside `backend/`:

```bash
npm run seed
```

Inspect the seed script and database target before rerunning it against data you need to preserve.

### 3. Install and start the frontend

Open another terminal from the repository root:

```bash
cd Front-end/forma-ai
npm install
npm run dev
```

Vite displays the local development URL, usually `http://localhost:5173/`.

### 4. Build and lint

From `Front-end/forma-ai/`:

```bash
npm run build
npm run lint
```

## Development principles

- Keep the original dynamic form engine and human-review workflow central.
- Use real persisted data for metrics and activity.
- Keep AI and database credentials on the backend.
- Validate requests and model-generated schemas server-side.
- Require user review before publishing AI-generated forms.
- Enforce authorization for every private resource.
- Distinguish implemented features from planned product direction.
- Test end-to-end workflows before marking them complete.

## Contributing

1. Create a branch for your change.
2. Keep changes focused and avoid committing generated files or secrets.
3. Run relevant frontend build/lint checks and backend tests.
4. Review `git diff` before committing.
5. Use clear commit messages, for example:

```text
feat(frontend): add schema-driven form renderer
fix(api): validate form submission payload
docs: update product architecture
```

---

**Forma AI — AI-assisted forms with human review, evolving into an intelligent SaaS workspace.**
