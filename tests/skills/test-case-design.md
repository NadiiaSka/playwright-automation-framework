# Test Case Design Standard

Use this standard whenever you are asked to design test cases from a feature and its exploration notes.

## Objective

Produce a complete test matrix for the feature using the real app behavior, not generic examples. Base each case on the actual component or flow under review and the recorded exploration notes.

## Required structure for every test case

Each test case must use this format:

- Title: a short behavior-focused title, for example: `Login rejects empty password`
- Preconditions: the setup needed before the action starts
- Steps: the exact user or system actions to perform
- Expected result: the observable outcome that proves the feature works correctly

## Required categories

Every feature must be covered in all three categories:

### Positive

Cover valid input and the happy path. The feature must work as intended when the user provides correct, expected values.

### Negative

Cover invalid input and rejected behavior. Include empty fields, wrong values, malformed format, unexpected values, and states that should not be accepted.

### Edge

Cover boundary behavior. Include values such as zero, minimum, maximum, just-below-minimum, just-above-maximum, empty, max length, and time/date boundaries when relevant.

## Rules for the agent

1. Read the feature and its exploration notes first.
2. Extract only behaviors that are relevant to the real application.
3. Use the app’s actual data flow, UI states, and business rules from the exploration notes.
4. Do not invent generic test cases that do not map to the app.
5. Produce a single complete matrix for the feature, grouped by category.
6. Keep titles outcome-based and user-facing.
7. Include both visible UI behavior and any required state change.
8. If the exploration notes mention a known issue or mismatch, add it as a planned regression case and label it clearly.
9. If a case is only relevant because of a discovered bug or limitation, say so in the expected result or preconditions.

## Coverage checklist

Before finishing, confirm the matrix includes:

- Positive path coverage
- Negative rejection coverage
- Edge boundary coverage
- The real app flow from the exploration notes
- Known bug awareness and regression tracking

## Output style

Write the result in a concise, structured format. Keep it practical and implementation-ready for the project’s test documentation.

## Reminder

A known bug is not a reason to skip coverage. It is a reason to add a regression case that documents the current limitation and the expected future behavior.
