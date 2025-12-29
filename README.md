# Agent Foundry Plan Maker

A Vite-powered React + TypeScript application for creating and managing software development plans.

## Features

- 🚀 Built with Vite for fast development and optimized builds
- ⚛️ React 18 with TypeScript for type-safe component development
- 🛣️ React Router for client-side routing
- 🎨 Responsive design with mobile-first CSS and theme tokens
- ♿ Accessibility features including skip links and semantic HTML
- 🛡️ Error boundaries for graceful error handling
- 🧪 Comprehensive test coverage with Vitest and Testing Library
- 🔐 Environment variable validation for runtime configuration
- 🔍 ESLint + Prettier for code quality and consistency
- 🔄 React Query for intelligent data fetching and caching
- 🗺️ TypeScript path aliases for cleaner imports
- 🌓 Dark mode support with OS preference detection and manual toggle

## Dark Mode

Plan Maker includes a built-in dark mode theme that provides a comfortable viewing experience in low-light conditions.

### Using Dark Mode

The theme toggle is located in the application header. It cycles through three modes:

- **☀️ Light** - Light theme (white background, dark text)
- **🌙 Dark** - Dark theme (dark background, light text)
- **🔄 Auto** - Automatically follows your OS/browser preference

Your theme preference is automatically saved and persists across browser sessions.

### OS Preference Detection

When set to "Auto" mode, the app automatically detects and follows your operating system's color scheme preference using the `prefers-color-scheme` media query. If your OS switches between light and dark modes, the app will update accordingly in real-time.

### Accessibility

All colors in both light and dark themes maintain WCAG AA contrast ratios for readability and accessibility. Focus states, validation colors, and status badges are optimized for visibility in both themes.

### Print Styling

When printing or generating PDFs, the app automatically forces the light theme regardless of your current theme setting to ensure optimal readability on paper.

### For Developers

#### Theme Implementation

The theme system uses CSS custom properties (CSS variables) for all colors. The theme is controlled by a `data-theme` attribute on the document root element:

```html
<html data-theme="light">  <!-- Light theme -->
<html data-theme="dark">   <!-- Dark theme -->
```

#### Using Theme Colors

Always use semantic color variables rather than hard-coded colors:

```css
/* ✅ Good - uses semantic variable */
.my-component {
  background-color: var(--color-surface);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* ❌ Bad - hard-coded color */
.my-component {
  background-color: #f5f5f5;
  color: #1a1a1a;
}
```

#### Theme Hook

Use the `useTheme` hook to access and control the theme from React components:

```tsx
import { useTheme } from '@/hooks/useTheme';

function MyComponent() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  
  // Current theme mode: 'light', 'dark', or 'auto'
  console.log(theme);
  
  // Actual theme being displayed: 'light' or 'dark'
  console.log(resolvedTheme);
  
  // Change theme
  setTheme('dark');
}
```

#### Adding New Colors

When adding new colors to the design system:

1. Define both light and dark variants in `src/styles/theme.css`
2. Use semantic names that describe the purpose, not the color
3. Ensure WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)
4. Test in both light and dark modes

```css
/* In :root for light theme */
:root {
  --color-my-feature: #0066cc;
  --color-my-feature-hover: #0052a3;
}

/* In [data-theme="dark"] for dark theme */
[data-theme="dark"] {
  --color-my-feature: #4d9fff;
  --color-my-feature-hover: #70b0ff;
}
```

## Design System

Plan Maker uses a comprehensive design system built on CSS custom properties (CSS variables) for consistent, maintainable, and themeable UI components.

### Design Tokens

Design tokens are defined in `src/styles/theme.css` and organized into semantic categories:

#### Color Tokens

**Primary Colors** - Brand and interactive elements:
```css
var(--color-primary)         /* #0066cc - Primary brand color */
var(--color-primary-hover)   /* Hover state */
var(--color-primary-light)   /* Light background variant */
```

