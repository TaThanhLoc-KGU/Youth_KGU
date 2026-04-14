#!/bin/bash
# =====================================================
# restore.sh - Restore từ backup lên server mới
# Chạy trên server MỚI (sau server-setup.sh):
#   bash restore.sh youth-kgu-backup-YYYY-MM-DD.tar.gz
# =====================================================

set -e

BACKUP_FILE="$1"
APP_DIR="/opt/youth-kgu"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
    echo "Usage: bash restore.sh <backup-file.tar.gz>"
    exit 1
fi

echo "=== Youth KGU Restore ==="
echo "File: $BACKUP_FILE"

EXTRACT_DIR="/tmp/youth-kgu-restore-$$"
mkdir -p "$EXTRACT_DIR"
tar -xzf "$BACKUP_FILE" -C "$EXTRACT_DIR"
BACKUP_CONTENT=$(ls "$EXTRACT_DIR")
BACKUP_PATH="$EXTRACT_DIR/$BACKUP_CONTENT"

# ─── 1. Database ───
echo "[1/4] Restore database..."
if [ -f "$BACKUP_PATH/database.sql" ]; then
    read -s -p "Nhap mat khau MySQL root: " DB_PASS; echo
    mysql -u root -p"$DB_PASS" youth-kgu < "$BACKUP_PATH/database.sql"
    echo "    OK - database restored"
else
    echo "    SKIP - khong co database.sql"
fi

# ─── 2. Uploads ───
echo "[2/4] Restore uploads..."
if [ -d "$BACKUP_PATH/uploads" ]; then
    cp -r "$BACKUP_PATH/uploads/." "$APP_DIR/uploads/"
    chown -R youthkgu:youthkgu "$APP_DIR/uploads"
    echo "    OK - $(du -sh $APP_DIR/uploads | cut -f1)"
else
    echo "    SKIP - khong co uploads"
fi

# ─── 3. App files ───
echo "[3/4] Restore app files..."
if [ -f "$BACKUP_PATH/app.jar" ]; then
    cp "$BACKUP_PATH/app.jar" "$APP_DIR/backend/app.jar"
    chown youthkgu:youthkgu "$APP_DIR/backend/app.jar"
    echo "    OK - JAR restored"
fi
if [ -d "$BACKUP_PATH/dist" ]; then
    rm -rf "$APP_DIR/frontend/dist"
    cp -r "$BACKUP_PATH/dist" "$APP_DIR/frontend/dist"
    chown -R youthkgu:youthkgu "$APP_DIR/frontend"
    echo "    OK - Frontend restored"
fi

# ─── 4. Nginx config ───
echo "[4/4] Restore nginx config..."
if [ -f "$BACKUP_PATH/nginx/youth-kgu.conf" ]; then
    # Ubuntu/Debian
    if [ -d /etc/nginx/sites-available ]; then
        cp "$BACKUP_PATH/nginx/youth-kgu.conf" /etc/nginx/sites-available/youth-kgu
        ln -sf /etc/nginx/sites-available/youth-kgu /etc/nginx/sites-enabled/youth-kgu
    # CentOS/Rocky
    else
        cp "$BACKUP_PATH/nginx/youth-kgu.conf" /etc/nginx/conf.d/youth-kgu.conf
    fi
    echo "    OK - nhớ cập nhật domain + chạy certbot lại"
else
    echo "    SKIP - khong co nginx config"
fi

# Cleanup
rm -rf "$EXTRACT_DIR"

echo ""
echo "=== Restore xong! ==="
echo ""
echo "Buoc cuoi:"
echo "  sudo nginx -t && sudo systemctl reload nginx"
echo "  sudo systemctl start youth-kgu-backend"
echo "  sudo systemctl status youth-kgu-backend"
