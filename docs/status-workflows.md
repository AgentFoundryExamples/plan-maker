# Status & Clarification Workflows

This guide provides step-by-step instructions for tracking planner jobs, launching clarifications, checking status, and interpreting UI feedback in the Plan Maker application.

## Table of Contents

- [Overview](#overview)
- [Workflow 1: Creating and Tracking Plans](#workflow-1-creating-and-tracking-plans)
- [Workflow 2: Clarifying Specifications](#workflow-2-clarifying-specifications)
- [Workflow 3: Monitoring Clarification Status](#workflow-3-monitoring-clarification-status)
- [Understanding Status Indicators](#understanding-status-indicators)
- [Error Handling](#error-handling)
- [Data Persistence](#data-persistence)
- [Rate Limiting and Refresh Strategy](#rate-limiting-and-refresh-strategy)
- [Environment Configuration](#environment-configuration)
- [API Endpoints Reference](#api-endpoints-reference)
- [Limitations and Known Issues](#limitations-and-known-issues)

## Overview

Plan Maker provides two main workflows:
1. **Plan Management**: Create software development plans and track their status
2. **Specification Clarification**: Submit specifications for clarification and monitor the clarification jobs

Both workflows use asynchronous job processing, returning immediately with a job ID that you can use to poll for status and results.

## Workflow 1: Creating and Tracking Plans

### Step 1: Create a New Plan

1. Navigate to the **Plan Input** page (home page at `/`)
2. Enter your project description in the text area
3. Click **"Create Plan"** or **"Create Plan (Async)"**
   - **Create Plan**: Waits for synchronous response (may time out for long operations)
   - **Create Plan (Async)**: Returns immediately with a job ID for background processing (recommended)

**Expected Response:**
- Success: Job created with status `QUEUED`
- The job will transition through: `QUEUED` → `RUNNING` → `SUCCEEDED` or `FAILED`

### Step 2: View All Plans

1. Navigate to **Plans List** page via the top navigation bar or directly at `/plans`
2. You'll see a list of all your recent plans sorted by most recently updated

**What you'll see:**
- Job ID and timestamps (created, updated)
- Current status badge (see [Understanding Status Indicators](#understanding-status-indicators))
- Last updated time ("Just now", "2 minutes ago", etc.)
- Manual refresh button to update the list on demand

**Empty State:**
If you haven't created any plans yet, you'll see a message: _"No plans found. Create your first plan to get started!"_

### Step 3: View Plan Details

1. Click on any plan in the Plans List to view its details
2. Navigate to `/plans/{job_id}` to see:
   - Full job metadata (ID, status, timestamps)
   - Generated specifications (when status is `SUCCEEDED`)
   - Open questions that need clarification
   - Status timeline showing job history
   - Clarifier panel for launching clarification jobs

**Interpreting the Detail Page:**

- **QUEUED/RUNNING**: Job is still processing. You can manually refresh to check progress.
- **SUCCEEDED**: Job completed successfully. Specifications are displayed with any open questions highlighted.
- **FAILED**: Job failed. Error message and failure reason are displayed.

### Step 4: Manual Refresh

The application uses an **on-demand refresh strategy** to avoid rate limits and excessive server load.

**To refresh plan status:**
- On Plans List page: Click the **"Refresh"** button in the header
- On Plan Detail page: Click the **"Refresh"** button in the status section

**Automatic polling:**
- Plans List: Auto-refreshes every 60 seconds when the page is visible (pauses when tab is hidden)
- Plan Detail: No automatic polling - use manual refresh

⚠️ **Caution**: Avoid high-frequency manual refreshes (clicking refresh multiple times per second) to prevent hitting rate limits.

## Workflow 2: Clarifying Specifications

Once a plan has **SUCCEEDED** and contains open questions, you can submit it for clarification.

### Prerequisites

- Plan must be in `SUCCEEDED` status
- Plan must contain specifications with open questions
- You must answer all questions before submitting

### Step 1: Answer Questions

1. On the Plan Detail page (`/plans/{job_id}`), expand the specification sections
2. Find questions marked with ❓ icon
3. Type your answers in the text area below each question
4. All questions must be answered before submission

**Validation:**
- Unanswered questions are highlighted when you attempt to submit
- Error banner shows: _"Please answer all N remaining questions before submitting"_

### Step 2: Submit for Clarification

1. After answering all questions, scroll to the **Clarifier Panel**
2. Review your answers
3. Click **"Submit for Clarification"**

**Expected Response:**
- Success banner: _"Clarification job created successfully. Job ID: {job_id}"_
- The clarifier job ID is automatically stored in browser localStorage
- The job starts with status `PENDING`

### Step 3: Track Clarification Job

The clarifier job ID is displayed in the Clarifier Panel. You can:
- Click **"Check Status"** to manually refresh the status
- View the current status badge (PENDING → RUNNING → SUCCESS → FAILED)
- See timestamps for when the job was created and last updated

**If you navigate away:**
The clarifier job ID is persisted in localStorage and will be loaded automatically when you return to the same plan detail page.

## Workflow 3: Monitoring Clarification Status

### Manual Status Check

The application does **NOT** automatically poll for clarification status to avoid rate limits.

**To check clarification status:**
1. In the Clarifier Panel, click **"Check Status"**
2. The current status, timestamps, and result (if complete) are displayed
3. Repeat as needed until the job reaches `SUCCESS` or `FAILED` state

### Using Manual Job ID Entry

If you have a clarifier job ID from a previous session or external source:

1. In the Clarifier Panel, find the **"Or enter job ID manually"** section
2. Paste the job ID (UUID format)
3. Click **"Load Status"**
4. The job status will be loaded and the ID will be saved for this plan

### Debug Information (Optional)

If the backend has debug mode enabled (via `APP_ENABLE_DEBUG_ENDPOINT=true`), you can view additional job metadata:

1. After checking clarification status, click **"View Debug Info"**
2. Debug panel shows:
   - Configuration used for the job
   - Detailed timestamps
   - Additional metadata (excludes sensitive data like raw prompts)

**If debug is disabled:**
- The "View Debug Info" button will show an error: _"Debug endpoint is disabled (403)"_
- This is normal and expected in production environments

## Understanding Status Indicators

### Plan Job Status

| Status      | Badge Color | Meaning                                      |
|-------------|-------------|----------------------------------------------|
| `QUEUED`    | Blue        | Job is waiting to be processed               |
| `RUNNING`   | Yellow      | Job is currently being processed             |
| `SUCCEEDED` | Green       | Job completed successfully                   |
| `FAILED`    | Red         | Job failed with an error                     |

### Clarification Job Status

**Note:** Clarification jobs use different status terminology than plan jobs. Initial state is `PENDING` (not `QUEUED`), and success state is `SUCCESS` (not `SUCCEEDED`).

| Status      | Badge Color | Meaning                                      |
|-------------|-------------|----------------------------------------------|
| `PENDING`   | Blue        | Job is waiting to be processed               |
| `RUNNING`   | Yellow      | Job is currently being processed by LLM      |
| `SUCCESS`   | Green       | Clarification completed successfully         |
| `FAILED`    | Red         | Clarification failed with an error           |

### Progress Indicators

- **Timeline**: Visual representation of job history on Plan Detail page
- **Last Updated**: Human-readable timestamp ("Just now", "2 minutes ago")
- **Timestamps**: Full ISO 8601 timestamps for created_at and updated_at

## Error Handling

The application gracefully handles various error scenarios:

### 403 Forbidden - Debug Endpoint Disabled

**When it occurs:** Attempting to view debug information when backend has `APP_ENABLE_DEBUG_ENDPOINT=false`

**What you'll see:**
- Error message: _"Debug endpoint is disabled (403)"_
- Banner with info type explaining that debug endpoint is not available

**What to do:**
- This is expected in production environments
- No action needed - debug information is optional
- Contact your administrator if you need debug access

### 404 Not Found - Job ID Not Found

**When it occurs:**
- Job ID doesn't exist in the backend database
- Job has expired or been deleted
- Invalid job ID format

**What you'll see:**
- Error message: _"Job not found (404)"_
- Banner with error type

**What to do:**
- Verify you're using the correct job ID
- Check if the job might have expired
- Create a new job if the old one is no longer available

### 422 Unprocessable Entity - Invalid UUID Format

**When it occurs:** Providing a job ID that isn't a valid UUID format

**What you'll see:**
- Error message: _"Invalid job ID format (422)"_
- Validation error details

**What to do:**
- Verify the job ID is a valid UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- Check for typos or extra characters
- Use the job ID exactly as it was returned from the API

### Network Errors

**When it occurs:** Backend is unreachable, network timeout, or connection issues

**What you'll see:**
- Error banner with technical error message
- Retry suggestions

**What to do:**
- Check your internet connection
- Verify the backend services are running
- Check environment variables for correct API URLs
- Wait a moment and try refreshing again

### Validation Errors

**When it occurs:** Attempting to submit incomplete or invalid data

**What you'll see:**
- Error banner highlighting specific validation issues
- Red highlights on problematic fields
- Count of unanswered questions

**What to do:**
- Review all highlighted fields
- Complete all required answers
- Ensure all input meets format requirements
- Try submitting again after fixes

## Data Persistence

### localStorage for Clarifier Job IDs

The application stores clarifier job IDs in browser localStorage to maintain continuity across page navigations and sessions.

**Storage Schema:**
```javascript
Key: `plan-maker_clarifier_{planId}`
Value: { 
  jobId: "550e8400-...",
  timestamp: 1704067200000 
}
```

**Expiration:**
- Clarifier job IDs expire after **7 days**
- Expired entries are automatically removed when accessed

**Privacy Implications:**
- Data is stored only in your browser (not sent to any third-party servers)
- Clearing browser data will remove stored job IDs
- Private/Incognito browsing mode may limit or disable localStorage

**In Private Browsing Mode:**
- The application automatically falls back to in-memory storage
- Job IDs are available during the current browser session only
- All data is lost when the browser tab/window is closed

**Manual Cleanup:**
To clear stored clarifier job IDs:
1. Open browser Developer Tools (F12)
2. Go to Application/Storage → Local Storage
3. Find keys starting with `plan-maker_clarifier_`
4. Delete individual entries or clear all localStorage

### What is NOT Stored

The application does **NOT** store:
- Plan specifications or generated content
- User answers to questions
- API keys or authentication tokens
- Backend responses (except job IDs)
- Debug information or logs

## Rate Limiting and Refresh Strategy

### On-Demand Refresh Philosophy

Plan Maker uses a **manual, on-demand refresh strategy** rather than aggressive automatic polling to:
- Avoid overwhelming backend services
- Respect API rate limits
- Reduce unnecessary network traffic
- Improve application performance

### Refresh Intervals

| Page         | Automatic Polling | Manual Refresh | Recommendation                          |
|--------------|-------------------|----------------|-----------------------------------------|
| Plans List   | 60 seconds        | Available      | Auto-refresh is for passive monitoring; use manual refresh when actively tracking a specific job |
| Plan Detail  | None              | Available      | Check every 5-10 seconds for active jobs |
| Clarifier    | None              | Available      | Check every 10-30 seconds for LLM jobs |

**Clarification on Auto-Refresh:**
The 60-second auto-refresh on Plans List is designed for passive monitoring when you have the page open but aren't actively watching a specific job. When you're actively monitoring a running job, use the manual refresh button and refresh every 5-10 seconds for more timely updates. The auto-refresh continues in the background, so you'll see updates eventually even if you don't manually refresh.

### Best Practices

✅ **DO:**
- Use manual refresh when you're actively monitoring a job
- Wait 5-10 seconds between refreshes for running jobs
- Rely on automatic polling on Plans List page when appropriate
- Close tabs/navigate away if you're not actively monitoring

❌ **DON'T:**
- Click refresh continuously (multiple times per second)
- Set up custom polling intervals faster than recommended
- Keep multiple tabs polling the same endpoint simultaneously
- Refresh completed jobs repeatedly (status won't change)

### Rate Limit Errors

If you encounter rate limit errors (HTTP 429):
- **Wait**: Rate limits typically reset after 1-5 minutes
- **Reduce frequency**: Increase time between manual refreshes
- **Contact admin**: If limits are too restrictive for your use case

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Software Planner Service Base URL
VITE_SOFTWARE_PLANNER_BASE_URL=http://localhost:8080

# Spec Clarifier Service Base URL  
VITE_SPEC_CLARIFIER_BASE_URL=http://localhost:8081
```

**Important:**
- These variables are **required** and validated at runtime
- Missing or empty values will cause the application to fail before making network calls
- Use full URLs including protocol (http:// or https://)
- Do not include trailing slashes

### Backend Environment Variables

For backend debug functionality, the Spec Clarifier service should set:

```bash
# Enable debug endpoint (optional, default: false)
APP_ENABLE_DEBUG_ENDPOINT=true
```

**Effect:**
- When `true`: `GET /v1/clarifications/{job_id}/debug` endpoint is available
- When `false` or unset: Debug endpoint returns 403 Forbidden

**Security Note:**
Debug endpoint should be **disabled in production** as it may expose metadata about job processing.

### Verification

To verify your environment configuration:

1. Start the frontend application:
   ```bash
   npm run dev
   ```

2. Check the browser console for environment validation messages
3. Try creating a plan - successful API calls confirm correct configuration

## API Endpoints Reference

### Software Planner API

Base URL: Configured via `VITE_SOFTWARE_PLANNER_BASE_URL`

| Endpoint                      | Method | Purpose                                    |
|-------------------------------|--------|--------------------------------------------|
| `/api/v1/models`              | GET    | List available LLM models                  |
| `/api/v1/plan`                | POST   | Create plan synchronously (blocking)       |
| `/api/v1/plans`               | POST   | Create plan asynchronously (recommended)   |
| `/api/v1/plans`               | GET    | List all plans (sorted by most recent)     |
| `/api/v1/plans/{job_id}`      | GET    | Get specific plan status and results       |

**Request/Response Examples:**

**Create Async Plan (POST /api/v1/plans):**
```json
// Request
{
  "description": "Build a REST API for user management"
}

// Response (202 Accepted)
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:00:00Z"
}
```

**List Plans (GET /api/v1/plans):**
```json
// Request: GET /api/v1/plans?limit=50

// Response (200 OK)
{
  "jobs": [
    {
      "job_id": "550e8400-...",
      "status": "SUCCEEDED",
      "created_at": "2025-01-01T12:00:00Z",
      "updated_at": "2025-01-01T12:05:00Z",
      "result": { /* plan data */ }
    }
  ]
}
```

**Get Plan Details (GET /api/v1/plans/{job_id}):**
```json
// Response (200 OK)
{
  "job_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCEEDED",
  "created_at": "2025-01-01T12:00:00Z",
  "updated_at": "2025-01-01T12:05:00Z",
  "result": {
    "specs": [
      {
        "id": 1,
        "title": "User Authentication",
        "description": "Implement JWT-based authentication",
        "open_questions": [
          "Should we support OAuth providers?"
        ]
      }
    ]
  }
}
```

### Spec Clarifier API

Base URL: Configured via `VITE_SPEC_CLARIFIER_BASE_URL`

| Endpoint                                | Method | Purpose                                      |
|-----------------------------------------|--------|----------------------------------------------|
| `/v1/clarifications`                    | POST   | Create clarification job (async)             |
| `/v1/clarifications/{job_id}`           | GET    | Get clarification status and results         |
| `/v1/clarifications/{job_id}/debug`     | GET    | Get debug info (if APP_ENABLE_DEBUG_ENDPOINT=true) |
| `/v1/clarifications/preview`            | POST   | Preview clarification synchronously (dev only) |

**Request/Response Examples:**

**Create Clarification Job (POST /v1/clarifications):**
```json
// Request
{
  "plan": {
    "specs": [
      {
        "id": 1,
        "title": "User Authentication",
        "open_questions": ["Should we support OAuth?"]
      }
    ]
  },
  "answers": [
    {
      "spec_id": 1,
      "question": "Should we support OAuth?",
      "answer": "Yes, support Google and GitHub OAuth"
    }
  ]
}

// Response (202 Accepted)
{
  "id": "650f9512-f3ab-42e5-b827-557766550111",
  "status": "PENDING",
  "created_at": "2025-01-01T12:10:00Z",
  "updated_at": "2025-01-01T12:10:00Z"
}
```

**Get Clarification Status (GET /v1/clarifications/{job_id}):**
```json
// Response (200 OK) - In Progress
{
  "id": "650f9512-...",
  "status": "RUNNING",
  "created_at": "2025-01-01T12:10:00Z",
  "updated_at": "2025-01-01T12:10:30Z"
}

// Response (200 OK) - Complete
{
  "id": "650f9512-...",
  "status": "SUCCESS",
  "created_at": "2025-01-01T12:10:00Z",
  "updated_at": "2025-01-01T12:11:00Z",
  "result": {
    "clarified_specs": [
      {
        "id": 1,
        "title": "User Authentication",
        "requirements": [
          "Implement JWT-based authentication",
          "Support Google and GitHub OAuth providers"
        ],
        "open_questions": []
      }
    ]
  }
}
```

**Get Debug Info (GET /v1/clarifications/{job_id}/debug):**
```json
// Response (200 OK) - When debug is enabled
{
  "job_id": "650f9512-...",
  "config": {
    "provider": "openai",
    "model": "gpt-4",
    "temperature": 0.7
  },
  "timestamps": {
    "created_at": "2025-01-01T12:10:00Z",
    "started_at": "2025-01-01T12:10:05Z",
    "completed_at": "2025-01-01T12:11:00Z"
  }
}

// Response (403 Forbidden) - When debug is disabled
{
  "detail": "Debug endpoint is disabled"
}
```

### Error Responses

All endpoints may return standard HTTP error responses:

**404 Not Found:**
```json
{
  "detail": "Job not found"
}
```

**422 Unprocessable Entity:**
```json
{
  "detail": [
    {
      "loc": ["body", "job_id"],
      "msg": "Invalid UUID format",
      "type": "type_error.uuid"
    }
  ]
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Internal server error"
}
```

**When it occurs:** Server-side error during request processing (database issues, LLM API failures, etc.)

**What you'll see:**
- Generic error message in banner
- Request fails without specific details

**What to do:**
- Wait a few minutes and try again (may be temporary)
- Check if backend services are operational
- Review backend logs if you have access
- Contact your administrator if error persists
- For plan/clarification jobs: The error typically means the job failed to start; check Plans List or manually query the job ID later to see if it eventually processed

## Limitations and Known Issues

### Missing Endpoints

The following operations are **NOT available** in the current OpenAPI specifications:

❌ **Plan Deletion**: No endpoint exists to delete plans
- Plans persist indefinitely in the backend database
- UI intentionally omits delete actions
- Contact your administrator if you need to remove plans

❌ **Plan Duplication**: No endpoint exists to duplicate/clone plans
- You must manually recreate plans with the same description
- UI does not show duplicate/clone buttons

❌ **Clarification Job Deletion**: No endpoint to delete clarification jobs
- Jobs persist in the backend database
- You can only create new jobs, not remove old ones

**Why this approach?**
The UI follows an "integrate if available" philosophy - features are only shown if the backend API supports them. This prevents user confusion from showing actions that would fail.

### Empty State Behavior

**Plans List - No Plans:**
- Message displayed: _"No plans found. Create your first plan to get started!"_
- Link to Plan Input page provided
- No status indicators or refresh options shown

**Plan Detail - No Specifications:**
- If a plan has no specs (rare edge case), a message is displayed
- Clarifier panel is hidden (nothing to clarify)
- Only job metadata and status are shown

**Clarifier Panel - No Open Questions:**
- If specifications have no open questions, clarifier submission is disabled
- Message: _"This plan has no questions to clarify"_
- Panel still allows manual job ID entry to check previous clarifications

### localStorage Limitations

**Private Browsing Mode:**
- localStorage may be disabled or limited
- Application falls back to in-memory storage
- Data is lost when browser tab/window closes
- Functionality remains available but persistence is temporary

**Cross-Device Access:**
- Clarifier job IDs are stored per-device (not synced across devices)
- If you switch devices, you'll need to manually enter job IDs
- Consider bookmarking or saving important job IDs externally

**Storage Quota:**
- Browsers typically provide 5-10MB localStorage quota
- Plan Maker uses minimal storage (only job IDs)
- Unlikely to hit quota limits in normal usage
- Old entries expire after 7 days automatically

### Known Edge Cases

**Concurrent Job Creation:**
- Creating multiple plans simultaneously may show temporary status inconsistencies
- Manual refresh resolves the state
- No data loss occurs

**Long-Running Jobs:**
- Jobs that run longer than expected may appear stuck in `RUNNING` status
- Backend automatically marks stuck jobs as `FAILED` on restart
- Use debug endpoint (if enabled) to check detailed job state

**Time Zone Differences:**
- All timestamps are in UTC (ISO 8601 format)
- UI displays timestamps in your local time zone
- "Last updated" relative times may differ from absolute timestamps

## Troubleshooting

### "Failed to fetch" or Network Errors

**Possible causes:**
- Backend services not running
- Incorrect environment variable configuration
- CORS issues (backend not allowing frontend origin)
- Firewall or network restrictions

**Solutions:**
1. Verify backend services are running and accessible
2. Check `.env` file has correct URLs
3. Test backend health endpoints directly in browser:
   - `{VITE_SOFTWARE_PLANNER_BASE_URL}/health`
   - `{VITE_SPEC_CLARIFIER_BASE_URL}/health`
4. Check browser console for detailed error messages
5. Verify CORS configuration on backend allows your frontend origin

### Status Not Updating

**Possible causes:**
- Job is still processing (check backend logs)
- Backend service crashed (job stuck in RUNNING state)
- Network connectivity issues

**Solutions:**
1. Wait 10-30 seconds and refresh again
2. Check backend service status and logs
3. Verify job ID is correct
4. If job appears stuck, contact administrator to check backend

### Clarifier Job ID Not Persisting

**Possible causes:**
- Private browsing mode enabled
- localStorage disabled by browser settings
- Browser cleared data
- Using different device or browser

**Solutions:**
1. Check if you're in private/incognito mode
2. Enable localStorage in browser settings
3. Use the "Manual Job ID Entry" feature to re-load your job
4. Save important job IDs externally (notepad, bookmark, etc.)

### Debug Endpoint Returns 403

**This is expected behavior**, not an error:
- Debug endpoint is disabled by default in production
- Only affects optional debug information viewing
- All core functionality (status checking, results) works normally

**If you need debug access:**
- Contact your administrator
- Request `APP_ENABLE_DEBUG_ENDPOINT=true` on backend
- Note: Should only be enabled in development/staging environments

---

## Additional Resources

- [README.md](../README.md) - General project documentation
- [OpenAPI Specifications](../) - `software-planner.openapi.json` and `spec-clarifier.openapi.json`
- [Environment Configuration](../.env.example) - Example environment variables

## Feedback and Support

If you encounter issues not covered in this guide:
1. Check browser console for detailed error messages
2. Review backend service logs
3. Verify environment configuration
4. Submit an issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Browser/environment details
   - Relevant error messages (sanitize any sensitive data)
