# Bugs & Issues

## Bug 1: Photo Upload Silent Failure

**Description:** Photo upload appears unresponsive; eventually shows timeout error.

**How to Reproduce:**

1. Click "Upload Photo" during event creation
2. Select or take photo
3. No photo preview appears
4. Eventually shows: "ERROR Error uploading image(s): Firebase Storage: Max retry time for operation exceeded"

**Platform:** Both iOS & Android

---

## Bug 2: Feedback Navigation Glitch

**Description:** Viewing feedback for non-first closed event causes brief wrong page load and extra back steps.

**How to Reproduce:**

1. Have multiple closed events
2. View feedback for second/later event
3. Briefly sees first event's page first
4. Back button requires extra press

**Platform:** Both iOS & Android

---

## Bug 3: Empty Address Causes Event Creation Failure

**Description:** Event creation fails when Location address field is empty, showing only generic error.

**How to Reproduce:**

1. Create new event as admin
2. Leave Location address field empty
3. Submit form
4. Shows: "Error failed to create event"

**Platform:** Both iOS & Android
