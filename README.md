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

### Configuration

API clients read base URLs from environment variables at runtime via `src/api/clientConfig.ts`. Missing or malformed URLs throw descriptive errors before network calls are made.

## Routes

- `/` - Plan Input page (home)
- `/plans` - Plans List page
- `/plans/:id` - Plan Detail page
- `*` - 404 Not Found page (catch-all)

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive (supports screens as small as 320px)

## Technologies

- **React 18.3.1** - UI library
- **TypeScript 5.6.3** - Type safety
- **Vite 5.4.11** - Build tool and dev server
- **React Router 6.27.0** - Client-side routing
- **Vitest 2.1.5** - Testing framework
- **Testing Library** - Component testing utilities
- **openapi-typescript-codegen 0.30.0** - OpenAPI client generator



# Permanents (License, Contributing, Author)

Do not change any of the below sections

## License

This Agent Foundry Project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created by Agent Foundry and John Brosnihan
