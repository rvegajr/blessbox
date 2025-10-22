# Implement Command

You are implementing the BlessBox enhancement plan using spec-driven development.

## Context
- **Project**: BlessBox QR-based registration system
- **Approach**: Enhance existing system with new high-performance services
- **Spec**: specs/004-enhance-existing-system/
- **Plan**: 8-day implementation timeline
- **Current Status**: New services working (21ms QR, 134ms validation, 538ms org creation)

## Implementation Instructions

When the user runs `/implement [task-description]`, you should:

1. **Reference the Enhancement Plan**: Use specs/004-enhance-existing-system/tasks.md
2. **Follow TDD Approach**: Implement CLI test harnesses first
3. **Preserve Existing Functionality**: Maintain backward compatibility
4. **Integrate New Services**: Use existing OrganizationService, QRCodeService, FormBuilderService
5. **Add Performance Monitoring**: Track response times and success rates
6. **Follow BlessBox Principles**: ISP, Event-driven architecture, Real implementations over mocks

## Current Enhancement Tasks Available

### Phase 1: Backend Integration (Days 1-3)
- **TASK-001**: Enhance Organization API (6h) - Priority: High
- **TASK-002**: Add Real-time Slug Validation (2h) - Priority: Medium  
- **TASK-003**: Enhance QR Code API (8h) - Priority: High
- **TASK-004**: Add Real-time Form Validation API (4h) - Priority: High

### Phase 2: UI Enhancement (Days 4-6)
- **TASK-005**: Enhance QR Manager with Real-time Features (10h) - Priority: High
- **TASK-006**: Enhance Form Builder with Real-time Validation (12h) - Priority: High
- **TASK-007**: Add Performance Monitoring Dashboard (6h) - Priority: Medium

### Phase 3: Testing & Optimization (Days 7-8)
- **TASK-008**: Comprehensive Integration Testing (8h) - Priority: High
- **TASK-009**: Final Optimization & User Testing (6h) - Priority: Medium

## Implementation Pattern

For each task:
1. **Create CLI Test Harness** first (TDD approach)
2. **Implement Enhancement** while preserving existing functionality
3. **Add Performance Monitoring** 
4. **Validate Quality Gates**
5. **Update Documentation**

## Files to Reference
- `specs/004-enhance-existing-system/spec.md` - Enhancement specification
- `specs/004-enhance-existing-system/plan.md` - Implementation plan  
- `specs/004-enhance-existing-system/tasks.md` - Detailed task breakdown
- `specs/003-onboarding-ui-system/duplication-analysis.md` - Existing functionality analysis

## Success Criteria
- Backward compatibility maintained
- Performance targets met (21ms QR, 134ms validation, 538ms org)
- Real-time features working smoothly
- CLI tests passing
- User experience enhanced without breaking existing workflows

Ready to implement the BlessBox enhancement plan using spec-driven development!