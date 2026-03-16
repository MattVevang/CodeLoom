# Contributing to CodeLoom

Thanks for helping improve CodeLoom.

## Prerequisites

- Node.js 18 or newer
- npm
- A modern browser with local file access support for full workflow testing

## Setup

```bash
git clone <repository-url>
cd LocalLLMRepositoryPromptHelper
npm install
npm run dev
```

## Development Workflow

1. Create a branch for your work.
2. Install dependencies with `npm install`.
3. Start the app with `npm run dev`.
4. Make focused changes with tests, linting, and build checks where available.
5. Open a pull request with a clear summary and screenshots for UI changes.

## Code Style Guidelines

- Keep **TypeScript strict mode** friendly: prefer explicit types at service and store boundaries.
- Use **Tailwind CSS** utilities for styling before reaching for custom CSS.
- Keep shared application state in **Zustand** stores.
- Favor small, composable React components and hooks.
- Keep browser-only privacy assumptions intact; avoid introducing server dependencies for repository processing.

## Pull Request Process

- Rebase on the latest main branch before opening the pull request.
- Keep pull requests scoped to a single change or feature area.
- Include a concise description of the problem, the solution, and manual verification steps.
- Update documentation when behavior or developer workflow changes.

## Reporting Issues

When reporting a bug or suggesting an enhancement, include:

- What you expected to happen
- What actually happened
- Browser and operating system details
- Reproduction steps
- Screenshots or console output when relevant
