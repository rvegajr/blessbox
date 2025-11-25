# Contributing to BlessBox

Thank you for your interest in contributing to BlessBox! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Commit Message Guidelines](#commit-message-guidelines)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome constructive feedback
- Focus on what's best for the community
- Show empathy towards other contributors

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm or yarn
- Git
- Turso account (for database testing)
- Basic understanding of Next.js, TypeScript, and React

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/blessbox.git
   cd blessbox
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   ```bash
   cp env.template .env.local
   # Edit .env.local with your credentials
   ```

4. **Setup Database**
   ```bash
   npm run db:migrate
   npm run db:setup  # Optional: Load test data
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   # Open http://localhost:7777
   ```

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `development` - Integration branch for features
- `feature/*` - Feature branches
- `bugfix/*` - Bug fix branches
- `hotfix/*` - Critical production fixes

### Creating a Feature Branch

```bash
git checkout development
git pull origin development
git checkout -b feature/your-feature-name
```

### Working on Your Feature

1. Make your changes
2. Write tests
3. Ensure all tests pass
4. Commit your changes
5. Push to your fork
6. Create a Pull Request

## Coding Standards

### TypeScript

- **Strict Mode:** Always use TypeScript strict mode
- **Types:** Prefer interfaces over types for object shapes
- **Enums:** Use const enums when possible
- **Any:** Avoid using `any` - use `unknown` if type is truly unknown

```typescript
// Good
interface User {
  id: string;
  email: string;
  name: string;
}

// Avoid
type User = {
  id: any;
  email: any;
};
```

### React Components

- **Functional Components:** Use function components with hooks
- **Props:** Always type component props
- **State:** Use appropriate hooks (useState, useReducer)
- **Effects:** Clean up side effects properly

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ onClick, children, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={`btn-${variant}`}>
      {children}
    </button>
  );
}
```

### File Naming

- **Components:** PascalCase (e.g., `UserProfile.tsx`)
- **Utilities:** camelCase (e.g., `formatDate.ts`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `API_ENDPOINTS.ts`)
- **Types/Interfaces:** PascalCase (e.g., `UserTypes.ts`)

### Code Organization

```
component/
├── ComponentName.tsx           # Main component
├── ComponentName.interface.ts  # TypeScript interfaces
├── ComponentName.test.tsx      # Component tests
└── index.ts                    # Barrel export
```

### Styling

- **Tailwind CSS:** Use Tailwind utility classes
- **Custom CSS:** Only when absolutely necessary
- **Responsive:** Mobile-first approach
- **Dark Mode:** Support dark mode where applicable

```tsx
// Good
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800">
  <h1 className="text-2xl font-bold">Title</h1>
</div>

// Avoid inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <h1 style={{ fontSize: '24px' }}>Title</h1>
</div>
```

### API Routes

- **RESTful:** Follow REST conventions
- **Error Handling:** Always handle errors gracefully
- **Validation:** Validate all inputs
- **Types:** Type all request/response bodies

```typescript
// Good
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.email || !isValidEmail(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Process request
    const result = await processRequest(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Testing Requirements

### Unit Tests

All new code must include unit tests:

```typescript
import { describe, it, expect } from 'vitest';
import { formatDate } from './dateUtils';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });

  it('should handle invalid dates', () => {
    expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
  });
});
```

### E2E Tests

Critical user flows must have E2E tests:

```typescript
import { test, expect } from '@playwright/test';

test('user can register successfully', async ({ page }) => {
  await page.goto('/register/test-org/main');

  await page.fill('[name="fullName"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.click('button[type="submit"]');

  await expect(page.locator('.success-message')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
npm test

# E2E tests (local)
npm run test:e2e:local

# All tests
npm run test && npm run test:e2e:local
```

### Test Coverage

- **Minimum Coverage:** 70% overall
- **Critical Paths:** 90% coverage
- **New Features:** 80% coverage required

## Pull Request Process

### Before Submitting

1. ✅ All tests pass (`npm test && npm run build`)
2. ✅ Code follows style guidelines
3. ✅ Documentation is updated
4. ✅ Commit messages follow conventions
5. ✅ Branch is up to date with `development`

### PR Title Format

```
<type>(<scope>): <description>

Examples:
feat(dashboard): add export functionality
fix(auth): resolve login redirect issue
docs(readme): update installation instructions
test(api): add tests for payment endpoints
```

### PR Description Template

```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing performed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests pass locally

## Screenshots (if applicable)
Add screenshots here

## Additional Notes
Any additional context or notes
```

### Review Process

1. Automated checks run (tests, linting, build)
2. At least one approval required
3. All comments must be resolved
4. Branch must be up to date with base

## Commit Message Guidelines

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat:** New feature
- **fix:** Bug fix
- **docs:** Documentation changes
- **style:** Code style changes (formatting, etc.)
- **refactor:** Code refactoring
- **test:** Adding or updating tests
- **chore:** Maintenance tasks

### Examples

```bash
# Simple commit
git commit -m "feat(auth): add email verification"

# Detailed commit
git commit -m "feat(dashboard): add export functionality

- Add PDF export option
- Add CSV export option
- Add date range filter
- Update export button UI

Closes #123"
```

### Commit Best Practices

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Limit first line to 72 characters
- Reference issues and pull requests when relevant

## Security

### Reporting Security Issues

**Do NOT** create public issues for security vulnerabilities.

Instead:
1. Email security@blessbox.org
2. Include detailed description
3. Include steps to reproduce
4. Wait for response before disclosure

### Security Best Practices

- Never commit sensitive data
- Validate all user inputs
- Use parameterized queries
- Implement rate limiting
- Follow OWASP guidelines

## Getting Help

- **Questions:** Create a GitHub Discussion
- **Bugs:** Create a GitHub Issue
- **Features:** Create a GitHub Issue with [Feature Request] tag
- **Chat:** Join our Discord server (link in README)

## Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes
- Project website (with permission)

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to BlessBox!** 🎉

Every contribution, no matter how small, makes a difference.
