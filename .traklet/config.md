---
adapter: github
baseUrl: https://api.github.com
project: rvegajr/blessbox
tokenEnv: TRAKLET_PAT
---

# Traklet Configuration

This file configures how `npx traklet sync` discovers and syncs
test cases to the backend.

## Token

Set the `TRAKLET_PAT` environment variable with your GitHub
Personal Access Token that has `repo` write scope for `rvegajr/blessbox`.

The dev proxy at `/api/dev/traklet-proxy` uses this same token
to forward widget requests server-side (so the PAT never ships to browsers).

## Adding Test Cases

Create markdown files in `.traklet/test-cases/` with YAML frontmatter:

```yaml
---
id: TC-001
title: "What this test verifies"
priority: high
labels: [use-case, feature-area]
depends: [TC-002]  # optional prerequisites
suite: auth        # optional grouping
---
```

Use Traklet's structured sections for the body:

```markdown
{traklet:section:objective}
## Objective
What this test validates
{/traklet:section:objective}

{traklet:section:steps}
## Steps
1. First step
2. Second step
{/traklet:section:steps}

{traklet:section:expected}
## Expected
What should happen
{/traklet:section:expected}
```

Then run `npx traklet sync` to push them to GitHub Issues.
The `backend-id` will be written back to the frontmatter after first sync.
