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

ensure_student() {
  info "Ensuring STUDENT has status=active"
  api GET "/v1/users/$STUDENT_ID" >/dev/null || fail "Student user not found"
  api PATCH "/v1/users/$STUDENT_ID" -d '{"public_metadata":{"status":"active"}}' >/dev/null
  ok "Student status ensured"
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
  info "$name"
  "$@" && ok "$name"
}

test_ping() {
  local resp code
  resp=$(curl -s -w '|%{http_code}' "$BASE/api/ping")
  code="${resp##*|}"
  assert_code "$code" "200"
}

test_me_user() {
  local resp code
  resp=$(curl -s -w '|%{http_code}' -H "Authorization: Bearer $USER_JWT" "$BASE/api/me")
  code="${resp##*|}"
  assert_code "$code" "200"
}

test_request_role() {
  local resp code
  resp=$(curl -s -w '|%{http_code}' \
    -H "Authorization: Bearer $USER_JWT" \
    -H "Content-Type: application/json" \
    -d '{"requestedRole":"staff"}' \
    "$BASE/api/request-role")
  code="${resp##*|}"
  assert_code "$code" "200"
}

test_pending() {
  local resp code body
  resp=$(curl -s -w '|%{http_code}' -H "Authorization: Bearer $ADMIN_JWT" "$BASE/api/admin/pending")
  code="${resp##*|}"
  body="${resp%|*}"
  assert_code "$code" "200"
  USER_TO_APPROVE=$(echo "$body" | jq -r '.pending[0].userId // empty')
  [[ -n "$USER_TO_APPROVE" ]] || fail "No pending users found"
}

test_approve() {
  local resp code
  resp=$(curl -s -w '|%{http_code}' \
    -X POST -H "Authorization: Bearer $ADMIN_JWT" \
    "$BASE/api/admin/approve/$USER_TO_APPROVE")
  code="${resp##*|}"
  assert_code "$code" "200"
}

# Run
echo -e "${BOLD}RBAC API TEST — $BASE${RESET}"

ensure_admin
ensure_student

USER_JWT=$(make_token "$STUDENT_ID")
ADMIN_JWT=$(make_token "$ADMIN_ID")

test "ping" test_ping
test "me (user)" test_me_user
test "request-role" test_request_role
test "admin pending" test_pending
test "admin approve" test_approve

ok "ALL TESTS PASSED"
# echo
# echo "export USER_JWT=\"$USER_JWT\""
# echo "export ADMIN_JWT=\"$ADMIN_JWT\""
# echo
