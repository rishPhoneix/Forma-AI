# Forma AI - Project Overview

## 1. Purpose

Forma AI is an AI-assisted dynamic form engine designed to simplify structured data collection through natural-language input.

## 2. Problem Statement

Traditional forms require users to manually interpret questions and enter information field by field. This can be repetitive, time-consuming, and error-prone.

Forma AI aims to reduce this effort by extracting relevant information from natural-language descriptions and mapping it to predefined form fields.

## 3. Proposed Solution

The application combines schema-driven form rendering, conditional logic, server-side validation, and AI-assisted data extraction.

Users remain in control: AI-generated values must be reviewed and can be corrected before submission.

## 4. Core Scope

- JSON-schema-driven dynamic forms
- Conditional questions and field validation
- Natural-language extraction through Magic Input
- Mapping extracted values to form fields
- Human review before submission
- Draft saving and resuming

## 5. Technology Stack

- Frontend: React and Vite
- Form management: React Hook Form
- Client state: Zustand
- Backend: Node.js and Express.js
- Database: MongoDB Atlas and Mongoose
- AI integration: LangChain.js and an LLM provider
- Validation: Zod

## 6. High-Level Architecture

The React frontend communicates with the Express API over HTTP. The backend validates requests, coordinates AI extraction, and manages persistence through MongoDB. The AI integration returns structured field values that users can review before submitting.

## 7. Security and Reliability

- Store credentials in environment variables.
- Validate requests on the server.
- Validate AI-generated output against the expected schema.
- Treat extracted values as untrusted until validated.
- Keep sensitive information out of source control.
- Test critical form and extraction workflows.

## 8. Current Status

The repository and initial documentation have been created. Application implementation, integration, testing, and deployment remain part of the development roadmap.
