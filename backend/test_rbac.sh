#!/usr/bin/env bash
set -euo pipefail

# Load .env
if [[ -f ".env" ]]; then
  export $(grep -v '^#' .env | xargs)
else
  echo "No .env file found. Please create one."
  exit 1
fi

# Sanitize Inputs
strip() { printf '%s' "$1" | tr -d '\r\n\t '; }
BASE="$(strip "${BASE:-}")"
CLERK_SECRET_KEY="$(strip "${CLERK_SECRET_KEY:-}")"
STUDENT_ID="$(strip "${STUDENT_ID:-}")"
ADMIN_ID="$(strip "${ADMIN_ID:-}")"

# Pretty output
BOLD="\033[1m"; RESET="\033[0m"
GREEN="\033[32m"; YELLOW="\033[33m"; RED="\033[31m"; CYAN="\033[36m"
ok()   { echo -e "${GREEN}[OK]${RESET} $1"; }
info() { echo -e "${CYAN}[INFO]${RESET} $1"; }
warn() { echo -e "${YELLOW}[WARN]${RESET} $1"; }
fail() { echo -e "${RED}[ERR]${RESET} $1"; exit 1; }

# Deps
command -v curl >/dev/null || fail "curl required"
command -v jq >/dev/null || fail "jq required"

# Clerk API helper
api() {
  local method="$1"; shift
  local path="$1"; shift
  local url="https://api.clerk.com${path}"
  curl -sS --fail-with-body -X "$method" "$url" \
    -H "Authorization: Bearer $CLERK_SECRET_KEY" \
    -H "Content-Type: application/json" \
    "$@"
}

# Session + JWT
ensure_admin() {
  info "Ensuring ADMIN has role=admin,status=active"
  api GET "/v1/users/$ADMIN_ID" >/dev/null || fail "Admin user not found"
  api PATCH "/v1/users/$ADMIN_ID" -d '{"public_metadata":{"role":"admin","status":"active"}}' >/dev/null
  ok "Admin metadata set"
}

reset_student() {
  info "Resetting STUDENT to role=student,status=active"
  api GET "/v1/users/$STUDENT_ID" >/dev/null || fail "Student user not found"
  api PATCH "/v1/users/$STUDENT_ID" -d '{"public_metadata":{"role":"student","status":"active"}}' >/dev/null
  ok "Student reset to baseline"
}

make_token() {
  local uid="$1"
  local sid
  sid=$(api POST "/v1/sessions" -d "{\"user_id\":\"$uid\"}" | jq -r '.id')
  api POST "/v1/sessions/$sid/tokens" | jq -r '.jwt'
}

# API Tests
assert_code() { [[ "$1" == "$2" ]] || fail "Expected HTTP $2, got $1"; }

test() {
  local name="$1"; shift
  info "Testing: $name"
  "$@" && ok "$name"
}

test_ping() {
  local resp code
  resp=$(curl -s -w '|%{http_code}' "$BASE/api/ping")
  code="${resp##*|}"
  assert_code "$code" "200"
}

test_me_user() {
  local resp code body
  resp=$(curl -s -w '|%{http_code}' -H "Authorization: Bearer $USER_JWT" "$BASE/api/me")
  code="${resp##*|}"
  body="${resp%|*}"
  assert_code "$code" "200"
  local role=$(echo "$body" | jq -r '.rbac.role')
  [[ "$role" == "student" ]] || fail "Expected role=student, got $role"
}

test_request_role() {
  local resp code body
  resp=$(curl -s -w '|%{http_code}' \
    -X POST \
    -H "Authorization: Bearer $USER_JWT" \
    "$BASE/api/request-role")
  code="${resp##*|}"
  body="${resp%|*}"
  assert_code "$code" "200"
  local status=$(echo "$body" | jq -r '.status')
  [[ "$status" == "pending" ]] || fail "Expected status=pending, got $status"
}

test_pending() {
  local resp code body
  resp=$(curl -s -w '|%{http_code}' -H "Authorization: Bearer $ADMIN_JWT" "$BASE/api/admin/pending")
  code="${resp##*|}"
  body="${resp%|*}"
  assert_code "$code" "200"
  USER_TO_APPROVE=$(echo "$body" | jq -r ".pending[] | select(.userId == \"$STUDENT_ID\") | .userId")
  [[ -n "$USER_TO_APPROVE" ]] || fail "Student not found in pending list"
}

test_approve() {
  local resp code body
  resp=$(curl -s -w '|%{http_code}' \
    -X POST -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE/api/admin/approve/$USER_TO_APPROVE")
  code="${resp##*|}"
  body="${resp%|*}"
  assert_code "$code" "200"
  
  # Verify user is now staff
  sleep 1
  resp=$(curl -s -w '|%{http_code}' -H "Authorization: Bearer $USER_JWT" "$BASE/api/me")
  body="${resp%|*}"
  local role=$(echo "$body" | jq -r '.rbac.role')
  [[ "$role" == "staff" ]] || fail "Expected role=staff after approval, got $role"
}

test_revoke() {
  local resp code body
  resp=$(curl -s -w '|%{http_code}' \
    -X POST -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE/api/admin/revoke/$STUDENT_ID")
  code="${resp##*|}"
  body="${resp%|*}"
  assert_code "$code" "200"
  
  # Verify user is back to student
  sleep 1
  resp=$(curl -s -w '|%{http_code}' -H "Authorization: Bearer $USER_JWT" "$BASE/api/me")
  body="${resp%|*}"
  local role=$(echo "$body" | jq -r '.rbac.role')
  [[ "$role" == "student" ]] || fail "Expected role=student after revoke, got $role"
}

# Cleanup trap
cleanup() {
  warn "Cleaning up: Resetting student to baseline state"
  reset_student 2>/dev/null || true
}
trap cleanup EXIT

# Run
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo -e "${BOLD}  RBAC API TEST SUITE${RESET}"
echo -e "${BOLD}  Endpoint: $BASE${RESET}"
echo -e "${BOLD}═══════════════════════════════════════${RESET}"
echo

ensure_admin
reset_student

info "Generating JWT tokens..."
USER_JWT=$(make_token "$STUDENT_ID")
ADMIN_JWT=$(make_token "$ADMIN_ID")
ok "Tokens generated"
echo

test "Ping endpoint" test_ping
test "Get current user info" test_me_user
test "Request staff role" test_request_role
test "Admin: List pending users" test_pending
test "Admin: Approve user" test_approve
test "Admin: Revoke staff access" test_revoke

echo
echo -e "${BOLD}${GREEN}═══════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  ✓ ALL TESTS PASSED${RESET}"
echo -e "${BOLD}${GREEN}═══════════════════════════════════════${RESET}"
echo
