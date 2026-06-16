# Repository Guidelines

## Project Structure & Module Organization

This repository is currently a clean starting point with no application source, tests, or assets checked in yet. As it grows, keep the top-level layout predictable:

- `src/` for application code and reusable modules.
- `tests/` for automated tests that mirror the structure of `src/`.
- `assets/` for static files such as images, fixtures, or sample data.
- `docs/` for design notes, architecture decisions, and contributor docs.

Avoid placing generated output, dependency folders, or local environment files in the repository unless they are intentionally versioned.

## Build, Test, and Development Commands

No build or test tooling is currently configured. When tooling is added, document the canonical commands here. Examples:

- `npm install` or equivalent: install project dependencies.
- `npm run dev`: start a local development server.
- `npm test`: run the automated test suite.
- `npm run build`: create a production build.

Prefer package-manager scripts, `Makefile` targets, or other single-entry commands.

## Coding Style & Naming Conventions

Use consistent, language-appropriate formatting. Until a formatter is configured, prefer 2-space indentation for web projects and 4-space indentation for Python or similar backend code. Name files with lowercase, descriptive names such as `user-service.ts`, `api_client.py`, or `login-form.test.ts`.

When adding a formatter or linter, commit its configuration and include the exact command here.

## Testing Guidelines

Add tests alongside new behavior. Test files should identify the unit or workflow under test, using names such as `*.test.ts`, `*_test.py`, or `test_*.py`. Keep tests deterministic and avoid local machine state.

Document any coverage expectations after a test framework is introduced. At minimum, new features should include happy-path coverage and relevant edge cases.

## Commit & Pull Request Guidelines

This repository has no existing commit history, so no local convention has been established. Use short, imperative commit messages, for example `Add user model` or `Configure test runner`.

Pull requests should include a concise description, reason for the change, test results, and screenshots or recordings for UI changes. Link related issues when available.

## Security & Configuration Tips

Do not commit secrets, API keys, tokens, or machine-specific configuration. Use ignored local environment files such as `.env.local` and provide a safe example file, such as `.env.example`, when configuration is required.