**Semantic Status Colors** - WCAG AA compliant:
```css
var(--color-success)   /* Green for success states */
var(--color-warning)   /* Orange for warning states */
var(--color-error)     /* Red for error states */
var(--color-info)      /* Blue for informational states */
```

**Surface Colors**:
```css
var(--color-background)      /* Page background */
var(--color-surface)         /* Card/panel surfaces */
var(--color-text)            /* Primary text */
var(--color-text-secondary)  /* Secondary text */
var(--color-border)          /* Borders and dividers */
```

#### Spacing Tokens

Mobile-first spacing scale based on 4px increments:
```css
var(--spacing-xs)   /* 4px - minimal spacing */
var(--spacing-sm)   /* 8px - compact spacing */
var(--spacing-md)   /* 16px - standard spacing */
var(--spacing-lg)   /* 24px - comfortable spacing */
var(--spacing-xl)   /* 32px - generous spacing */
var(--spacing-2xl)  /* 48px - section spacing */
```

#### Typography Tokens

**Font Families**:
```css
var(--font-family-base)  /* System font stack */
var(--font-family-mono)  /* Monospace font stack */
```

**Font Sizes** - Responsive scale:
```css
var(--font-size-xs)    /* 12px - captions, labels */
var(--font-size-sm)    /* 14px - small text */
var(--font-size-base)  /* 16px - body text */
var(--font-size-lg)    /* 18px - emphasized text */
var(--font-size-xl)    /* 20px - h5, subheadings */
var(--font-size-2xl)   /* 24px - h3, h4 */
var(--font-size-3xl)   /* 30px - h2 */
var(--font-size-4xl)   /* 36px - h1 */
```

**Font Weights**:
```css
var(--font-weight-normal)     /* 400 */
var(--font-weight-medium)     /* 500 */
var(--font-weight-semibold)   /* 600 */
var(--font-weight-bold)       /* 700 */
```

#### Layout Tokens

**Border Radius**:
```css
var(--border-radius-sm)   /* 4px - subtle rounding */
var(--border-radius-md)   /* 8px - standard rounding */
var(--border-radius-lg)   /* 12px - prominent rounding */
```

**Shadows**:
```css
var(--shadow-sm)   /* Subtle elevation */
var(--shadow-md)   /* Standard elevation */
var(--shadow-lg)   /* Prominent elevation */
```

**Focus States** - For accessibility:
```css
var(--focus-ring-width)   /* 2px */
var(--focus-ring-color)   /* Primary color */
var(--focus-ring-offset)  /* 2px */
```

#### Motion Tokens

**Durations**:
```css
var(--transition-duration-fast)   /* 150ms - instant feedback */
var(--transition-duration-base)   /* 200ms - standard transitions */
var(--transition-duration-slow)   /* 300ms - deliberate transitions */
```

**Easing Functions**:
```css
var(--transition-timing-ease-in-out)  /* Smooth transitions */
var(--transition-timing-ease-out)     /* Natural deceleration */
```

**Common Transitions**:
```css
var(--transition-colors)      /* For color changes */
var(--transition-transform)   /* For transforms */
var(--transition-opacity)     /* For opacity changes */
```

### Component Styles

Global component utilities are defined in `src/styles/global.css`:

#### Buttons

```tsx
// Primary button
<button className="btn btn-primary">Save</button>

// Secondary button
<button className="btn btn-secondary">Cancel</button>

// Success/Danger variants
<button className="btn btn-success">Confirm</button>
<button className="btn btn-danger">Delete</button>

// Sizes
<button className="btn btn-sm">Small</button>
<button className="btn btn-lg">Large</button>
```

#### Form Inputs

Inputs automatically inherit design tokens:
```tsx
<input type="text" placeholder="Enter text..." />
<textarea placeholder="Enter long text..."></textarea>

// Error state
<input type="text" className="input-error" />
```

