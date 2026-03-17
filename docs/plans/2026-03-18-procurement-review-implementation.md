# Procurement Review Workspace Implementation Plan

> **For implementer:** Use TDD throughout. Write failing test first. Watch it fail. Then implement.

**Goal:** Rebuild `docx-ai-editor` into a procurement-archive review workspace that supports mixed-rule review, structured findings, document navigation, suggestion handling, and review report export.

**Architecture:** Keep the existing React + Vite + SuperDoc base, but reorganize the app around domain modules: `document`, `rules`, `review`, and `report`. Introduce a `ReviewOrchestrator` service that coordinates a deterministic rule engine, an AI review client, and a merger layer that produces normalized `Finding` objects for the UI.

**Tech Stack:** React 19, Vite, Vitest, Testing Library, SuperDoc, existing OpenRouter/Ollama integrations, local component state + Context/reducer.

---

## Task 1: Add review domain models

**Files:**
- Create: `src/domains/review/model/review-models.js`
- Create: `src/domains/review/model/__tests__/review-models.test.js`

**Step 1: Write the failing test**
Create tests that assert factory helpers return normalized objects for:
- `createFinding()`
- `createSuggestion()`
- `createReviewTask()`
- `createReviewReport()`

Test cases must verify default values for:
- `severity = "medium"`
- `status = "open"`
- `sourceType = "hybrid"`
- `confidence = 0.5`
- empty arrays are safely initialized

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/model/__tests__/review-models.test.js`
Expected: FAIL — module or exported functions not found

**Step 3: Write minimal implementation**
Implement plain factory helpers that normalize input into consistent review-domain objects.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/model/__tests__/review-models.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/model && git commit -m "feat: add review domain models"`

---

## Task 2: Add rules domain normalizer

**Files:**
- Create: `src/domains/rules/services/rule-normalizer.js`
- Create: `src/domains/rules/services/__tests__/rule-normalizer.test.js`

**Step 1: Write the failing test**
Add tests for `normalizeRuleSet()` and `normalizeRule()` that verify:
- system and user rule sources are preserved
- missing IDs are generated
- unknown `checkType` falls back to `semantic_review`
- missing severity defaults to `medium`
- string-only input can be normalized into a rule shell

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/rules/services/__tests__/rule-normalizer.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement normalization helpers that return deterministic `Rule` / `RuleSet` structures.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/rules/services/__tests__/rule-normalizer.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/rules/services && git commit -m "feat: add rule normalization service"`

---

## Task 3: Add deterministic rule engine MVP

**Files:**
- Create: `src/domains/review/services/rule-engine.js`
- Create: `src/domains/review/services/__tests__/rule-engine.test.js`
- Modify: `src/domains/review/model/review-models.js`

**Step 1: Write the failing test**
Add tests for `runRuleChecks(document, rules)` covering:
- required section missing => finding created
- required keyword present => no finding
- short section content => finding created with `sourceType = "system_rule"`
- field mismatch => finding created with evidence and location

Use a small mock document segmented by headings/paragraphs.

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/services/__tests__/rule-engine.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a synchronous MVP rule engine that supports:
- `required_presence`
- `structure_check`
- `field_consistency`

Return normalized `Finding` objects.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/services/__tests__/rule-engine.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/services src/domains/review/model && git commit -m "feat: add review rule engine mvp"`

---

## Task 4: Add AI output schema validator

**Files:**
- Create: `src/domains/review/services/ai-review-schema.js`
- Create: `src/domains/review/services/__tests__/ai-review-schema.test.js`

**Step 1: Write the failing test**
Add tests for `normalizeAIReviewResult()` that verify:
- valid AI findings pass through
- invalid severity is corrected to `medium`
- missing title/description causes item rejection
- missing location gets a safe fallback
- malformed payload returns empty findings array rather than throwing

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/services/__tests__/ai-review-schema.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a schema-normalization layer that sanitizes untrusted AI output before UI consumption.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/services/__tests__/ai-review-schema.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/services && git commit -m "feat: add ai review schema normalization"`

---

## Task 5: Add finding merger service

**Files:**
- Create: `src/domains/review/services/finding-merger.js`
- Create: `src/domains/review/services/__tests__/finding-merger.test.js`

**Step 1: Write the failing test**
Add tests for `mergeFindings(ruleFindings, aiFindings)` verifying:
- duplicate findings at same location are merged
- evidence arrays are combined
- higher severity wins
- user-rule finding keeps precedence over system-rule finding
- unresolved conflicts are marked `needs_review`

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/services/__tests__/finding-merger.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement merger logic keyed by title + location + category with source precedence rules.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/services/__tests__/finding-merger.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/services && git commit -m "feat: add finding merger service"`

---

## Task 6: Add document location mapper

