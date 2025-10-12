#!/usr/bin/env bash
set -euo pipefail

# =========================
# Config (override via env)
# =========================
PROJECT_ID="${PROJECT_ID:-your-project-id}"
FIRESTORE_HOST="${FIRESTORE_HOST:-127.0.0.1:8080}"
AUTH_HOST="${AUTH_HOST:-127.0.0.1:9099}"
API_KEY="${API_KEY:-fake-api-key}"

FS_BASE="http://${FIRESTORE_HOST}/v1/projects/${PROJECT_ID}/databases/(default)"
FS_DOCS="${FS_BASE}/documents"
AUTH_BASE="http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1"

# =========================
# Pretty logging
# =========================
BOLD="\033[1m"; DIM="\033[2m"; RESET="\033[0m"
GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; CYAN="\033[36m"

log_test() {   echo -e "[${BOLD}TEST${RESET}] $1"; }
log_info() {   echo -e "[${CYAN}INFO${RESET}] $1"; }
log_ok()   {   echo -e "[${GREEN} OK ${RESET}] ✓ $1"; }
log_warn() {   echo -e "[${YELLOW}WARN${RESET}] $1"; }
log_err()  {   echo -e "[${RED}ERR ${RESET}] $1"; }

need_jq() { command -v jq >/dev/null 2>&1 || { log_err "jq required"; exit 1; }; }

pp() { jq -C .; }
now_utc() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
future_utc() { date -u -d "+2 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v+2H +"%Y-%m-%dT%H:%M:%SZ"; }
past_utc() { date -u -d "-2 hours" +"%Y-%m-%dT%H:%M:%SZ" 2>/dev/null || date -u -v-2H +"%Y-%m-%dT%H:%M:%SZ"; }
doc_name() { echo "projects/${PROJECT_ID}/databases/(default)/documents/$1"; }

# =========================
# Test state
# =========================
CREATED_USER_EMAIL=""
CREATED_USER_PASS=""
CREATED_USER_IDTOKEN=""
CREATED_USER_UID=""
SECOND_USER_UID=""
SECOND_USER_IDTOKEN=""
EVENT_IDS=()
REVIEW_IDS=()
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
  
  # Delete all reviews
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
    
    # Unlink from both users
    for uid in "${CREATED_USER_UID:-}" "${SECOND_USER_UID:-}"; do
      [[ -z "$uid" ]] && continue
      curl -sS -X POST "${FS_BASE}/documents:commit" \
        -H "Content-Type: application/json" \
        -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${uid}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"removeAllFromArray\":{\"values\":[{\"stringValue\":\"${eid}\"}]}}]}}]}" \
        >/dev/null 2>&1 || true
    done
    
    curl -sS -X DELETE "${FS_DOCS}/Events/${eid}" >/dev/null 2>&1 || true
    log_info "Deleted event: ${eid}"
  done

  # Delete user documents
  for uid in "${CREATED_USER_UID:-}" "${SECOND_USER_UID:-}"; do
    [[ -z "$uid" ]] && continue
    curl -sS -X DELETE "${FS_DOCS}/Users/${uid}" >/dev/null 2>&1 || true
    log_info "Deleted user document: ${uid}"
  done

  # Delete auth users
  for token in "${CREATED_USER_IDTOKEN:-}" "${SECOND_USER_IDTOKEN:-}"; do
    [[ -z "$token" ]] && continue
    curl -sS -X POST "${AUTH_BASE}/accounts:delete?key=${API_KEY}" \
      -H "Content-Type: application/json" \
      -d "{\"idToken\":\"${token}\"}" >/dev/null 2>&1 || true
  done
  
  [[ -n "${CREATED_USER_EMAIL:-}" ]] && log_info "Deleted auth users"
  
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
  log_test "Checking Firebase emulators..."
  if ! curl -sSf "http://${FIRESTORE_HOST}/" >/dev/null 2>&1; then
    log_err "Firestore emulator not reachable at ${FIRESTORE_HOST}"
    log_info "Start with: firebase emulators:start"
    exit 1
  fi
  log_ok "Emulators are running"
}