#### Cards

```tsx
<div className="card">
  <div className="card-header">
    <h3>Card Title</h3>
  </div>
  <div className="card-body">
    Card content goes here
  </div>
</div>
```

#### Badges

```tsx
<span className="badge badge-primary">New</span>
<span className="badge badge-success">Active</span>
<span className="badge badge-warning">Pending</span>
<span className="badge badge-error">Failed</span>
```

#### Status Messages

```tsx
<div className="error">Error message</div>
<div className="success">Success message</div>
<div className="warning">Warning message</div>
<div className="info">Info message</div>
```

### Usage Guidelines

#### Using Tokens in CSS

Always prefer design tokens over hard-coded values:

```css
/* ❌ Avoid hard-coded values */
.my-component {
  padding: 16px;
  color: #666;
  border-radius: 8px;
}

/* ✅ Use design tokens */
.my-component {
  padding: var(--spacing-md);
  color: var(--color-text-secondary);
  border-radius: var(--border-radius-md);
}
```

#### When to Use Component Tokens vs Generic Spacing

The design system includes both generic spacing tokens (`--spacing-*`) and component-specific tokens (`--button-padding-x`, `--card-padding`, etc.). Here's when to use each:

**Use Generic Spacing Tokens (`--spacing-*`) when:**
- Adding margins between elements
- Setting padding for custom components not covered by component tokens
- Creating custom layouts or grids
- Defining gaps in flex/grid containers

**Use Component-Specific Tokens when:**
- Styling standard UI components (buttons, inputs, cards, badges)
- Ensuring consistency with the design system's component library
- You want your styles to automatically update if component tokens are reconfigured

**Example:**
```css
/* ❌ Don't use generic spacing for standard components */
.my-button {
  padding: var(--spacing-sm) var(--spacing-md);
}

/* ✅ Use component tokens for standard components */
.my-button {
  padding: var(--button-padding-y) var(--button-padding-x);
}

/* ✅ Use generic spacing for custom layouts */
.my-custom-panel {
  margin-bottom: var(--spacing-lg);
  padding: var(--spacing-md);
}
```

**Note:** Component tokens are often aliased to spacing tokens (e.g., `--button-padding-x: var(--spacing-md)`), but using the component token makes your intent clearer and allows for future customization.

#### Responsive Design

Design tokens automatically adjust for different screen sizes:

```css
/* Spacing tokens increase on desktop (768px+) */
.container {
  padding: var(--spacing-lg);  /* 24px on mobile, 32px on desktop */
}
```

#### Component-Level Overrides

When you need component-specific adjustments, use CSS variables for configurability:

```css
:root {
  --my-component-padding: var(--spacing-md);
  --my-component-color: var(--color-primary);
}

.my-component {
  padding: var(--my-component-padding);
  color: var(--my-component-color);
}
```

### Extending the Design System

#### Adding New Tokens

1. Define new tokens in `src/styles/theme.css`:

```css
:root {
  /* Add to appropriate category */
  --color-accent: #ff6b6b;
  --spacing-3xl: 4rem;
}
```

2. Document the token with an inline comment
3. Update this README with the new token

#### Creating Custom Components

When creating new components:

1. **Use existing utilities first** - Check if `.btn`, `.card`, `.badge` etc. meet your needs
2. **Compose from tokens** - Build new styles using design tokens
3. **Follow naming conventions** - Use BEM-style naming for clarity
4. **Add to global.css** - If the component is reusable across pages

Example:
```css
/* src/styles/global.css */
.alert {
  padding: var(--spacing-md);
  border-radius: var(--border-radius-md);
  border: var(--border-width-thin) solid;
  transition: var(--transition-colors);
}

.alert-warning {
  background-color: var(--color-warning-light);
  border-color: var(--color-warning);
  color: var(--color-text);
}
```

### Theming Support

The design system is built to support theming:

#### Prerequisites for Theming