**Files:**
- Create: `src/domains/document/services/location-mapper.js`
- Create: `src/domains/document/services/__tests__/location-mapper.test.js`

**Step 1: Write the failing test**
Add tests for `resolveFindingLocation(segments, hint)` verifying:
- exact segment ID match
- anchor text fallback
- heading-nearest fallback for missing sections
- safe null return when nothing matches

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/document/services/__tests__/location-mapper.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a conservative mapper that resolves findings to segment-based navigation targets.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/document/services/__tests__/location-mapper.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/document/services && git commit -m "feat: add document location mapper"`

---

## Task 7: Add review orchestrator

**Files:**
- Create: `src/domains/review/services/review-orchestrator.js`
- Create: `src/domains/review/services/__tests__/review-orchestrator.test.js`
- Modify: `src/domains/review/services/rule-engine.js`
- Modify: `src/domains/review/services/ai-review-schema.js`
- Modify: `src/domains/review/services/finding-merger.js`

**Step 1: Write the failing test**
Add tests for `runReviewSession({ document, rules, aiReviewer })` verifying:
- rule engine and AI reviewer are both invoked
- AI output is normalized before merging
- merged findings are returned in stable order
- AI failure degrades gracefully to rule-only findings

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/services/__tests__/review-orchestrator.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement orchestration logic that composes rule engine, AI reviewer, schema validator, and merger.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/services/__tests__/review-orchestrator.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/services && git commit -m "feat: add review orchestrator"`

---

## Task 8: Add report builder

**Files:**
- Create: `src/domains/report/services/report-builder.js`
- Create: `src/domains/report/services/__tests__/report-builder.test.js`

**Step 1: Write the failing test**
Add tests for `buildReviewReport({ document, findings, ruleSets })` verifying:
- summary counts are correct
- high-risk findings are surfaced first
- rule source metadata is included
- dismissed findings can be excluded

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/report/services/__tests__/report-builder.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a report builder returning a normalized `ReviewReport` object.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/report/services/__tests__/report-builder.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/report/services && git commit -m "feat: add review report builder"`

---

## Task 9: Build review session state hook

**Files:**
- Create: `src/domains/review/hooks/useReviewSession.js`
- Create: `src/domains/review/hooks/__tests__/useReviewSession.test.js`
- Modify: `src/hooks/useLLM.js`

**Step 1: Write the failing test**
Add tests verifying:
- initial idle state
- start review transitions to reviewing
- successful review stores findings and summary
- failed review stores error
- selecting a finding updates active detail state

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/hooks/__tests__/useReviewSession.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a reducer-based hook that wraps the orchestrator and exposes workspace-friendly review actions.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/hooks/__tests__/useReviewSession.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/hooks src/hooks/useLLM.js && git commit -m "feat: add review session hook"`

---

## Task 10: Build findings panel component

**Files:**
- Create: `src/domains/review/components/FindingsPanel.jsx`
- Create: `src/domains/review/components/FindingsPanel.css`
- Create: `src/domains/review/components/__tests__/FindingsPanel.test.jsx`

**Step 1: Write the failing test**
Add component tests covering:
- empty state rendering
- findings grouped by severity
- filter callbacks
- selecting a finding
- source badges and severity badges display

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/components/__tests__/FindingsPanel.test.jsx`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a right-panel findings list component driven by structured `Finding` objects rather than chat messages.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/components/__tests__/FindingsPanel.test.jsx`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/components && git commit -m "feat: add findings panel"`

---

## Task 11: Build finding detail component

**Files:**
- Create: `src/domains/review/components/FindingDetail.jsx`
- Create: `src/domains/review/components/FindingDetail.css`
- Create: `src/domains/review/components/__tests__/FindingDetail.test.jsx`

**Step 1: Write the failing test**
Add tests covering:
- evidence rendering
- rule source rendering
- location action callback
- copy suggestion callback
- dismiss / accept state callbacks

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/review/components/__tests__/FindingDetail.test.jsx`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement structured finding detail UI with actions for locate, copy, apply, dismiss, and accept.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/review/components/__tests__/FindingDetail.test.jsx`
Expected: PASS

**Step 5: Commit**
`git add src/domains/review/components && git commit -m "feat: add finding detail panel"`

---

## Task 12: Build rule drawer component

**Files:**
- Create: `src/domains/rules/components/RuleDrawer.jsx`
- Create: `src/domains/rules/components/RuleDrawer.css`
- Create: `src/domains/rules/components/__tests__/RuleDrawer.test.jsx`

**Step 1: Write the failing test**
Add tests covering:
- rendering system and user rule groups
- showing parsing status
- toggling active/inactive rule sets
- previewing extracted rule summaries

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/rules/components/__tests__/RuleDrawer.test.jsx`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement a drawer for viewing rule sources and activation state.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/rules/components/__tests__/RuleDrawer.test.jsx`
Expected: PASS

**Step 5: Commit**
`git add src/domains/rules/components && git commit -m "feat: add rule drawer"`

---

## Task 13: Build report preview component

**Files:**
- Create: `src/domains/report/components/ReportPreviewPanel.jsx`
- Create: `src/domains/report/components/ReportPreviewPanel.css`
- Create: `src/domains/report/components/__tests__/ReportPreviewPanel.test.jsx`

**Step 1: Write the failing test**
Add tests covering:
- summary stats rendering
- high-risk section rendering
- include/exclude dismissed toggle
- export action callback

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/report/components/__tests__/ReportPreviewPanel.test.jsx`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement report preview UI backed by `ReviewReport`.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/report/components/__tests__/ReportPreviewPanel.test.jsx`
Expected: PASS

**Step 5: Commit**
`git add src/domains/report/components && git commit -m "feat: add report preview panel"`

---

## Task 14: Wire document navigation into findings workflow

**Files:**
- Modify: `src/components/DocumentEditor.jsx`
- Modify: `src/api/docx-utils.js`
- Create: `src/domains/document/services/suggestion-applier.js`
- Create: `src/domains/document/services/__tests__/suggestion-applier.test.js`

**Step 1: Write the failing test**
Add tests for `applySuggestion()` verifying:
- insert suggestion mode
- replace suggestion mode
- failed adapter call returns structured error

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/domains/document/services/__tests__/suggestion-applier.test.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Implement an adapter-backed suggestion applier and connect finding location callbacks to existing document editor APIs.

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/domains/document/services/__tests__/suggestion-applier.test.js`
Expected: PASS

