#!/usr/bin/env bash
# Dumps the production Postgres container to a timestamped, gzip-compressed file.
# Run on the VPS via cron (crontab -e):
#   0 3 * * * /opt/learnflow/scripts/backup.sh >> /var/log/learnflow-backup.log 2>&1
set -euo pipefail

CONTAINER="${POSTGRES_CONTAINER:-learnflow-postgres}"
DB="${POSTGRES_DB:-learnflow}"
DB_USER="${POSTGRES_USER:-learnflow}"
BACKUP_DIR="${BACKUP_DIR:-/opt/learnflow/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
out_file="$BACKUP_DIR/learnflow-$timestamp.sql.gz"

docker exec "$CONTAINER" pg_dump -U "$DB_USER" "$DB" | gzip > "$out_file"
echo "Backup written to $out_file"

find "$BACKUP_DIR" -name 'learnflow-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