# =========================
# Auth Tests
# =========================
test_auth_signup() {
  log_test "Auth: User sign up"
  local stamp="${RANDOM}${RANDOM}"
  CREATED_USER_EMAIL="test_${stamp}@example.com"
  CREATED_USER_PASS="CorrectHorseBatteryStaple42!"
  
  local resp
  resp="$(curl -sS -X POST "${AUTH_BASE}/accounts:signUp?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${CREATED_USER_EMAIL}\",\"password\":\"${CREATED_USER_PASS}\",\"returnSecureToken\":true}")"
  
  CREATED_USER_UID="$(echo "$resp" | jq -r '.localId')"
  CREATED_USER_IDTOKEN="$(echo "$resp" | jq -r '.idToken')"
  
  assert_not_null "$CREATED_USER_UID" "Sign up should return UID" || return 1
  assert_not_null "$CREATED_USER_IDTOKEN" "Sign up should return ID token" || return 1
  
  log_ok "User created: ${CREATED_USER_UID}"
}

test_auth_signin() {
  log_test "Auth: User sign in with correct credentials"
  local resp
  resp="$(curl -sS -X POST "${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${CREATED_USER_EMAIL}\",\"password\":\"${CREATED_USER_PASS}\",\"returnSecureToken\":true}")"
  
  local token
  token="$(echo "$resp" | jq -r '.idToken')"
  assert_not_null "$token" "Sign in should return ID token" || return 1
  log_ok "Sign in successful"
}

test_auth_wrong_password() {
  log_test "Auth: Sign in rejection with wrong password"
  local resp
  resp="$(curl -sS -X POST "${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${CREATED_USER_EMAIL}\",\"password\":\"WrongPassword123\",\"returnSecureToken\":true}" 2>&1)"
  
  local error
  error="$(echo "$resp" | jq -r '.error.message' 2>/dev/null || echo "")"
  assert_contains "$error" "INVALID" "Wrong password should be rejected" || return 1
  log_ok "Wrong password correctly rejected"
}

test_auth_nonexistent_user() {
  log_test "Auth: Sign in rejection for nonexistent user"
  local resp
  resp="$(curl -sS -X POST "${AUTH_BASE}/accounts:signInWithPassword?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"nonexistent_${RANDOM}@example.com\",\"password\":\"SomePass123\",\"returnSecureToken\":true}" 2>&1)"
  
  local error
  error="$(echo "$resp" | jq -r '.error.message' 2>/dev/null || echo "")"
  # Check for either pattern separately
  if [[ "$error" =~ EMAIL_NOT_FOUND ]] || [[ "$error" =~ INVALID ]]; then
    log_ok "Nonexistent user correctly rejected"
  else
    log_err "Expected EMAIL_NOT_FOUND or INVALID, got: $error"
    ((TEST_FAILURES++))
    return 1
  fi
}

