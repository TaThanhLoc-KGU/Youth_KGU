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
$SRV      = "Dieukhientuxa@123.22.30.72"
$PORT     = "32156"
$SP       = "Vnkgu@Qtcsvc@2026"
$PROJ     = "D:\Youth_KGU"
$BE_DIR   = "/opt/youth-kgu/backend"
$FE_DIR   = "/www/wwwroot/youth-kgu"
# ==================

Set-Location $PROJ

# ─── BACKEND ──────────────────────────────────────────────────────────────
if ($Backend) {
    Write-Host "`n===== Build backend =====" -ForegroundColor Cyan
    mvn clean package -DskipTests -q
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Maven that bai" -ForegroundColor Red; exit 1 }

    Write-Host "`n===== Upload JAR =====" -ForegroundColor Cyan
    $JAR = "$PROJ\target\youth-kgu-0.0.1-SNAPSHOT.jar"
    scp -P $PORT $JAR "${SRV}:youth-kgu-0.0.1-SNAPSHOT.jar"
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Upload JAR that bai" -ForegroundColor Red; exit 1 }
}

# ─── FRONTEND ─────────────────────────────────────────────────────────────
if ($Frontend) {
    Write-Host "`n===== Build frontend =====" -ForegroundColor Cyan
    Set-Location "$PROJ\frontend-react"
    npm run build --silent
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] npm build that bai" -ForegroundColor Red; exit 1 }
    Set-Location $PROJ

    Write-Host "`n===== Upload dist =====" -ForegroundColor Cyan
    Compress-Archive -Path "$PROJ\frontend-react\dist\*" -DestinationPath "$PROJ\dist.zip" -Force
    scp -P $PORT "$PROJ\dist.zip" "${SRV}:dist.zip"
    if ($LASTEXITCODE -ne 0) { Write-Host "[ERROR] Upload dist that bai" -ForegroundColor Red; exit 1 }
    Remove-Item "$PROJ\dist.zip" -Force
}

# ─── BASH SCRIPT (LF only, UTF-8 no BOM) ─────────────────────────────────
Write-Host "`n===== Deploy tren server =====" -ForegroundColor Cyan

$lines = @("#!/bin/bash")

if ($Backend) {
    $lines += "echo '--- Cap nhat backend...'"
    $lines += "echo '$SP' | sudo -S cp ~/youth-kgu-0.0.1-SNAPSHOT.jar $BE_DIR/app.jar && echo 'OK: copy jar' || echo 'FAIL: copy jar'"
    $lines += "echo '$SP' | sudo -S chown youthkgu:youthkgu $BE_DIR/app.jar && echo 'OK: chown jar' || echo 'FAIL: chown jar'"
}
if ($Frontend) {
    $lines += "echo '--- Cap nhat frontend...'"
    $lines += "echo '$SP' | sudo -S rm -rf $FE_DIR/* && echo 'OK: xoa cu' || echo 'FAIL: xoa cu'"
    $lines += "echo '$SP' | sudo -S unzip -o ~/dist.zip -d $FE_DIR/ ; echo 'OK: unzip'"
    $lines += "echo '$SP' | sudo -S chown -R www:www $FE_DIR/ 2>/dev/null ; echo 'OK: chown'"
}
if ($Backend) {
    $lines += "echo '--- Restart backend...'"
    $lines += "echo '$SP' | sudo -S systemctl restart youth-kgu-backend && echo 'OK: restart' || echo 'FAIL: restart'"
    $lines += "sleep 3"
    $lines += "echo '$SP' | sudo -S systemctl is-active youth-kgu-backend && echo 'Backend: RUNNING' || echo 'Backend: FAILED'"
}
$lines += "rm -f ~/youth-kgu-0.0.1-SNAPSHOT.jar ~/dist.zip ~/deploy.sh"
$lines += "echo '=== DONE ==='"

$tmp = "$env:TEMP\deploy.sh"
[System.IO.File]::WriteAllText($tmp, ($lines -join "`n") + "`n", [System.Text.UTF8Encoding]::new($false))

scp -P $PORT $tmp "${SRV}:deploy.sh"
ssh -p $PORT $SRV "bash ~/deploy.sh"

Remove-Item $tmp -Force -ErrorAction SilentlyContinue

$elapsed = [math]::Round(((Get-Date) - $startTime).TotalSeconds)
Write-Host "`nDone! (${elapsed}s)" -ForegroundColor Green
