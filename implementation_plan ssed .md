# Implementation Plan: Fix Identified Bugs & Improve Code Quality

We will address the core functional bugs, security vulnerabilities, performance bottlenecks, and code quality issues identified in our codebase review.

---

## Proposed Changes

### 1. Security & Authentication Guard Fix
#### [MODIFY] [middleware.js](file:///c:/practicals/next_js_projects/project-a/middleware.js)
- Fix the `isPublicRoute` calculation to avoid matching every path starting with `/`.
- Ensure exact matching for the root route `/` and prefix matching for sub-routes like `/about`, `/contact`, `/auth/`, and `/api/auth`.

### 2. Task Deletion Bug Fix
#### [MODIFY] [page.js (tasks)](file:///c:/practicals/next_js_projects/project-a/src/app/tasks/page.js)
- Correct the deletion endpoint from `/api/fetch_data?id=...` to `/api/tasks`.
- Send a `DELETE` request with the JSON payload `{ id: taskId }` matching the REST handler in `src/app/api/tasks/route.js`.
- Correct the redirect fallback after session validation from the non-existent `/profile` to `/tasks`.

### 3. Forgot Password Placeholder Page
#### [NEW] [page.js (forgot-password)](file:///c:/practicals/next_js_projects/project-a/src/app/forgot-password/page.js)
- Create a basic "Forgot Password" UI form component so that users visiting or clicking this link do not receive a 404.
#### [MODIFY] [page.js (signin)](file:///c:/practicals/next_js_projects/project-a/src/app/auth/signin/page.js)
- Correct the "Forgot password?" Link target from the invalid `/auth/forgot-password` to `/forgot-password`.

### 4. Non-Standard API Route Folder Rename
- Move API route files from `src/app/api/master.js/route.js` to `src/app/api/master/route.js` [NEW].
- Delete the old folder `src/app/api/master.js` [DELETE].
#### [MODIFY] [TaskCard.js](file:///c:/practicals/next_js_projects/project-a/src/app/Components/TaskCard.js)
- Update the AI analysis fetch URL from `/api/master.js` to `/api/master`.

### 5. Web Fonts Performance Cleanup
#### [MODIFY] [layout.tsx](file:///c:/practicals/next_js_projects/project-a/src/app/layout.tsx)
- Keep only `Readex_Pro`, `Kite_One`, and `DM_Sans` (the active project design fonts) and remove the other 7 unused Google Fonts to reduce web page load times.

### 6. SSR (Server-Side Rendering) Fix
#### [MODIFY] [ThemeProvider.js](file:///c:/practicals/next_js_projects/project-a/src/app/Components/ThemeProvider.js)
- Default theme state to `'dark'` instead of `null` and remove the `if (!theme) return null;` SSR block. This enables Server-Side Rendering (SSR) for the application and prevents a blank flash on initial page load.

### 7. Database Connection Pool Singleton
#### [MODIFY] [db.js](file:///c:/practicals/next_js_projects/project-a/src/app/lib/db.js)
- Cache the connection pool in `global.mysqlPool` during development to avoid pool duplication and exhausted DB connections during hot-reloads.

### 8. React Hooks & Auto-Save Optimization
#### [MODIFY] [TaskEditor.js](file:///c:/practicals/next_js_projects/project-a/src/app/Components/TaskEditor.js)
- Wrap functional dependencies (`preserveCursorPosition`, `performSave`, `getPlainText`, `hasContentChanged`) in `useCallback` to prevent the auto-save `useEffect` hook from executing on every render cycle.
- Consolidate auto-save timers to prevent duplicate save triggers.
#### [MODIFY] [route.js (tasks api)](file:///c:/practicals/next_js_projects/project-a/src/app/api/tasks/route.js)
- Standardize all task update queries (`PUT`, `PATCH`, `DELETE`) to use `.execute()` instead of `.query()`, matching the prepared statements standard.

### 9. Next.js 15 Compatibility
#### [MODIFY] [route.js (profile API)](file:///c:/practicals/next_js_projects/project-a/src/app/api/profile/[username]/route.js)
- Await dynamic route parameter `params` asynchronously before destructuring, e.g. `const { username } = await params;` to comply with Next.js 15 standards.

---

## Verification Plan

### Automated Tests
- Run `npm run lint` to verify that all React hook warning/lint issues in `TaskEditor.js` have been resolved.
- Run `npm run build` to verify that Next.js compilation succeeds and there are no async param warnings or syntax errors.
