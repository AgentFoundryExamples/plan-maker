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

## Project Structure

```
plan-maker/
├── src/
│   ├── api/              # API utilities and environment config
│   ├── components/       # Reusable React components
│   ├── layout/           # Layout components (AppLayout)
│   ├── pages/            # Page components (routes)
│   ├── styles/           # Global styles and theme tokens
│   ├── test/             # Test setup and utilities
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Application entry point
│   └── vite-env.d.ts     # TypeScript definitions
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── vitest.config.ts      # Vitest configuration
└── tsconfig.json         # TypeScript configuration
```

## Environment Variables

The application requires the following environment variables:

- `VITE_SOFTWARE_PLANNER_BASE_URL`: Base URL for the Software Planner API
- `VITE_SPEC_CLARIFIER_BASE_URL`: Base URL for the Spec Clarifier API

See `.env.example` for reference.

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



# Permanents (License, Contributing, Author)

Do not change any of the below sections

## License

This Agent Foundry Project is licensed under the Apache 2.0 License - see the LICENSE file for details.

## Contributing

Feel free to submit issues and enhancement requests!

## Author

Created by Agent Foundry and John Brosnihan
