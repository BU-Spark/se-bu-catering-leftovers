#!/usr/bin/env bash
set -euo pipefail

# =========================
# Config (override via env)
# =========================
PROJECT_ID="${PROJECT_ID:-your-project-id}"
FIRESTORE_HOST="${FIRESTORE_HOST:-127.0.0.1:8080}"

FS_BASE="http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)"
FS_DOCS="${FS_BASE}/documents"

# =========================
# Pretty logging
# =========================
BOLD="\033[1m"; RESET="\033[0m"
GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; CYAN="\033[36m"

log_test() { echo -e "[${BOLD}TEST${RESET}] $1"; }
log_info() { echo -e "[${CYAN}INFO${RESET}] $1"; }
log_ok()   { echo -e "[${GREEN} OK ${RESET}] ✓ $1"; }
log_warn() { echo -e "[${YELLOW}WARN${RESET}] $1"; }
log_err()  { echo -e "[${RED}ERR ${RESET}] $1"; }

need_jq() { command -v jq >/dev/null 2>&1 || { log_err "jq required"; exit 1; }; }

pp() { jq -C .; }
now_utc() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
future_utc() { date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+2H +"%Y-%m-%dT%H:%M:%SZ"; }
past_utc() { date -u -d "-2 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v-2H +"%Y-%m-%dT%H:%M:%SZ"; }
doc_name() { echo "projects/${PROJECT_ID}/databases/(default)/documents/$1"; }

# =========================
# Test state
# =========================
TEST_USER_UID="test_user_${RANDOM}"
TEST_USER_EMAIL="test_${RANDOM}@example.com"
SECOND_USER_UID="test_user2_${RANDOM}"
EVENT_IDS=()
TEST_FAILURES=0

# =========================
# Assertion helpers
# =========================
assert_eq() {
  local actual="$1" expected="$2" msg="${3:-}"
  if [[ "$actual" != "$expected" ]]; then
    log_err "Assertion failed${msg:+: $msg}"
    log_err "  Expected: $expected"
    log_err "  Got: $actual"
    ((TEST_FAILURES++))
    return 1
  fi
  return 0
}

assert_not_null() {
  local val="$1" msg="${2:-Value should not be null}"
  if [[ -z "$val" || "$val" == "null" ]]; then
    log_err "$msg"
    ((TEST_FAILURES++))
    return 1
  fi
  return 0
}

assert_contains() {
  local haystack="$1" needle="$2" msg="${3:-}"
  if [[ ! "$haystack" =~ $needle ]]; then
    log_err "Assertion failed${msg:+: $msg}"
    log_err "  Expected to contain: $needle"
    log_err "  In: $haystack"
    ((TEST_FAILURES++))
    return 1
  fi
  return 0
}

# =========================
# Cleanup (trap)
# =========================
cleanup() {
  log_test "Cleaning up test data..."
  
  # Delete all reviews for test events
  for eid in "${EVENT_IDS[@]:-}"; do
    [[ -z "${eid}" ]] && continue
    local list
    list="$(curl -sS -X GET "${FS_DOCS}/Reviews/${eid}/Reviews?pageSize=100" 2>/dev/null || true)"
    local count
    count="$(echo "$list" | jq -r '.documents | length' 2>/dev/null || echo 0)"
    if [[ "$count" != "null" && "$count" -gt 0 ]]; then
      echo "$list" | jq -r '.documents[].name' | while read -r full; do
        curl -sS -X DELETE "http://${FIRESTORE_HOST}/v1/${full}" >/dev/null 2>&1 || true
      done
      log_info "Deleted ${count} review(s) under event ${eid}"
    fi
  done

  # Delete events and unlink from users
  for eid in "${EVENT_IDS[@]:-}"; do
    [[ -z "${eid}" ]] && continue
    
    # Unlink from users
    for uid in "${TEST_USER_UID:-}" "${SECOND_USER_UID:-}"; do
      [[ -z "$uid" ]] && continue
      curl -sS -X POST "${FS_BASE}/documents:commit" \
        -H "Content-Type: application/json" \
        -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${uid}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"removeAllFromArray\":{\"values\":[{\"stringValue\":\"${eid}\"}]}}]}}]}" \
        >/dev/null 2>&1 || true
    done
    
    curl -sS -X DELETE "${FS_DOCS}/Events/${eid}" >/dev/null 2>&1 || true
  done
  
  [[ ${#EVENT_IDS[@]} -gt 0 ]] && log_info "Deleted ${#EVENT_IDS[@]} event(s)"

  # Delete user documents
  for uid in "${TEST_USER_UID:-}" "${SECOND_USER_UID:-}"; do
    [[ -z "$uid" ]] && continue
    curl -sS -X DELETE "${FS_DOCS}/Users/${uid}" >/dev/null 2>&1 || true
  done
  
  [[ -n "${TEST_USER_UID:-}" ]] && log_info "Deleted test user documents"
  
  if [[ $TEST_FAILURES -gt 0 ]]; then
    log_err "❌ Tests completed with ${TEST_FAILURES} failure(s)"
    exit 1
  else
    log_ok "Cleanup complete"
  fi
}
trap cleanup EXIT ERR INT TERM

# =========================
# Emulator check
# =========================
check_emulators() {
  log_test "Checking Firestore emulator..."
  if ! curl -sSf "http://${FIRESTORE_HOST}/" >/dev/null 2>&1; then
    log_err "Firestore emulator not reachable at ${FIRESTORE_HOST}"
    log_info "Start with: firebase emulators:start"
    exit 1
  fi
  log_ok "Emulator is running"
}

# =========================
# User CRUD Tests
# =========================
test_user_create() {
  log_test "User: Create user document"
  curl -sS -X PATCH "${FS_DOCS}/Users/${TEST_USER_UID}" \
    -H "Content-Type: application/json" \
    -d @- >/dev/null <<EOF
{
  "fields": {
    "uid": {"stringValue": "${TEST_USER_UID}"},
    "email": {"stringValue": "${TEST_USER_EMAIL}"},
    "name": {"stringValue": "Test Admin"},
    "role": {"stringValue": "Admin"},
    "events": {"arrayValue": {}},
    "reviews": {"arrayValue": {}},
    "locPref": {"arrayValue": {}},
    "timePref": {"arrayValue": {}},
    "foodPref": {"arrayValue": {}},
    "agreedToTerms": {"booleanValue": false}
  }
}
EOF
  log_ok "User document created: ${TEST_USER_UID}"
}

test_user_read() {
  log_test "User: Read user document"
  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${TEST_USER_UID}")"
  
  local email role
  email="$(echo "$resp" | jq -r '.fields.email.stringValue')"
  role="$(echo "$resp" | jq -r '.fields.role.stringValue')"
  
  assert_eq "$email" "${TEST_USER_EMAIL}" "Email should match" || return 1
  assert_eq "$role" "Admin" "Role should be Admin" || return 1
  
  log_ok "User document read and verified"
}

test_user_preferences() {
  log_test "User: Update preferences"
  curl -sS -X PATCH "${FS_DOCS}/Users/${TEST_USER_UID}?updateMask.fieldPaths=locPref&updateMask.fieldPaths=foodPref" \
    -H "Content-Type: application/json" \
    -d @- >/dev/null <<'EOF'
{
  "fields": {
    "locPref": {"arrayValue":{"values":[{"stringValue":"East Campus"},{"stringValue":"West Campus"}]}},
    "foodPref": {"arrayValue":{"values":[{"stringValue":"Vegetarian"}]}}
  }
}
EOF

  local resp loc_count
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${TEST_USER_UID}")"
  loc_count="$(echo "$resp" | jq -r '.fields.locPref.arrayValue.values | length')"
  
  assert_eq "$loc_count" "2" "Should have 2 location preferences" || return 1
  log_ok "Preferences updated"
}

test_user_accept_terms() {
  log_test "User: Accept terms"
  curl -sS -X PATCH "${FS_DOCS}/Users/${TEST_USER_UID}?updateMask.fieldPaths=agreedToTerms" \
    -H "Content-Type: application/json" \
    -d '{"fields":{"agreedToTerms":{"booleanValue":true}}}' >/dev/null
  
  local resp agreed
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${TEST_USER_UID}")"
  agreed="$(echo "$resp" | jq -r '.fields.agreedToTerms.booleanValue')"
  
  assert_eq "$agreed" "true" "Terms should be accepted" || return 1
  log_ok "Terms accepted"
}

# =========================
# Event CRUD Tests
# =========================
test_event_create() {
  log_test "Event: Create new event with foods"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Events" -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "host": {"stringValue":"Dining Services"},
    "name": {"stringValue":"Pizza Drop"},
    "status": {"stringValue":"open"},
    "Location": {"mapValue":{"fields":{
      "name":{"stringValue":"Student Center"},
      "address":{"stringValue":"123 Campus Way"},
      "lat":{"stringValue":"42.3505"},
      "lon":{"stringValue":"-71.1054"},
      "campus_section":{"stringValue":"Central"}
    }}},
    "locationDetails": {"stringValue":"Room 101"},
    "notes": {"stringValue":"First come, first served"},
    "duration": {"integerValue":"45"},
    "foodAvailable": {"timestampValue":"${when}"},
    "foods": {"arrayValue": {"values":[
      {"mapValue":{"fields":{
        "id":{"stringValue":"f1"},
        "item":{"stringValue":"Pizza"},
        "quantity":{"stringValue":"5"},
        "unit":{"stringValue":"boxes"}
      }}}
    ]}},
    "images": {"arrayValue": {}},
    "reviewedBy": {"arrayValue": {}}
  }
}
EOF
)"
  
  local name id
  name="$(echo "$resp" | jq -r '.name')"
  id="$(basename "$name")"
  assert_not_null "$id" "Event creation should return ID" || return 1

  # Mirror ID in document
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=id" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"id\":{\"stringValue\":\"${id}\"}}}" >/dev/null

  # Link to user
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${TEST_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
    >/dev/null

  EVENT_IDS+=("$id")
  log_ok "Event created: ${id}"
}

test_event_create_drafted() {
  log_test "Event: Create drafted event"
  local when
  when="$(future_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Events" -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "host": {"stringValue":"Campus Catering"},
    "name": {"stringValue":"Taco Tuesday (Draft)"},
    "status": {"stringValue":"drafted"},
    "duration": {"integerValue":"60"},
    "foodAvailable": {"timestampValue":"${when}"},
    "foods": {"arrayValue": {}},
    "images": {"arrayValue": {}},
    "reviewedBy": {"arrayValue": {}}
  }
}
EOF
)"
  
  local name id status
  name="$(echo "$resp" | jq -r '.name')"
  id="$(basename "$name")"
  status="$(echo "$resp" | jq -r '.fields.status.stringValue')"
  
  assert_eq "$status" "drafted" "Status should be drafted" || return 1
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=id" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"id\":{\"stringValue\":\"${id}\"}}}" >/dev/null
  
  EVENT_IDS+=("$id")
  log_ok "Drafted event created: ${id}"
}