- All colors are defined as CSS variables
- No hard-coded color values in components (except dynamic inline styles from data)
- Color variables maintain semantic naming (primary, success, error, etc.)

#### Future Theme Implementation

To add theme switching (e.g., dark mode):

1. Create theme variants in theme.css:

```css
/* Light theme (default) */
:root {
  --color-background: #ffffff;
  --color-text: #1a1a1a;
}

/* Dark theme */
[data-theme="dark"] {
  --color-background: #1a1a1a;
  --color-text: #f5f5f5;
}
```

2. Toggle theme via JavaScript:

```typescript
document.documentElement.setAttribute('data-theme', 'dark');
```

3. Persist theme preference in localStorage

### Accessibility

All design tokens follow accessibility best practices:

- **WCAG AA Contrast** - All text/background color combinations meet WCAG AA requirements (4.5:1 for normal text, 3:1 for large text)
- **Focus Indicators** - Visible focus rings on all interactive elements
- **Touch Targets** - Minimum 44x44px touch targets on mobile
- **Motion** - Respects `prefers-reduced-motion` where appropriate

### Browser Support

Design tokens use CSS custom properties, which are supported in:
- Chrome/Edge 49+
- Firefox 31+
- Safari 9.1+
- iOS Safari 9.3+

For older browsers, tokens gracefully degrade to their fallback values.

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm (comes with Node.js)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/AgentFoundryExamples/plan-maker.git
cd plan-maker
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file from the example:
```bash
cp .env.example .env
```

4. Update the `.env` file with your API endpoints:
```
VITE_SOFTWARE_PLANNER_BASE_URL=http://localhost:8080
VITE_SPEC_CLARIFIER_BASE_URL=http://localhost:8081
```

### Development

Start the development server:
```bash
npm run dev
```

The app will be available at http://localhost:3000

### Building

Build the project for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:ui
```

### Code Quality

**Linting**

Check code for linting errors:
```bash
npm run lint
```

The project uses ESLint with TypeScript, React, and React Hooks rules to enforce code quality standards.

**Formatting**

Format code with Prettier:
```bash
npm run format
```

Check if code is properly formatted:
```bash
npm run format:check
```

**Before Committing**

Contributors should run both linting and formatting checks before committing:
```bash
npm run lint
npm run format
npm test
```

This ensures code quality and consistency across the codebase.

### API Client Generation

The project uses generated TypeScript clients for backend API communication. To regenerate API clients from OpenAPI specifications:

```bash
npm run generate:api
```

This command generates clients for both services:
- Software Planner API (`src/api/softwarePlanner/`)
- Spec Clarifier API (`src/api/specClarifier/`)

**Note:** Generated files should not be edited manually. Wrapper utilities in `src/api/softwarePlannerClient.ts` and `src/api/specClarifierClient.ts` provide ergonomic helper functions that won't be overwritten during regeneration.

## Project Structure

```
plan-maker/
├── src/
│   ├── api/              # API clients and utilities
│   │   ├── softwarePlanner/    # Generated Software Planner API client
│   │   ├── specClarifier/      # Generated Spec Clarifier API client
│   │   ├── clientConfig.ts     # Shared client configuration
│   │   ├── softwarePlannerClient.ts  # Software Planner wrapper utilities
│   │   ├── specClarifierClient.ts    # Spec Clarifier wrapper utilities
│   │   └── env.ts              # Environment variable validation
│   ├── components/       # Reusable React components
│   ├── layout/           # Layout components (AppLayout)
│   ├── pages/            # Page components (routes)
│   ├── styles/           # Global styles and theme tokens
│   ├── test/             # Test setup and utilities
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # TypeScript definitions
├── software-planner.openapi.json    # Software Planner OpenAPI spec
├── spec-clarifier.openapi.json      # Spec Clarifier OpenAPI spec
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Vitest configuration
└── tsconfig.json         # TypeScript configuration
```

## Environment Variables

The application requires the following environment variables:

- `VITE_SOFTWARE_PLANNER_BASE_URL`: Base URL for the Software Planner API
- `VITE_SPEC_CLARIFIER_BASE_URL`: Base URL for the Spec Clarifier API

These variables are validated at runtime. If they are missing or empty, the application will throw descriptive errors before making network calls.

See `.env.example` for reference.

## API Clients

The project includes typed API clients generated from OpenAPI specifications, with ergonomic wrapper utilities for easy integration.

### Generated Clients

API clients are automatically generated from OpenAPI specs:
- `src/api/softwarePlanner/` - Software Planner API models and types
- `src/api/specClarifier/` - Spec Clarifier API models and types

### Client Wrappers

Wrapper utilities provide typed helper functions:

#### Software Planner Client (`src/api/softwarePlannerClient.ts`)

```typescript
import { createPlan, createPlanAsync, getPlanById, listPlans } from './api/softwarePlannerClient';

