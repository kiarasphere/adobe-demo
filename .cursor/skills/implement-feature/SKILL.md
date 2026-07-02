---
name: implement-feature
description: Implement a feature end-to-end from a Jira ticket, issue URL, or plain-text description — gather context, plan, build following repo conventions, verify against acceptance criteria, and hand off. Use when the user asks to build, implement, or ship a feature, or points at a ticket to work on.
---

# Implement a feature end-to-end

Use this skill to take a feature from an intake source all the way to a reviewed, tested, handed-off change. Applies to any feature request in this React Spectrum monorepo, whether it targets a component package (e.g. `@react-spectrum/s2`) or an example app (e.g. `examples/rsp-cra-18`).

Trigger this skill when the user:

- asks to build, implement, add, or ship a feature, or
- points at a Jira ticket (e.g. `KT-5`), a GitHub issue URL, or a plain-text description of work to do.

## Workflow

Follow these five phases in order. Do not skip verification.

### 1. Gather context

- **Read the source of truth.** If given a Jira ticket, fetch it (via the Atlassian tools) and read its **Background**, **Goal**, **Scope / implementation notes**, and **Acceptance criteria**. If given a GitHub issue URL, read the issue. If given plain text, treat it as the spec.
- **Locate the target.** Identify the package and files named in the ticket's "Scope / Notes" section (most S2 tickets are scoped to `packages/@react-spectrum/s2`; demo-app tickets are scoped to `examples/rsp-cra-18/src/App.tsx`).
- **Study neighbors.** Read 1–2 existing components most similar to the requested one and mirror their structure, prop patterns, theming, and story layout. Do not invent new conventions.
- **Restate the goal and acceptance criteria** back as your definition of done before writing code.

### 2. Plan

- List the concrete files to add or change. For a new S2 component the standard set is:
  - `packages/@react-spectrum/s2/src/<Component>.tsx` — the component (follow S2 conventions: `forwardRef`, the `style` macro, `UNSAFE_className`/`styles` props, light/dark theming, Spectrum scales; build interaction/keyboard behavior on React Aria where possible).
  - `packages/@react-spectrum/s2/exports/<Component>.ts` — re-export the component, its context, and its `Props` type (mirror `exports/Badge.ts`).
  - `packages/@react-spectrum/s2/exports/index.ts` — add the `export {…}` and `export type {…}` lines in the correct alphabetical position.
  - `packages/@react-spectrum/s2/stories/<Component>.stories.tsx` — a Storybook story covering each visual state, so it appears in the storyboard (mirror `stories/Badge.stories.tsx`).
- For a demo-app feature, scope changes to the file named in the ticket and reuse React Spectrum components rather than hand-rolled markup.
- Map each acceptance-criteria bullet to something you will build and later verify.
- For a complex feature, capture the plan as todos and work them one at a time.

### 3. Build following repo conventions

- **Node/yarn:** the repo requires **Node 24**. If `node --version` reports v22, run `export PATH="$HOME/.nvm/versions/node/v24.17.0/bin:$PATH"` before using `yarn`. Never edit `/exec-daemon/node`.
- Match the copyright header, import ordering, `forwardRef` usage, and export shape of neighboring components.
- Keep the change scoped to the ticket. Do not refactor unrelated code.
- Add/keep accessibility: correct ARIA roles/labels, full keyboard support, and focus handling, as most tickets require it explicitly.

### 4. Verify against acceptance criteria

Run the repo checks (all pass before hand-off):

- `yarn check-types` — fast `tsgo` type check.
- `yarn jest <path-to-test>` — focused unit tests for the component's props and events. Add tests when the package convention expects them.
- `yarn lint` — heavier: `check-types` + `eslint packages` + package lint + yarn constraints.

Then **manually verify in Storybook**, which is the primary dev experience and the best evidence for UI work:

- `yarn start` serves Storybook at http://localhost:9003 (the preview finishes its first build ~10–15s after the manager starts).
- Open the new/updated story and walk through every acceptance-criteria bullet (states, keyboard nav, light/dark theme, scales). Capture a screenshot or short recording as the walkthrough artifact.
- For demo-app tickets, run the example app and exercise the feature end-to-end.

If any criterion fails, fix and re-verify. Do not hand off partially working work as complete.

### 5. Hand off

- Stage and commit with a clear, conventional message referencing the ticket (e.g. `feat(s2): add Rating component (KT-5)`). Create one commit per logical change.
- Push the branch and open (or update) a PR, following the repo's pull request template and CONTRIBUTING guidance: clear description, reference the issue/ticket, note that lint/tests pass, and mention the added/updated stories.
- In the summary, list the checks you ran and include the Storybook screenshot/recording that demonstrates the acceptance criteria are met.

## Definition of done

- Every acceptance-criteria bullet is satisfied and demonstrated.
- `yarn check-types`, `yarn lint`, and relevant `yarn jest` runs pass.
- A Storybook story (or demo-app change) shows the feature working in light and dark themes.
- Changes are committed, pushed, and captured in a PR referencing the source ticket/issue.
