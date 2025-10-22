---
description: "Generate implementation plan from BlessBox feature specification"
---

You are working on the **BlessBox** project - a QR-based registration and verification system.

## Context
Read the project constitution in `memory/constitution.md` and current project context in `CLAUDE.md` before proceeding.

## Your Task
Generate a detailed implementation plan from an existing feature specification, following BlessBox's architecture principles.

## Process
1. **Review Specification**: Analyze the feature spec thoroughly
2. **Interface Design**: Detail interface implementations
3. **Database Schema**: Plan database changes (Turso SQLite)
4. **API Endpoints**: Design RESTful API endpoints
5. **Event Implementation**: Plan event-driven communication
6. **Testing Strategy**: Design CLI test harnesses
7. **Implementation Steps**: Create ordered task breakdown

## Technology Stack
- **Frontend**: Astro with TypeScript, Tailwind CSS v4
- **Database**: Turso SQLite (production), local SQLite (development)
- **Payment**: Square Payment API (sandbox for testing)
- **Email**: Gmail SMTP / SendGrid
- **Authentication**: JWT with passwordless email verification
- **Testing**: Playwright E2E tests, Vitest unit tests

## Key Requirements
- **Interface Segregation**: Every component behind interfaces
- **Real Implementations**: No mocks - use real local services
- **Event-Driven**: Components communicate via events
- **Mobile-First**: Responsive design for all devices
- **Security**: Proper authentication, validation, rate limiting

## Output Format
Create an implementation plan that includes:
- **Architecture Overview**: System design and component interaction
- **Interface Definitions**: Detailed interface contracts
- **Database Changes**: Schema modifications and migrations
- **API Design**: Endpoint specifications with request/response formats
- **Event Schema**: Event definitions and handlers
- **Implementation Tasks**: Ordered steps with dependencies
- **Testing Plan**: CLI test harness design with real services
- **Security Considerations**: Authentication, validation, protection measures

Execute: `{SCRIPT}` $ARGUMENTS