test_event_read() {
  log_test "Event: Read single event"
  local id="${EVENT_IDS[0]}"
  sleep 0.3
  
  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  
  local name host
  name="$(echo "$resp" | jq -r '.fields.name.stringValue // empty')"
  host="$(echo "$resp" | jq -r '.fields.host.stringValue // empty')"
  
  assert_not_null "$name" "Event should have name" || return 1
  assert_not_null "$host" "Event should have host" || return 1
  
  log_ok "Event read successfully"
}

test_event_update() {
  log_test "Event: Update event fields"
  local id="${EVENT_IDS[0]}"
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=name&updateMask.fieldPaths=notes" \
    -H "Content-Type: application/json" \
    -d '{"fields":{"name":{"stringValue":"Pizza Drop (Updated)"},"notes":{"stringValue":"Limited quantity"}}}' \
    >/dev/null
  
  local resp name
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  name="$(echo "$resp" | jq -r '.fields.name.stringValue')"
  
  assert_contains "$name" "Updated" "Name should be updated" || return 1
  log_ok "Event updated"
}

test_event_status_change() {
  log_test "Event: Change status"
  local id="${EVENT_IDS[0]}"
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=status" \
    -H "Content-Type: application/json" \
    -d '{"fields":{"status":{"stringValue":"closed"}}}' >/dev/null
  
  local resp status
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  status="$(echo "$resp" | jq -r '.fields.status.stringValue')"
  
  assert_eq "$status" "closed" "Status should be closed" || return 1
  log_ok "Status changed to closed"
}

