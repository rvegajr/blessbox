---
description: "Break down BlessBox implementation plan into specific, actionable tasks"
---

You are working on the **BlessBox** project - a QR-based registration and verification system.

## Context
Read the project constitution in `memory/constitution.md` and current project context in `CLAUDE.md` before proceeding.

## Your Task
Break down an implementation plan into specific, actionable tasks following BlessBox's Test-Driven Development approach.

## Task Breakdown Principles
- **Interface First**: Start with interface definitions
- **Test-Driven**: Each task includes test creation
- **Real Implementations**: Use actual services, not mocks
- **Dependencies**: Clear task ordering and dependencies
- **Atomic Tasks**: Each task should be completable in 1-2 hours
- **Validation**: Each task has clear completion criteria

## Task Categories

### 1. Interface Design Tasks
- Define interface contracts
- Create TypeScript interface files
- Document interface methods and events

### 2. Test Infrastructure Tasks
- Set up CLI test harnesses
- Configure real local services (database, email, etc.)
- Create test data and fixtures

### 3. Implementation Tasks
- Implement interface contracts
- Create service implementations
- Build API endpoints

### 4. Database Tasks
- Design schema changes
- Create migration files
- Test database operations

### 5. Integration Tasks
- Wire up event-driven communication
- Connect UI components to services
- End-to-end testing

### 6. Security & Validation Tasks
- Implement authentication checks
- Add input validation
- Security testing

## Task Format
Each task should include:
- **Task ID**: Unique identifier (e.g., TASK-001)
- **Title**: Clear, actionable description
- **Category**: Interface, Test, Implementation, Database, Integration, Security
- **Dependencies**: Prerequisites that must be completed first
- **Acceptance Criteria**: Specific, testable requirements
- **Estimated Time**: 1-2 hours per task
- **Files Affected**: Specific files to create or modify
- **Testing**: How to verify task completion

## Example Task Structure
```
TASK-001: Create User Registration Interface
Category: Interface
Dependencies: None
Time: 1 hour
Files: src/interfaces/IUserRegistrationService.ts
Acceptance Criteria:
- Interface defines registerUser method
- Method accepts user data and returns registration result
- Includes error handling for validation failures
- Events defined for registration success/failure
Testing: Interface compiles without errors
```

## BlessBox-Specific Considerations
- **Mobile-First**: Ensure UI tasks consider mobile responsiveness
- **QR Code Integration**: Tasks involving QR generation use real libraries
- **Payment Processing**: Square sandbox integration for payment tasks
- **Email Verification**: Real SMTP or email service integration
- **Database**: Turso SQLite for production, local SQLite for development

Execute: `{SCRIPT}` $ARGUMENTS


