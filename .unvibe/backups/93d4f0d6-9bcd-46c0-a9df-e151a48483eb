# E2E Testing Guide

## Overview

This guide provides comprehensive documentation for the End-to-End (E2E) testing suite for the BlessBox application. The test suite covers all critical user journeys, features, and system integrations to ensure the application works correctly from a user's perspective.

## Test Coverage

### 1. Authentication and Security Tests
- **File**: `authentication.spec.ts`
- **Coverage**: User login, logout, session management, password security, two-factor authentication
- **Priority**: Critical
- **Test Count**: 15+ tests

### 2. Organization Onboarding Tests
- **File**: `organization-onboarding.spec.ts`
- **Coverage**: Organization registration, email verification, form builder setup, QR code configuration
- **Priority**: Critical
- **Test Count**: 20+ tests

### 3. QR Code Management Tests
- **File**: `qr-codes.spec.ts`
- **Coverage**: QR code creation, management, scanning, analytics, bulk operations
- **Priority**: High
- **Test Count**: 25+ tests

### 4. Form Builder Tests
- **File**: `form-builder.spec.ts`
- **Coverage**: Form creation, field management, validation, conditional logic, templates
- **Priority**: High
- **Test Count**: 30+ tests

### 5. Analytics and Reporting Tests
- **File**: `analytics.spec.ts`
- **Coverage**: Analytics dashboard, data visualization, reporting, exports, real-time updates
- **Priority**: Medium
- **Test Count**: 20+ tests

### 6. Settings and Administration Tests
- **File**: `settings.spec.ts`
- **Coverage**: User settings, organization management, billing, user management, API settings
- **Priority**: Medium
- **Test Count**: 25+ tests

### 7. Mobile Responsiveness Tests
- **File**: `mobile-responsiveness.spec.ts`
- **Coverage**: Mobile navigation, touch interactions, tablet compatibility, responsive design
- **Priority**: Medium
- **Test Count**: 15+ tests

### 8. Security and Compliance Tests
- **File**: `security.spec.ts`
- **Coverage**: Security features, authentication, authorization, data protection, input validation
- **Priority**: Critical
- **Test Count**: 20+ tests

### 9. Performance and Load Tests
- **File**: `performance.spec.ts`
- **Coverage**: Page load performance, API response times, memory usage, concurrent users
- **Priority**: Medium
- **Test Count**: 15+ tests

### 10. Integration Tests
- **File**: `integration.spec.ts`
- **Coverage**: Complete user journeys, system integration, end-to-end workflows
- **Priority**: High
- **Test Count**: 10+ tests

## Test Execution

### Prerequisites

1. **Application Running**: Ensure the BlessBox application is running on `http://localhost:7777`
2. **Database Seeded**: Run the database seeding script to populate test data
3. **Dependencies Installed**: All required dependencies are installed via `npm install`

### Running Tests

#### Run All Tests
```bash
npm run test:e2e
```

#### Run Specific Test Categories
```bash
# Authentication tests
npm run test:e2e -- --grep "Authentication"

# QR Code tests
npm run test:e2e -- --grep "QR Code"

# Form Builder tests
npm run test:e2e -- --grep "Form Builder"
```

#### Run Tests in Specific Browsers
```bash
# Chrome only
npm run test:e2e -- --project=chromium

# Firefox only
npm run test:e2e -- --project=firefox

# Safari only
npm run test:e2e -- --project=webkit
```

#### Run Tests in Headless Mode
```bash
npm run test:e2e -- --headed=false
```

#### Run Tests with Debug Mode
```bash
npm run test:e2e -- --debug
```

### Test Configuration

#### Browser Configuration
- **Chromium**: Default browser for most tests
- **Firefox**: Cross-browser compatibility testing
- **WebKit**: Safari compatibility testing

#### Viewport Sizes
- **Desktop**: 1920x1080
- **Tablet**: 768x1024
- **Mobile**: 375x667

#### Test Data
- **Test Users**: Pre-configured users with different roles
- **Test Organizations**: Sample organizations for testing
- **Test Forms**: Sample forms with various field types
- **Test QR Codes**: Sample QR code sets for testing

## Test Structure

### Test Organization
```
src/tests/e2e/
├── authentication.spec.ts          # Authentication and security
├── organization-onboarding.spec.ts # Organization setup
├── qr-codes.spec.ts               # QR code management
├── form-builder.spec.ts           # Form builder functionality
├── analytics.spec.ts              # Analytics and reporting
├── settings.spec.ts               # Settings and administration
├── mobile-responsiveness.spec.ts   # Mobile and tablet testing
├── security.spec.ts               # Security and compliance
├── performance.spec.ts             # Performance and load testing
├── integration.spec.ts            # Integration and end-to-end
└── run-all-tests.ts               # Test runner and configuration
```

### Test Patterns

#### Page Object Model
Each test file follows the Page Object Model pattern for better maintainability:

```typescript
// Example: Dashboard page object
class DashboardPage {
  constructor(private page: Page) {}
  
  async navigateToQRCodes() {
    await this.page.click('text=QR Codes')
  }
  
  async createQRCodeSet(name: string) {
    await this.page.click('text=Create QR Code Set')
    await this.page.fill('input[name="name"]', name)
    await this.page.click('text=Create QR Code Set')
  }
}
```

#### Test Data Management
Test data is managed through centralized configuration:

