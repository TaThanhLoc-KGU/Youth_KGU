# =====================================================
# deploy.ps1 - Script tự động build và deploy Youth KGU
# Chạy: .\deploy.ps1
# Chạy chỉ backend: .\deploy.ps1 -Backend
# Chạy chỉ frontend: .\deploy.ps1 -Frontend
# =====================================================

param(
    [switch]$Backend,
    [switch]$Frontend
)

# Nếu không truyền tham số → deploy cả 2
if (-not $Backend -and -not $Frontend) {
    $Backend  = $true
    $Frontend = $true
}

# ===== CONFIG =====
$PROJECT_DIR  = "D:\Youth_KGU"
$SSH_KEY      = "$env:USERPROFILE\.ssh\youth-kgu-key"
$REMOTE_USER  = "thanhlocta2408"
$REMOTE_HOST  = "34.10.108.252"
$REMOTE       = "${REMOTE_USER}@${REMOTE_HOST}"
$SSH          = "ssh -i `"$SSH_KEY`" -o StrictHostKeyChecking=no"
$SCP          = "scp -i `"$SSH_KEY`" -o StrictHostKeyChecking=no"
# ==================

$ErrorActionPreference = "Stop"
$startTime = Get-Date

function Log-Step($msg) { Write-Host "`n===== $msg =====" -ForegroundColor Cyan }
function Log-OK($msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Log-Error($msg){ Write-Host "[ERROR] $msg" -ForegroundColor Red; exit 1 }

Set-Location $PROJECT_DIR

# ─── BACKEND ───
if ($Backend) {
    Log-Step "1/5  Build backend (Maven)"
    mvn clean package -DskipTests -q
    if ($LASTEXITCODE -ne 0) { Log-Error "Maven build that bai" }
    Log-OK "Maven build thanh cong"

    Log-Step "2/5  Upload JAR len server"
    $JAR = "$PROJECT_DIR\target\youth-kgu-0.0.1-SNAPSHOT.jar"
    Invoke-Expression "$SCP `"$JAR`" ${REMOTE}:/home/${REMOTE_USER}/youth-kgu-0.0.1-SNAPSHOT.jar"
    if ($LASTEXITCODE -ne 0) { Log-Error "Upload JAR that bai" }
    Log-OK "Upload JAR thanh cong"
}

# ─── FRONTEND ───
if ($Frontend) {
    Log-Step "3/5  Build frontend (npm)"
    Set-Location "$PROJECT_DIR\frontend-react"
    npm run build --silent
    if ($LASTEXITCODE -ne 0) { Log-Error "npm build that bai" }
    Log-OK "npm build thanh cong"

    Log-Step "4/5  Nen va upload dist len server"
    Compress-Archive -Path dist -DestinationPath "$PROJECT_DIR\dist.zip" -Force
    Invoke-Expression "$SCP `"$PROJECT_DIR\dist.zip`" ${REMOTE}:/home/${REMOTE_USER}/dist.zip"
    if ($LASTEXITCODE -ne 0) { Log-Error "Upload dist.zip that bai" }
    Log-OK "Upload dist.zip thanh cong"
    Set-Location $PROJECT_DIR
}

# ─── DEPLOY TREN SERVER ───
Log-Step "5/5  Deploy tren server"

$lines = [System.Collections.Generic.List[string]]::new()
$lines.Add("set -e")

if ($Backend) {
    $lines.Add("echo '>>> Cap nhat backend...'")
    $lines.Add("sudo cp ~/youth-kgu-0.0.1-SNAPSHOT.jar /opt/youth-kgu/backend/app.jar")
    $lines.Add("sudo chown youthkgu:youthkgu /opt/youth-kgu/backend/app.jar")
}
if ($Frontend) {
    $lines.Add("echo '>>> Cap nhat frontend...'")
    $lines.Add("sudo rm -rf /opt/youth-kgu/frontend/dist")
    $lines.Add("sudo unzip -o ~/dist.zip -d /opt/youth-kgu/frontend/")
    $lines.Add("sudo chown -R youthkgu:youthkgu /opt/youth-kgu/frontend/")
}
if ($Backend) {
    $lines.Add("echo '>>> Restart backend...'")
    $lines.Add("sudo systemctl restart youth-kgu-backend")
    $lines.Add("sleep 3")
    $lines.Add("sudo systemctl is-active youth-kgu-backend && echo 'Backend: RUNNING' || echo 'Backend: FAILED'")
}
if ($Frontend) {
    $lines.Add("echo '>>> Reload nginx...'")
    $lines.Add("sudo systemctl reload nginx")
    $lines.Add("echo 'Nginx: OK'")
}
$lines.Add("rm -f ~/youth-kgu-0.0.1-SNAPSHOT.jar ~/dist.zip")
$lines.Add("echo 'Xong!'")

# Pipe script qua stdin để tránh quoting hell
$lines -join "`n" | & ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no $REMOTE "bash -s"
if ($LASTEXITCODE -ne 0) { Log-Error "Deploy tren server that bai" }

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Host "`nDeploy hoan tat sau ${elapsed}s" -ForegroundColor Green
