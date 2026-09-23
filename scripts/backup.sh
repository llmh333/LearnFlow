#!/usr/bin/env bash
# Dumps the production Supabase database to a timestamped, gzip-compressed file.
# Run on the VPS via cron (crontab -e):
#   0 3 * * * DATABASE_URL='postgresql://...' /opt/learnflow/scripts/backup.sh >> /var/log/learnflow-backup.log 2>&1
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL env var is required (Supabase connection string)}"
BACKUP_DIR="${BACKUP_DIR:-/opt/learnflow/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
timestamp=$(date -u +%Y%m%dT%H%M%SZ)
out_file="$BACKUP_DIR/learnflow-$timestamp.sql.gz"

pg_dump "$DATABASE_URL" | gzip > "$out_file"
echo "Backup written to $out_file"

find "$BACKUP_DIR" -name 'learnflow-*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
