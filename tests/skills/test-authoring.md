# Test Authoring Standard

Use this standard whenever you are asked to author or refine test cases for any testing layer, including component, integration, or end-to-end testing.

## Objective

Produce clear, reusable, behavior-based test cases that reflect the real application and the actual exploration notes. The goal is to create test cases that are accurate, maintainable, and useful in a portfolio or real team environment.

## Core principles

1. Base every case on the real feature, component, or user flow in the application.
2. Write test cases that describe user-visible behavior, not implementation details.
3. Prefer accessible queries and user-driven interaction patterns.
4. Keep the test names outcome-oriented and specific.
5. Cover happy paths, user errors, and edge conditions in the relevant testing layer.
6. Avoid generic, invented, or unrealistic scenarios that do not match the product.
7. Keep the suite small, readable, and maintainable.

## Testing layer rules

### Component tests

Component tests focus on isolated UI behavior, rendering, interaction, props, and local state.

Use them to verify:

- the component renders correctly
- user interactions trigger the expected output
- validation states and edge cases are handled
- accessible labels and roles behave as expected

### Integration tests

Integration tests focus on coordinated app behavior across multiple components and the data flow between UI, state, and external boundaries.

Use them to verify:

- multi-step user flows
- app state coordination
- request/response handling
- loading, empty, and error states
- the behavior of the feature as a whole

### E2E tests

E2E tests focus on the highest-value browser journeys and critical product flows.

Use them to verify:

- end-user journeys in a real browser
- the product works in realistic runtime conditions
- the most important flows survive across UI and environment changes

## Required case format

Each test case must follow this exact format:

- Title: behavior-based and specific, for example `Login rejects empty password`
- Preconditions: setup required before the action begins
- Steps: clear sequence of actions
- Expected result: observable outcome that proves the behavior works or fails correctly

## Required categories

Every feature or component must be covered in all three categories:

### Positive

Cover the intended behavior with valid input and correct user actions. Validate that the feature works as expected in normal conditions.

### Negative

Cover invalid or unsupported input. Include empty values, malformed data, wrong values, unsupported states, and cases that should be rejected or ignored.

### Edge

Cover boundary conditions. Include zero, minimum, maximum, just below or above limits, empty states, loading states, and threshold scenarios when relevant.

## Writing standards

- Use clear, concise titles that describe the behavior.
- Keep steps short and sequential.
- Make expected results observable and testable.
- Prefer user-facing language over internal implementation terms.
- Group cases by category for readability.
- Do not mix unrelated scenarios in a single case.
- Prefer accessible queries like role, label, text, and form semantics over implementation details.

## Anti-patterns to avoid

- Testing internal state instead of user-visible behavior
- Asserting mock-only behavior instead of actual output
- Testing function calls instead of UI outcomes
- Overusing broad fixtures that hide the real behavior under test
- Writing duplicate tests with only different wording
- Mocking too much of the app instead of the external boundary
- Mixing component, integration, and E2E responsibilities in one test

## Fixtures and setup rules

- Shared setup belongs in a fixture.
- Do not duplicate setup across multiple tests.
- Keep fixtures responsible for realistic state preparation and provider setup.
- Use fixtures to represent real app state, not artificial test-only behavior.
- Keep the fixture simple and readable.
- Use a shared render helper only for common provider composition.

## API and network mocking rules

For integration tests:

- Prefer mocking the external API boundary using MSW or an equivalent HTTP-level interceptor.
- Mock the network, not the app logic.
- Validate the real request/response flow and the UI behavior after the response.
- Cover loading, success, and failure states at the network boundary.

## Naming conventions

Use names that describe the user outcome, not the internal mechanics.

Prefer:

- `renders the conversion result after valid input`
- `shows empty state when amount is missing`
- `rejects invalid currency inputs`

Avoid:

- `calls setFirstAmount`
- `updates context state`
- `invokes fetch function`

## Quality gate

Before finalizing, confirm:

- The case reflects the real application and exploration notes.
- The title clearly describes the user-visible behavior.
- The case belongs to the correct category and testing layer.
- The expected result is observable and testable.
- The test is readable, maintainable, and not over-mocked.
- The assertion is based on real behavior, not implementation details.
- The setup is minimal and reusable without hiding the feature being tested.

## Final summary

This is the reusable authoring standard for test writing across testing layers. It is designed to produce tests that are outcome-focused, maintainable, realistic, and suitable for both portfolio work and production quality engineering.