// Synchronous plan creation
const plan = await createPlan({ description: 'Build a REST API' });

// Asynchronous plan creation
const job = await createPlanAsync({ description: 'Build a REST API' });
const status = await getPlanById(job.job_id);

// List recent plans (specs field is optional in response)
const plans = await listPlans(10);
```

#### Spec Clarifier Client (`src/api/specClarifierClient.ts`)

```typescript
import { clarifySpecs, getClarifierStatus, waitForClarification } from './api/specClarifierClient';

// Create clarification job
const job = await clarifySpecs({
  plan: { specs: [/* specifications */] }
});

// Check status
const status = await getClarifierStatus(job.id);

// Wait for completion with polling
const result = await waitForClarification(job.id, {
  maxAttempts: 60,
  intervalMs: 2000
});
```

### Regenerating Clients

If the backend OpenAPI specifications change, regenerate the clients:

```bash
npm run generate:api
```

**Important:**
- Generated files in `src/api/softwarePlanner/` and `src/api/specClarifier/` should **not** be edited manually
- Wrapper utilities (`softwarePlannerClient.ts`, `specClarifierClient.ts`) are safe from regeneration
- The generation script is idempotent and can be run multiple times

### Data Fetching with React Query

The application uses **React Query** (TanStack Query) for intelligent data fetching, caching, and state management.

#### QueryClient Provider

The app is wrapped with `QueryClientProvider` in `src/main.tsx`, which provides:
- **Automatic caching**: Fetched data is cached for 5 minutes by default
- **Background refetching**: Stale data is automatically refreshed
- **Request deduplication**: Multiple components requesting the same data trigger only one fetch
- **Retry logic**: Failed requests are automatically retried once

#### Custom Hooks (`src/api/hooks.ts`)

The project provides React Query hook stubs that wrap the API clients:

```typescript
import { usePlan, usePlans, useCreatePlan, useClarificationStatus } from './api/hooks';

// Fetch a single plan with caching
const { data: plan, isLoading, error } = usePlan(planId);

// Fetch multiple plans
const { data: plans } = usePlans({ limit: 10 });

// Create a plan with mutation
const createPlan = useCreatePlan({
  onSuccess: (data) => {
    console.log('Plan created:', data);
  }
});
createPlan.mutate({ description: 'Build a REST API' });

// Poll for clarification status
const { data: status } = useClarificationStatus(jobId);
```

**Note:** The hooks in `src/api/hooks.ts` are currently stubs. Connect them to the actual API client functions from `softwarePlannerClient.ts` and `specClarifierClient.ts` as needed.

### TypeScript Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
// Before (relative paths)
import App from './App';
import { getSafeEnvConfig } from './api/env';

// After (path alias)
import App from '@/App';
import { getSafeEnvConfig } from '@/api/env';
```

The `@/*` alias maps to `src/*` and is configured in:
- `tsconfig.json` - TypeScript compiler
- `vite.config.ts` - Vite bundler

