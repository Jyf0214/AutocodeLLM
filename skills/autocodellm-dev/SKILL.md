---
name: autocodellm-dev
description: A comprehensive development skill for the AutocodeLLM project, encapsulating project architecture, routing, engineering standards, git workflow, page design, and development practices. Use this skill when implementing features, refactoring, or making any code changes in this codebase.
---

# AutocodeLLM Project Development Skill

This skill encapsulates the complete development guidelines, architectural decisions, engineering standards, and best practices for the AutocodeLLM project. Follow this skill when implementing features, fixing bugs, refactoring, or making any modifications to ensure consistency, maintainability, and quality.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Routing & Page Structure](#routing--page-structure)
3. [Engineering Standards](#engineering-standards)
   - [Git Workflow](#git-workflow)
   - [TODO Standards](#todo-standards)
4. [Page Design Standards](#page-design-standards)
   - [Workplace Page Design Principles](#workplace-page-design-principles)
5. [Development Specifications](#development-specifications)
   - [Core Principles](#core-principles)
   - [Module-First CSS Strategy](#module-first-css-strategy)
   - [Innovative Component Coding](#innovative-component-coding)
   - [Cross-Platform Unification](#cross-platform-unification)
   - [Precise Typography Strategy](#precise-typography-strategy)
6. [Tool Usage & Commands](#tool-usage--commands)
7. [When to Ask for Help](#when-to-ask-for-help)

---

## Project Overview

AutocodeLLM is a full-stack application built with Next.js 16, React 19, TypeScript, Prisma ORM, Ant Design, and Zustand for state management. The application is designed as a workplace management system with AI integration capabilities, featuring workspaces, MCP (Model Context Protocol) servers, AI providers, cloud storage integration (WebDAV), and extensive customization through skills and agents.

The codebase follows a modular, maintainable architecture with strict separation of concerns, backward compatibility, and minimalism principles.

---

## Routing & Page Structure

The project adopts a flat routing design organized into four primary modules: Workspace Management, System Configuration, Cloud Services, and Development/Debugging.

### Core Routes

| Route | Purpose | Notes |
|-------|---------|-------|
| `/` | Homepage | Application entry point; typically displays a dashboard or workspace list. |
| `/workplace` | Workspace Overview | Shows a list of all workspaces. No specific operations are available here; it serves as an entry point. |
| `/workplace/[[id]]/` | Specific Workspace (Dynamic) | `[[id]]` is the unique workspace identifier. Entering this route enables execution of that workspace's specific functions. |
| `/workplace/[[id]]/setting` | Workspace Settings | Configuration management for an individual workspace. |
| `/workplace/[[id]]/logs` | Workspace Logs | View runtime logs and history for the selected workspace. |
| `/workplace/[[id]]/channel` | Channel Configuration | Configure internal communication channels within the workspace. |
| `/workplace/[[id]]/terminal` | Web Terminal | Browser-based terminal emulator that requires a real backend connection. |
| `/workplace/[[id]]/backups` | Workspace Backup Status | Displays local and remote WebDAV backup states for the workspace. |
| `/workplace/[[id]]/detail` | Workspace Detailed Info | Shows metadata and detailed attributes of the workspace. |
| `/workplace/[[id]]/chat/[[chat_history]]` | Workspace Web Chat | Chat history view supporting channel-based messaging. |
| `/chat/workplace/[[id]]/[[chat_history]]` | Chat Route Redirect | Functionally identical to the above chat route; provided for alternative entry compatibility. |

### System & Configuration Routes

- `/mcp` – MCP (Model Context Protocol) server configuration center. Supports multiple protocol implementations, not limited to pure HTTP-based MCP servers.
- `/provider/[[provider_id]]/model` – AI model provider management page. Contains API configuration and available model lists for a specific provider.
- `/setting` – Global application configuration. Affects system-wide parameters.
- `/agents` – Sub‑agent management. Agents can be invoked by the main Agent via Function Call (Tool Call). This is not a standalone UI page; it is bound to the agent calling mechanism.
- `/skills` – LLM Skills management. Defines the skill set that the LLM can invoke.
- `/state` – System health check page. Real‑time monitoring of application component states (e.g., chat channel connectivity, service availability).
- `/login` – User authentication login page.

### Cloud Services Routes

- `/cloud` – Cloud storage service overview and configuration entry.
- `/cloud/webdav` – WebDAV protocol configuration page for setting up cloud storage connections.
- `/cloud/backups` – Global backup monitoring (read‑only). Displays WebDAV sync status per workspace; clicking details opens specific workspace backup information.

### Environment Variables Route

- `/env` – Environment variable management. Variables are persisted in the DATABASE. When the application executes an AI LLM Function Call ("Run shell") or when a user interacts via the Workplace Terminal, these environment variables take effect globally.

---

## Engineering Standards

### Git Workflow

#### Pre‑commit Hook (Pre‑commit Checks)

Before any commit is allowed, the following automated validations run to ensure code quality:

1. **Syntax Check**
   - Blocks all Warning and Error level issues that could affect runtime execution.
   - Does **not** enforce a specific code style (indentation, line breaks, etc.), preserving developer flexibility for personal formatting preferences.

2. **Security Check**
   - **Prohibits** committing any `.env` files or hard‑coded environment variables.
   - Performs automatic scanning for sensitive strings such as API keys, passwords, tokens, etc. Any match will abort the commit.

3. **TODO Check**
   - Scans the codebase for `TODO` comments.
   - Verifies that a `TODO.md` file exists in the project root (or a sibling directory) and that every TODO item is documented there.
   - Enforces dual‑track accountability: mental reminders must be mirrored in written form.

4. **Vitest Check**
   - Runs the frontend Vitest test suite automatically.
   - The commit is blocked if any test fails.

5. **Build Check**
   - Executes the `build:test` script.
   - This command only verifies that the application can be built successfully; it does **not** run additional tests or linting, providing rapid feedback.

#### Pre‑push Hook (Pre‑push Checks)

> **Current Status:** No pre‑push checks are configured. This area is marked as **TODO** for future implementation.

#### TODO Standards

- All `TODO` comments in code **must** be accompanied by an entry in `TODO.md` located at the project root.
- Each TODO entry should include:
  - A brief description of the work.
  - The responsible party or team (if applicable).
  - A target version or milestone.
  - Optional: links to related issues or PRs.
- Before marking a TODO as resolved, ensure the corresponding code change is committed and the entry in `TODO.md` is updated or removed.
- Regularly review `TODO.md` during sprint planning to keep the backlog visible.

---

## Page Design Standards

### Workplace Page Design Principles

The `/workplace` route is intentionally designed **only** as a workspace list view. It does **not** contain any operational functionality. All actions related to a specific workspace must be performed after navigating into the dynamic route `/workplace/[[id]]/`.

- The `/workplace` page **includes** a chat route entry point (`/chat/workplace/[[id]]/[[chat_history]]`) for quick access to workspace conversations, but this is merely a navigation shortcut.
- Avoid placing any buttons, forms, or interactive elements that modify workspace state on the `/workplace` page.
- Keep the layout minimal: a clean list (or grid) of workspace cards, each displaying the workspace name, icon, and a short status indicator.
- Clicking a workspace card should navigate to `/workplace/[[id]]/` where the full suite of features (settings, logs, terminal, backups, detail, chat) becomes available.
- Ensure the list view is responsive: on mobile devices, cards should stack vertically with adequate touch targets.

---

## Development Specifications

These guidelines apply to **frontend** code (React/Next.js/Ant Design) but also influence backend decisions where applicable.

### Core Principles

1. **Backward Compatibility (上下兼容)**
   - New and old versions must allow seamless migration.
   - No feature breakage or data loss due to version upgrades.
   - Any API change must retain the old interface until all consumers have migrated.
   - Deprecation warnings should be added at least one version before removal.

2. **Absolute Modularity (绝对模块化)**
   - Extract reusable UI/logic units (e.g., button feedback, toast messages, modal hooks) into independent files.
   - Modules must be importable by any page or component.
   - Aim for single‑responsibility per file: even if a file grows large, its purpose must remain clear and focused.
   - Prefer barrel exports (`index.ts`) only when they genuinely improve discoverability.

3. **Minimalism (极简主义)**
   - When multiple syntactically equivalent implementations exist, choose the simplest and most intuitive.
   - In UI, balance aesthetic appeal with minimal code; however, **do not** sacrifice user experience for the sake of fewer lines.
   - If a richer interaction improves clarity, implement it fully.

4. **Perfectionism (完美主义)**
   - Do **not** commit code that is not in a polished state.
   - Eliminate redundant logic, dead code, or commented‑out blocks.
   - When providing backward compatibility for an endpoint, implement it rigorously—no "temporary" or "will clean later" placeholders.
   - Every line should have a justified purpose.

5. **Module‑First CSS Strategy (模块至上的CSS策略)**
   - Leverage existing UI library components (cards, containers, grid systems) and encapsulated dependencies before writing custom CSS.
   - Write CSS only when absolutely necessary, and keep it scoped (CSS Modules or Styled Components) to avoid leakage.
   - Prefer utility‑class approaches (Tailwind‑like) if adopted, otherwise use BEM‑style naming with a clear prefix.
   - Avoid global stylesheets that affect unrelated components.

6. **Innovative Component Coding (创新的组件编码)**
   - For common components offered by React, Next.js, or Ant Design, avoid default icons and animations unless they truly fit the product's visual language.
   - Example: Replace the default loading spinner with a custom animation that reflects the brand's identity.
   - Encourage small, purposeful enhancements (e.g., custom hover effects, micro‑interactions) that improve perceived quality without bloat.

7. **Cross‑Platform Unification (多端统一的代码)**
   - Mobile UI considerations:
     - Key buttons and text **must** support automatic line‑wrapping.
     - Prevent horizontal overflow or layout shifts caused by long unbroken strings.
     - Avoid forcing menus to expand in ways that break the viewport.
   - Ensure identical logical behavior and visual fidelity between desktop and mobile breakpoints.
   - Use responsive design principles (fluid grids, flexible images, media queries) rather than separate codebases.

8. **Precise Typography Strategy (精确的字体策略)**
   - Do not restrict yourself to a single system font.
   - Choose typefaces based on context, target audience, and regional preferences:
     - Use **Italic** for emphasis or citations.
     - Use **Script** or **Decorative** fonts sparingly for logos or headings where appropriate.
     - Consider licensing and web‑font performance when introducing custom font families.
   - Establish a clear typographic scale (e.g., base 16px, then 1.25× for headings) and apply it consistently.
   - Maintain sufficient contrast ratios (WCAG AA at minimum) for all text‑background combinations.

### Additional Development Practices

- **TypeScript Strictness**: Enable `strict: true` in `tsconfig.json`. Leverage `never`, `unknown`, and `readonly` where appropriate.
- **State Management**: Prefer Zustand stores for global or cross‑component state. Keep slices small and focused.
- **Data Fetching**: Use React Query or SWR for server state; fallback to `useEffect` + `fetch` only for simple cases.
- **Error Boundaries**: Wrap asynchronous UI sections with error boundaries to prevent whole‑page crashes.
- **Accessibility**: Follow WCAG 2.1 AA; use semantic HTML, ARIA labels, and ensure keyboard navigation.
- **Testing**: Write unit tests for utilities and presentation‑layer logic with Vitest. Aim for ≥80% coverage on critical paths.
- **Linting**: Use ESLint with the plugin `@typescript-eslint` and `eslint-plugin-react`. Fix all errors before committing.
- **Formatting**: Use Prettier with an 80‑character print width; enable auto‑format on save via editor integration.

---

## Tool Usage & Commands

| Tool | Purpose | Typical Usage |
|------|---------|---------------|
| `bun run dev` | Start the Next.js development server with hot reload. | `bun run dev` |
| `bun run build` | Production build. Outputs to `.next`. | `bun run build` |
| `bun run start` | Start the production server after building. | `bun run start` |
| `bun run lint` | Run ESLint across the codebase. | `bun run lint` |
| `bun run typecheck` | Run TypeScript compiler in check‑only mode. | `bun run typecheck` |
| `bun run test` | Execute Vitest test suite. | `bun run test` |
| `bun run db:generate` | Generate Prisma client after schema changes. | `bun run db:generate` |
| `bun run db:push` | Apply Prisma schema changes to the database. | `bun run db:push` |
| `bun run db:studio` | Launch Prisma Studio for GUI data inspection. | `bun run db:studio` |
| `npm run *` | Fallback scripts if using npm instead of bun. | `npm run lint` |

### Scripts Reference (from `package.json`)

- `build:test` – Verifies build capability without running tests.
- `prepare` – Husky installation for git hooks.
- `lint:fix` – Auto‑fix ESLint‑correctable issues.
- `typecheck:watch` – Watch mode for TypeScript checks.

---

## When to Ask for Help

Use the `/question` tool (or ask the AI directly) when you encounter any of the following:

- **Ambiguous Requirements**: The feature description is unclear or missing acceptance criteria.
- **External Dependencies**: Need to integrate a third‑party service, API, or package not already in the project.
- **Breaking Changes**: Proposed modifications that could affect existing consumers or data structures.
- **Security Concerns**: Uncertainty about handling secrets, authentication, or input validation.
- **Performance Issues**: Suspected bottlenecks that require profiling or optimization guidance.
- **Architectural Doubt**: Uncertainty about where to place new code, which pattern to follow, or how to maintain modularity.
- **Testing Challenges**: Difficulty writing effective unit or integration tests for complex logic.
- **CSS/Styling Conflicts**: Styles that are not behaving as expected, or need for scoped solutions.
- **TypeScript Errors**: Persistent type issues that you cannot resolve after reasonable effort.
- **Any Blocking Issue**: Anything that stops you from making progress for more than 15 minutes.

When asking, provide:
- A concise summary of what you're trying to achieve.
- What you've already tried (commands, code snippets, error messages).
- The expected outcome versus the actual result.
- Relevant file paths or function names.

---

## Summary

By adhering to this skill, you ensure that every change you make aligns with the project's vision of **backward compatibility**, **absolute modularity**, **minimalism**, **perfectionism**, **module‑first CSS**, **innovative components**, **cross‑platform unity**, and **precise typography**. Following the routing conventions, engineering standards, and page design principles will keep the codebase clean, maintainable, and ready for rapid iteration.

Let's build great software together—clean, correct, and craft-focused.