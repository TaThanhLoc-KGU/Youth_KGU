param(
    [switch]$Backend,
    [switch]$Frontend
)

if (-not $Backend -and -not $Frontend) {
    $Backend  = $true
    $Frontend = $true
}

$ErrorActionPreference = "Stop"
$startTime = Get-Date

# ===== CONFIG =====
$HOST_IP  = "100.110.62.27"
$USER     = "Dieukhientuxa"
$PORT     = 32156
$SP       = "Vnkgu@Qtcsvc@2026"
$PROJ     = "D:\Youth_KGU"
$BE_DIR   = "/opt/youth-kgu/backend"
$FE_DIR   = "/www/wwwroot/youth-kgu"
# ==================

# ── Posh-SSH (cài nếu chưa có) ──────────────────────────────────────────────
if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
    Write-Host "Cai Posh-SSH..." -ForegroundColor Yellow
    Install-Module -Name Posh-SSH -Force -Scope CurrentUser -AllowClobber
}
Import-Module Posh-SSH -Force

$secPass = ConvertTo-SecureString $SP -AsPlainText -Force
$cred    = New-Object PSCredential($USER, $secPass)

Write-Host "Ket noi SSH..." -ForegroundColor Cyan
$sess = New-SSHSession -ComputerName $HOST_IP -Port $PORT -Credential $cred -AcceptKey -Force
$sid  = $sess.SessionId

function Run($cmd) {
    $r = Invoke-SSHCommand -SessionId $sid -Command $cmd
    if ($r.Output) { Write-Host $r.Output }
    if ($r.Error)  { Write-Host $r.Error -ForegroundColor Yellow }
}

function Upload($local, $remote) {
    Set-SCPItem -ComputerName $HOST_IP -Port $PORT -Credential $cred `
        -Path $local -Destination $remote -AcceptKey -Force
}

Set-Location $PROJ

# ── BACKEND ──────────────────────────────────────────────────────────────────
if ($Backend) {
    Write-Host "`n===== 1/3 Build backend =====" -ForegroundColor Cyan
    $prevEAP = $ErrorActionPreference; $ErrorActionPreference = "Continue"
    mvn clean package -DskipTests -q "-Dmaven.clean.failOnError=false"
    $mvnExit = $LASTEXITCODE; $ErrorActionPreference = $prevEAP
    if ($mvnExit -ne 0) { Write-Host "[ERROR] Maven that bai" -ForegroundColor Red; exit 1 }

    Write-Host "`n===== 2/3 Upload JAR =====" -ForegroundColor Cyan
    Upload "$PROJ\target\youth-kgu-0.0.1-SNAPSHOT.jar" "~"
    Write-Host "Upload JAR OK"
}

# ── FRONTEND ─────────────────────────────────────────────────────────────────
if ($Frontend) {
    Write-Host "`n===== Build frontend =====" -ForegroundColor Cyan
    Set-Location "$PROJ\frontend-react"
    $prevEAP2 = $ErrorActionPreference; $ErrorActionPreference = "Continue"
    npm run build --silent
    $npmExit = $LASTEXITCODE; $ErrorActionPreference = $prevEAP2
    if ($npmExit -ne 0) { Write-Host "[ERROR] npm build that bai" -ForegroundColor Red; exit 1 }
    Set-Location $PROJ

    Write-Host "`n===== Upload dist =====" -ForegroundColor Cyan
    Compress-Archive -Path "$PROJ\frontend-react\dist\*" -DestinationPath "$PROJ\dist.zip" -Force
    Upload "$PROJ\dist.zip" "~"
    Remove-Item "$PROJ\dist.zip" -Force
    Write-Host "Upload dist OK"
}

# ── DEPLOY TREN SERVER ───────────────────────────────────────────────────────
Write-Host "`n===== Deploy tren server =====" -ForegroundColor Cyan

$lines = @("#!/bin/bash", "set -e")

if ($Backend) {
    $lines += "echo '--- Cap nhat backend...'"
    $lines += "echo '$SP' | sudo -S mkdir -p /opt/youth-kgu/logs/"
    $lines += "echo '$SP' | sudo -S chown -R youthkgu:youthkgu /opt/youth-kgu/"
    $lines += "echo '$SP' | sudo -S cp ~/youth-kgu-0.0.1-SNAPSHOT.jar $BE_DIR/app.jar && echo 'OK: copy jar'"
    $lines += "echo '$SP' | sudo -S chown youthkgu:youthkgu $BE_DIR/app.jar && echo 'OK: chown jar'"
    $lines += "echo '$SP' | sudo -S chmod 755 $BE_DIR/app.jar && echo 'OK: chmod jar'"
    $lines += "echo '$SP' | sudo -S chown -R youthkgu:youthkgu $BE_DIR/"
    $lines += "echo '$SP' | sudo -S chown -R youthkgu:youthkgu /opt/youth-kgu/logs/"
}
if ($Frontend) {
    $lines += "echo '--- Cap nhat frontend...'"
    $lines += "echo '$SP' | sudo -S rm -rf $FE_DIR/*"
    $lines += "echo '$SP' | sudo -S unzip -o ~/dist.zip -d $FE_DIR/ && echo 'OK: unzip'"
    $lines += "echo '$SP' | sudo -S chown -R www:www $FE_DIR/ 2>/dev/null ; echo 'OK: chown'"
}
if ($Backend) {
    $lines += "echo '--- Set SPRING_PROFILES_ACTIVE=prod ...'"
    $lines += "if ! grep -q 'SPRING_PROFILES_ACTIVE' /etc/systemd/system/youth-kgu-backend.service 2>/dev/null; then"
    $lines += "  echo '$SP' | sudo -S sed -i '/\[Service\]/a Environment=SPRING_PROFILES_ACTIVE=prod' /etc/systemd/system/youth-kgu-backend.service"
    $lines += "  echo 'OK: added SPRING_PROFILES_ACTIVE=prod'"
    $lines += "else"
    $lines += "  echo '$SP' | sudo -S sed -i 's/SPRING_PROFILES_ACTIVE=.*/SPRING_PROFILES_ACTIVE=prod/' /etc/systemd/system/youth-kgu-backend.service"
    $lines += "  echo 'OK: ensured SPRING_PROFILES_ACTIVE=prod'"
    $lines += "fi"
    $lines += "echo '$SP' | sudo -S systemctl daemon-reload && echo 'OK: daemon-reload'"
    $lines += "echo '--- Restart backend...'"
    $lines += "echo '$SP' | sudo -S systemctl restart youth-kgu-backend && echo 'OK: restart'"
    $lines += "sleep 4"
    $lines += "echo '$SP' | sudo -S systemctl is-active youth-kgu-backend && echo 'Backend: RUNNING' || echo 'Backend: FAILED'"
}
$lines += "rm -f ~/youth-kgu-0.0.1-SNAPSHOT.jar ~/dist.zip ~/deploy.sh"
$lines += "echo '=== DONE ==='"

$tmp = "$env:TEMP\deploy.sh"
[System.IO.File]::WriteAllText($tmp, ($lines -join "`n") + "`n", [System.Text.UTF8Encoding]::new($false))

Upload $tmp "~"
Remove-Item $tmp -Force -ErrorAction SilentlyContinue

Run "bash ~/deploy.sh"

Remove-SSHSession -SessionId $sid | Out-Null

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Host "`nDone! (${elapsed}s)" -ForegroundColor Green