Use path aliases for:
- Cleaner, more maintainable imports
- Avoiding deep relative paths (`../../../`)
- Easier refactoring when moving files

### Configuration

API clients read base URLs from environment variables at runtime via `src/api/clientConfig.ts`. Missing or malformed URLs throw descriptive errors before network calls are made.

## Routes

The application provides the following routes, accessible via the top navigation bar:

- `/` - **Plan Input** page (home) - Create new software development plans by entering specifications
- `/plans` - **Plans List** page - View all your created plans with their status (queued, running, succeeded, failed)
- `/plans/:id` - **Plan Detail** page - View detailed information for a specific plan
- `*` - **404 Not Found** page (catch-all) - Displays when navigating to non-existent routes

### Navigation

The application header includes a persistent navigation bar with links to:
- **Plan Input** - Returns to the home page for creating new plans
- **Plans List** - Navigate to the plans overview page to see all your plans

Navigation features:
- Active route indication with visual highlighting and `aria-current` attribute
- Keyboard accessible with visible focus indicators
- Responsive design that adapts to mobile, tablet, and desktop viewports
- On mobile devices, navigation links stack vertically for easier touch interaction

## Status & Clarification

Plan Maker provides comprehensive workflows for tracking plan generation and clarifying specifications with open questions.

### Plans List Page

The **Plans List** page (`/plans`) displays all your created plans in a table sorted by most recently updated.

**Features:**
- View job status with color-coded badges (QUEUED, RUNNING, SUCCEEDED, FAILED)
- See timestamps for when plans were created and last updated
- Manual refresh button to update the list on demand
- Automatic background refresh every 60 seconds (when page is visible)
- Last updated indicator showing relative time ("Just now", "2 minutes ago", etc.)
- Click any plan to view detailed information

**Empty State:**
When you haven't created any plans yet, you'll see a helpful message with a link to create your first plan.

### Plan Detail Page

The **Plan Detail** page (`/plans/:id`) shows complete information about a specific plan.

**What's Displayed:**
- Job metadata (ID, status, timestamps)
- Status timeline showing job progression
- Generated specifications with expandable sections (when status is SUCCEEDED)
- Open questions highlighted with ❓ icon
- Answer input fields for each question
- Clarifier panel for submitting clarifications
- Manual refresh button for status updates

**Status Workflow:**
1. **QUEUED**: Plan is waiting to be processed
2. **RUNNING**: Plan is actively being generated by the LLM
3. **SUCCEEDED**: Plan completed successfully with specifications and questions
4. **FAILED**: Plan generation failed with error details

### Clarifier Panel

The clarifier panel enables you to submit specifications for clarification and monitor the clarification job status.

**Features:**
- **Submit for Clarification**: Answer all questions and submit for LLM processing
- **Manual Status Check**: Check clarification job status on demand (no auto-polling)
- **Manual Job ID Entry**: Load status for clarification jobs from previous sessions
- **Debug Information**: View detailed job metadata (when backend debug mode is enabled)
- **Status Tracking**: Monitor clarification progress with status badges
- **Job Persistence**: Clarifier job IDs stored in localStorage for continuity

**Clarification Workflow:**
1. Answer all questions in the specifications
2. Click "Submit for Clarification" button
3. Clarification job created with status PENDING
4. Use "Check Status" button to monitor progress (PENDING → RUNNING → SUCCESS/FAILED)
5. View clarified specifications when job reaches SUCCESS status

**Debug Endpoint:**
The debug information feature is only available when the backend has `APP_ENABLE_DEBUG_ENDPOINT=true`. If disabled, you'll see a 403 error - this is expected and normal in production environments. Core functionality (submitting and checking status) works regardless of debug availability.

### Manual Refresh Strategy

Plan Maker uses an **on-demand refresh approach** to avoid rate limits and reduce server load.

