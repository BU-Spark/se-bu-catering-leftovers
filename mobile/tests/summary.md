# Firebase Test Suite Summary

## 🔐 Authentication Tests (4 tests)

| Test                           | Purpose                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| **test_auth_signup**           | Creates a test user account and verifies UID and ID token are returned |
| **test_auth_signin**           | Signs in with correct credentials and verifies token issuance          |
| **test_auth_wrong_password**   | Ensures authentication fails with incorrect password                   |
| **test_auth_nonexistent_user** | Ensures authentication fails for non-registered email                  |

## 👤 User CRUD Tests (5 tests)

| Test                           | Purpose                                                                  |
| ------------------------------ | ------------------------------------------------------------------------ |
| **test_user_doc_create**       | Creates Firestore user document with all required fields                 |
| **test_user_doc_read**         | Reads user document and verifies email, role, and terms agreement status |
| **test_user_pref_updates**     | Updates location and food preferences, verifies array counts             |
| **test_user_accept_terms**     | Updates agreedToTerms flag and confirms change                           |
| **test_user_nonexistent_read** | Verifies 404 status when reading non-existent user                       |

## 📅 Event CRUD Tests (8 tests)

| Test                          | Purpose                                                              |
| ----------------------------- | -------------------------------------------------------------------- |
| **test_event_create**         | Creates open event with foods, links to user, verifies ID generation |
| **test_event_create_drafted** | Creates drafted event with future timestamp                          |
| **test_event_read**           | Fetches single event and verifies name and host fields               |
| **test_event_update**         | Updates event name and notes, verifies changes persisted             |
| **test_event_status_change**  | Changes event status from open to closed                             |
| **test_list_open_events**     | Queries only events with status='open', ordered by foodAvailable     |
| **test_event_fetch_by_ids**   | Uses IN query to fetch multiple events by document IDs               |
| **test_event_pagination**     | Fetches events with limit=2 to test pagination logic                 |

## ⭐ Review CRUD Tests (4 tests)

| Test                            | Purpose                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------ |
| **test_review_create**          | Creates review with contact sharing, updates event.reviewedBy and user.reviews |
| **test_review_without_contact** | Creates anonymous review (shareContact=false), verifies no contact data        |
| **test_review_list**            | Lists all reviews for an event, verifies count                                 |
| **test_review_ordering**        | Queries reviews ordered by date descending to verify sort order                |

## 🔥 Edge Case Tests (10 tests)

| Test                                  | Purpose                                                                    |
| ------------------------------------- | -------------------------------------------------------------------------- |
| **test_array_deduplication**          | Adds same event ID twice to user array, verifies only one instance remains |
| **test_array_removal**                | Removes event from user array using removeAllFromArray, verifies deletion  |
| **test_empty_query_results**          | Queries for non-existent status, verifies zero results returned            |
| **test_missing_optional_fields**      | Creates event with only required fields, verifies successful creation      |
| **test_concurrent_review_creation**   | Two users review same event, verifies both appear in reviewedBy array      |
| **test_timestamp_ordering**           | Creates events with past/future timestamps, verifies DESC ordering works   |
| **test_batch_write_atomicity**        | Uses batch commit to update event and user, verifies both succeed together |
| **test_special_characters_in_fields** | Tests émojis, quotes, newlines, tabs in text fields                        |
| **test_large_array_operations**       | Adds 50 items to preference array, verifies all stored                     |
| **test_rapid_successive_writes**      | Fires 5 parallel updates to same document, verifies completion             |

## ⚡ Performance Test

| Test                             | Purpose                                                        |
| -------------------------------- | -------------------------------------------------------------- |
| **test_rapid_successive_writes** | Tests emulator stability under rapid parallel write operations |

---

## Running the Tests

```bash
# Start Firebase emulators
firebase emulators:start

# In another terminal
chmod +x test_firebase.sh
./test_firebase.sh
```

## Exit Codes

- **0**: All tests passed
- **1**: One or more tests failed (count shown in output)