test_list_open_events() {
  log_test "Event: Query open events"
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<'EOF'
{
  "structuredQuery": {
    "from":[{"collectionId":"Events"}],
    "where":{"fieldFilter":{
      "field":{"fieldPath":"status"},
      "op":"EQUAL",
      "value":{"stringValue":"open"}
    }},
    "orderBy":[{"field":{"fieldPath":"foodAvailable"},"direction":"DESCENDING"}]
  }
}
EOF
)"
  
  local found
  found="$(echo "$resp" | jq -r '[.[] | select(.document!=null)] | length')"
  
  log_ok "Found ${found} open event(s)"
}

test_event_fetch_by_ids() {
  log_test "Event: Fetch by IDs (IN query)"
  
  if [[ "${#EVENT_IDS[@]}" -lt 2 ]]; then
    test_event_create
  fi
  
  local values=""
  for id in "${EVENT_IDS[@]:0:2}"; do
    values+="{\"referenceValue\":\"$(doc_name "Events/${id}")\"},"
  done
  values="[${values%,}]"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<EOF
{
  "structuredQuery": {
    "from":[{"collectionId":"Events"}],
    "where":{"fieldFilter":{
      "field":{"fieldPath":"__name__"},
      "op":"IN",
      "value":{"arrayValue":{"values": ${values} }}
    }}
  }
}
EOF
)"
  
  local count
  count="$(echo "$resp" | jq -r '[.[] | select(.document!=null)] | length')"
  
  assert_eq "$count" "2" "Should fetch 2 events" || return 1
  log_ok "IN query returned ${count} events"
}

