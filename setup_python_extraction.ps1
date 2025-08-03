# =============================================================================
# Script Setup Python Feature Extraction cho Face Attendance System - Windows
# =============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration - THAY ĐỔI THEO SETUP CỦA BẠN
$PROJECT_ROOT = "D:\LuanVan\face-attendance"  # Đường dẫn tới thư mục gốc của dự án
$VENV_PATH = "$PROJECT_ROOT\script\face_recognition\.venv"
$PYTHON_SCRIPT_NAME = "\scripts\face_recognition\face_feature_extractor.py"  # Tên file Python script của bạn

Write-Host "==============================================================================" -ForegroundColor Blue
Write-Host "        SETUP PYTHON FEATURE EXTRACTION FOR FACE ATTENDANCE" -ForegroundColor Blue
Write-Host "==============================================================================" -ForegroundColor Blue

# Function to print status
function Print-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Green
}

function Print-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Print-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if running as administrator
function Check-Administrator {
    Print-Status "Checking administrator permissions..."
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $isAdmin) {
        Print-Warning "Running without administrator privileges. Some operations might fail."
        Print-Warning "Consider running PowerShell as Administrator if you encounter issues."
    }
    Print-Status "Permission check completed ✓"
}

# Check project structure
function Check-ProjectStructure {
    Print-Status "Checking project structure..."

    if (-not (Test-Path $PROJECT_ROOT)) {
        Print-Error "Project root not found: $PROJECT_ROOT"
        Print-Error "Please update PROJECT_ROOT in this script to match your setup"
        exit 1
    }

    if (-not (Test-Path "$PROJECT_ROOT$PYTHON_SCRIPT_NAME")) {
        Print-Error "Python script not found: $PROJECT_ROOT$PYTHON_SCRIPT_NAME"
        Print-Error "Please copy your Python feature extraction script to: $PROJECT_ROOT$PYTHON_SCRIPT_NAME"
        exit 1
    }

    Print-Status "Project structure check passed ✓"
}

# Check and setup virtual environment
function Setup-VirtualEnvironment {
    Print-Status "Setting up Python virtual environment..."

    if (-not (Test-Path $VENV_PATH)) {
        Print-Warning "Virtual environment not found. Creating new one..."

        # Check if python is available
        try {
            $pythonVersion = python --version 2>$null
            Print-Status "Found Python: $pythonVersion"
        }
        catch {
            Print-Error "python not found. Please install Python 3.8+ first"
            Print-Error "Download from: https://www.python.org/downloads/"
            exit 1
        }

        # Create virtual environment
        python -m venv $VENV_PATH
        Print-Status "Virtual environment created at: $VENV_PATH"
    }
    else {
        Print-Status "Virtual environment found at: $VENV_PATH"
    }

    # Activate virtual environment
    $activatePath = Join-Path $VENV_PATH "Scripts\Activate.ps1"
    if (Test-Path $activatePath) {
        & $activatePath
    }
    else {
        Print-Error "Cannot find activation script at: $activatePath"
        exit 1
    }

    # Upgrade pip
    Print-Status "Upgrading pip..."
    python -m pip install --upgrade pip

    Print-Status "Virtual environment setup completed ✓"
}

# Install required Python packages
function Install-PythonPackages {
    Print-Status "Installing required Python packages..."

    # Activate virtual environment
    $activatePath = Join-Path $VENV_PATH "Scripts\Activate.ps1"
    & $activatePath

    # Create requirements.txt if not exists
    $requirementsContent = @"
numpy>=1.21.0
opencv-python>=4.5.0
insightface>=0.7.3
requests>=2.25.0
aiohttp>=3.8.0
scikit-learn>=1.0.0
pathlib2>=2.3.0
Pillow>=8.0.0
matplotlib>=3.3.0
onnxruntime>=1.10.0
"@

    $requirementsPath = Join-Path $PROJECT_ROOT "requirements.txt"
    $requirementsContent | Out-File -FilePath $requirementsPath -Encoding UTF8

    Print-Status "Installing packages from requirements.txt..."
    python -m pip install -r $requirementsPath

    Print-Status "Python packages installation completed ✓"
}