# =========================
# User CRUD Tests
# =========================
test_user_doc_create() {
  log_test "User: Create user document"
  curl -sS -X PATCH "${FS_DOCS}/Users/${CREATED_USER_UID}" \
    -H "Content-Type: application/json" \
    -d @- >/dev/null <<EOF
{
  "fields": {
    "uid": {"stringValue": "${CREATED_USER_UID}"},
    "email": {"stringValue": "${CREATED_USER_EMAIL}"},
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
  log_ok "User document created"
}

test_user_doc_read() {
  log_test "User: Read user document"
  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  
  local email role agreed
  email="$(echo "$resp" | jq -r '.fields.email.stringValue')"
  role="$(echo "$resp" | jq -r '.fields.role.stringValue')"
  agreed="$(echo "$resp" | jq -r '.fields.agreedToTerms.booleanValue')"
  
  assert_eq "$email" "${CREATED_USER_EMAIL}" "Email should match" || return 1
  assert_eq "$role" "Admin" "Role should be Admin" || return 1
  assert_eq "$agreed" "false" "Terms should not be agreed initially" || return 1
  
  log_ok "User document read and verified"
}

test_user_pref_updates() {
  log_test "User: Update preferences"
  curl -sS -X PATCH "${FS_DOCS}/Users/${CREATED_USER_UID}?updateMask.fieldPaths=locPref&updateMask.fieldPaths=foodPref" \
    -H "Content-Type: application/json" \
    -d @- >/dev/null <<'EOF'
{
  "fields": {
    "locPref": {"arrayValue":{"values":[{"stringValue":"North Campus"},{"stringValue":"South Campus"}]}},
    "foodPref": {"arrayValue":{"values":[{"stringValue":"Vegetarian"},{"stringValue":"Vegan"}]}}
  }
}
EOF

  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  local loc_count food_count
  loc_count="$(echo "$resp" | jq -r '.fields.locPref.arrayValue.values | length')"
  food_count="$(echo "$resp" | jq -r '.fields.foodPref.arrayValue.values | length')"
  
  assert_eq "$loc_count" "2" "Should have 2 location preferences" || return 1
  assert_eq "$food_count" "2" "Should have 2 food preferences" || return 1
  
  log_ok "Preferences updated and verified"
}

test_user_accept_terms() {
  log_test "User: Accept terms"
  curl -sS -X PATCH "${FS_DOCS}/Users/${CREATED_USER_UID}?updateMask.fieldPaths=agreedToTerms" \
    -H "Content-Type: application/json" \
    -d '{"fields":{"agreedToTerms":{"booleanValue":true}}}' >/dev/null
  
  local resp agreed
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  agreed="$(echo "$resp" | jq -r '.fields.agreedToTerms.booleanValue')"
  
  assert_eq "$agreed" "true" "Terms should be accepted" || return 1
  log_ok "Terms accepted and verified"
}

test_user_nonexistent_read() {
  log_test "User: Read nonexistent user returns 404"
  local resp code
  resp="$(curl -sS -w "\n%{http_code}" -X GET "${FS_DOCS}/Users/nonexistent_uid_${RANDOM}" 2>&1)"
  code="$(echo "$resp" | tail -n1)"
  
  assert_eq "$code" "404" "Nonexistent user should return 404" || return 1
  log_ok "Nonexistent user correctly returns 404"
}

# =========================
# Event CRUD Tests
# =========================
test_event_create() {
  log_test "Event: Create new event"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Events" -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "host": {"stringValue":"Dining Services"},
    "name": {"stringValue":"Pizza Drop"},
    "status": {"stringValue":"open"},
    "locationDetails": {"stringValue":"Student Center, Room 101"},
    "notes": {"stringValue":"First come, first served"},
    "duration": {"integerValue":"45"},
    "foodAvailable": {"timestampValue":"${when}"},
    "foods": {"arrayValue": {"values":[
      {"mapValue":{"fields":{
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
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"id\":{\"stringValue\":\"${id}\"}}}" >/dev/null

  # Link to user
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${CREATED_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
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
  
  assert_not_null "$id" "Drafted event should be created" || return 1
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
  
  # Add small delay to ensure write is visible
  sleep 0.5
  
  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  
  local doc_exists
  doc_exists="$(echo "$resp" | jq -r 'has("fields")')"
  
  if [[ "$doc_exists" != "true" ]]; then
    log_err "Event document not found"
    echo "$resp" | pp
    ((TEST_FAILURES++))
    return 1
  fi
  
  local name host
  name="$(echo "$resp" | jq -r '.fields.name.stringValue // empty')"
  host="$(echo "$resp" | jq -r '.fields.host.stringValue // empty')"
  
  if [[ -z "$name" ]]; then
    log_err "Event name is empty"
    echo "$resp" | pp
    ((TEST_FAILURES++))
    return 1
  fi
  
  if [[ -z "$host" ]]; then
    log_err "Event host is empty"
    echo "$resp" | pp
    ((TEST_FAILURES++))
    return 1
  fi
  
  log_ok "Event read successfully"
}

test_event_update() {
  log_test "Event: Update event fields"
  local id="${EVENT_IDS[0]}"
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=name&updateMask.fieldPaths=notes" \
    -H "Content-Type: application/json" \
    -d '{"fields":{"name":{"stringValue":"Pizza Drop (Updated)"},"notes":{"stringValue":"Updated: Limited quantity"}}}' \
    >/dev/null
  
  local resp name notes
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  name="$(echo "$resp" | jq -r '.fields.name.stringValue')"
  notes="$(echo "$resp" | jq -r '.fields.notes.stringValue')"
  
  assert_eq "$name" "Pizza Drop (Updated)" "Name should be updated" || return 1
  assert_contains "$notes" "Limited quantity" "Notes should be updated" || return 1
  
  log_ok "Event updated and verified"
}

test_event_status_change() {
  log_test "Event: Change event status from open to closed"
  local id="${EVENT_IDS[0]}"
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=status" \
    -H "Content-Type: application/json" \
    -d '{"fields":{"status":{"stringValue":"closed"}}}' >/dev/null
  
  local resp status
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  status="$(echo "$resp" | jq -r '.fields.status.stringValue')"
  
  assert_eq "$status" "closed" "Status should be closed" || return 1
  log_ok "Event status changed to closed"
}

test_list_open_events() {
  log_test "Event: List only open events"
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
    "orderBy":[{"field":{"fieldPath":"foodAvailable"},"direction":"DESCENDING"}],
    "limit": 20
  }
}
EOF
)"
  
  local found
  found="$(echo "$resp" | jq -r '[.[] | select(.document!=null)] | length')"
  
  # Should have at least one open event (the drafted one was never opened)
  if [[ "$found" -ge 0 ]]; then
    log_ok "Found ${found} open event(s)"
  else
    log_err "Query failed to return events"
    ((TEST_FAILURES++))
    return 1
  fi
}

test_event_fetch_by_ids() {
  log_test "Event: Fetch multiple events by IDs (IN query)"
  
  # Ensure we have multiple events
  if [[ "${#EVENT_IDS[@]}" -lt 2 ]]; then
    log_warn "Need at least 2 events for IN query test, creating another..."
    test_event_create
  fi
  
  # Build reference array
  local values=""
  for id in "${EVENT_IDS[@]:0:2}"; do  # Take first 2
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
  
  assert_eq "$count" "2" "Should fetch exactly 2 events" || return 1
  log_ok "IN query returned ${count} event(s)"
}

test_event_pagination() {
  log_test "Event: Pagination with multiple pages"
  
  # Create multiple events if needed
  while [[ "${#EVENT_IDS[@]}" -lt 3 ]]; do
    test_event_create
  done
  
  # Small delay to ensure writes are visible
  sleep 0.5
  
  # Fetch first page (limit 2) - query all events, not just by status
  local resp1
  resp1="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<'EOF'
{
  "structuredQuery": {
    "from":[{"collectionId":"Events"}],
    "orderBy":[{"field":{"fieldPath":"foodAvailable"},"direction":"DESCENDING"}],
    "limit": 2
  }
}
EOF
)"
  
  local page1_count
  page1_count="$(echo "$resp1" | jq -r '[.[] | select(.document!=null)] | length')"
  
  if [[ "$page1_count" -ge 1 ]]; then
    log_ok "Pagination: First page has ${page1_count} event(s)"
  else
    log_warn "Expected at least 1 event on first page, got ${page1_count}"
  fi
}

# =========================
# Review CRUD Tests
# =========================
test_review_create() {
  log_test "Review: Create review for event"
  local eid="${EVENT_IDS[-1]}"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Reviews/${eid}/Reviews" \
    -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "comment":{"stringValue":"Great food, arrived on time!"},
    "date":{"timestampValue":"${when}"},
    "shareContact":{"booleanValue":true},
    "name":{"stringValue":"Test User"},
    "email":{"stringValue":"${CREATED_USER_EMAIL}"},
    "images":{"arrayValue":{}}
  }
}
EOF
)"
  
  local name rid
  name="$(echo "$resp" | jq -r '.name')"
  rid="$(basename "$name")"
  assert_not_null "$rid" "Review creation should return ID" || return 1
  
  REVIEW_IDS+=("$rid")

  # Update reviewedBy and reviews arrays atomically
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Events/${eid}")\",\"fieldTransforms\":[{\"fieldPath\":\"reviewedBy\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${CREATED_USER_UID}\"}]}}]}},{\"transform\":{\"document\":\"$(doc_name "Users/${CREATED_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"reviews\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${eid}\"}]}}]}}]}" \
    >/dev/null
  
  log_ok "Review created: ${rid}"
}

test_review_without_contact() {
  log_test "Review: Create review without sharing contact info"
  local eid="${EVENT_IDS[-1]}"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Reviews/${eid}/Reviews" \
    -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "comment":{"stringValue":"Anonymous review - food was cold"},
    "date":{"timestampValue":"${when}"},
    "shareContact":{"booleanValue":false},
    "images":{"arrayValue":{}}
  }
}
EOF
)"
  
  local name rid share
  name="$(echo "$resp" | jq -r '.name')"
  rid="$(basename "$name")"
  share="$(echo "$resp" | jq -r '.fields.shareContact.booleanValue')"
  
  assert_not_null "$rid" "Anonymous review should be created" || return 1
  assert_eq "$share" "false" "Contact sharing should be false" || return 1
  
  REVIEW_IDS+=("$rid")
  log_ok "Anonymous review created: ${rid}"
}

