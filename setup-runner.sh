#!/bin/bash
# Script cài GitHub Actions Self-hosted Runner trên server Linux
# Chạy: bash setup-runner.sh <GITHUB_TOKEN>
# Token lấy tại: GitHub repo → Settings → Actions → Runners → New self-hosted runner
#
# Yêu cầu: server đã có Java 17+, Maven, Node.js 18+

set -e

REPO_URL="https://github.com/TaThanhLoc-KGU/Youth_KGU"
RUNNER_TOKEN="$1"
RUNNER_DIR="/opt/github-runner"
RUNNER_USER="youthkgu"    # user đang chạy backend service
RUNNER_NAME="youth-kgu-server"

if [ -z "$RUNNER_TOKEN" ]; then
  echo "Usage: bash setup-runner.sh <REGISTRATION_TOKEN>"
  echo "Token lay tai: $REPO_URL/settings/actions/runners/new"
  exit 1
fi

echo "=== Cai GitHub Actions Runner ==="

# 1. Tao thu muc
sudo mkdir -p $RUNNER_DIR
sudo chown $RUNNER_USER:$RUNNER_USER $RUNNER_DIR

# 2. Tai runner (Linux x64)
RUNNER_VERSION="2.317.0"
cd /tmp
curl -sLO "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
sudo tar xzf "actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz" -C $RUNNER_DIR
sudo chown -R $RUNNER_USER:$RUNNER_USER $RUNNER_DIR

# 3. Cau hinh runner
sudo -u $RUNNER_USER $RUNNER_DIR/config.sh \
  --url "$REPO_URL" \
  --token "$RUNNER_TOKEN" \
  --name "$RUNNER_NAME" \
  --labels "self-hosted,linux,production" \
  --work "/opt/github-runner/_work" \
  --unattended \
  --replace

# 4. Cai thanh systemd service
sudo $RUNNER_DIR/svc.sh install $RUNNER_USER
sudo $RUNNER_DIR/svc.sh start

echo ""
echo "=== Cau hinh sudoers (de runner co the restart service) ==="
cat <<EOF | sudo tee /etc/sudoers.d/github-runner
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/systemctl restart youth-kgu-backend
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/systemctl is-active youth-kgu-backend
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/journalctl -u youth-kgu-backend *
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/cp /opt/github-runner/_work/Youth_KGU/Youth_KGU/target/*.jar /opt/youth-kgu/backend/app.jar
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/chown youthkgu\:youthkgu /opt/youth-kgu/backend/app.jar
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/rm -rf /www/wwwroot/youth-kgu/*
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/cp -r * /www/wwwroot/youth-kgu/
$RUNNER_USER ALL=(ALL) NOPASSWD: /bin/chown -R www\:www /www/wwwroot/youth-kgu/
EOF

sudo chmod 440 /etc/sudoers.d/github-runner

echo ""
echo "=== Kiem tra ==="
sudo $RUNNER_DIR/svc.sh status

echo ""
echo "=== XONG ==="
echo "Runner '$RUNNER_NAME' da duoc cai va dang chay."
echo "Kiem tra tai: $REPO_URL/settings/actions/runners"
