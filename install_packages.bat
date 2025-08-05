@echo off
echo =================================================================
echo        INSTALLING PYTHON PACKAGES FOR FACE RECOGNITION
echo =================================================================

cd /d D:\LuanVan\face-attendance\scripts\face_recognition

echo Activating virtual environment...
call .venv\Scripts\activate

echo.
echo Upgrading pip...
python -m pip install --upgrade pip

echo.
echo Installing core packages...
pip install numpy opencv-python Pillow

echo.
echo Installing machine learning packages...
pip install scikit-learn scipy

echo.
echo Installing HTTP clients...
pip install requests aiohttp aiofiles

echo.
echo Installing data processing...
pip install pandas tqdm

echo.
echo Installing InsightFace (this may take a while)...
pip install insightface

echo.
echo Installing ONNX Runtime...
pip install onnxruntime

echo.
echo Testing installations...
python -c "
import sys
print(f'Python version: {sys.version}')

packages = [
    ('numpy', 'np'),
    ('cv2', 'cv2'),
    ('PIL', 'PIL'),
    ('sklearn', 'sklearn'),
    ('requests', 'requests'),
    ('aiohttp', 'aiohttp'),
    ('pandas', 'pd'),
    ('insightface', 'insightface')
]

failed = []
for pkg_name, import_name in packages:
    try:
        module = __import__(import_name)
        if hasattr(module, '__version__'):
            print(f'✓ {pkg_name}: {module.__version__}')
        else:
            print(f'✓ {pkg_name}: OK')
    except ImportError as e:
        print(f'✗ {pkg_name}: FAILED - {e}')
        failed.append(pkg_name)

if failed:
    print(f'\\nFailed packages: {failed}')
    sys.exit(1)
else:
    print('\\n🎉 All packages installed successfully!')
"

if %errorlevel% equ 0 (
    echo.
    echo =================================================================
    echo                    INSTALLATION SUCCESSFUL!
    echo =================================================================
    echo.
    echo You can now run:
    echo   python face_feature_extractor.py
    echo.
) else (
    echo.
    echo =================================================================
    echo                    INSTALLATION FAILED!
    echo =================================================================
    echo Please check the error messages above.
)

pause