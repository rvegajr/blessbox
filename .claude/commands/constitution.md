---
description: "Review and update BlessBox project constitution and architectural principles"
---

You are working on the **BlessBox** project - a QR-based registration and verification system.

## Your Task
Review, validate, and potentially update the project constitution based on new requirements or architectural insights.

## Constitution Location
The project constitution is located at `memory/constitution.md` and contains:
- **Core Principles**: Interface Segregation, Event-Driven Architecture, TDD
- **Project Standards**: Real implementations, technology stack requirements
- **Security & Quality**: Authentication, data protection, performance standards
- **Domain Rules**: QR code management, registration system, subscription management
- **Governance**: Amendment process, quality gates

## Review Process
1. **Read Current Constitution**: Understand existing principles and rules
2. **Analyze Request**: Determine if changes align with project goals
3. **Impact Assessment**: Evaluate effects on existing architecture
4. **Propose Changes**: Suggest specific amendments if needed
5. **Validation**: Ensure changes maintain architectural integrity

## Key Principles (NON-NEGOTIABLE)
- **Interface Segregation Principle**: All business logic behind interfaces
- **Event-Driven Architecture**: Components communicate via events only
- **Test-Driven Development**: CLI test harnesses with real implementations
- **Simplicity First**: KISS and YAGNI principles
- **Real Implementations**: No mocks when real local services are feasible

## Amendment Considerations
- **Backward Compatibility**: Ensure existing interfaces remain valid
- **Migration Path**: Plan for transitioning existing code
- **Testing Impact**: Maintain comprehensive test coverage
- **Security Implications**: Preserve or enhance security standards
- **Performance Effects**: Consider impact on system performance

## Output Format
If amendments are needed:
- **Rationale**: Clear justification for changes
- **Specific Changes**: Exact text modifications
- **Migration Plan**: Steps to implement changes
- **Impact Analysis**: Effects on existing codebase
- **Version Update**: New constitution version number

If no changes needed:
- **Validation**: Confirm current constitution adequacy
- **Compliance Check**: Verify request aligns with existing principles
- **Recommendations**: Suggest implementation approach within current framework

Execute: `{SCRIPT}` $ARGUMENTS


