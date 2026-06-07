# Login Page Test Plan

## Objective
Validate the BridgeConnect login page using the DOM artifact as the source of truth for stable selectors and field behavior.

## Scope
- Verify the email field, password field, and submit button are visible and usable.
- Exercise happy-path, negative, edge-case, and navigation scenarios on the pre-auth login page only.
- Keep the test suite reusable for similar login pages by relying on field type and button text rather than project-specific logic.

## Assumptions
- The application under test is the public login page at https://qa.bridgeconnect.uk.
- Credentials are supplied through environment variables when available; otherwise deterministic sample values are used for form interaction tests.
- The test suite intentionally avoids post-login assertions because the prompt explicitly limits scope to the pre-auth login page.

## Test Data
- Valid username: BRIDGECONNECT_VALID_USER (fallback: qa@example.com)
- Valid password: BRIDGECONNECT_VALID_PASSWORD (fallback: Password123!)
- Invalid username: BRIDGECONNECT_INVALID_USER (fallback: invalid@example.com)
- Invalid password: BRIDGECONNECT_INVALID_PASSWORD (fallback: WrongPassword!)
- Long input payloads and special-character payloads are generated in the test file for edge-case coverage.

## Test Scenarios
### Happy Path
- Enter valid credentials and submit the form.
- Confirm the login form remains available for validation on this pre-auth screen.

### Negative Scenarios
- Invalid username + valid password.
- Valid username + invalid password.
- Empty username + empty password.

### Edge Cases
- Extremely long username/password inputs.
- Special characters in inputs.
- Leading/trailing whitespace normalization on the form fields.
- Rapid repeated login attempts to confirm the form remains stable.

### Navigation Behavior
- Reload the page and confirm the login form is still present.
- Navigate away and back to confirm the page restores its login controls.
