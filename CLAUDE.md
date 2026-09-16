# CLAUDE.md

## Build & Lint Commands
- Dev server: `npm run dev`
- ESLint: `npm run lint` (auto-fix: `npm run lint:fix`)
- Stylelint: `npm run lint:style` (auto-fix: `npm run lint:style:fix`)
- Production Build: `npm run build:prod`

## Architecture & Code Conventions
- **Framework**: Vue 3.5 Composition API with `<script setup lang="ts">`.
- **UI & CSS**: Element Plus 2.13 + Tailwind CSS 4 + Design Tokens. Zero hex/rgb color literals in `.vue` or `.scss`; use `var(--app-*)` instead.
- **Data Fetching**: All requests go through `src/api/` with interfaces defined in `src/types/api/`. NEVER import `request` directly in `src/views/` or `src/components/`.
- **Component Splitting**: When any `.vue` file exceeds 150 lines, decompose it into subcomponents under a local `components/` directory (e.g. dialogs, complex filters).
- **Reusable Assets**: Always check `docs/ai/ASSET_DICTIONARY.md` before coding. Reuse `<Pagination />`, `<RightToolbar />`, `<DictTag />`, `useDict`, `parseTime`, etc.
- **Page Generation Protocol**: Always follow `docs/ai/PAGE_GENERATION_PROTOCOL.md` to produce the full 3-piece bundle (Types + API + Split Views).