# =========================
# Review CRUD Tests
# =========================
test_review_create() {
  log_test "Review: Create review"
  local eid="${EVENT_IDS[-1]}"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Reviews/${eid}/Reviews" \
    -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "comment":{"stringValue":"Great food!"},
    "date":{"timestampValue":"${when}"},
    "shareContact":{"booleanValue":true},
    "name":{"stringValue":"Test User"},
    "email":{"stringValue":"${TEST_USER_EMAIL}"},
    "images":{"arrayValue":{}}
  }
}
EOF
)"
  
  local name rid
  name="$(echo "$resp" | jq -r '.name')"
  rid="$(basename "$name")"
  assert_not_null "$rid" "Review should be created" || return 1

  # Update arrays atomically
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Events/${eid}")\",\"fieldTransforms\":[{\"fieldPath\":\"reviewedBy\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${TEST_USER_UID}\"}]}}]}},{\"transform\":{\"document\":\"$(doc_name "Users/${TEST_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"reviews\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${eid}\"}]}}]}}]}" \
    >/dev/null
  
  log_ok "Review created: ${rid}"
}

test_review_without_contact() {
  log_test "Review: Create anonymous review"
  local eid="${EVENT_IDS[-1]}"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Reviews/${eid}/Reviews" \
    -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "comment":{"stringValue":"Anonymous feedback"},
    "date":{"timestampValue":"${when}"},
    "shareContact":{"booleanValue":false},
    "images":{"arrayValue":{}}
  }
}
EOF
)"
  
  local share
  share="$(echo "$resp" | jq -r '.fields.shareContact.booleanValue')"
  
  assert_eq "$share" "false" "Contact sharing should be false" || return 1
  log_ok "Anonymous review created"
}

test_review_list() {
  log_test "Review: List reviews for event"
  local eid="${EVENT_IDS[-1]}"
  
  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Reviews/${eid}/Reviews?pageSize=50")"
  
  local count
  count="$(echo "$resp" | jq -r '.documents | length' 2>/dev/null || echo 0)"
  
  log_ok "Found ${count} review(s)"
}