**Refresh Behavior:**
- **Plans List**: Automatically refreshes every 60 seconds when page is visible (pauses when tab is hidden)
- **Plan Detail**: No automatic refresh - use the manual refresh button
- **Clarifier Status**: No automatic polling - use "Check Status" button

**Best Practices:**
- Use manual refresh when actively monitoring a job
- Wait 5-10 seconds between manual refreshes for running jobs
- Avoid rapid clicking to prevent rate limit errors
- Close or navigate away from pages you're not actively monitoring

### API Endpoints

The application interacts with two backend services via the following endpoints:

#### Software Planner API

Base URL: `VITE_SOFTWARE_PLANNER_BASE_URL`

- `GET /api/v1/models` - List available LLM models
- `POST /api/v1/plan` - Create plan synchronously (blocks until complete)
- `POST /api/v1/plans` - Create plan asynchronously (recommended, returns job ID immediately)
- `GET /api/v1/plans` - List all recent plans (sorted by updated_at descending)
- `GET /api/v1/plans/{job_id}` - Get specific plan status and results

#### Spec Clarifier API

Base URL: `VITE_SPEC_CLARIFIER_BASE_URL`

- `POST /v1/clarifications` - Create clarification job (async, returns job ID)
- `GET /v1/clarifications/{job_id}` - Get clarification status and results
- `GET /v1/clarifications/{job_id}/debug` - Get debug information (requires `APP_ENABLE_DEBUG_ENDPOINT=true` on backend)

**Note:** The `/v1/clarifications/preview` endpoint is for development only and not used by the UI.

### Environment Variables

In addition to the base URL variables, the backend services may use:

**Frontend (.env):**
```bash
VITE_SOFTWARE_PLANNER_BASE_URL=http://localhost:8080
VITE_SPEC_CLARIFIER_BASE_URL=http://localhost:8081
```

**Backend (Spec Clarifier Service):**
```bash
# Optional: Enable debug endpoint (default: false, disable in production)
APP_ENABLE_DEBUG_ENDPOINT=true
```

### Data Persistence

**Clarifier Job IDs** are stored in browser localStorage to maintain continuity across page navigations and sessions.

**Storage Details:**
- **Key Format**: `plan-maker_clarifier_{planId}`
- **Value**: JSON object with `{ jobId: string, timestamp: number }`
- **Expiration**: Automatically removed after 7 days
- **Fallback**: In-memory storage when localStorage is unavailable (e.g., private browsing mode)

**Privacy & Cleanup:**
- Data stored only in your browser (not sent to third parties)
- Clearing browser data removes stored job IDs
- Private browsing mode uses temporary in-memory storage (lost on tab close)
- No sensitive data (specifications, answers, or results) is stored locally

**Manual Cleanup:**
To clear stored clarifier job IDs, use browser Developer Tools (F12) → Application/Storage → Local Storage → delete keys starting with `plan-maker_clarifier_`.

### Error Handling

The application gracefully handles various error scenarios:

**403 Forbidden (Debug Disabled):**
- Debug endpoint returns 403 when `APP_ENABLE_DEBUG_ENDPOINT` is false/unset
- Expected in production environments
- Core functionality (status checks, submissions) unaffected
- Error banner explains debug is unavailable

**404 Not Found (Job Missing):**
- Job ID doesn't exist or has expired
- Error banner with details
- Verify job ID is correct or create a new job

**422 Unprocessable Entity (Invalid UUID):**
- Job ID format is invalid (must be valid UUID)
- Check for typos in manually entered job IDs
- Use exact job ID as returned by API

**Network Errors:**
- Backend unreachable or network issues
- Error banner with technical details
- Check backend services are running and environment variables are correct

### Known Limitations

**Missing Operations:**
The following operations are **intentionally not available** in the UI because the backend APIs do not provide these endpoints:

