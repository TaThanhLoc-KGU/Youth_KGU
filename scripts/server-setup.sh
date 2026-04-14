#!/bin/bash
# =====================================================
# server-setup.sh - Cài đặt môi trường server mới
# Hỗ trợ: Ubuntu 20/22/24, CentOS 8/9, Rocky Linux 8/9
# Chạy với quyền root: sudo bash server-setup.sh
# =====================================================

set -e

APP_USER="youthkgu"
APP_DIR="/opt/youth-kgu"
JAVA_VERSION="21"

echo "========================================"
echo "  Youth KGU - Server Setup Script"
echo "========================================"

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    OS_VERSION=$VERSION_ID
else
    echo "Không xác định được OS"; exit 1
fi
echo "OS: $OS $OS_VERSION"

# ─── Package manager ───
install_pkg() {
    case $OS in
        ubuntu|debian) apt-get install -y "$@" ;;
        centos|rhel|rocky|almalinux) dnf install -y "$@" ;;
        *) echo "OS không hỗ trợ: $OS"; exit 1 ;;
    esac
}
update_pkg() {
    case $OS in
        ubuntu|debian) apt-get update -y ;;
        centos|rhel|rocky|almalinux) dnf update -y ;;
    esac
}

echo ""
echo "[1/7] Cập nhật hệ thống..."
update_pkg
install_pkg curl wget unzip git

# ─── Java ───
echo ""
echo "[2/7] Cài Java $JAVA_VERSION..."
case $OS in
    ubuntu|debian)
        apt-get install -y "openjdk-${JAVA_VERSION}-jdk" || {
            # Fallback: dùng temurin
            wget -O - https://packages.adoptium.net/artifactory/api/gpg/key/public | apt-key add -
            echo "deb https://packages.adoptium.net/artifactory/deb $(lsb_release -cs) main" > /etc/apt/sources.list.d/adoptium.list
            apt-get update -y
            apt-get install -y "temurin-${JAVA_VERSION}-jdk"
        }
        ;;
    centos|rhel|rocky|almalinux)
        dnf install -y "java-${JAVA_VERSION}-openjdk" || \
        dnf install -y "java-${JAVA_VERSION}-openjdk-headless"
        ;;
esac
java -version

# ─── MySQL ───
echo ""
echo "[3/7] Cài MySQL..."
case $OS in
    ubuntu|debian)
        install_pkg mysql-server
        systemctl enable --now mysql
        ;;
    centos|rhel|rocky|almalinux)
        dnf install -y mysql-server
        systemctl enable --now mysqld
        ;;
esac

# Tạo database
echo "Tao database youth-kgu..."
read -s -p "Dat mat khau MySQL root: " DB_PASS; echo
mysql -u root <<MYSQL
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASS}';
CREATE DATABASE IF NOT EXISTS \`youth-kgu\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
FLUSH PRIVILEGES;
MYSQL
echo "    Database: OK"

# ─── Nginx ───
echo ""
echo "[4/7] Cài Nginx..."
install_pkg nginx
systemctl enable --now nginx

# ─── Certbot ───
echo ""
echo "[5/7] Cài Certbot..."
case $OS in
    ubuntu|debian)
        install_pkg certbot python3-certbot-nginx
        ;;
    centos|rhel|rocky|almalinux)
        dnf install -y epel-release
        dnf install -y certbot python3-certbot-nginx
        ;;
esac

# ─── User và thư mục ───
echo ""
echo "[6/7] Tao user va thu muc app..."
id "$APP_USER" &>/dev/null || useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"

mkdir -p "$APP_DIR"/{backend,frontend/dist,logs,uploads}
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chmod -R 755 "$APP_DIR"

# ─── Systemd service ───
echo ""
echo "[7/7] Tao systemd service..."
read -p "Nhap DB password (de ghi vao service): " DB_PASS_SVC
read -p "Nhap JWT secret (bo trong = dung default): " JWT_SECRET

cat > /etc/systemd/system/youth-kgu-backend.service << SERVICE
[Unit]
Description=Youth KGU Backend
After=network.target mysql.service mysqld.service
Requires=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=/usr/bin/java -jar $APP_DIR/backend/app.jar
Restart=on-failure
RestartSec=10
StandardOutput=append:$APP_DIR/logs/app.log
StandardError=append:$APP_DIR/logs/app-error.log

# Environment
Environment="SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/youth-kgu?useSSL=false&serverTimezone=Asia/Ho_Chi_Minh&allowPublicKeyRetrieval=true"
Environment="SPRING_DATASOURCE_USERNAME=root"
Environment="SPRING_DATASOURCE_PASSWORD=$DB_PASS_SVC"
Environment="JWT_EXPIRATION=604800000"
Environment="JWT_REFRESH_TOKEN_EXPIRATION=2592000000"
Environment="APP_UPLOAD_PATH=$APP_DIR/uploads"
$([ -n "$JWT_SECRET" ] && echo "Environment=\"JWT_SECRET=$JWT_SECRET\"")

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload

echo ""
echo "========================================"
echo "  Setup xong!"
echo "========================================"
echo ""
echo "Buoc tiep theo:"
echo "  1. Chay restore.sh de khoi phuc du lieu"
echo "  2. Copy nginx config vao /etc/nginx/sites-available/ (Ubuntu)"
echo "     hoac /etc/nginx/conf.d/ (CentOS/Rocky)"
echo "  3. sudo certbot --nginx -d yourdomain.com"
echo "  4. sudo systemctl start youth-kgu-backend"
echo ""
