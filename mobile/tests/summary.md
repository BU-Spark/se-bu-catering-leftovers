# Firebase Test Suite Summary

## User CRUD Tests (4 tests)

| Test                        | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| **test_user_create**        | Creates Firestore user document with required fields               |
| **test_user_read**          | Reads user document and verifies email and role                    |
| **test_user_preferences**   | Updates location and food preferences, verifies array counts       |
| **test_user_accept_terms**  | Updates agreedToTerms flag and confirms change                     |

## Event CRUD Tests (6 tests)

| Test                          | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| **test_event_create**         | Creates open event with foods, links to user, verifies ID          |
| **test_event_create_drafted** | Creates drafted event with future timestamp                        |
| **test_event_read**           | Fetches single event and verifies name and host fields             |
| **test_event_update**         | Updates event name and notes, verifies changes persisted           |
| **test_event_status_change**  | Changes event status from open to closed                           |
| **test_list_open_events**     | Queries only events with status='open', ordered by foodAvailable   |
| **test_event_fetch_by_ids**   | Uses IN query to fetch multiple events by document IDs             |

## Review CRUD Tests (3 tests)

| Test                            | Purpose                                                                 |
| ------------------------------- | ----------------------------------------------------------------------- |
| **test_review_create**          | Creates review with contact sharing, updates reviewedBy and user.reviews |
| **test_review_without_contact** | Creates anonymous review (shareContact=false), verifies contact absence  |
| **test_review_list**            | Lists all reviews for an event, verifies count                          |

## Edge Case Tests (3 tests)

| Test                         | Purpose                                                               |
| ---------------------------- | --------------------------------------------------------------------- |
| **test_array_operations**    | Verifies arrayUnion deduplication and removeAllFromArray deletion      |
| **test_batch_atomicity**     | Uses batch commit to update event and user atomically                  |
| **test_pagination**          | Fetches events with limit=2 to test pagination logic                   |

---

## Running the Tests

```bash
# Start Firebase emulator
firebase emulators:start

# In another terminal
chmod +x test_firebase.sh
./test_firebase.sh
```

## Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed (count shown in output)
