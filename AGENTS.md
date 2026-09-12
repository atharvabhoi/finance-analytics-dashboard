# Finance Dashboard development guide

## Structure

- `frontend/` contains the Vite + React TypeScript application.
- `backend/` contains the Express TypeScript service.
- Supplied assignment assets and data must be preserved. Do not replace transaction JSON data.

## Conventions

- Keep frontend and backend independently runnable with their own `package.json` files.
- Use TypeScript and conventional `src/` entry points. Keep dependencies minimal.
- Add configuration examples to `.env.example`; never commit real `.env` files or credentials.
- Before finishing a change, run the affected package's `typecheck` and `build` scripts.
- Do not introduce authentication, persistence, external APIs, or dashboard features unless explicitly requested.
