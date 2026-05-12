#!/usr/bin/env bash
# Tạo database PostgreSQL "jptaxi" (khớp backend/src/main/resources/application.yml).
# Dùng khi log báo: FATAL: database "jptaxi" does not exist (SQLState 3D000).
#
# Chạy từ thư mục repo hoặc database/:
#   ./database/create-jptaxi-database.sh
#
# Ghi đè user/mật khẩu/host (giống Spring Boot):
#   SPRING_DATASOURCE_USERNAME=postgres SPRING_DATASOURCE_PASSWORD=yourpass ./database/create-jptaxi-database.sh

set -euo pipefail

USER_NAME="${SPRING_DATASOURCE_USERNAME:-postgres}"
export PGPASSWORD="${SPRING_DATASOURCE_PASSWORD:-123456}"
PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
DBNAME="jptaxi"

export PGHOST PGPORT

exists="$(psql -U "$USER_NAME" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '${DBNAME}'" 2>/dev/null || true)"
if [[ "$exists" == "1" ]]; then
  echo "Database '${DBNAME}' already exists."
  exit 0
fi

psql -U "$USER_NAME" -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DBNAME};"
echo "Created database '${DBNAME}'."
