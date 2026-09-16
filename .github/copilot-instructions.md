# GitHub Copilot Instructions for newAI

This project is an enterprise management system based on Vue 3.5, TypeScript 5.6, Element Plus 2.13, Vite 6, and Tailwind CSS 4.

## General Principles
- **Framework**: Vue 3 with `<script setup lang="ts">`.
- **Typing**: Strict TypeScript, zero `any`, fully typed API DTOs in `src/types/api/`.
- **API Requests**: Never import Axios or `@/utils/request` in Vue components. Always encapsulate requests in `src/api/` and import them in views.
- **Styling**: Zero raw color literals (e.g. `#fff`, `rgb()`). Only use CSS design tokens `var(--app-*)` or `var(--el-*)`.
- **Components & Utils**: Always reuse global components (`<Pagination />`, `<RightToolbar />`, `<DictTag />`, `<FileUpload />`, `<TreePanel />`) and utilities (`useDict`, `parseTime`, `handleTree`, `addDateRange`, `download`).
- **File Length**: Split components when lines > 150. Modal forms/dialogs must be separated into a `components/` subfolder.
- **Reference**: Refer to `docs/ai/ASSET_DICTIONARY.md` and `docs/ai/PAGE_GENERATION_PROTOCOL.md` for exact component usages and skeleton templates.