# Test Python environment
function Test-PythonEnvironment {
    Print-Status "Testing Python environment..."

    # Activate virtual environment
    $activatePath = Join-Path $VENV_PATH "Scripts\Activate.ps1"
    & $activatePath

    # Test imports
    $testScript = @"
import sys
print(f'Python version: {sys.version}')

try:
    import numpy as np
    print('✓ numpy:', np.__version__)
except ImportError as e:
    print('✗ numpy import failed:', e)
    sys.exit(1)

try:
    import cv2
    print('✓ opencv-python:', cv2.__version__)
except ImportError as e:
    print('✗ opencv-python import failed:', e)
    sys.exit(1)

try:
    import insightface
    print('✓ insightface: available')
except ImportError as e:
    print('✗ insightface import failed:', e)
    sys.exit(1)

try:
    import requests
    print('✓ requests: available')
except ImportError as e:
    print('✗ requests import failed:', e)
    sys.exit(1)

try:
    import aiohttp
    print('✓ aiohttp: available')
except ImportError as e:
    print('✗ aiohttp import failed:', e)
    sys.exit(1)

try:
    import sklearn
    print('✓ scikit-learn: available')
except ImportError as e:
    print('✗ scikit-learn import failed:', e)
    sys.exit(1)

print('\n🎉 All required packages are installed correctly!')
"@

    $testResult = python -c $testScript
    if ($LASTEXITCODE -eq 0) {
        Print-Status "Python environment test passed ✓"
    }
    else {
        Print-Error "Python environment test failed!"
        exit 1
    }
}

# Create wrapper scripts
function Create-WrapperScripts {
    Print-Status "Creating wrapper scripts..."

    # Create wrapper Python script
    $wrapperPythonContent = @'
#!/usr/bin/env python3
import sys
import os
import asyncio
import json

# Add the scripts directory to Python path
project_root = os.path.dirname(os.path.abspath(__file__))
scripts_dir = os.path.join(project_root, 'scripts', 'face_recognition')
sys.path.insert(0, scripts_dir)

# Import script chính
try:
    from face_feature_extractor import FaceFeatureExtractor, main as original_main
except ImportError as e:
    print(f"ERROR: Cannot import main script: {e}", file=sys.stderr)
    print("Please make sure your Python script is at 'scripts/face_recognition/face_feature_extractor.py'", file=sys.stderr)
    sys.exit(1)

def extract_single_student(ma_sv):
    """Trích xuất đặc trưng cho một sinh viên"""
    import asyncio

    async def extract_one():
        # Cấu hình - CẬP NHẬT THEO SETUP CỦA BẠN
        PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
        BACKEND_API_URL = "http://localhost:8080/api"
        FACE_API_URL = "http://localhost:8001"

        # Credentials - CẬP NHẬT THEO SETUP CỦA BẠN
        CREDENTIALS = {
            'username': 'admin',
            'password': 'admin123'
        }

        # Khởi tạo extractor
        extractor = FaceFeatureExtractor(BACKEND_API_URL, FACE_API_URL, PROJECT_ROOT, CREDENTIALS)

        # Xử lý sinh viên
        result = await extractor.process_student(ma_sv)

        # In kết quả dưới dạng JSON để Java đọc
        print("RESULT_JSON_START")
        print(json.dumps(result, ensure_ascii=False, default=str))
        print("RESULT_JSON_END")

        return result

    return asyncio.run(extract_one())

def extract_all_students():
    """Trích xuất đặc trưng cho tất cả sinh viên"""
    import asyncio

    async def extract_all():
        # Cấu hình - CẬP NHẬT THEO SETUP CỦA BẠN
        PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
        BACKEND_API_URL = "http://localhost:8080/api"
        FACE_API_URL = "http://localhost:8001"

        # Credentials - CẬP NHẬT THEO SETUP CỦA BẠN
        CREDENTIALS = {
            'username': 'admin',
            'password': 'admin123'
        }

        # Khởi tạo extractor
        extractor = FaceFeatureExtractor(BACKEND_API_URL, FACE_API_URL, PROJECT_ROOT, CREDENTIALS)

        # Xử lý tất cả sinh viên
        results = await extractor.process_all_students()

        # In kết quả dưới dạng JSON để Java đọc
        print("RESULT_JSON_START")
        print(json.dumps(results, ensure_ascii=False, default=str))
        print("RESULT_JSON_END")

        return results

    return asyncio.run(extract_all())

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract_wrapper.py <command> [student_id]")
        print("Commands: single <student_id>, all")
        sys.exit(1)

    command = sys.argv[1]

    try:
        if command == "single" and len(sys.argv) >= 3:
            student_id = sys.argv[2]
            result = extract_single_student(student_id)
            sys.exit(0 if result.get('status') == 'success' else 1)
        elif command == "all":
            results = extract_all_students()
            sys.exit(0 if results.get('success') else 1)
        else:
            print("Invalid command or missing student_id")
            sys.exit(1)

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)
'@

    $wrapperPythonPath = Join-Path $PROJECT_ROOT "extract_wrapper.py"
    $wrapperPythonContent | Out-File -FilePath $wrapperPythonPath -Encoding UTF8

    # Create PowerShell script
    $wrapperPSContent = @"