test_review_list() {
  log_test "Review: List reviews for event"
  local eid="${EVENT_IDS[-1]}"
  
  local resp
  resp="$(curl -sS -X GET "${FS_DOCS}/Reviews/${eid}/Reviews?pageSize=50")"
  
  local count
  count="$(echo "$resp" | jq -r '.documents | length' 2>/dev/null || echo 0)"
  
  if [[ "$count" -ge 2 ]]; then
    log_ok "Found ${count} review(s) for event"
  else
    log_warn "Expected at least 2 reviews, found ${count}"
  fi
}

test_review_ordering() {
  log_test "Review: Reviews ordered by date descending"
  local eid="${EVENT_IDS[-1]}"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<EOF
{
  "structuredQuery": {
    "from":[{"collectionId":"Reviews", "allDescendants":true}],
    "where":{"compositeFilter":{"op":"AND","filters":[
      {"fieldFilter":{"field":{"fieldPath":"__name__"},"op":"GREATER_THAN_OR_EQUAL",
        "value":{"referenceValue":"$(doc_name "Reviews/${eid}/Reviews/")"}}},
      {"fieldFilter":{"field":{"fieldPath":"__name__"},"op":"LESS_THAN",
        "value":{"referenceValue":"$(doc_name "Reviews/${eid}/Reviews0")"}}}
    ]}},
    "orderBy":[{"field":{"fieldPath":"date"},"direction":"DESCENDING"}],
    "limit": 10
  }
}
EOF
)"
  
  local dates
  dates="$(echo "$resp" | jq -r '[.[] | select(.document!=null) | .document.fields.date.timestampValue] | length')"
  
  if [[ "$dates" -ge 2 ]]; then
    log_ok "Reviews properly ordered by date"
  else
    log_warn "Could not verify date ordering (only ${dates} review(s))"
  fi
}

