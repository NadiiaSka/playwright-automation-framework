# Flake Triage

## Purpose

Use this standard whenever a test fails. Decide whether the failure is a real product bug or a flaky test before drawing any conclusion.

## Required workflow

Follow this checklist in order before classifying the result:

1. Consistency
   - Re-run the same test a few times when the result is unclear.
   - If it fails every time, it leans toward a real bug.
   - If it fails only intermittently, it leans toward a flaky test.

2. Cause
   - Check whether the app is behaving incorrectly in the actual page state.
   - Or whether the test is timing out, racing, or using a fragile locator.
   - Real failures usually show the app in a bad state.
   - Flaky failures usually show test confusion, timing issues, or locator instability.

3. Evidence
   - Inspect the trace and the DOM state.
   - Confirm whether the app genuinely reached a broken state.
   - Or whether the test looked too early, missed the element, or relied on a brittle selector.

4. Classification
   - State clearly: "REAL BUG" or "FLAKY TEST".
   - Do not hedge or skip the classification.

5. Recommendation
   - If the result is a real bug, use the bug-reporting workflow and document the defect clearly.
   - If the result is flaky, name the fix specifically, for example: better locator, remove sleep, wait for the correct condition, improve isolation, or stabilize setup.
   - Do not file a bug for a flaky test.
6. Correction and verification
   - Fix the product behavior or test synchronization/data causing the failure.
   - Never remove, skip, weaken, or loosen assertions to make a failing test pass.
   - Rerun the affected test and report its exact command and outcome.
   - For CI failures, inspect the original job logs and artifacts. The optional
     AI diagnosis covers API, functional, accessibility, and security
     Playwright jobs only; verify its suggestions against the evidence.
   - Push the correction so CI runs again. A human reviews and merges the PR.

## Short decision rules

- Consistent failure + broken app state = REAL BUG
- Intermittent failure + timing/locator issue = FLAKY TEST
- Unclear result = re-run the test a few times and re-check the trace before deciding

## Output format

Provide a short triage note with:

- Failure summary
- Consistency check result
- Cause analysis
- Evidence from the trace or page state
- Final classification: REAL BUG or FLAKY TEST
- Recommendation and next action

## Guardrails

- Do not conclude after one failed run when the pattern is unclear.
- Do not blame the app without checking the trace.
- Do not file a bug for a flaky test.
- Do not claim a CI failure was corrected until the relevant test passes.
- Do not treat AI-generated diagnosis as authoritative.
- Keep the triage concise and evidence-based.

## Repository commands

Use the narrowest applicable command:

| Area | Command |
| --- | --- |
| Lint | `npm run lint` |
| CI build | `npm run build:ci` |
| Python agent | `.\.venv\Scripts\python.exe -m unittest agent.test_orchestrator` |
| Components | `npm run test:component` |
| Integration | `npm run test:integration` |
| API | `npm run test:api` |
| Functional browser flow | `npm run test:functional` |
| Accessibility | `npm run test:accessibility` |
| Security | `npm run test:security` |
| Visual (informational in CI) | `npm run test:visual` |

This JavaScript project has no `typecheck` script. Firefox/WebKit,
cross-browser, visual, and performance jobs are informational; do not describe
them as blocking checks.