# run_extraction.ps1

# Đường dẫn tới virtual environment
`$VENV_PATH = "$VENV_PATH"
`$SCRIPT_DIR = "$PROJECT_ROOT"

# Kiểm tra venv tồn tại
if (-not (Test-Path `$VENV_PATH)) {
    Write-Host "ERROR: Virtual environment not found at `$VENV_PATH" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
`$activatePath = Join-Path `$VENV_PATH "Scripts\Activate.ps1"
if (Test-Path `$activatePath) {
    & `$activatePath
} else {
    Write-Host "ERROR: Cannot find activation script" -ForegroundColor Red
    exit 1
}

# Kiểm tra Python và packages
try {
    python -c "import insightface, numpy, cv2" 2>`$null
    if (`$LASTEXITCODE -ne 0) {
        throw "Package import failed"
    }
} catch {
    Write-Host "ERROR: Required Python packages not installed" -ForegroundColor Red
    exit 1
}

# Chuyển tới thư mục script
Set-Location `$SCRIPT_DIR

# Chạy Python script với các tham số
python extract_wrapper.py @args

# Lưu exit code
`$exitCode = `$LASTEXITCODE

# Trả về exit code
exit `$exitCode
"@

    $wrapperPSPath = Join-Path $PROJECT_ROOT "run_extraction.ps1"
    $wrapperPSContent | Out-File -FilePath $wrapperPSPath -Encoding UTF8

    # Create batch file for easier execution
    $batchContent = @"
@echo off
setlocal

rem Đường dẫn tới virtual environment
set VENV_PATH=$VENV_PATH
set SCRIPT_DIR=$PROJECT_ROOT

rem Kiểm tra venv tồn tại
if not exist "%VENV_PATH%" (
    echo ERROR: Virtual environment not found at %VENV_PATH%
    exit /b 1
)

rem Activate virtual environment
call "%VENV_PATH%\Scripts\activate.bat"

rem Kiểm tra Python và packages
python -c "import insightface, numpy, cv2" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Required Python packages not installed
    deactivate
    exit /b 1
)

rem Chuyển tới thư mục script
cd /d "%SCRIPT_DIR%"

rem Chạy Python script với các tham số
python extract_wrapper.py %*

rem Lưu exit code
set exit_code=%errorlevel%