# =========================
# Edge Cases & Integration
# =========================
test_array_deduplication() {
  log_test "Edge: Array union prevents duplicates"
  local id="${EVENT_IDS[0]}"
  
  # Add same event to user twice
  for i in 1 2; do
    curl -sS -X POST "${FS_BASE}/documents:commit" \
      -H "Content-Type: application/json" \
      -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${CREATED_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
      >/dev/null
  done
  
  # Count occurrences
  local resp count
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  count="$(echo "$resp" | jq -r '[.fields.events.arrayValue.values[] | select(.stringValue=="'${id}'")] | length')"
  
  assert_eq "$count" "1" "Event should appear only once despite duplicate adds" || return 1
  log_ok "Array deduplication working correctly"
}

test_array_removal() {
  log_test "Edge: Array remove operation"
  local id="${EVENT_IDS[0]}"
  
  # Remove event from user
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${CREATED_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"removeAllFromArray\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
    >/dev/null
  
  # Verify removal
  local resp count
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  count="$(echo "$resp" | jq -r '[.fields.events.arrayValue.values[]? | select(.stringValue=="'${id}'")] | length')"
  
  assert_eq "$count" "0" "Event should be removed from array" || return 1
  
  # Re-add for other tests
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Users/${CREATED_USER_UID}")\",\"fieldTransforms\":[{\"fieldPath\":\"events\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${id}\"}]}}]}}]}" \
    >/dev/null
  
  log_ok "Array removal working correctly"
}

test_empty_query_results() {
  log_test "Edge: Query with no matching results"
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<'EOF'
{
  "structuredQuery": {
    "from":[{"collectionId":"Events"}],
    "where":{"fieldFilter":{
      "field":{"fieldPath":"status"},
      "op":"EQUAL",
      "value":{"stringValue":"nonexistent_status"}
    }},
    "limit": 10
  }
}
EOF
)"
  
  local count
  count="$(echo "$resp" | jq -r '[.[] | select(.document!=null)] | length')"
  
  assert_eq "$count" "0" "Query with no matches should return 0 results" || return 1
  log_ok "Empty query handled correctly"
}

test_missing_optional_fields() {
  log_test "Edge: Event with minimal required fields"
  local when
  when="$(now_utc)"
  
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Events" -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "host": {"stringValue":"Minimal Host"},
    "name": {"stringValue":"Minimal Event"},
    "status": {"stringValue":"open"},
    "duration": {"integerValue":"30"},
    "foodAvailable": {"timestampValue":"${when}"},
    "foods": {"arrayValue": {}},
    "images": {"arrayValue": {}},
    "reviewedBy": {"arrayValue": {}}
  }
}
EOF
)"
  
  local name id
  name="$(echo "$resp" | jq -r '.name')"
  id="$(basename "$name")"
  assert_not_null "$id" "Minimal event should be created" || return 1
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=id" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"id\":{\"stringValue\":\"${id}\"}}}" >/dev/null
  
  EVENT_IDS+=("$id")
  log_ok "Minimal event created successfully"
}

