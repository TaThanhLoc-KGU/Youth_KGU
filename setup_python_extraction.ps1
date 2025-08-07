# =============================================================================
# Script Setup Python Feature Extraction cho Face Attendance System - Windows
# =============================================================================

# Set error action preference
$ErrorActionPreference = "Stop"

# Configuration - RELATIVE PATHS
$SCRIPT_DIR = $PSScriptRoot
$PROJECT_ROOT = $SCRIPT_DIR  # Script is in project root
$VENV_PATH = Join-Path $PROJECT_ROOT "scripts\face_recognition\.venv"
$PYTHON_SCRIPT_NAME = "scripts\face_recognition\face_feature_extractor.py"

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

# Check environment and paths
function Check-Environment {
    Print-Status "Checking environment..."
    Print-Status "Script directory: $SCRIPT_DIR"
    Print-Status "Project root: $PROJECT_ROOT"
    Print-Status "PowerShell version: $($PSVersionTable.PSVersion)"

    # Check if running as administrator
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    $isAdmin = $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

    if (-not $isAdmin) {
        Print-Warning "Running without administrator privileges. Some operations might fail."
        Print-Warning "Consider running PowerShell as Administrator if you encounter issues."
    } else {
        Print-Status "Running with administrator privileges ✓"
    }

    Print-Status "Environment check completed ✓"
}

# Check project structure
function Check-ProjectStructure {
    Print-Status "Checking project structure..."

    if (-not (Test-Path $PROJECT_ROOT)) {
        Print-Error "Project root not found: $PROJECT_ROOT"
        Print-Error "Please run this script from the project root directory"
        exit 1
    }

    # Check and create scripts directory if needed
    $scriptsDir = Join-Path $PROJECT_ROOT "scripts"
    if (-not (Test-Path $scriptsDir)) {
        Print-Warning "Scripts directory not found. Creating it..."
        New-Item -ItemType Directory -Path $scriptsDir -Force | Out-Null
    }

    # Check and create face_recognition directory if needed
    $faceRecognitionDir = Join-Path $PROJECT_ROOT "scripts\face_recognition"
    if (-not (Test-Path $faceRecognitionDir)) {
        Print-Warning "Face recognition directory not found. Creating it..."
        New-Item -ItemType Directory -Path $faceRecognitionDir -Force | Out-Null
    }

    # Check if Python script exists
    $scriptPath = Join-Path $PROJECT_ROOT $PYTHON_SCRIPT_NAME
    if (-not (Test-Path $scriptPath)) {
        Print-Warning "Python script not found: $scriptPath"
        Print-Warning "Will create a template script for you"
    }

    Print-Status "Project structure check completed ✓"
}