# =========================
# Edge Cases
# =========================
test_array_operations() {
  log_test "Edge: Array union/removal"
  local id="${EVENT_IDS[0]}"
  
  # Add same event twice (should deduplicate)
  for i in 1 2; do
    curl -sS -X POST "${FS_BASE}/documents:commit" \
      -H "Content-Type: application/json" \
      -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${TEST_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
      >/dev/null
  done
  
  local resp count
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${TEST_USER_UID}")"
  count="$(echo "$resp" | jq -r '[.fields.events.arrayValue.values[] | select(.stringValue=="'${id}'")] | length')"
  
  assert_eq "$count" "1" "Array should deduplicate" || return 1
  
  # Remove event
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${TEST_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"removeAllFromArray\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
    >/dev/null
  
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${TEST_USER_UID}")"
  count="$(echo "$resp" | jq -r '[.fields.events.arrayValue.values[]? | select(.stringValue=="'${id}'")] | length')"
  
  assert_eq "$count" "0" "Event should be removed" || return 1
  log_ok "Array operations working"
}

test_batch_atomicity() {
  log_test "Edge: Batch write atomicity"
  local eid="${EVENT_IDS[0]}"
  
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d @- >/dev/null <<EOF
{
  "writes": [
    {
      "update": {
        "name": "$(doc_name "Events/${eid}")",
        "fields": {"status": {"stringValue": "open"}}
      },
      "updateMask": {"fieldPaths": ["status"]}
    },
    {
      "transform": {
        "document": "$(doc_name "Users/${TEST_USER_UID}")",
        "fieldTransforms": [{
          "fieldPath": "events",
          "appendMissingElements": {"values": [{"stringValue": "${eid}"}]}
        }]
      }
    }
  ]
}
EOF
  
  local event_resp user_resp
  event_resp="$(curl -sS -X GET "${FS_DOCS}/Events/${eid}")"
  user_resp="$(curl -sS -X GET "${FS_DOCS}/Users/${TEST_USER_UID}")"
  
  local status has_event
  status="$(echo "$event_resp" | jq -r '.fields.status.stringValue')"
  has_event="$(echo "$user_resp" | jq -r '[.fields.events.arrayValue.values[]? | select(.stringValue=="'${eid}'")] | length')"
  
  assert_eq "$status" "open" "Event status updated" || return 1
  assert_eq "$has_event" "1" "User has event" || return 1
  log_ok "Batch write atomic"
}

test_pagination() {
  log_test "Edge: Pagination"
  
  while [[ "${#EVENT_IDS[@]}" -lt 3 ]]; do
    test_event_create
  done
  
  sleep 0.3
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<'EOF'
{
  "structuredQuery": {
    "from":[{"collectionId":"Events"}],
    "orderBy":[{"field":{"fieldPath":"foodAvailable"},"direction":"DESCENDING"}],
    "limit": 2
  }
}
EOF
)"
  
  local count
  count="$(echo "$resp" | jq -r '[.[] | select(.document!=null)] | length')"
  
  log_ok "Pagination: page has ${count} event(s)"
}

# =========================
# Main Test Runner
# =========================
run_all_tests() {
  log_test "Starting Firebase test suite..."
  echo ""
  
  # User CRUD
  test_user_create || true
  test_user_read || true
  test_user_preferences || true
  test_user_accept_terms || true
  echo ""
  
  # Event CRUD
  test_event_create || true
  test_event_create_drafted || true
  test_event_read || true
  test_event_update || true
  test_event_status_change || true
  test_list_open_events || true
  test_event_fetch_by_ids || true
  echo ""
  
  # Review CRUD
  test_review_create || true
  test_review_without_contact || true
  test_review_list || true
  echo ""
  
  # Edge cases
  test_array_operations || true
  test_batch_atomicity || true
  test_pagination || true
  echo ""
}

# =========================
# Entry point
# =========================
main() {
  need_jq
  check_emulators
  echo ""
  
  run_all_tests
  
  if [[ $TEST_FAILURES -eq 0 ]]; then
    log_ok "✅ All tests passed!"
  else
    log_err "❌ Test suite completed with ${TEST_FAILURES} failure(s)"
    exit 1
  fi
}

main "$@"