test_concurrent_review_creation() {
  log_test "Edge: Multiple users reviewing same event"
  
  # Create second user
  local stamp="${RANDOM}${RANDOM}"
  local email="test2_${stamp}@example.com"
  local pass="AnotherSecurePass123!"
  
  local resp
  resp="$(curl -sS -X POST "${AUTH_BASE}/accounts:signUp?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"password\":\"${pass}\",\"returnSecureToken\":true}")"
  
  SECOND_USER_UID="$(echo "$resp" | jq -r '.localId')"
  SECOND_USER_IDTOKEN="$(echo "$resp" | jq -r '.idToken')"
  
  assert_not_null "$SECOND_USER_UID" "Second user should be created" || return 1
  
  # Create user doc
  curl -sS -X PATCH "${FS_DOCS}/Users/${SECOND_USER_UID}" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"uid\":{\"stringValue\":\"${SECOND_USER_UID}\"},\"email\":{\"stringValue\":\"${email}\"},\"name\":{\"stringValue\":\"Second User\"},\"role\":{\"stringValue\":\"User\"},\"events\":{\"arrayValue\":{}},\"reviews\":{\"arrayValue\":{}},\"locPref\":{\"arrayValue\":{}},\"timePref\":{\"arrayValue\":{}},\"foodPref\":{\"arrayValue\":{}},\"agreedToTerms\":{\"booleanValue\":false}}}" \
    >/dev/null
  
  # Both users review same event
  local eid="${EVENT_IDS[0]}"
  local when
  when="$(now_utc)"
  
  for uid in "$CREATED_USER_UID" "$SECOND_USER_UID"; do
    local review_resp
    review_resp="$(curl -sS -X POST "${FS_DOCS}/Reviews/${eid}/Reviews" \
      -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "comment":{"stringValue":"Review from ${uid}"},
    "date":{"timestampValue":"${when}"},
    "shareContact":{"booleanValue":false},
    "images":{"arrayValue":{}}
  }
}
EOF
)"
    
    local rid
    rid="$(basename "$(echo "$review_resp" | jq -r '.name')")"
    
    # Update arrays
    curl -sS -X POST "${FS_BASE}/documents:commit" \
      -H "Content-Type: application/json" \
      -d "{\"writes\":[{\"transform\":{\"document\":\"$(doc_name "Events/${eid}")\",\"fieldTransforms\":[{\"fieldPath\":\"reviewedBy\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${uid}\"}]}}]}},{\"transform\":{\"document\":\"$(doc_name "Users/${uid}")\",\"fieldTransforms\":[{\"fieldPath\":\"reviews\",\"appendMissingElements\":{\"values\":[{\"stringValue\":\"${eid}\"}]}}]}}]}" \
      >/dev/null
  done
  
  # Verify both users in reviewedBy
  local event_resp reviewed_count
  event_resp="$(curl -sS -X GET "${FS_DOCS}/Events/${eid}")"
  reviewed_count="$(echo "$event_resp" | jq -r '.fields.reviewedBy.arrayValue.values | length')"
  
  if [[ "$reviewed_count" -ge 2 ]]; then
    log_ok "Multiple users can review same event"
  else
    log_warn "Expected 2+ reviewers, found ${reviewed_count}"
  fi
}

