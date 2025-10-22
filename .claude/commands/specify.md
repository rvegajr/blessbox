---
description: "Create a new feature specification using BlessBox spec-driven development process"
---

You are working on the **BlessBox** project - a QR-based registration and verification system.

## Context
Read the project constitution in `memory/constitution.md` and current project context in `CLAUDE.md` before proceeding.

## Your Task
Create a comprehensive feature specification following BlessBox's Interface Segregation Principle (ISP) and Event-Driven Architecture patterns.

## Process
1. **Understand Requirements**: Analyze the user's feature request
2. **Define Interfaces**: Identify required interfaces following ISP
3. **Event Design**: Define events for loose coupling
4. **Specification**: Create detailed spec with acceptance criteria
5. **Validation**: Ensure spec aligns with BlessBox architecture

## Key Considerations
- **Real Implementations**: Plan for real services (database, email, payments)
- **Mobile-First**: All features must work seamlessly on mobile
- **Security**: Consider authentication, validation, and data protection
- **Testing**: Plan for CLI test harnesses with real implementations
- **Simplicity**: Follow KISS and YAGNI principles

## Architecture Layers
```
UI Layer (Astro) → View Models → Business Logic → Data Access
```

## Output Format
Create a specification document that includes:
- **Feature Overview**: Clear description and business value
- **Interface Contracts**: Required interfaces with method signatures
- **Event Schema**: Events for component communication
- **Acceptance Criteria**: Testable requirements
- **Technical Considerations**: Database, API, security requirements
- **Testing Strategy**: CLI test approach with real implementations

Execute: `{SCRIPT}` $ARGUMENTS