```typescript
export const testData = {
  users: {
    admin: { email: 'admin@example.com', password: 'AdminPassword123!' },
    user: { email: 'user@example.com', password: 'UserPassword123!' }
  },
  organizations: {
    testOrg: { name: 'Test Organization', slug: 'test-org' }
  }
}
```

#### Error Handling
Comprehensive error handling and recovery:

```typescript
test('Form submission with validation errors', async ({ page }) => {
  // Test form validation
  await page.click('text=Create Form')
  await expect(page.locator('text=Form name is required')).toBeVisible()
  
  // Test error recovery
  await page.fill('input[name="name"]', 'Valid Form Name')
  await page.click('text=Create Form')
  await expect(page.locator('text=Form created successfully')).toBeVisible()
})
```

## Test Scenarios

### Critical User Journeys

#### 1. Organization Onboarding
1. User visits registration page
2. Fills out personal information
3. Verifies email address
4. Sets up organization details
5. Creates initial form
6. Configures QR codes
7. Completes onboarding

#### 2. Event Registration Flow
1. Organization creates QR code set
2. Generates QR codes
3. User scans QR code
4. Fills out registration form
5. Submits registration
6. Receives check-in token
7. Checks in at event

#### 3. Analytics and Reporting
1. Organization views analytics dashboard
2. Analyzes registration trends
3. Reviews QR code performance
4. Exports data reports
5. Schedules automated reports

### Edge Cases and Error Scenarios

#### 1. Network Failures
- API timeouts
- Network disconnections
- Server errors
- Data synchronization issues

#### 2. User Input Validation
- Invalid email formats
- Weak passwords
- Required field validation
- Data type validation

#### 3. Security Scenarios
- Unauthorized access attempts
- Session timeout handling
- CSRF protection
- XSS prevention

## Performance Benchmarks

### Page Load Times
- **Dashboard**: < 3 seconds
- **Forms**: < 2 seconds
- **Analytics**: < 3 seconds
- **Settings**: < 2 seconds

### API Response Times
- **Authentication**: < 1 second
- **Data Retrieval**: < 1 second
- **Form Submission**: < 2 seconds
- **File Upload**: < 5 seconds

### Mobile Performance
- **Mobile Dashboard**: < 4 seconds
- **Touch Interactions**: < 500ms
- **Form Rendering**: < 2 seconds

## Security Testing

### Authentication Security
- Password strength requirements
- Account lockout after failed attempts
- Session timeout handling
- Two-factor authentication

### Data Protection
- Input sanitization
- XSS prevention
- SQL injection protection
- CSRF token validation

### Authorization Testing
- Role-based access control
- Permission validation
- Resource access restrictions
- API endpoint security

## Mobile Testing

### Responsive Design
- Mobile navigation
- Touch interactions
- Form usability
- Chart responsiveness

### Performance
- Mobile page load times
- Touch response times
- Memory usage
- Battery optimization

### Accessibility
- Screen reader compatibility
- Keyboard navigation
- Color contrast
- ARIA labels

## Continuous Integration

### Automated Testing
- Tests run on every commit
- Cross-browser testing
- Performance monitoring
- Security scanning

### Test Reporting
- HTML test reports
- Screenshot capture on failures
- Video recording of test runs
- Performance metrics

### Quality Gates
- Minimum test coverage: 90%
- Performance benchmarks must be met
- Security tests must pass
- All critical user journeys must pass

## Troubleshooting

### Common Issues

#### 1. Test Timeouts
- Increase timeout values
- Check for slow API responses
- Verify test data setup

#### 2. Element Not Found
- Wait for elements to load
- Use proper selectors
- Check for dynamic content

#### 3. Authentication Failures
- Verify test user credentials
- Check session management
- Clear browser data

#### 4. Mobile Test Failures
- Verify viewport settings
- Check touch interactions
- Test responsive design

### Debug Mode
Enable debug mode for detailed logging:

```bash
npm run test:e2e -- --debug
```

### Test Isolation
Ensure tests are properly isolated:

```typescript
test.beforeEach(async ({ page }) => {
  // Clear browser data
  await page.context().clearCookies()
  await page.context().clearPermissions()
})
```

## Best Practices

### Test Design
1. **Single Responsibility**: Each test should focus on one specific functionality
2. **Independence**: Tests should not depend on each other
3. **Deterministic**: Tests should produce consistent results
4. **Maintainable**: Use Page Object Model and centralized test data

### Test Data
1. **Isolation**: Use unique test data for each test
2. **Cleanup**: Clean up test data after each test
3. **Realistic**: Use realistic test data that mirrors production
4. **Comprehensive**: Cover edge cases and error scenarios

### Performance
1. **Optimization**: Minimize test execution time
2. **Parallelization**: Run tests in parallel when possible
3. **Resource Management**: Properly manage browser resources
4. **Monitoring**: Track test performance metrics

### Security
1. **Authentication**: Test all authentication scenarios
2. **Authorization**: Verify role-based access control
3. **Input Validation**: Test all input validation rules
4. **Data Protection**: Verify data encryption and privacy

## Conclusion

This E2E testing suite provides comprehensive coverage of the BlessBox application, ensuring that all critical user journeys, features, and system integrations work correctly. The tests are designed to be maintainable, reliable, and provide valuable feedback on application quality.

For questions or issues with the test suite, please refer to the troubleshooting section or contact the development team.


