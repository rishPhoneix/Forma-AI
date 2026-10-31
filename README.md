# Forma AI

**AI-Augmented Dynamic Form Engine**

Forma AI is an AI-assisted dynamic form engine designed to simplify structured data collection through natural-language input. It combines schema-driven form rendering, conditional questions, validation, and AI-assisted extraction while keeping users in control of reviewing and correcting extracted values.

## Project Overview

Traditional forms require users to interpret questions and enter information field by field. Forma AI aims to reduce this effort by extracting relevant information from natural-language descriptions and mapping it to predefined form fields.

The application follows a human-in-the-loop workflow: AI-generated values are suggestions that users should review and correct before submission.

## Core Features

- JSON-schema-driven dynamic forms
- Conditional questions and field validation
- Natural-language extraction through **Magic Input**
- Mapping extracted values to form fields
- Human review before submission
- Draft saving and resuming

These describe the intended project scope. Refer to the current application and API implementation to determine which workflows are fully implemented.

## Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React, Vite, React Router |
| Form Management | React Hook Form |
| Client State | Zustand |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| AI Integration | LangChain.js, configured LLM provider |
| Validation | Zod |

## Project Structure

```text
Forma-AI/
+-- Front-end/
|   +-- forma-ai/           React and Vite application
+-- backend/                Express API, models, routes and services
+-- docs/                   Project documentation
+-- README.md               Project overview and setup guide
```

## Getting Started

### Prerequisites

- Node.js and npm
- Access to the configured MongoDB database
- Credentials for the configured AI provider, if using AI extraction

### 1. Clone the Repository

```bash
git clone https://github.com/rishPhoneix/Forma-AI.git
cd Forma-AI
```

### 2. Configure and Start the Backend

```bash
cd backend
npm install
copy .env.example .env
```

For macOS/Linux, use:

```bash
cp .env.example .env
```

Configure the required environment variables in `backend/.env` using your own credentials.

**Never commit or share your `.env` file.**

Start the backend:

```bash
npm run dev
```

To seed form definitions, open another terminal inside `backend/`:

```bash
npm run seed
```

Inspect the seed script and database target before rerunning it against data you need to preserve.

### 3. Install and Start the Frontend

Open another terminal from the repository root:

```bash
cd Front-end/forma-ai
npm install
npm run dev
```

Vite will display the local development URL, usually:

```text
http://localhost:5173/
```

### 4. Frontend Build and Lint

From `Front-end/forma-ai/`:

```bash
npm run build
npm run lint
```

## High-Level Architecture

1. The React frontend requests form definitions and submits user input through the Express API.
2. The backend validates incoming requests and coordinates application workflows.
3. MongoDB stores application data and form definitions through Mongoose.
4. The AI integration is intended to extract structured values from natural-language descriptions.
5. Extracted values should be validated and presented for user review before submission.

The exact API endpoints and request/response contracts should be taken from the current backend route and controller implementation.

## Security and Reliability

- Keep database credentials, JWT secrets, and AI-provider API keys in backend environment variables.
- Never commit `.env` files, secrets, or local dependency folders.
- Validate incoming requests on the server.
- Validate AI-generated output against the expected form schema.
- Treat extracted values as untrusted until validated and reviewed.
- Do not expose internal stack traces or secret values to the browser.

## Development Status

The repository contains a React/Vite frontend and an Express backend. The frontend has been started locally and its dashboard route has been viewed in a browser.

The complete status of each feature, backend integration, automated testing, and deployment should be updated as those areas are verified. The presence of a page or dependency does not by itself mean its end-to-end workflow is complete.

## Documentation

See [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md) for the project purpose, problem statement, proposed solution, technology stack, architecture, and security principles.

## Contributing

1. Create a branch for your change.
2. Keep changes focused and avoid committing generated files or secrets.
3. Run the relevant frontend build/lint checks and backend checks.
4. Review `git diff` before committing.
5. Use clear commit messages, for example:

```bash
feat(frontend): add schema-driven form renderer
fix(api): validate form submission payload
docs: update project setup instructions
```

---

**Forma AI - AI-assisted forms with human review.**