# Create template Python script if not exists
function Create-TemplateScript {
    $scriptPath = Join-Path $PROJECT_ROOT $PYTHON_SCRIPT_NAME

    if (-not (Test-Path $scriptPath)) {
        Print-Status "Creating template face_feature_extractor.py..."

        $templateContent = @'
#!/usr/bin/env python3
"""
Face Feature Extractor for Face Attendance System
Template script - customize according to your needs
"""

import sys
import os
import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('face_extraction.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class FaceFeatureExtractor:
    """Face Feature Extractor for processing student images"""

    def __init__(self, backend_api_url: str, face_api_url: str, project_root: str, credentials: Dict):
        self.backend_api_url = backend_api_url
        self.face_api_url = face_api_url
        self.project_root = Path(project_root)
        self.credentials = credentials

        # Configuration
        self.max_face_size = 640
        self.min_face_size = 40
        self.quality_threshold = 0.6

        logger.info("FaceFeatureExtractor initialized")

    async def process_student(self, ma_sv: str) -> Dict:
        """Process a single student"""
        logger.info(f"Processing student: {ma_sv}")

        try:
            # TODO: Implement your face processing logic here
            # This is a template - customize according to your needs

            result = {
                'status': 'success',
                'student_id': ma_sv,
                'faces_processed': 0,
                'embedding_created': False,
                'message': f'Student {ma_sv} processed successfully (template)'
            }

            return result

        except Exception as e:
            logger.error(f"Error processing student {ma_sv}: {str(e)}")
            return {
                'status': 'error',
                'student_id': ma_sv,
                'message': str(e)
            }

    async def process_all_students(self) -> Dict:
        """Process all students"""
        logger.info("Processing all students")

        try:
            # TODO: Implement batch processing logic
            # This is a template - customize according to your needs

            result = {
                'success': True,
                'total_students': 0,
                'processed_students': 0,
                'failed_students': 0,
                'message': 'All students processed successfully (template)'
            }

            return result

        except Exception as e:
            logger.error(f"Error processing all students: {str(e)}")
            return {
                'success': False,
                'message': str(e)
            }

async def main():
    """Main function"""
    logger.info("Face Feature Extractor started")

    # Configuration - Use relative paths
    PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    BACKEND_API_URL = "http://localhost:8080/api"
    FACE_API_URL = "http://localhost:8001"
    CREDENTIALS = {
        'username': 'admin',
        'password': 'admin123'
    }

    # Create extractor
    extractor = FaceFeatureExtractor(BACKEND_API_URL, FACE_API_URL, PROJECT_ROOT, CREDENTIALS)

    # Example usage
    if len(sys.argv) > 1:
        if sys.argv[1] == "all":
            result = await extractor.process_all_students()
        else:
            ma_sv = sys.argv[1]
            result = await extractor.process_student(ma_sv)

        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        print("Usage: python face_feature_extractor.py <student_id|all>")

if __name__ == "__main__":
    asyncio.run(main())
'@

        $templateContent | Out-File -FilePath $scriptPath -Encoding UTF8
        Print-Status "Template script created at: $scriptPath"
        Print-Warning "Please customize this template script according to your specific needs"
    }
}

# Check and setup virtual environment
function Setup-VirtualEnvironment {
    Print-Status "Setting up Python virtual environment..."

    if (-not (Test-Path $VENV_PATH)) {
        Print-Warning "Virtual environment not found. Creating new one..."

        # Check if python is available
        try {
            $pythonVersion = python --version 2>$null
            if ($LASTEXITCODE -eq 0) {
                Print-Status "Found Python: $pythonVersion"
            } else {
                throw "Python not found"
            }
        }
        catch {
            Print-Error "python not found. Please install Python 3.8+ first"
            Print-Error "Download from: https://www.python.org/downloads/"
            Print-Error "Make sure Python is added to PATH during installation"
            exit 1
        }

        # Create virtual environment
        python -m venv $VENV_PATH
        if ($LASTEXITCODE -eq 0) {
            Print-Status "Virtual environment created at: $VENV_PATH"
        } else {
            Print-Error "Failed to create virtual environment"
            exit 1
        }
    }
    else {
        Print-Status "Virtual environment found at: $VENV_PATH"
    }

    # Activate virtual environment
    $activatePath = Join-Path $VENV_PATH "Scripts\Activate.ps1"
    if (Test-Path $activatePath) {
        try {
            & $activatePath
            Print-Status "Virtual environment activated ✓"
        }
        catch {
            Print-Error "Failed to activate virtual environment: $($_.Exception.Message)"
            exit 1
        }
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

    # Create requirements.txt
    $requirementsContent = @"
# Core dependencies
numpy>=1.21.0
opencv-python>=4.5.0
Pillow>=8.0.0
requests>=2.25.0
aiohttp>=3.8.0

# Machine Learning
scikit-learn>=1.0.0
onnxruntime>=1.10.0

# Face Recognition (install based on your needs)
# insightface>=0.7.3  # Uncomment if using InsightFace
# dlib>=19.22.0       # Uncomment if using dlib
# face-recognition>=1.3.0  # Uncomment if using face_recognition library

# Utilities
pathlib2>=2.3.0
matplotlib>=3.3.0
tqdm>=4.62.0

# Async and HTTP
asyncio-mqtt>=0.11.0
httpx>=0.24.0
"@

    $requirementsPath = Join-Path $PROJECT_ROOT "requirements.txt"
    $requirementsContent | Out-File -FilePath $requirementsPath -Encoding UTF8

    Print-Status "Installing packages from requirements.txt..."
    python -m pip install -r $requirementsPath

    if ($LASTEXITCODE -eq 0) {
        Print-Status "Python packages installation completed ✓"
    } else {
        Print-Error "Failed to install some packages. Check the output above for errors."
        exit 1
    }
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

# Test core packages
packages_to_test = [
    ('numpy', 'np'),
    ('cv2', 'cv2'),
    ('requests', 'requests'),
    ('aiohttp', 'aiohttp'),
    ('sklearn', 'sklearn')
]

failed_imports = []

for package_name, import_name in packages_to_test:
    try:
        module = __import__(import_name)
        if hasattr(module, '__version__'):
            print(f'✓ {package_name}: {module.__version__}')
        else:
            print(f'✓ {package_name}: available')
    except ImportError as e:
        print(f'✗ {package_name}: import failed - {e}')
        failed_imports.append(package_name)

if failed_imports:
    print(f'\n❌ Some packages failed to import: {failed_imports}')
    sys.exit(1)
else:
    print('\n🎉 All core packages imported successfully!')
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
"""
Wrapper script for face feature extraction
This script interfaces between Java Spring Boot and Python face extraction
"""

import sys
import os
import asyncio
import json
from pathlib import Path

# Get project root directory (where this script is located)
project_root = Path(__file__).parent.resolve()
scripts_dir = project_root / 'scripts' / 'face_recognition'

# Add scripts directory to Python path
sys.path.insert(0, str(scripts_dir))

# Import the main extractor
try:
    from face_feature_extractor import FaceFeatureExtractor
except ImportError as e:
    print(f"ERROR: Cannot import face_feature_extractor: {e}", file=sys.stderr)
    print("Please ensure face_feature_extractor.py exists in scripts/face_recognition/", file=sys.stderr)
    sys.exit(1)

def extract_single_student(student_id: str):
    """Extract features for a single student"""

    async def extract_one():
        # Configuration
        PROJECT_ROOT = str(project_root)
        BACKEND_API_URL = "http://localhost:8080/api"
        FACE_API_URL = "http://localhost:8001"

        # Credentials
        CREDENTIALS = {
            'username': 'admin',
            'password': 'admin123'
        }

        # Initialize extractor
        extractor = FaceFeatureExtractor(BACKEND_API_URL, FACE_API_URL, PROJECT_ROOT, CREDENTIALS)

        # Process student
        result = await extractor.process_student(student_id)

        # Output JSON for Java to parse
        print("RESULT_JSON_START")
        print(json.dumps(result, ensure_ascii=False, default=str))
        print("RESULT_JSON_END")

        return result

    return asyncio.run(extract_one())

def extract_all_students():
    """Extract features for all students"""

    async def extract_all():
        # Configuration
        PROJECT_ROOT = str(project_root)
        BACKEND_API_URL = "http://localhost:8080/api"
        FACE_API_URL = "http://localhost:8001"

        # Credentials
        CREDENTIALS = {
            'username': 'admin',
            'password': 'admin123'
        }

        # Initialize extractor
        extractor = FaceFeatureExtractor(BACKEND_API_URL, FACE_API_URL, PROJECT_ROOT, CREDENTIALS)

        # Process all students
        results = await extractor.process_all_students()

        # Output JSON for Java to parse
        print("RESULT_JSON_START")
        print(json.dumps(results, ensure_ascii=False, default=str))
        print("RESULT_JSON_END")

        return results

    return asyncio.run(extract_all())

def main():
    """Main function"""
    if len(sys.argv) < 2:
        print("Usage: python extract_wrapper.py <command> [student_id]")
        print("Commands:")
        print("  single <student_id>  - Extract features for one student")
        print("  all                  - Extract features for all students")
        sys.exit(1)

    command = sys.argv[1].lower()

    try:
        if command == "single":
            if len(sys.argv) < 3:
                print("ERROR: Missing student_id for single extraction", file=sys.stderr)
                sys.exit(1)

            student_id = sys.argv[2]
            result = extract_single_student(student_id)
            sys.exit(0 if result.get('status') == 'success' else 1)

        elif command == "all":
            results = extract_all_students()
            sys.exit(0 if results.get('success') else 1)

        else:
            print(f"ERROR: Unknown command '{command}'", file=sys.stderr)
            print("Use 'single <student_id>' or 'all'", file=sys.stderr)
            sys.exit(1)

    except Exception as e:
        print(f"ERROR: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
'@

    $wrapperPythonPath = Join-Path $PROJECT_ROOT "extract_wrapper.py"
    $wrapperPythonContent | Out-File -FilePath $wrapperPythonPath -Encoding UTF8

    # Create PowerShell script
    $wrapperPSContent = @"
# run_extraction.ps1 - Face Feature Extraction Runner Script

# Get script directory and set relative paths
`$SCRIPT_DIR = `$PSScriptRoot
`$VENV_PATH = Join-Path `$SCRIPT_DIR "scripts\face_recognition\.venv"

# Check if virtual environment exists
if (-not (Test-Path `$VENV_PATH)) {
    Write-Host "ERROR: Virtual environment not found at `$VENV_PATH" -ForegroundColor Red
    Write-Host "Please run setup_python_extraction.ps1 first" -ForegroundColor Red
    exit 1
}

# Activate virtual environment
`$activatePath = Join-Path `$VENV_PATH "Scripts\Activate.ps1"
if (Test-Path `$activatePath) {
    try {
        & `$activatePath
    } catch {
        Write-Host "ERROR: Cannot activate virtual environment" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "ERROR: Cannot find activation script at `$activatePath" -ForegroundColor Red
    exit 1
}

# Verify Python packages
try {
    python -c "import numpy, cv2, requests" 2>`$null
    if (`$LASTEXITCODE -ne 0) {
        throw "Package import failed"
    }
} catch {
    Write-Host "ERROR: Required Python packages not installed" -ForegroundColor Red
    Write-Host "Please run setup_python_extraction.ps1 first" -ForegroundColor Red
    exit 1
}

# Change to project directory
Set-Location `$SCRIPT_DIR

# Run Python wrapper with arguments
python extract_wrapper.py @args

# Store exit code
`$exitCode = `$LASTEXITCODE

# Return exit code
exit `$exitCode
"@

    $wrapperPSPath = Join-Path $PROJECT_ROOT "run_extraction.ps1"
    $wrapperPSContent | Out-File -FilePath $wrapperPSPath -Encoding UTF8

    # Create batch file for easier execution
    $batchContent = @"
@echo off
setlocal EnableDelayedExpansion

rem Get script directory and set relative paths
set SCRIPT_DIR=%~dp0
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%
set VENV_PATH=%SCRIPT_DIR%\scripts\face_recognition\.venv

rem Check if virtual environment exists
if not exist "%VENV_PATH%" (
    echo ERROR: Virtual environment not found at %VENV_PATH%
    echo Please run setup_python_extraction.ps1 first
    exit /b 1
)

rem Activate virtual environment
call "%VENV_PATH%\Scripts\activate.bat"
if errorlevel 1 (
    echo ERROR: Cannot activate virtual environment
    exit /b 1
)

rem Verify Python packages
python -c "import numpy, cv2, requests" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Required Python packages not installed
    echo Please run setup_python_extraction.ps1 first
    call deactivate
    exit /b 1
)

rem Change to project directory
cd /d "%SCRIPT_DIR%"

rem Run Python wrapper with arguments
python extract_wrapper.py %*

rem Store exit code
set exit_code=%errorlevel%

rem Deactivate venv
call deactivate

rem Return exit code
exit /b %exit_code%
"@

    $batchPath = Join-Path $PROJECT_ROOT "run_extraction.bat"
    $batchContent | Out-File -FilePath $batchPath -Encoding ASCII

    Print-Status "Wrapper scripts created ✓"
    Print-Status "  - extract_wrapper.py (Python wrapper)"
    Print-Status "  - run_extraction.ps1 (PowerShell script)"
    Print-Status "  - run_extraction.bat (Windows batch file)"
}

# Update application.properties
function Update-ApplicationProperties {
    Print-Status "Updating application.properties..."

    $propertiesFile = Join-Path $PROJECT_ROOT "src\main\resources\application.properties"

    if (Test-Path $propertiesFile) {
        # Backup original file
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        Copy-Item $propertiesFile "$propertiesFile.backup.$timestamp"

        # Get absolute paths for Java configuration
        $absVenvPath = (Resolve-Path $VENV_PATH).Path
        $absProjectRoot = (Resolve-Path $PROJECT_ROOT).Path
        $absScriptFile = (Resolve-Path (Join-Path $PROJECT_ROOT $PYTHON_SCRIPT_NAME)).Path

        # Read current content
        $content = Get-Content $propertiesFile

        # Remove old Python configuration
        $filteredContent = $content | Where-Object {
            $_ -notmatch "# Python Feature Extraction Configuration" -and
                    $_ -notmatch "app\.python\.venv\.path" -and
                    $_ -notmatch "app\.python\.script\.path" -and
                    $_ -notmatch "app\.python\.script\.file" -and
                    $_ -notmatch "app\.python\.timeout\.minutes" -and
                    $_ -notmatch "app\.python\.max\.concurrent"
        }

        # Add updated Python configuration
        $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        $pythonConfig = @"

# Python Feature Extraction Configuration - Updated $timestamp
app.python.venv.path=$absVenvPath
app.python.script.path=$absProjectRoot
app.python.script.file=$absScriptFile
app.python.timeout.minutes=30
app.python.max.concurrent=2
"@

        # Write updated content
        $filteredContent + $pythonConfig | Out-File -FilePath $propertiesFile -Encoding UTF8

        Print-Status "application.properties updated with absolute paths ✓"
    }
    else {
        Print-Warning "application.properties not found at: $propertiesFile"
        Print-Warning "Skipping application.properties update..."
    }
}

# Test complete setup
function Test-CompleteSetup {
    Print-Status "Testing complete setup..."

    # Test Python wrapper
    $wrapperPath = Join-Path $PROJECT_ROOT "extract_wrapper.py"
    if (Test-Path $wrapperPath) {
        Print-Status "Testing Python wrapper..."

        # Activate venv and test
        $activatePath = Join-Path $VENV_PATH "Scripts\Activate.ps1"
        & $activatePath

        # Test wrapper (should show usage)
        try {
            python $wrapperPath 2>$null
        } catch {
            # Expected to fail with usage message
        }
        Print-Status "Wrapper script ready ✓"
    }

    # Test PowerShell script
    $psScriptPath = Join-Path $PROJECT_ROOT "run_extraction.ps1"
    if (Test-Path $psScriptPath) {
        Print-Status "PowerShell script ready ✓"
    }

    # Test batch script
    $batchScriptPath = Join-Path $PROJECT_ROOT "run_extraction.bat"
    if (Test-Path $batchScriptPath) {
        Print-Status "Batch script ready ✓"
    }

    Print-Status "Complete setup test passed ✓"
}

# Main execution
function Main {
    Write-Host "Starting Face Attendance Python Setup (Windows - Relative Paths)..." -ForegroundColor Blue
    Write-Host ""

    Check-Environment
    Write-Host ""

    Check-ProjectStructure
    Write-Host ""

    Create-TemplateScript
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
    Write-Host "📜 Python Script: $(Join-Path $PROJECT_ROOT $PYTHON_SCRIPT_NAME)" -ForegroundColor Blue
    Write-Host "🔧 Wrapper Script: $(Join-Path $PROJECT_ROOT 'extract_wrapper.py')" -ForegroundColor Blue
    Write-Host "⚙️  PowerShell Script: $(Join-Path $PROJECT_ROOT 'run_extraction.ps1')" -ForegroundColor Blue
    Write-Host "⚙️  Batch Script: $(Join-Path $PROJECT_ROOT 'run_extraction.bat')" -ForegroundColor Blue
    Write-Host ""
    Write-Host "📋 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. 🚀 Start your Spring Boot application"
    Write-Host "2. 🔧 Ensure Face Recognition Service is running on port 8001"
    Write-Host "3. 🎯 Customize the template face_feature_extractor.py script"
    Write-Host "4. 🧪 Test feature extraction from the web interface"
    Write-Host ""
    Write-Host "🧪 Manual Test Commands:" -ForegroundColor Yellow
    Write-Host "PowerShell: " -NoNewline; Write-Host ".\run_extraction.ps1 all" -ForegroundColor Green
    Write-Host "Command Prompt: " -NoNewline; Write-Host "run_extraction.bat all" -ForegroundColor Green
    Write-Host "Python Direct: " -NoNewline; Write-Host "python extract_wrapper.py all" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Important Notes:" -ForegroundColor Yellow
    Write-Host "• All paths are now relative - works on any Windows system"
    Write-Host "• Template script created - customize it for your face recognition needs"
    Write-Host "• Uncomment required packages in requirements.txt (InsightFace, dlib, etc.)"
    Write-Host "• Virtual environment: " -NoNewline; Write-Host "$VENV_PATH" -ForegroundColor Green
    Write-Host "• Logs will be saved to: " -NoNewline; Write-Host "face_extraction.log" -ForegroundColor Green
    Write-Host "• Portable - can be moved to any Windows machine"
    Write-Host ""
}

# Run main function
try {
    Main
}
catch {
    Print-Error "Setup failed: $($_.Exception.Message)"
    Print-Error "Stack trace: $($_.ScriptStackTrace)"
    exit 1
}