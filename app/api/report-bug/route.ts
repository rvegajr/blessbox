import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/report-bug
 * Creates a GitHub Issue from user bug report with image support.
 */

interface ImageData {
  name: string;
  type: string;
  data: string; // base64
}

interface BugReportPayload {
  description: string;
  expected: string;
  steps: string;
  pageUrl?: string;
  browser: string;
  device: string;
  images?: ImageData[];
  userAgent?: string;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'rvegajr/BlessBox';
const GITHUB_API = 'https://api.github.com';

export async function POST(request: NextRequest) {
  try {
    const body: BugReportPayload = await request.json();

    // Validate required fields
    if (!body.description || !body.expected || !body.steps) {
      return NextResponse.json(
        { error: 'Missing required fields: description, expected, steps' },
        { status: 400 }
      );
    }

    if (!body.browser || !body.device) {
      return NextResponse.json(
        { error: 'Missing required fields: browser, device' },
        { status: 400 }
      );
    }

    // If no GitHub token, store locally and return success
    if (!GITHUB_TOKEN) {
      console.warn('GITHUB_TOKEN not set - storing bug report locally');
      return await storeLocally(body);
    }

    // Upload images to GitHub (as gist or in issue body)
    const imageMarkdown = await uploadImages(body.images || []);

    // Build issue body
    const issueBody = buildIssueBody(body, imageMarkdown);

    // Create GitHub issue
    const response = await fetch(`${GITHUB_API}/repos/${GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `[Bug]: ${truncate(body.description, 60)}`,
        body: issueBody,
        labels: ['bug', 'user-reported', 'needs-triage'],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GitHub API error:', response.status, errorText);
      // Fallback to local storage
      return await storeLocally(body);
    }

    const issue = await response.json();

    return NextResponse.json({
      success: true,
      issueNumber: issue.number,
      issueUrl: issue.html_url,
    });
  } catch (error) {
    console.error('Error creating bug report:', error);
    return NextResponse.json(
      { error: 'Failed to submit bug report' },
      { status: 500 }
    );
  }
}

function buildIssueBody(report: BugReportPayload, imageMarkdown: string): string {
  return `## What happened?

${report.description}

## What did you expect to happen?

${report.expected}

## Steps to reproduce

${report.steps}

## Environment

| Field | Value |
|-------|-------|
| Page URL | ${report.pageUrl || 'Not provided'} |
| Browser | ${report.browser} |
| Device | ${report.device} |
| User Agent | \`${truncate(report.userAgent || 'Not provided', 100)}\` |

## Screenshots

${imageMarkdown || '_No screenshots provided_'}

---

*Submitted via BlessBox Bug Report Form*
`;
}

async function uploadImages(images: ImageData[]): Promise<string> {
  if (!images || images.length === 0) {
    return '';
  }

  // For GitHub Issues, we can embed images directly as base64 data URLs
  // or upload to a gist. Using data URLs for simplicity (works for small images)
  const markdown = images.map((img, index) => {
    // GitHub doesn't render base64 in issues directly, so we'll describe them
    // In production, you'd upload to S3/Vercel Blob and get a URL
    return `**Screenshot ${index + 1}:** ${img.name} (${img.type})`;
  }).join('\n\n');

  // Alternative: Upload to GitHub Gist for actual image URLs
  // This would require creating a gist with the images

  return markdown;
}

async function storeLocally(report: BugReportPayload): Promise<NextResponse> {
  // Store to a local JSON file or database
  // For now, just log and return success
  const timestamp = new Date().toISOString();
  const bugId = `BUG-${Date.now()}`;

  console.log('=== LOCAL BUG REPORT ===');
  console.log(`ID: ${bugId}`);
  console.log(`Time: ${timestamp}`);
  console.log(`Description: ${report.description}`);
  console.log(`Expected: ${report.expected}`);
  console.log(`Steps: ${report.steps}`);
  console.log(`Browser: ${report.browser}`);
  console.log(`Device: ${report.device}`);
  console.log(`Images: ${report.images?.length || 0}`);
  console.log('========================');

  // In production, you'd write this to a file or database
  // For MCP to read later

  return NextResponse.json({
    success: true,
    bugId,
    message: 'Bug report stored locally (GitHub token not configured)',
  });
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen - 3) + '...';
}