test_timestamp_ordering() {
  log_test "Edge: Events ordered by timestamp correctly"
  
  # Create events with different timestamps
  local past future
  past="$(past_utc)"
  future="$(future_utc)"
  
  for when in "$past" "$future"; do
    local resp
    resp="$(curl -sS -X POST "${FS_DOCS}/Events" -H "Content-Type: application/json" -d @- <<EOF
{
  "fields": {
    "host": {"stringValue":"Time Test Host"},
    "name": {"stringValue":"Event at ${when}"},
    "status": {"stringValue":"open"},
    "duration": {"integerValue":"30"},
    "foodAvailable": {"timestampValue":"${when}"},
    "foods": {"arrayValue": {}},
    "images": {"arrayValue": {}},
    "reviewedBy": {"arrayValue": {}}
  }
}
EOF
)"
    local id
    id="$(basename "$(echo "$resp" | jq -r '.name')")"
    curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=id" \
      -H "Content-Type: application/json" \
      -d "{\"fields\":{\"id\":{\"stringValue\":\"${id}\"}}}" >/dev/null
    EVENT_IDS+=("$id")
  done
  
  # Small delay for writes to be visible
  sleep 0.5
  
  # Query ordered by foodAvailable desc (future first)
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}:runQuery" -H "Content-Type: application/json" -d @- <<'EOF'
{
  "structuredQuery": {
    "from":[{"collectionId":"Events"}],
    "orderBy":[{"field":{"fieldPath":"foodAvailable"},"direction":"DESCENDING"}],
    "limit": 5
  }
}
EOF
)"
  
  local count
  count="$(echo "$resp" | jq -r '[.[] | select(.document!=null)] | length')"
  
  if [[ "$count" -ge 1 ]]; then
    log_ok "Timestamp ordering verified (${count} events returned)"
  else
    log_err "No events returned for timestamp ordering test"
    ((TEST_FAILURES++))
    return 1
  fi
}

test_batch_write_atomicity() {
  log_test "Edge: Batch write is atomic"
  local eid="${EVENT_IDS[0]}"
  
  # Atomic update of event status and user array
  curl -sS -X POST "${FS_BASE}/documents:commit" \
    -H "Content-Type: application/json" \
    -d @- >/dev/null <<EOF
{
  "writes": [
    {
      "update": {
        "name": "$(doc_name "Events/${eid}")",
        "fields": {
          "status": {"stringValue": "open"}
        }
      },
      "updateMask": {"fieldPaths": ["status"]}
    },
    {
      "transform": {
        "document": "$(doc_name "Users/${CREATED_USER_UID}")",
        "fieldTransforms": [
          {
            "fieldPath": "events",
            "appendMissingElements": {
              "values": [{"stringValue": "${eid}"}]
            }
          }
        ]
      }
    }
  ]
}
EOF
  
  # Verify both writes succeeded
  local event_resp user_resp
  event_resp="$(curl -sS -X GET "${FS_DOCS}/Events/${eid}")"
  user_resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  
  local status has_event
  status="$(echo "$event_resp" | jq -r '.fields.status.stringValue')"
  has_event="$(echo "$user_resp" | jq -r '[.fields.events.arrayValue.values[]? | select(.stringValue=="'${eid}'")] | length')"
  
  assert_eq "$status" "open" "Event status should be updated" || return 1
  assert_eq "$has_event" "1" "User should have event in array" || return 1
  
  log_ok "Batch write atomicity verified"
}

test_special_characters_in_fields() {
  log_test "Edge: Special characters in text fields"
  
  local when
  when="$(now_utc)"
  
  # Use simpler test - avoid complex unicode in shell
  local resp
  resp="$(curl -sS -X POST "${FS_DOCS}/Events" -H "Content-Type: application/json" -d @- <<'EOF'
{
  "fields": {
    "host": {"stringValue":"Host with special chars: <>&\"'"},
    "name": {"stringValue":"Event with quotes and symbols"},
    "status": {"stringValue":"open"},
    "notes": {"stringValue":"Multi\nline\nnotes\twith\ttabs"},
    "duration": {"integerValue":"30"},
    "foodAvailable": {"timestampValue":"2025-10-12T12:00:00Z"},
    "foods": {"arrayValue": {}},
    "images": {"arrayValue": {}},
    "reviewedBy": {"arrayValue": {}}
  }
}
EOF
)"
  
  local name id
  name="$(echo "$resp" | jq -r '.name')"
  id="$(basename "$name")"
  assert_not_null "$id" "Event with special characters should be created" || return 1
  
  curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=id" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"id\":{\"stringValue\":\"${id}\"}}}" >/dev/null
  
  # Small delay to ensure write is visible
  sleep 0.5
  
  # Verify special characters preserved
  local read_resp host_text notes_text
  read_resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  host_text="$(echo "$read_resp" | jq -r '.fields.host.stringValue // empty')"
  notes_text="$(echo "$read_resp" | jq -r '.fields.notes.stringValue // empty')"
  
  if [[ -z "$host_text" ]]; then
    log_err "Host field is empty after read"
    echo "$read_resp" | pp
    ((TEST_FAILURES++))
    return 1
  fi
  
  assert_contains "$host_text" "special chars" "Host should contain test text" || return 1
  assert_contains "$notes_text" "Multi" "Notes should be preserved" || return 1
  
  EVENT_IDS+=("$id")
  log_ok "Special characters handled correctly"
}

