# QA Assistant Access Instructions

## Adding Jam Dev Recordings to Issues

QA assistants can add Jam Dev recordings to issues in two ways:

### Method 1: Add as a Comment (Easiest - No special permissions needed)
1. Open the issue you're testing
2. Scroll to the comments section at the bottom
3. Click "Write" to add a comment
4. Paste your Jam Dev link:
   ```
   📹 Test Recording: https://jam.dev/c/your-recording-id
   
   **Status:** ✅ Pass / ❌ Fail
   **Notes:** Any additional observations
   ```
5. Click "Comment"

### Method 2: Edit the Issue Body (Requires Collaborator Access)
If you have write access to the repository:
1. Open the issue you're testing
2. Click the "..." menu next to "Subscribe" button
3. Select "Edit"
4. Scroll to the "## Evidence" section
5. Replace `_No recordings or screenshots attached yet._` with:
   ```
   📹 https://jam.dev/c/your-recording-id
   
   **Status:** ✅ Pass / ❌ Fail
   **Tested:** 2026-05-20
   ```
6. Click "Update comment"

## Getting Repository Access

To edit issue descriptions directly (Method 2), you need to be added as a repository collaborator.

**Repository Owner:** Contact @rvegajr with:
- Your GitHub username
- Request: "Write" or "Triage" access to add test evidence to issues

## Using Jam Dev

1. Install the [Jam browser extension](https://jam.dev)
2. When you encounter a bug:
   - Click the Jam extension icon
   - Click "Start recording"
   - Reproduce the bug
   - Click "Stop recording"
   - Copy the link and add it to the issue

## Issue Templates

When creating new bugs or test cases, use the templates:
- **Bug Report:** `.github/ISSUE_TEMPLATE/bug_report.yml` - has a Jam Recording field
- **Use Case:** `.github/ISSUE_TEMPLATE/use_case.yml` - has an Evidence section for Jam links
- **Task:** `.github/ISSUE_TEMPLATE/task.yml` - has a Bug Recording field

All templates include fields for Jam Dev links!
