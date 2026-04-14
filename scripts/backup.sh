#!/bin/bash
# =====================================================
# backup.sh - Backup toàn bộ server Youth KGU
# Chạy trên server CŨ: bash backup.sh
# Output: ~/youth-kgu-backup-YYYY-MM-DD.tar.gz
# =====================================================

set -e

DATE=$(date +%Y-%m-%d_%H-%M)
BACKUP_DIR="/tmp/youth-kgu-backup-$DATE"
OUTPUT="$HOME/youth-kgu-backup-$DATE.tar.gz"

echo "=== Youth KGU Backup ==="
echo "Date: $DATE"
mkdir -p "$BACKUP_DIR"

# ─── 1. Database ───
echo "[1/5] Backup database..."
read -s -p "Nhap mat khau MySQL root: " DB_PASS; echo
mysqldump -u root -p"$DB_PASS" youth-kgu > "$BACKUP_DIR/database.sql"
echo "    OK - $(wc -l < $BACKUP_DIR/database.sql) dòng SQL"

# ─── 2. Uploads ───
echo "[2/5] Backup uploads..."
cp -r /opt/youth-kgu/uploads "$BACKUP_DIR/uploads"
echo "    OK - $(du -sh $BACKUP_DIR/uploads | cut -f1)"

# ─── 3. Nginx config ───
echo "[3/5] Backup nginx config..."
mkdir -p "$BACKUP_DIR/nginx"
cp /etc/nginx/sites-available/youth-kgu "$BACKUP_DIR/nginx/youth-kgu.conf" 2>/dev/null || \
cp /etc/nginx/conf.d/youth-kgu.conf     "$BACKUP_DIR/nginx/youth-kgu.conf" 2>/dev/null || \
echo "    WARN: không tìm thấy nginx config"
echo "    OK"

# ─── 4. Systemd service ───
echo "[4/5] Backup systemd service..."
mkdir -p "$BACKUP_DIR/systemd"
cp /etc/systemd/system/youth-kgu-backend.service "$BACKUP_DIR/systemd/" 2>/dev/null || \
echo "    WARN: không tìm thấy service file"
echo "    OK"

# ─── 5. App hiện tại (JAR + dist) ───
echo "[5/5] Backup app files..."
cp /opt/youth-kgu/backend/app.jar "$BACKUP_DIR/app.jar" 2>/dev/null || echo "    WARN: không có JAR"
cp -r /opt/youth-kgu/frontend/dist "$BACKUP_DIR/dist" 2>/dev/null || echo "    WARN: không có dist"

# ─── Đóng gói ───
echo "Dang nen..."
tar -czf "$OUTPUT" -C "$(dirname $BACKUP_DIR)" "$(basename $BACKUP_DIR)"
rm -rf "$BACKUP_DIR"

echo ""
echo "=== Backup xong: $OUTPUT ==="
echo "Size: $(du -sh $OUTPUT | cut -f1)"
echo ""
echo "Chep ve may local:"
echo "  scp -i ~/.ssh/youth-kgu-key $USER@<IP>:$OUTPUT ."