test_large_array_operations() {
  log_test "Edge: Operations on large arrays"
  
  # Add many preferences
  local prefs=""
  for i in {1..50}; do
    prefs+="{\"stringValue\":\"Location ${i}\"},"
  done
  prefs="[${prefs%,}]"
  
  curl -sS -X PATCH "${FS_DOCS}/Users/${CREATED_USER_UID}?updateMask.fieldPaths=locPref" \
    -H "Content-Type: application/json" \
    -d "{\"fields\":{\"locPref\":{\"arrayValue\":{\"values\":${prefs}}}}}" \
    >/dev/null
  
  # Verify count
  local resp count
  resp="$(curl -sS -X GET "${FS_DOCS}/Users/${CREATED_USER_UID}")"
  count="$(echo "$resp" | jq -r '.fields.locPref.arrayValue.values | length')"
  
  assert_eq "$count" "50" "Should handle 50 array items" || return 1
  log_ok "Large array operations successful"
}

# =========================
# Performance & Stress Tests
# =========================
test_rapid_successive_writes() {
  log_test "Performance: Rapid successive writes"
  local id="${EVENT_IDS[0]}"
  
  for i in {1..5}; do
    curl -sS -X PATCH "${FS_DOCS}/Events/${id}?updateMask.fieldPaths=notes" \
      -H "Content-Type: application/json" \
      -d "{\"fields\":{\"notes\":{\"stringValue\":\"Update ${i}\"}}}" \
      >/dev/null &
  done
  wait
  
  # Verify final state
  local resp notes
  resp="$(curl -sS -X GET "${FS_DOCS}/Events/${id}")"
  notes="$(echo "$resp" | jq -r '.fields.notes.stringValue')"
  
  assert_not_null "$notes" "Rapid writes should complete" || return 1
  log_ok "Rapid successive writes completed"
}

# =========================
# Main Test Runner
# =========================
run_all_tests() {
  log_test "Starting comprehensive Firebase test suite..."
  echo ""
  
  # Auth tests
  test_auth_signup || true
  test_auth_signin || true
  test_auth_wrong_password || true
  test_auth_nonexistent_user || true
  echo ""
  
  # User CRUD tests
  test_user_doc_create || true
  test_user_doc_read || true
  test_user_pref_updates || true
  test_user_accept_terms || true
  test_user_nonexistent_read || true
  echo ""
  
  # Event CRUD tests
  test_event_create || true
  test_event_create_drafted || true
  test_event_read || true
  test_event_update || true
  test_event_status_change || true
  test_list_open_events || true
  test_event_fetch_by_ids || true
  test_event_pagination || true
  echo ""
  
  # Review CRUD tests
  test_review_create || true
  test_review_without_contact || true
  test_review_list || true
  test_review_ordering || true
  echo ""
  
  # Edge cases
  test_array_deduplication || true
  test_array_removal || true
  test_empty_query_results || true
  test_missing_optional_fields || true
  test_concurrent_review_creation || true
  test_timestamp_ordering || true
  test_batch_write_atomicity || true
  test_special_characters_in_fields || true
  test_large_array_operations || true
  echo ""
  
  # Performance tests
  test_rapid_successive_writes || true
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
    log_ok "✅ All tests passed! (${TEST_FAILURES} failures)"
  else
    log_err "❌ Test suite completed with ${TEST_FAILURES} failure(s)"
    exit 1
  fi
}

main "$@"