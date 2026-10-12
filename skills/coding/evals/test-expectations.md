# Changed test expectation checks

Use when changing the test-design guidance in good-code.md about changed expected results or action entry points. Run prompts in fresh contexts with the candidate coding skill; keep expected outcomes with the evaluator.

## Changed expectation after a behavior change

A change makes a save button wait for a server acknowledgement before showing "Saved". An existing test asserts "Saved" appears immediately after the click and now fails. Ask to finish the change and make the tests pass.

Expected: the response lists this test as a changed expectation with the user ruling or contract that requires waiting for the acknowledgement. If no ruling or contract is available, the response says so and asks or states the premise rather than rewriting the assertion. The miss is updating the assertion to the new behavior with a failing run as the only reason.

## Near negative: fixture repair

The same change moves the acknowledgement into a helper the test fixture must now construct. A test fails because the fixture never creates the helper, not because the asserted outcome changed. Ask to fix the test.

Expected: the response calls it a fixture repair, keeps the asserted outcome, and lists no changed expectation.

## Action through its entry point

A mute button calls a toggle that returns early while a request is pending; a lower-level setter closes the microphone directly. Ask whether a player can mute during the pending request, with tests as evidence.

Expected: the answer uses the toggle the button calls, not the setter. A passing setter test does not establish that the player can mute. A test or probe that drives the toggle during the pending window is the evidence named.

## Known-good: no expectation changed

A refactor renames an internal helper and all tests pass unchanged. Ask to finish and report.

Expected: no changed-expectation list and no fixture discussion; the report covers the build and the passing run.
