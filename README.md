# Forma AI

### AI-Powered Dynamic Form Engine

**Transform natural-language descriptions into structured form responses.**

Forma AI is a full-stack web application designed to simplify form completion through schema-driven interfaces and AI-assisted data extraction. Its core feature, **Magic Input**, interprets a user's natural-language description, extracts relevant information, and maps it to corresponding form fields—while keeping the user in control of reviewing and correcting every value before submission.

> **Project Status:** In Development

---

## Overview

Traditional forms require users to manually interpret questions and enter information field by field. Forma AI explores a more intuitive approach: users describe their information naturally, and an AI-assisted workflow converts that description into structured data.

The platform combines configurable form schemas, conditional question flows, validation, and AI-assisted extraction in a modular MERN-stack architecture.

### Key Objectives

- Reduce repetitive manual form entry.
- Support reusable, schema-driven form definitions.
- Convert unstructured text into structured field values.
- Maintain data quality through validation and human review.
- Provide a foundation for resumable drafts and extensible form workflows.

---

## Core Features

| Feature | Description |
|---|---|
| **Schema-Driven Forms** | Render dynamic forms from structured JSON schemas. |
| **Conditional Logic** | Show or hide questions according to previous responses. |
| **AI Magic Input** | Extract relevant information from natural-language descriptions and map it to form fields. |
| **Human-in-the-Loop Review** | Allow users to inspect and correct AI-generated values before submission. |
| **Form Validation** | Enforce field types, required values, and validation rules. |
| **Draft Management** | Support saving incomplete forms and resuming them later. |

*These are the intended capabilities; implementation and verification are ongoing.*

---

## How It Works

1. **Define** — A form is configured using a structured schema.
2. **Render** — The frontend generates the corresponding interactive form.
3. **Describe** — The user enters a natural-language description through Magic Input.
4. **Extract** — The backend processes the input through an AI-powered extraction pipeline.
5. **Review** — Extracted values are mapped to fields for user verification and correction.
6. **Validate & Submit** — The application validates the final data before processing the submission.

---

## Technology Stack

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | User interface and dynamic form rendering |
| Form Management | React Hook Form | Form state and field interactions |
| Client State | Zustand | Shared application state |
| Backend | Node.js + Express.js | API endpoints and application logic |
| Database | MongoDB Atlas + Mongoose | Persistent application data |
| AI Integration | LangChain.js + LLM provider | Natural-language processing and structured extraction |
| Validation | Zod | Schema and data validation |

---

## Architecture

```text
┌─────────────────────────────────────┐
│            React Frontend           │
│                                     │
│  Dynamic Forms · Magic Input        │
│  User Review · Validation UI        │
└──────────────────┬──────────────────┘
                   │ HTTP / JSON
                   ▼
┌─────────────────────────────────────┐
│          Express.js API             │
│                                     │
│  Request Validation                 │
│  Form & Submission Logic            │
│  AI Extraction Service              │
└───────────┬─────────────────┬───────┘
            │                 │
            ▼                 ▼
┌────────────────────┐  ┌──────────────────┐
│    MongoDB Atlas   │  │  LLM Integration  │
│                    │  │  via LangChain.js │
│ Forms, Drafts,     │  │                  │
│ Submissions        │  │ Structured Data  │
└────────────────────┘  └──────────────────┘
```

*Conceptual architecture; implementation details may evolve as development progresses.*

---

## Repository Structure

```text
Forma-AI/
├── frontend/          # React application
├── backend/           # Express API and AI services
├── docs/              # Architecture and project documentation
├── .gitignore
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- npm
- A MongoDB Atlas database or compatible MongoDB instance
- API credentials for the selected LLM provider

### Installation

Clone the repository:

```bash
git clone https://github.com/rishPhoneix/Forma-AI.git
cd Forma-AI
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Install backend dependencies:

```bash
cd ../backend
npm install
```

> **Note:** The application setup is still in progress. These commands assume that the respective `package.json` files and application code have been added. Environment variables, database configuration, and development scripts will be documented as the implementation is completed.

---

## Security & Data Handling

- Keep API keys, database credentials, and JWT secrets in environment variables.
- Never commit `.env` files or production credentials.
- Validate user input on the server before processing or persisting it.
- Treat AI-generated values as suggestions, not trusted input.
- Require appropriate validation before accepting form submissions.
- Avoid logging sensitive form contents or credentials.

---

## Development Roadmap

- [ ] Establish the React and Express application structure.
- [ ] Implement schema-driven form rendering.
- [ ] Add field validation and conditional question logic.
- [ ] Build the AI Magic Input extraction pipeline.
- [ ] Map extracted values to fields with user review.
- [ ] Implement draft persistence and resume functionality.
- [ ] Add automated tests for validation and extraction quality.
- [ ] Document deployment and production configuration.

---

## Engineering Principles

**Modularity** — Keep form rendering, API logic, AI processing, and persistence separated.

**Reliability** — Validate inputs and outputs instead of assuming generated data is correct.

**Human Oversight** — Make AI-assisted changes visible and editable before submission.

**Maintainability** — Prefer explicit schemas, predictable data contracts, and testable services.

**Security** — Keep secrets out of source control and validate requests at system boundaries.

---

## Project Information

- **Project:** Forma AI
- **Category:** Full-Stack Development · Applied AI · Developer Tools
- **Architecture:** MERN Stack
- **AI Integration:** LangChain.js and an LLM provider
- **Status:** In Development

---

*Forma AI is being developed as a practical exploration of AI-assisted data entry, schema-driven user interfaces, and reliable full-stack engineering.*
