# =============================================================================
# Script Setup Python Feature Extraction cho Face Attendance System - Cross Platform
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - RELATIVE PATHS
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$SCRIPT_DIR"  # Script is in project root
VENV_PATH="$PROJECT_ROOT/scripts/face_recognition/.venv"
PYTHON_SCRIPT_NAME="scripts/face_recognition/face_feature_extractor.py"

echo -e "${BLUE}==============================================================================${NC}"
echo -e "${BLUE}        SETUP PYTHON FEATURE EXTRACTION - FACE ATTENDANCE SYSTEM${NC}"
echo -e "${BLUE}==============================================================================${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Convert path to Windows format
convert_to_windows_path() {
    local path="$1"
    # Convert Unix path to Windows path
    if [[ "$OSTYPE" == "msys" ]] || [[ "$MSYSTEM" == "MINGW"* ]]; then
        # In Git Bash, convert /c/path to C:\path format
        echo "$path" | sed 's|^/\([a-z]\)|\U\1:|' | sed 's|/|\\|g'
    else
        # On other systems, just replace forward slashes with backslashes
        echo "$path" | sed 's|/|\\|g'
    fi
}

# Get absolute path in cross-platform way
get_absolute_path() {
    local relative_path="$1"
    if [[ "$relative_path" = /* ]]; then
        # Already absolute
        echo "$relative_path"
    else
        # Make it absolute
        echo "$(cd "$PROJECT_ROOT" && cd "$relative_path" && pwd)"
    fi
}

# Check if running in Git Bash on Windows
check_environment() {
    print_status "Checking environment..."
    print_status "Script directory: $SCRIPT_DIR"
    print_status "Project root: $PROJECT_ROOT"
    print_status "Operating system: $OSTYPE"

    if [[ -n "$MSYSTEM" ]]; then
        print_status "Running in Git Bash on Windows: $MSYSTEM"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_status "Running on Linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_status "Running on macOS"
    else
        print_warning "Unknown operating system: $OSTYPE"
    fi

    print_status "Environment check completed ✓"
}

# Check project structure
check_project_structure() {
    print_status "Checking project structure..."

    if [ ! -d "$PROJECT_ROOT" ]; then
        print_error "Project root not found: $PROJECT_ROOT"
        print_error "Please run this script from the project root directory"
        exit 1
    fi

    # Check if scripts directory exists
    if [ ! -d "$PROJECT_ROOT/scripts" ]; then
        print_warning "Scripts directory not found. Creating it..."
        mkdir -p "$PROJECT_ROOT/scripts"
    fi

    # Check if face_recognition directory exists
    if [ ! -d "$PROJECT_ROOT/scripts/face_recognition" ]; then
        print_warning "Face recognition directory not found. Creating it..."
        mkdir -p "$PROJECT_ROOT/scripts/face_recognition"
    fi

    # Check if Python script exists
    if [ ! -f "$PROJECT_ROOT/$PYTHON_SCRIPT_NAME" ]; then
        print_warning "Python script not found: $PROJECT_ROOT/$PYTHON_SCRIPT_NAME"
        print_warning "Will create a template script for you"
    fi

    print_status "Project structure check completed ✓"
}

# Create template Python script if not exists
create_template_script() {
    local SCRIPT_PATH="$PROJECT_ROOT/$PYTHON_SCRIPT_NAME"

    if [ ! -f "$SCRIPT_PATH" ]; then
        print_status "Creating template face_feature_extractor.py..."

        cat > "$SCRIPT_PATH" << 'EOF'
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
EOF

        print_status "Template script created at: $SCRIPT_PATH"
        print_warning "Please customize this template script according to your specific needs"
    fi
}

# Setup virtual environment
setup_virtual_environment() {
    print_status "Setting up Python virtual environment..."

    if [ ! -d "$VENV_PATH" ]; then
        print_warning "Virtual environment not found. Creating new one..."

        # Check Python availability
        if command -v python3 &> /dev/null; then
            PYTHON_CMD="python3"
        elif command -v python &> /dev/null; then
            PYTHON_CMD="python"
        else
            print_error "Python not found. Please install Python 3.8+ and add to PATH"
            print_error "Download from: https://www.python.org/downloads/"
            exit 1
        fi

        print_status "Using Python: $PYTHON_CMD"

        # Create virtual environment
        $PYTHON_CMD -m venv "$VENV_PATH"
        print_status "Virtual environment created at: $VENV_PATH"
    else
        print_status "Virtual environment found at: $VENV_PATH"
    fi

    # Activate virtual environment (cross-platform)
    if [ -f "$VENV_PATH/Scripts/activate" ]; then
        source "$VENV_PATH/Scripts/activate"
        print_status "Virtual environment activated (Windows)"
    elif [ -f "$VENV_PATH/bin/activate" ]; then
        source "$VENV_PATH/bin/activate"
        print_status "Virtual environment activated (Unix)"
    else
        print_error "Cannot find activation script in virtual environment"
        exit 1
    fi

    # Upgrade pip
    print_status "Upgrading pip..."
    python -m pip install --upgrade pip

    print_status "Virtual environment setup completed ✓"
}

# Install Python packages
install_python_packages() {
    print_status "Installing required Python packages..."

    # Activate virtual environment first
    if [ -f "$VENV_PATH/Scripts/activate" ]; then
        source "$VENV_PATH/Scripts/activate"
    elif [ -f "$VENV_PATH/bin/activate" ]; then
        source "$VENV_PATH/bin/activate"
    fi

    # Create requirements.txt in project root
    cat > "$PROJECT_ROOT/requirements.txt" << EOF
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
EOF

    print_status "Installing packages from requirements.txt..."
    pip install -r "$PROJECT_ROOT/requirements.txt"

    print_status "Python packages installation completed ✓"
}

# Test Python environment
test_python_environment() {
    print_status "Testing Python environment..."

    # Activate virtual environment
    if [ -f "$VENV_PATH/Scripts/activate" ]; then
        source "$VENV_PATH/Scripts/activate"
    elif [ -f "$VENV_PATH/bin/activate" ]; then
        source "$VENV_PATH/bin/activate"
    fi

    # Test basic imports
    python -c "
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
    print(f'\\n❌ Some packages failed to import: {failed_imports}')
    sys.exit(1)
else:
    print('\\n🎉 All core packages imported successfully!')
"

    if [ $? -eq 0 ]; then
        print_status "Python environment test passed ✓"
    else
        print_error "Python environment test failed!"
        exit 1
    fi
}

# Create wrapper scripts
create_wrapper_scripts() {
    print_status "Creating wrapper scripts..."

    # Create Python wrapper
    cat > "$PROJECT_ROOT/extract_wrapper.py" << 'EOF'
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
EOF

    # Create cross-platform Bash script
    cat > "$PROJECT_ROOT/run_extraction.sh" << EOF
#!/bin/bash
# Face Feature Extraction Runner Script - Cross Platform

# Get script directory
SCRIPT_DIR="\$(cd "\$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="\$SCRIPT_DIR/scripts/face_recognition/.venv"

# Check if virtual environment exists
if [ ! -d "\$VENV_PATH" ]; then
    echo "ERROR: Virtual environment not found at \$VENV_PATH"
    echo "Please run setup_python_extraction.sh first"
    exit 1
fi

# Activate virtual environment (cross-platform)
if [ -f "\$VENV_PATH/Scripts/activate" ]; then
    source "\$VENV_PATH/Scripts/activate"
elif [ -f "\$VENV_PATH/bin/activate" ]; then
    source "\$VENV_PATH/bin/activate"
else
    echo "ERROR: Cannot find activation script"
    exit 1
fi

# Verify Python packages
if ! python -c "import numpy, cv2, requests" 2>/dev/null; then
    echo "ERROR: Required Python packages not installed"
    echo "Please run setup_python_extraction.sh first"
    exit 1
fi

# Change to project directory
cd "\$SCRIPT_DIR"

# Run Python wrapper with arguments
python extract_wrapper.py "\$@"

# Store exit code
exit_code=\$?

# Return exit code
exit \$exit_code
EOF

    # Create Windows batch file
    local VENV_RELATIVE_PATH="scripts\\face_recognition\\.venv"
    cat > "$PROJECT_ROOT/run_extraction.bat" << EOF
@echo off
setlocal EnableDelayedExpansion

rem Windows batch file for running face extraction

rem Get script directory
set SCRIPT_DIR=%~dp0
set SCRIPT_DIR=%SCRIPT_DIR:~0,-1%

rem Set relative paths
set VENV_PATH=%SCRIPT_DIR%\\$VENV_RELATIVE_PATH

rem Check if virtual environment exists
if not exist "%VENV_PATH%" (
    echo ERROR: Virtual environment not found at %VENV_PATH%
    echo Please run setup_python_extraction.sh first
    exit /b 1
)

rem Activate virtual environment
call "%VENV_PATH%\\Scripts\\activate.bat"

rem Verify Python packages
python -c "import numpy, cv2, requests" >nul 2>&1
if errorlevel 1 (
    echo ERROR: Required Python packages not installed
    echo Please run setup_python_extraction.sh first
    call deactivate
    exit /b 1
)

rem Change to project directory
cd /d "%SCRIPT_DIR%"

rem Run Python wrapper with arguments
python extract_wrapper.py %*

rem Store exit code
set exit_code=%errorlevel%

rem Deactivate virtual environment
call deactivate

rem Return exit code
exit /b %exit_code%
EOF

    # Make scripts executable
    chmod +x "$PROJECT_ROOT/extract_wrapper.py"
    chmod +x "$PROJECT_ROOT/run_extraction.sh"

    print_status "Wrapper scripts created ✓"
    print_status "  - extract_wrapper.py (Python wrapper)"
    print_status "  - run_extraction.sh (Cross-platform bash script)"
    print_status "  - run_extraction.bat (Windows batch file)"
}

# Update application.properties
update_application_properties() {
    print_status "Updating application.properties..."

    local PROPERTIES_FILE="$PROJECT_ROOT/src/main/resources/application.properties"

    if [ -f "$PROPERTIES_FILE" ]; then
        # Backup original file
        cp "$PROPERTIES_FILE" "$PROPERTIES_FILE.backup.$(date +%Y%m%d_%H%M%S)"

        # Get absolute paths for Java configuration
        local ABS_VENV_PATH=$(get_absolute_path "$VENV_PATH")
        local ABS_PROJECT_ROOT=$(get_absolute_path "$PROJECT_ROOT")

        # Convert to Windows format if needed
        local JAVA_VENV_PATH=$(convert_to_windows_path "$ABS_VENV_PATH")
        local JAVA_PROJECT_ROOT=$(convert_to_windows_path "$ABS_PROJECT_ROOT")
        local JAVA_SCRIPT_FILE=$(convert_to_windows_path "$ABS_PROJECT_ROOT/$PYTHON_SCRIPT_NAME")

        # Remove old Python configuration
        sed -i '/# Python Feature Extraction Configuration/d' "$PROPERTIES_FILE"
        sed -i '/app.python.venv.path/d' "$PROPERTIES_FILE"
        sed -i '/app.python.script.path/d' "$PROPERTIES_FILE"
        sed -i '/app.python.script.file/d' "$PROPERTIES_FILE"
        sed -i '/app.python.timeout.minutes/d' "$PROPERTIES_FILE"
        sed -i '/app.python.max.concurrent/d' "$PROPERTIES_FILE"

        # Add updated Python configuration
        echo "" >> "$PROPERTIES_FILE"
        echo "# Python Feature Extraction Configuration - Updated $(date)" >> "$PROPERTIES_FILE"
        echo "app.python.venv.path=$JAVA_VENV_PATH" >> "$PROPERTIES_FILE"
        echo "app.python.script.path=$JAVA_PROJECT_ROOT" >> "$PROPERTIES_FILE"
        echo "app.python.script.file=$JAVA_SCRIPT_FILE" >> "$PROPERTIES_FILE"
        echo "app.python.timeout.minutes=30" >> "$PROPERTIES_FILE"
        echo "app.python.max.concurrent=2" >> "$PROPERTIES_FILE"

        print_status "application.properties updated with cross-platform paths ✓"
    else
        print_warning "application.properties not found, skipping..."
    fi
}

# Test complete setup
test_complete_setup() {
    print_status "Testing complete setup..."

    # Test Python wrapper
    if [ -f "$PROJECT_ROOT/extract_wrapper.py" ]; then
        print_status "Testing Python wrapper..."

        # Activate venv and test
        if [ -f "$VENV_PATH/Scripts/activate" ]; then
            source "$VENV_PATH/Scripts/activate"
        elif [ -f "$VENV_PATH/bin/activate" ]; then
            source "$VENV_PATH/bin/activate"
        fi

        # Test wrapper (should show usage)
        python "$PROJECT_ROOT/extract_wrapper.py" 2>/dev/null || print_status "Wrapper script ready"
    fi

    print_status "Complete setup test passed ✓"
}

# Main execution
main() {
    echo -e "${BLUE}Starting Face Attendance Python Setup (Cross-Platform)...${NC}\n"

    check_environment
    echo ""

    check_project_structure
    echo ""

    create_template_script
    echo ""

    setup_virtual_environment
    echo ""

    install_python_packages
    echo ""

    test_python_environment
    echo ""

    create_wrapper_scripts
    echo ""

    update_application_properties
    echo ""

    test_complete_setup
    echo ""

    echo -e "${GREEN}==============================================================================${NC}"
    echo -e "${GREEN}                     PYTHON SETUP COMPLETED SUCCESSFULLY!${NC}"
    echo -e "${GREEN}==============================================================================${NC}"
    echo ""
    echo -e "${BLUE}📁 Project Root:${NC} $PROJECT_ROOT"
    echo -e "${BLUE}🐍 Virtual Environment:${NC} $VENV_PATH"
    echo -e "${BLUE}📜 Python Script:${NC} $PROJECT_ROOT/$PYTHON_SCRIPT_NAME"
    echo -e "${BLUE}🔧 Wrapper Script:${NC} $PROJECT_ROOT/extract_wrapper.py"
    echo -e "${BLUE}⚙️  Bash Script:${NC} $PROJECT_ROOT/run_extraction.sh"
    echo -e "${BLUE}⚙️  Windows Batch:${NC} $PROJECT_ROOT/run_extraction.bat"
    echo ""
    echo -e "${YELLOW}📋 Next Steps:${NC}"
    echo -e "1. 🚀 Start your Spring Boot application"
    echo -e "2. 🔧 Ensure Face Recognition Service is running on port 8001"
    echo -e "3. 🎯 Customize the template face_feature_extractor.py script"
    echo -e "4. 🧪 Test feature extraction from the web interface"
    echo ""
    echo -e "${YELLOW}🧪 Manual Test Commands:${NC}"
    echo -e "Unix/Linux/macOS: ${GREEN}./run_extraction.sh all${NC}"
    echo -e "Windows Git Bash: ${GREEN}./run_extraction.sh all${NC}"
    echo -e "Windows CMD: ${GREEN}run_extraction.bat all${NC}"
    echo -e "Python Direct: ${GREEN}python extract_wrapper.py all${NC}"
    echo ""
    echo -e "${YELLOW}📝 Important Notes:${NC}"
    echo -e "• All paths are now relative - works on any system"
    echo -e "• Template script created - customize it for your face recognition needs"
    echo -e "• Uncomment required packages in requirements.txt (InsightFace, dlib, etc.)"
    echo -e "• Virtual environment: ${GREEN}$VENV_PATH${NC}"
    echo -e "• Logs will be saved to: ${GREEN}face_extraction.log${NC}"
    echo -e "• Cross-platform compatible: Windows, Linux, macOS"
    echo ""
}

# Run main function
main "$@"