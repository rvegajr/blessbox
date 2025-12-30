#!/usr/bin/env node

/**
 * BlessBox MCP Server
 *
 * Provides tools for automated bug-fix workflow:
 * - list-bugs: List open bug reports from GitHub Issues or local files
 * - get-bug: Get details of a specific bug with screenshots
 * - run-test: Execute Playwright test to reproduce bug
 * - mark-fixed: Close bug report after fix is applied
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readdir, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..', '..');
const BUGS_DIR = join(PROJECT_ROOT, 'bugs');

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'rvegajr/BlessBox';

const server = new Server(
  {
    name: 'blessbox-bugfix',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list-bugs',
        description: 'List all open bug reports from GitHub Issues (labeled "user-reported") or local bug files',
        inputSchema: {
          type: 'object',
          properties: {
            source: {
              type: 'string',
              enum: ['github', 'local', 'both'],
              description: 'Where to fetch bugs from',
              default: 'both',
            },
            status: {
              type: 'string',
              enum: ['open', 'closed', 'all'],
              description: 'Filter by status',
              default: 'open',
            },
          },
        },
      },
      {
        name: 'get-bug',
        description: 'Get full details of a specific bug report including screenshots and reproduction steps',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Bug ID (GitHub issue number or local bug ID like BUG-1234567890)',
            },
            source: {
              type: 'string',
              enum: ['github', 'local'],
              description: 'Where to fetch the bug from',
            },
          },
          required: ['id'],
        },
      },
      {
        name: 'run-test',
        description: 'Run a Playwright test to attempt reproducing the bug. Can run specific test file or search for related tests.',
        inputSchema: {
          type: 'object',
          properties: {
            testFile: {
              type: 'string',
              description: 'Specific test file to run (e.g., "user-reported-regressions.spec.ts")',
            },
            testName: {
              type: 'string',
              description: 'Specific test name pattern to match',
            },
            headed: {
              type: 'boolean',
              description: 'Run with visible browser',
              default: false,
            },
          },
        },
      },
      {
        name: 'create-regression-test',
        description: 'Create a new Playwright test case from a bug report to track the regression',
        inputSchema: {
          type: 'object',
          properties: {
            bugId: {
              type: 'string',
              description: 'Bug ID to create test for',
            },
            testName: {
              type: 'string',
              description: 'Name for the test case',
            },
            steps: {
              type: 'array',
              items: { type: 'string' },
              description: 'Steps to reproduce as Playwright commands',
            },
          },
          required: ['bugId', 'testName'],
        },
      },
      {
        name: 'mark-fixed',
        description: 'Mark a bug as fixed. Closes GitHub issue or updates local file.',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Bug ID to mark as fixed',
            },
            fixSummary: {
              type: 'string',
              description: 'Description of how the bug was fixed',
            },
            commitHash: {
              type: 'string',
              description: 'Git commit hash that contains the fix',
            },
          },
          required: ['id', 'fixSummary'],
        },
      },
      {
        name: 'analyze-bug',
        description: 'Analyze a bug report and suggest likely files/components to investigate',
        inputSchema: {
          type: 'object',
          properties: {
            bugId: {
              type: 'string',
              description: 'Bug ID to analyze',
            },
          },
          required: ['bugId'],
        },
      },
    ],
  };
});

// Tool implementations
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case 'list-bugs':
      return await listBugs(args);
    case 'get-bug':
      return await getBug(args);
    case 'run-test':
      return await runTest(args);
    case 'create-regression-test':
      return await createRegressionTest(args);
    case 'mark-fixed':
      return await markFixed(args);
    case 'analyze-bug':
      return await analyzeBug(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// === Tool Implementations ===

async function listBugs(args) {
  const source = args?.source || 'both';
  const status = args?.status || 'open';
  const bugs = [];

  // Fetch from GitHub
  if ((source === 'github' || source === 'both') && GITHUB_TOKEN) {
    try {
      const state = status === 'all' ? 'all' : status;
      const response = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/issues?labels=user-reported&state=${state}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github+json',
          },
        }
      );

      if (response.ok) {
        const issues = await response.json();
        for (const issue of issues) {
          bugs.push({
            id: `GH-${issue.number}`,
            source: 'github',
            title: issue.title,
            state: issue.state,
            createdAt: issue.created_at,
            url: issue.html_url,
            labels: issue.labels.map((l) => l.name),
          });
        }
      }
    } catch (error) {
      console.error('Error fetching GitHub issues:', error);
    }
  }

  // Fetch from local files
  if (source === 'local' || source === 'both') {
    try {
      const files = await readdir(BUGS_DIR);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const content = await readFile(join(BUGS_DIR, file), 'utf-8');
          const bug = JSON.parse(content);
          if (status === 'all' || bug.status === status) {
            bugs.push({
              id: bug.id,
              source: 'local',
              title: bug.description?.substring(0, 60) || 'No description',
              state: bug.status || 'open',
              createdAt: bug.createdAt,
              file: file,
            });
          }
        }
      }
    } catch (error) {
      // bugs directory might not exist or be empty
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ bugs, count: bugs.length }, null, 2),
      },
    ],
  };
}

async function getBug(args) {
  const { id, source } = args;

  // Determine source from ID format
  const isGitHub = id.startsWith('GH-') || source === 'github';
  const isLocal = id.startsWith('BUG-') || source === 'local';

  if (isGitHub) {
    const issueNumber = id.replace('GH-', '');
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub issue not found: ${id}`);
    }

    const issue = await response.json();
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              id: `GH-${issue.number}`,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              createdAt: issue.created_at,
              url: issue.html_url,
              labels: issue.labels.map((l) => l.name),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  if (isLocal) {
    const file = `${id}.json`;
    const content = await readFile(join(BUGS_DIR, file), 'utf-8');
    const bug = JSON.parse(content);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(bug, null, 2),
        },
      ],
    };
  }

  throw new Error(`Cannot determine source for bug ID: ${id}`);
}

async function runTest(args) {
  const { testFile, testName, headed } = args;

  let command = 'npx playwright test';

  if (testFile) {
    command += ` tests/e2e/${testFile}`;
  }

  if (testName) {
    command += ` -g "${testName}"`;
  }

  if (headed) {
    command += ' --headed';
  }

  command += ' --reporter=list';

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd: PROJECT_ROOT,
      timeout: 120000, // 2 minutes
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              command,
              output: stdout,
              errors: stderr,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
              command,
              error: error.message,
              stdout: error.stdout,
              stderr: error.stderr,
            },
            null,
            2
          ),
        },
      ],
    };
  }
}

async function createRegressionTest(args) {
  const { bugId, testName, steps } = args;

  // Generate test code
  const testCode = `
  test('REPRO: ${testName}', async ({ page }) => {
    // Auto-generated from bug report: ${bugId}
    // TODO: Implement reproduction steps
    ${steps?.map((s) => `// ${s}`).join('\n    ') || '// Add steps here'}

    test.fail(true, 'Known regression from ${bugId}');
  });
`;

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            bugId,
            testName,
            generatedCode: testCode,
            instruction:
              'Add this test to tests/e2e/user-reported-regressions.spec.ts',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function markFixed(args) {
  const { id, fixSummary, commitHash } = args;

  const isGitHub = id.startsWith('GH-');

  if (isGitHub && GITHUB_TOKEN) {
    const issueNumber = id.replace('GH-', '');

    // Add comment with fix summary
    await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: `## Fix Applied\n\n${fixSummary}\n\n${commitHash ? `Commit: ${commitHash}` : ''}\n\n---\n*Closed by BlessBox MCP Server*`,
        }),
      }
    );

    // Close issue
    await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues/${issueNumber}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state: 'closed',
          labels: ['bug', 'user-reported', 'fixed'],
        }),
      }
    );

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, id, action: 'closed' }, null, 2),
        },
      ],
    };
  }

  // Local bug
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            success: true,
            id,
            action: 'marked-fixed-locally',
            note: 'Update the local bug file status to "fixed"',
          },
          null,
          2
        ),
      },
    ],
  };
}

async function analyzeBug(args) {
  const { bugId } = args;

  // Get bug details first
  const bugResult = await getBug({ id: bugId });
  const bugData = JSON.parse(bugResult.content[0].text);

  // Simple keyword-based analysis
  const body = (bugData.body || bugData.description || '').toLowerCase();
  const suggestions = [];

  // Route-based suggestions
  if (body.includes('/dashboard')) {
    suggestions.push('app/dashboard/ - Dashboard pages');
  }
  if (body.includes('/register') || body.includes('registration')) {
    suggestions.push('app/register/ - Registration flow');
    suggestions.push('lib/services/RegistrationService.ts');
  }
  if (body.includes('/onboarding')) {
    suggestions.push('app/onboarding/ - Onboarding wizard');
    suggestions.push('lib/utils/onboarding-flow.ts');
  }
  if (body.includes('login') || body.includes('auth')) {
    suggestions.push('app/api/auth/ - Authentication routes');
    suggestions.push('lib/auth.ts');
  }
  if (body.includes('email')) {
    suggestions.push('lib/services/EmailService.ts');
    suggestions.push('lib/services/NotificationService.ts');
  }
  if (body.includes('qr code') || body.includes('qr-code')) {
    suggestions.push('lib/services/QRCodeService.ts');
  }
  if (body.includes('spinner') || body.includes('loading')) {
    suggestions.push('Check for early returns before loading state is cleared');
    suggestions.push('Check useEffect dependencies');
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(
          {
            bugId,
            analysis: {
              keywords: body.match(/\b(error|fail|crash|spin|stuck|blank|missing)\b/gi) || [],
              suggestedFiles: suggestions,
              relatedTests: [
                'tests/e2e/user-reported-regressions.spec.ts',
                'tests/e2e/qa-testing-guide-coverage.spec.ts',
              ],
            },
          },
          null,
          2
        ),
      },
    ],
  };
}

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('BlessBox MCP Server started');
}

main().catch(console.error);