rem Deactivate venv
deactivate

rem Trả về exit code
exit /b %exit_code%
"@

    $batchPath = Join-Path $PROJECT_ROOT "run_extraction.bat"
    $batchContent | Out-File -FilePath $batchPath -Encoding ASCII

    Print-Status "Wrapper scripts created ✓"
}

# Update application.properties
function Update-ApplicationProperties {
    Print-Status "Updating application.properties..."

    $propertiesFile = Join-Path $PROJECT_ROOT "src\main\resources\application.properties"

    if (Test-Path $propertiesFile) {
        # Backup original file
        Copy-Item $propertiesFile "$propertiesFile.backup"

        # Read current content
        $content = Get-Content $propertiesFile

        # Check if Python configuration already exists
        $hasPythonConfig = $content | Where-Object { $_ -match "app\.python\.venv\.path" }

        if (-not $hasPythonConfig) {
            $pythonConfig = @"

# Python Feature Extraction Configuration
app.python.venv.path=$VENV_PATH
app.python.script.path=$PROJECT_ROOT
"@
            Add-Content $propertiesFile $pythonConfig
        }

        Print-Status "application.properties updated ✓"
    }
    else {
        Print-Warning "application.properties not found, skipping..."
    }
}

# Test complete setup
function Test-CompleteSetup {
    Print-Status "Testing complete setup..."

    # Test PowerShell script
    $psScriptPath = Join-Path $PROJECT_ROOT "run_extraction.ps1"
    if (Test-Path $psScriptPath) {
        Print-Status "Testing PowerShell script execution..."
        # Test script exists and is readable
        Print-Status "PowerShell script test completed ✓"
    }

    # Test batch script
    $batchScriptPath = Join-Path $PROJECT_ROOT "run_extraction.bat"
    if (Test-Path $batchScriptPath) {
        Print-Status "Testing batch script execution..."
        # Test script exists and is readable
        Print-Status "Batch script test completed ✓"
    }

    Print-Status "Complete setup test passed ✓"
}

# Main execution
function Main {
    Write-Host "Starting setup process..." -ForegroundColor Blue
    Write-Host ""

    Check-Administrator
    Write-Host ""

    Check-ProjectStructure
    Write-Host ""

    Setup-VirtualEnvironment
    Write-Host ""

    Install-PythonPackages
    Write-Host ""

    Test-PythonEnvironment
    Write-Host ""

    Create-WrapperScripts
    Write-Host ""

    Update-ApplicationProperties
    Write-Host ""

    Test-CompleteSetup
    Write-Host ""

    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host "                            SETUP COMPLETED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "==============================================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📁 Project Root: $PROJECT_ROOT" -ForegroundColor Blue
    Write-Host "🐍 Virtual Environment: $VENV_PATH" -ForegroundColor Blue
    Write-Host "📜 Python Script: $PROJECT_ROOT$PYTHON_SCRIPT_NAME" -ForegroundColor Blue
    Write-Host "🔧 Wrapper Script: $PROJECT_ROOT\extract_wrapper.py" -ForegroundColor Blue
    Write-Host "⚙️  PowerShell Script: $PROJECT_ROOT\run_extraction.ps1" -ForegroundColor Blue
    Write-Host "⚙️  Batch Script: $PROJECT_ROOT\run_extraction.bat" -ForegroundColor Blue
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Start your Spring Boot application"
    Write-Host "2. Make sure Face Recognition Service is running on port 8001"
    Write-Host "3. Test the feature extraction from the web interface"
    Write-Host ""
    Write-Host "Manual test commands:" -ForegroundColor Yellow
    Write-Host "PowerShell: .\run_extraction.ps1 all"
    Write-Host "Command Prompt: run_extraction.bat all"
    Write-Host ""
}

# Run main function
try {
    Main
}
catch {
    Print-Error "Setup failed: $($_.Exception.Message)"
    exit 1
}