**Step 5: Commit**
`git add src/components/DocumentEditor.jsx src/api/docx-utils.js src/domains/document/services && git commit -m "feat: wire suggestion application into document workspace"`

---

## Task 15: Rebuild the main workspace shell around review flow

**Files:**
- Create: `src/app/AppShell.jsx`
- Modify: `src/App.jsx`
- Modify: `src/App.css`
- Modify: `src/components/DualPanelLayout.jsx`
- Modify: `src/components/ChatPanel.jsx`

**Step 1: Write the failing test**
Add integration-oriented component tests covering:
- upload state => review preparation state
- start review => findings panel visible
- selecting finding => detail + document locate callback wired
- chat panel rendered as auxiliary area, not primary result surface

**Step 2: Run test — confirm it fails**
Command: `bun vitest run src/App.test.jsx`
Expected: FAIL

**Step 3: Write minimal implementation**
Rebuild the main app shell so the primary workflow is:
- document left
- findings right
- chat auxiliary
- report/rule drawers secondary

**Step 4: Run test — confirm it passes**
Command: `bun vitest run src/App.test.jsx`
Expected: PASS

**Step 5: Commit**
`git add src/app src/App.jsx src/App.css src/components/DualPanelLayout.jsx src/components/ChatPanel.jsx && git commit -m "feat: rebuild app shell around procurement review workflow"`

---

## Task 16: Final integration verification

**Files:**
- Modify: `__tests__/integration/review-workflow.test.js` (create if missing)
- Modify: `__tests__/e2e/flows/procurement-review.spec.js` (create if missing)
- Modify: `docs/plans/2026-03-18-procurement-review-design.md` (optional status notes)

**Step 1: Write the failing test**
Add one integration test and one E2E test for the full happy path:
- upload procurement archive
- load built-in rules
- run review
- inspect finding
- navigate to document
- export report

**Step 2: Run test — confirm it fails**
Commands:
- `bun vitest run __tests__/integration/review-workflow.test.js`
- `bun playwright test __tests__/e2e/flows/procurement-review.spec.js`
Expected: FAIL

**Step 3: Write minimal implementation**
Patch any missing glue code required to satisfy the full review workflow.

**Step 4: Run test — confirm it passes**
Commands:
- `bun vitest run __tests__/integration/review-workflow.test.js`
- `bun playwright test __tests__/e2e/flows/procurement-review.spec.js`
Expected: PASS

**Step 5: Commit**
`git add __tests__ docs/plans && git commit -m "test: verify procurement review workflow end to end"`

---

## Suggested execution order
1. Tasks 1–8 (domain and service foundation)
2. Tasks 9–13 (state and UI panels)
3. Tasks 14–15 (document/editor/workspace wiring)
4. Task 16 (integration verification)

## Notes for implementers
- Do not start by editing `App.jsx` first.
- Preserve existing OpenRouter and Ollama integrations; adapt behind stable interfaces.
- Prefer segment-level location over fragile character offsets.
- Chat remains available, but findings must become the primary result model.
- Keep commits small and aligned to one task each.
