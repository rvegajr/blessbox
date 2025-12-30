# BlessBox Bug-Fix Workflow

Automated workflow for users to report bugs and agents to fix them.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  USER (non-technical)                                           │
│  ───────────────────                                            │
│  Goes to: blessbox.org/report-bug                               │
│  - Describes issue in plain text                                │
│  - Pastes/uploads screenshots (Ctrl+V)                          │
│  - Clicks "Submit"                                              │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  GitHub Issue (auto-created)                                    │
│  ──────────────────────────                                     │
│  Labels: bug, user-reported, needs-triage                       │
│  Contains: description, steps, screenshots, browser info        │
└─────────────────────────┬───────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│  MCP SERVER (Claude Code agent)                                 │
│  ────────────────────────────                                   │
│  Tools:                                                         │
│  - list-bugs     → See all open user-reported issues            │
│  - get-bug       → Get full details with screenshots            │
│  - analyze-bug   → Suggest files to investigate                 │
│  - run-test      → Reproduce via Playwright                     │
│  - mark-fixed    → Close issue after fix                        │
└─────────────────────────────────────────────────────────────────┘
```

## Setup

### 1. Environment Variables

Add to `.env.local`:

```bash
# Required for GitHub integration
GITHUB_TOKEN=ghp_your_personal_access_token
GITHUB_REPO=rvegajr/BlessBox
```

Create a GitHub Personal Access Token at: https://github.com/settings/tokens
- Required scopes: `repo` (full control of private repositories)

### 2. Install MCP Server Dependencies

```bash
cd mcp-server
npm install
```

### 3. Configure Claude Code

The MCP server is configured in `.claude/mcp.json`. Claude Code will automatically detect and use it.

## User Workflow

### Option A: In-App Form (Recommended for Non-Technical Users)

1. Go to `https://www.blessbox.org/report-bug`
2. Fill in:
   - **What happened?** - Describe the issue
   - **What did you expect?** - Expected behavior
   - **Steps to reproduce** - How to recreate the issue
   - **Screenshots** - Paste with Ctrl+V or upload
   - **Browser/Device** - Select from dropdown
3. Click **Submit Bug Report**
4. Receive confirmation with GitHub issue link

### Option B: GitHub Issue (For Technical Users)

1. Go to: https://github.com/rvegajr/BlessBox/issues/new/choose
2. Select "Bug Report" template
3. Fill in the structured form
4. Paste screenshots directly (GitHub supports drag & drop)
5. Submit

## Agent Workflow

### Step 1: List Open Bugs

Ask Claude Code:
> "List all open user-reported bugs"

The agent will use `list-bugs` tool to fetch:
- GitHub Issues labeled `user-reported`
- Local bug files in `/bugs/` directory

### Step 2: Analyze a Bug

Ask Claude Code:
> "Analyze bug GH-42 and suggest which files to look at"

The agent will:
- Fetch bug details with `get-bug`
- Use `analyze-bug` to suggest relevant files based on keywords
- Return a list of files/components to investigate

### Step 3: Reproduce the Bug

Ask Claude Code:
> "Run the regression tests to see if any fail"

```bash
# Or directly:
npm run test:e2e:regressions
```

### Step 4: Fix the Bug

After the agent identifies the issue:
1. Agent proposes a fix
2. You approve the changes
3. Agent applies the fix
4. Agent runs tests to verify

### Step 5: Mark as Fixed

Ask Claude Code:
> "Mark bug GH-42 as fixed with summary: Fixed infinite spinner by adding auth redirect"

The agent will:
- Add a comment to the GitHub issue with fix details
- Close the issue
- Add `fixed` label

## MCP Server Tools

| Tool | Description | Example |
|------|-------------|---------|
| `list-bugs` | List open bug reports | `{ "source": "github", "status": "open" }` |
| `get-bug` | Get bug details | `{ "id": "GH-42" }` |
| `analyze-bug` | Suggest files to investigate | `{ "bugId": "GH-42" }` |
| `run-test` | Run Playwright tests | `{ "testFile": "user-reported-regressions.spec.ts" }` |
| `create-regression-test` | Generate test from bug | `{ "bugId": "GH-42", "testName": "..." }` |
| `mark-fixed` | Close bug with summary | `{ "id": "GH-42", "fixSummary": "..." }` |

## File Structure

```
BlessBox/
├── .github/
│   └── ISSUE_TEMPLATE/
│       └── bug_report.yml      # Structured bug report form
├── .claude/
│   ├── mcp.json                # MCP server configuration
│   └── settings.local.json     # Claude Code permissions
├── app/
│   ├── report-bug/
│   │   └── page.tsx            # User-facing bug report form
│   └── api/
│       └── report-bug/
│           └── route.ts        # API to create GitHub issues
├── bugs/
│   └── .gitkeep                # Local bug storage (fallback)
├── mcp-server/
│   ├── package.json
│   └── src/
│       └── index.js            # MCP server implementation
└── tests/
    └── e2e/
        └── user-reported-regressions.spec.ts  # Regression tests
```

## Testing the Workflow

### Test Bug Report Page

```bash
npm run dev
# Open http://localhost:7777/report-bug
```

### Test MCP Server Locally

```bash
cd mcp-server
npm install
node src/index.js
```

### Test GitHub Integration

1. Set `GITHUB_TOKEN` in `.env.local`
2. Submit a bug report
3. Check GitHub Issues for new issue

## Troubleshooting

### Bug reports not appearing in GitHub

- Check `GITHUB_TOKEN` is set and has `repo` scope
- Check `GITHUB_REPO` is correct (format: `owner/repo`)
- Check browser console for API errors

### MCP server not connecting

- Ensure dependencies installed: `cd mcp-server && npm install`
- Check `.claude/mcp.json` exists
- Restart Claude Code

### Images not showing in GitHub issues

- GitHub Issues support pasted/uploaded images directly
- Base64 data URLs are not rendered in GitHub
- For full image support, consider Vercel Blob storage
