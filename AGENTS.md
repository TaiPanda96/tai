# Tai portfolio

## Stack and commands

- React 19, TypeScript, Vite 7, and Three.js.
- Node.js 22 and pnpm 10.28.0.
- Install: `pnpm install --frozen-lockfile`.
- Local preview: `pnpm dev`.
- Production verification: `pnpm build`, which includes TypeScript checking.
- Deployment: the existing Vercel project builds `dist/` using `vercel.json`.

## Working rules

- Keep changes focused on the requested work. Preserve approved landing motion, session behavior, and audio unless the task changes them.
- Edit profile details in `src/profile.ts` and Work or Projects content in `src/content.ts`.
- Use `README.md` for content sources and expected behavior. Notion remains authoritative for the HighFi narratives and approval boundaries.
- `archive/legacy-site/` is the preserved previous repository, not active application code. Leave its files unchanged.
- Do not use em dashes in new copy, comments, or documentation.
- Update `CHANGELOG.md` under `[Unreleased]` when finishing changes.
- Run `pnpm build` before merging. For UI changes, check the affected desktop and mobile routes.
- Keep dependency installs, builds, recordings, local environment files, and tool artifacts out of Git.
- Do not add coauthor trailers to commits.