❌ **Delete Plans**: No endpoint exists to delete plans (`DELETE /api/v1/plans/{job_id}` not in OpenAPI spec)
❌ **Duplicate Plans**: No endpoint exists to clone/duplicate plans
❌ **Delete Clarifications**: No endpoint exists to delete clarification jobs

The UI follows an "integrate if available" approach - features are only shown when the backend API supports them. This prevents user confusion from showing actions that would fail.

**Workarounds:**
- To "delete" a plan, simply ignore it - it won't affect functionality
- To duplicate a plan, manually re-enter the description on the Plan Input page
- The local reference to old clarification jobs is removed from your browser's localStorage after 7 days. The job itself persists on the backend.

### Detailed Documentation

For comprehensive step-by-step workflows, error handling details, and troubleshooting guidance, see:

📖 **[docs/status-workflows.md](docs/status-workflows.md)** - Complete Status & Clarification Workflows Guide

This guide covers:
- Step-by-step instructions for all workflows
- Detailed error handling scenarios
- Rate limiting best practices
- localStorage behavior and privacy implications
- API endpoint reference with request/response examples
- Troubleshooting common issues

## Copy and Tone Guidelines

Plan Maker follows a concise, helpful, and action-oriented voice across all UI text:

### Tone Principles

1. **Concise**: Use fewer words to convey the same meaning. Avoid redundancy.
   - ❌ "You haven't created any plans yet. Get started by creating your first software development plan."
   - ✅ "Create your first software development plan to get started."

2. **Helpful**: Provide clear next steps. Guide users to what they can do.
   - ❌ "No plans found"
   - ✅ "No Plans Yet" + actionable button "Create Plan"

3. **Direct**: Use active voice and imperative mood for actions.
   - ❌ "Click below to start the clarification process."
   - ✅ "Start Clarification"

4. **Specific**: Replace vague language with concrete examples.
   - ❌ "Enter a description of your project"
   - ✅ "Describe your software project. Example: Build a REST API for task management..."

### Button Text

- Use verb phrases: "Create Plan", "Check Status", "Refresh"
- Avoid unnecessary articles: "Submit" not "Submit the Form"
- Show loading states: "Creating..." instead of just disabling

### Helper Text

- One sentence when possible
- Lead with the action, not the reason
- ❌ "This field allows you to specify a model name. Leave empty to use the default."
- ✅ "Specify a model name. Leave empty to use default."

### Placeholders

- Use concrete examples over abstract instructions
- Keep under 80 characters when possible
- ❌ "Enter your text here"
- ✅ "gpt-4-turbo or claude-opus"

### Empty States

- State what's missing + provide an action
- Avoid negative framing ("haven't", "no", "empty")
- ❌ "You don't have any items"
- ✅ "Create your first item to get started"

### Error Messages

- Explain what went wrong and how to fix it
- Be specific about the validation requirement
- ❌ "Invalid input"
- ✅ "Description is required and cannot be empty"

### Accessibility

- All interactive elements have descriptive aria-labels
- Status changes are announced via aria-live regions
- Focus indicators are visible and consistent

### Localization Considerations

While the app is currently English-only, all copy is designed to:
- Avoid idioms and colloquialisms
- Use simple sentence structures
- Allow for text expansion (German/French are ~30% longer)
- Be screen-reader friendly with proper punctuation

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (supports screens as small as 320px)

## Technologies

- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4.11** - Build tool and dev server
- **React Router 6.27.0** - Client-side routing
- **React Query (TanStack Query)** - Data fetching, caching, and state management
- **Vitest 2.1.5** - Testing framework
- **Testing Library** - Component testing utilities
- **ESLint 9** - Code linting with TypeScript and React rules
- **Prettier** - Code formatting
- **openapi-typescript-codegen 0.30.0** - OpenAPI client generator



# Permanents (License, Contributing, Author)

Do not change any of the below sections

## License

This Agent Foundry Project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created by Agent Foundry and John Brosnihan
