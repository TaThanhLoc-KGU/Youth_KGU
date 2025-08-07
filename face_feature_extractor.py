import os
import cv2
import numpy as np
import insightface
import requests
import json
import base64
from pathlib import Path
import logging
from typing import List, Dict, Optional, Tuple, Union
import time
import asyncio
import aiohttp
from sklearn.preprocessing import normalize
from sklearn.metrics.pairwise import cosine_similarity
import torch
import onnxruntime as ort
from concurrent.futures import ThreadPoolExecutor
import warnings
warnings.filterwarnings('ignore')

# Cấu hình logging chi tiết
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('face_extraction_detailed.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AdvancedFaceFeatureExtractor:
    """
    Advanced Face Feature Extractor với các backbone model tốt nhất
    - InsightFace với multiple models
    - Quality assessment
    - Advanced preprocessing
    - Ensemble embeddings
    """

    def __init__(self, backend_api_url: str, face_api_url: str, project_root: str, credentials: Dict = None):
        """
        Khởi tạo Advanced Face Feature Extractor
        """
        self.backend_api_url = backend_api_url.rstrip('/')
        self.face_api_url = face_api_url.rstrip('/')
        self.credentials = credentials
        self.session_cookies = None

        # Đường dẫn project
        self.project_root = Path(project_root)
        self.student_base_dir = self.project_root / "src" / "main" / "resources" / "static" / "uploads" / "students"

        # Cache và models directory
        self.models_dir = self.project_root / "models" / "face_recognition"
        self.models_dir.mkdir(parents=True, exist_ok=True)

        # Initialize multiple InsightFace models for ensemble
        self.face_models = self._initialize_face_models()

        # Headers cho API calls
        self.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'User-Agent': 'AdvancedFaceExtractor/1.0'
        }

        # Advanced configuration
        self.config = {
            'detection_threshold': 0.5,
            'recognition_threshold': 0.6,
            'quality_threshold': 0.7,
            'max_face_size': 1920,
            'min_face_size': 64,  # Tăng lên để đảm bảo chất lượng
            'target_face_size': 512,  # Chuẩn hóa kích thước
            'blur_threshold': 100.0,  # Threshold để detect ảnh mờ
            'brightness_range': (50, 200),  # Range brightness hợp lệ
            'pose_threshold': 45.0,  # Threshold cho góc nghiêng (degrees)
            'ensemble_method': 'weighted_average',  # 'mean', 'weighted_average', 'quality_weighted'
            'quality_weights': {
                'detection_score': 0.3,
                'face_area': 0.2,
                'brightness': 0.15,
                'sharpness': 0.2,
                'pose_quality': 0.15
            }
        }

        logger.info(" AdvancedFaceFeatureExtractor initialized")
        logger.info(f" Project root: {self.project_root}")
        logger.info(f" Student directory: {self.student_base_dir}")
        logger.info(f" Models loaded: {len(self.face_models)}")

    def _initialize_face_models(self) -> Dict:
        """
        Initialize multiple InsightFace models for ensemble approach
        """
        models = {}

        try:
            # Model 1: Buffalo_L - High accuracy, balanced speed
            logger.info(" Loading BuffaloL model...")
            buffalo_l = insightface.app.FaceAnalysis(
                providers=self._get_optimal_providers(),
                name='buffalo_l'
            )
            buffalo_l.prepare(ctx_id=0, det_size=(640, 640))
            models['buffalo_l'] = {
                'model': buffalo_l,
                'weight': 0.4,  # Trọng số cao nhất
                'embedding_dim': 512,
                'description': 'High accuracy general purpose'
            }
            logger.info(" BuffaloL model loaded")

        except Exception as e:
            logger.error(f" Failed to load BuffaloL: {e}")

        try:
            # Model 2: Buffalo_S - Faster, good for mobile
            logger.info(" Loading BuffaloS model...")
            buffalo_s = insightface.app.FaceAnalysis(
                providers=self._get_optimal_providers(),
                name='buffalo_s'
            )
            buffalo_s.prepare(ctx_id=0, det_size=(640, 640))
            models['buffalo_s'] = {
                'model': buffalo_s,
                'weight': 0.3,
                'embedding_dim': 512,
                'description': 'Fast and efficient'
            }
            logger.info(" BuffaloS model loaded")

        except Exception as e:
            logger.error(f" Failed to load BuffaloS: {e}")

        try:
            # Model 3: ArcFace ResNet100 - Highest accuracy
            logger.info(" Loading ArcFace ResNet100...")
            arcface = insightface.app.FaceAnalysis(
                providers=self._get_optimal_providers(),
                name='antelopev2'  # Contains ResNet100 ArcFace
            )
            arcface.prepare(ctx_id=0, det_size=(640, 640))
            models['arcface_r100'] = {
                'model': arcface,
                'weight': 0.3,
                'embedding_dim': 512,
                'description': 'Highest accuracy ArcFace'
            }
            logger.info(" ArcFace ResNet100 loaded")

        except Exception as e:
            logger.error(f" Failed to load ArcFace: {e}")

        if not models:
            logger.error(" No face recognition models could be loaded!")
            raise RuntimeError("Cannot initialize any face recognition models")

        logger.info(f" Successfully loaded {len(models)} face recognition models")
        return models

    def _get_optimal_providers(self) -> List[str]:
        """
        Get optimal ONNX providers based on available hardware
        """
        providers = []

        # Check for CUDA
        if torch.cuda.is_available():
            providers.append('CUDAExecutionProvider')
            logger.info(" CUDA GPU detected - using GPU acceleration")

        # Check for DirectML (Windows)
        try:
            import onnxruntime as ort
            available_providers = ort.get_available_providers()
            if 'DmlExecutionProvider' in available_providers:
                providers.append('DmlExecutionProvider')
                logger.info(" DirectML detected - using DirectML acceleration")
        except:
            pass

        # CPU fallback
        providers.append('CPUExecutionProvider')

        logger.info(f"🔧 Using providers: {providers}")
        return providers

    async def login_session(self) -> bool:
        """Enhanced login with retry mechanism"""
        if not self.credentials:
            logger.warning(" No credentials provided")
            return False

        for attempt in range(3):  # 3 attempts
            try:
                login_data = {
                    'username': self.credentials['username'],
                    'password': self.credentials['password']
                }

                timeout = aiohttp.ClientTimeout(total=10)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    url = f"{self.backend_api_url}/auth/login"
                    async with session.post(url, json=login_data, headers=self.headers) as response:
                        if response.status == 200:
                            self.session_cookies = response.cookies
                            logger.info(" Authentication successful")
                            return True
                        else:
                            logger.warning(f" Login attempt {attempt + 1} failed: {response.status}")

            except Exception as e:
                logger.warning(f" Login attempt {attempt + 1} error: {e}")

            if attempt < 2:
                await asyncio.sleep(2)  # Wait before retry

        logger.error(" All login attempts failed")
        return False

    def get_student_image_paths(self, ma_sv: str) -> Dict:
        """
        Enhanced image path detection - READ ALL IMAGES in student directory
        """
        student_dir = self.student_base_dir / ma_sv
        faces_dir = student_dir / "faces"

        result = {
            'student_dir': student_dir,
            'profile_image': None,
            'face_images': [],
            'all_images': [],  # TẤT CẢ ảnh tìm được
            'exists': student_dir.exists(),
            'total_files': 0,
            'valid_images': []
        }

        if not student_dir.exists():
            logger.warning(f" Student directory not found: {student_dir}")
            return result

        # Supported image formats
        supported_formats = ['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff']

        # 1. Find profile image (priority)
        profile_found = False
        for ext in supported_formats:
            profile_path = student_dir / f"profile{ext}"
            if profile_path.exists() and self._is_valid_image(profile_path):
                result['profile_image'] = profile_path
                result['all_images'].append(profile_path)
                result['valid_images'].append(profile_path)
                profile_found = True
                break

        # 2. Scan ALL images in student directory (root level)
        try:
            for file_path in student_dir.iterdir():
                if file_path.is_file():
                    # Check if it's an image
                    if file_path.suffix.lower() in supported_formats:
                        # Skip profile if already found
                        if profile_found and file_path.name.lower().startswith('profile'):
                            continue

                        if self._is_valid_image(file_path):
                            result['all_images'].append(file_path)
                            result['valid_images'].append(file_path)
                            logger.debug(f"Found image: {file_path.name}")
        except Exception as e:
            logger.warning(f"Error scanning student directory: {e}")

        # 3. Scan ALL images in faces subdirectory
        if faces_dir.exists():
            try:
                for file_path in faces_dir.rglob('*'):  # Recursive scan
                    if file_path.is_file():
                        if file_path.suffix.lower() in supported_formats:
                            if self._is_valid_image(file_path):
                                result['face_images'].append(file_path)
                                result['all_images'].append(file_path)
                                result['valid_images'].append(file_path)
                                logger.debug(f"Found face image: {file_path.name}")
            except Exception as e:
                logger.warning(f"Error scanning faces directory: {e}")

        # 4. Remove duplicates while preserving order
        seen = set()
        unique_images = []
        for img in result['all_images']:
            if img not in seen:
                seen.add(img)
                unique_images.append(img)
        result['all_images'] = unique_images
        result['valid_images'] = unique_images

        # Count all files in directory
        try:
            all_files = list(student_dir.rglob('*'))
            result['total_files'] = len([f for f in all_files if f.is_file()])
        except:
            result['total_files'] = 0

        logger.info(f"👤 {ma_sv}: Profile={'Success' if result['profile_image'] else 'Fail'}, "
                    f"Faces_dir={len(result['face_images'])}, "
                    f"Total_valid={len(result['valid_images'])}, "
                    f"All_files={result['total_files']}")

        return result

    def _is_valid_image(self, image_path: Path) -> bool:
        """
        Validate if file is a valid image
        """
        try:
            # Check file size
            if image_path.stat().st_size < 1024:  # Less than 1KB
                return False

            # Try to read image
            image = cv2.imread(str(image_path))
            if image is None:
                return False

            # Check dimensions
            height, width = image.shape[:2]
            if width < 32 or height < 32:  # Too small
                return False

            return True
        except:
            return False

    def enhance_image_quality(self, image: np.ndarray) -> np.ndarray:
        """
        Advanced image enhancement for better feature extraction
        """
        try:
            # Convert to LAB color space for better processing
            lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
            l_channel, a_channel, b_channel = cv2.split(lab)

            # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization) to L channel
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            l_channel = clahe.apply(l_channel)

            # Merge channels and convert back to BGR
            enhanced_lab = cv2.merge([l_channel, a_channel, b_channel])
            enhanced = cv2.cvtColor(enhanced_lab, cv2.COLOR_LAB2BGR)

            # Subtle sharpening
            kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
            sharpened = cv2.filter2D(enhanced, -1, kernel * 0.1 + np.array([[0,0,0],[0,1,0],[0,0,0]]))

            # Blend original and sharpened (70% enhanced, 30% original)
            result = cv2.addWeighted(enhanced, 0.7, sharpened, 0.3, 0)

            return result

        except Exception as e:
            logger.warning(f" Image enhancement failed: {e}")
            return image

    def calculate_image_quality_metrics(self, image: np.ndarray, face_bbox: Optional[np.ndarray] = None) -> Dict:
        """
        Calculate comprehensive image quality metrics
        """
        try:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            height, width = gray.shape

            # If face bbox provided, focus on face region
            if face_bbox is not None:
                x1, y1, x2, y2 = np.clip(face_bbox.astype(int), [0, 0, 0, 0], [width, height, width, height])
                if x2 > x1 and y2 > y1:  # Valid bbox
                    gray_face = gray[y1:y2, x1:x2]
                else:
                    gray_face = gray
            else:
                gray_face = gray

            if gray_face.size == 0:  # Empty region
                gray_face = gray

            # Sharpness (Laplacian variance)
            laplacian = cv2.Laplacian(gray_face, cv2.CV_64F)
            sharpness = laplacian.var()

            # Brightness (mean intensity)
            brightness = gray_face.mean()

            # Contrast (standard deviation)
            contrast = gray_face.std()

            # Dynamic range
            dynamic_range = gray_face.max() - gray_face.min()

            # Exposure quality (histogram analysis)
            hist = cv2.calcHist([gray_face], [0], None, [256], [0, 256])
            hist_norm = hist.flatten() / (hist.sum() + 1e-8)  # Avoid division by zero

            # Check for over/under exposure
            underexposed = hist_norm[:50].sum()  # Dark pixels
            overexposed = hist_norm[200:].sum()   # Bright pixels

            # Overall quality score
            quality_score = self._calculate_overall_quality(
                sharpness, brightness, contrast, dynamic_range, underexposed, overexposed
            )

            return {
                'sharpness': float(sharpness),
                'brightness': float(brightness),
                'contrast': float(contrast),
                'dynamic_range': float(dynamic_range),
                'underexposed_ratio': float(underexposed),
                'overexposed_ratio': float(overexposed),
                'quality_score': float(quality_score),
                'is_good_quality': quality_score > self.config['quality_threshold']
            }

        except Exception as e:
            logger.warning(f" Quality calculation failed: {e}")
            return {
                'sharpness': 0.0, 'brightness': 128.0, 'contrast': 0.0,
                'dynamic_range': 0.0, 'underexposed_ratio': 0.0, 'overexposed_ratio': 0.0,
                'quality_score': 0.3, 'is_good_quality': False  # Default fallback quality
            }

    def _calculate_overall_quality(self, sharpness: float, brightness: float, contrast: float,
                                   dynamic_range: float, underexposed: float, overexposed: float) -> float:
        """Calculate overall image quality score (0-1)"""

        # Normalize sharpness (typical range: 0-500)
        sharpness_score = min(sharpness / 200.0, 1.0)

        # Brightness score (optimal range: 80-170)
        brightness_score = 1.0 - abs(brightness - 125) / 125.0
        brightness_score = max(0.0, brightness_score)

        # Contrast score (higher is better, typical range: 0-80)
        contrast_score = min(contrast / 60.0, 1.0)

        # Dynamic range score (higher is better)
        dynamic_score = min(dynamic_range / 200.0, 1.0)

        # Exposure penalty
        exposure_penalty = (underexposed + overexposed) * 2

        # Weighted combination
        quality_score = (
                                sharpness_score * 0.3 +
                                brightness_score * 0.25 +
                                contrast_score * 0.25 +
                                dynamic_score * 0.2
                        ) - exposure_penalty

        return max(0.0, min(1.0, quality_score))

    def extract_face_features_ensemble(self, image_paths: List[Path]) -> Tuple[List[np.ndarray], Dict]:
        """
        Advanced ensemble face feature extraction using multiple models
        """
        all_embeddings = []
        detailed_metadata = {
            'total_images': len(image_paths),
            'processed_images': 0,
            'valid_faces': 0,
            'model_results': {name: [] for name in self.face_models.keys()},
            'quality_scores': [],
            'face_details': [],
            'ensemble_method': self.config['ensemble_method']
        }

        for idx, image_path in enumerate(image_paths):
            logger.info(f" Processing image {idx+1}/{len(image_paths)}: {image_path.name}")

            # Load and enhance image
            image = cv2.imread(str(image_path))
            if image is None:
                logger.warning(f" Cannot load image: {image_path}")
                continue

            # Enhance image quality
            enhanced_image = self.enhance_image_quality(image)

            # Extract faces with all models
            model_embeddings = []
            face_info = {
                'image_name': image_path.name,
                'models_used': [],
                'detection_results': {},
                'quality_metrics': {},
                'final_embedding_dim': 0
            }

            best_face_data = None

            for model_name, model_info in self.face_models.items():
                try:
                    model = model_info['model']
                    faces = model.get(enhanced_image)

                    if faces:
                        # Select best face (highest detection score and largest area)
                        best_face = max(faces, key=lambda x: x.det_score * self._calculate_face_area(x.bbox))

                        # Quality checks
                        face_area = self._calculate_face_area(best_face.bbox)
                        if face_area < self.config['min_face_size'] ** 2:
                            logger.warning(f" Face too small in {image_path.name} with {model_name}")
                            continue

                        # Calculate quality metrics for face region
                        quality_metrics = self.calculate_image_quality_metrics(enhanced_image, best_face.bbox)

                        # Lowered quality threshold for acceptance
                        if quality_metrics['quality_score'] < 0.15:  # Very lenient threshold
                            logger.warning(f" Extremely poor quality face in {image_path.name} with {model_name}")
                            continue

                        # Extract embedding
                        embedding = best_face.normed_embedding

                        if embedding is not None and len(embedding) == model_info['embedding_dim']:
                            model_embeddings.append({
                                'model': model_name,
                                'embedding': embedding,
                                'weight': model_info['weight'],
                                'detection_score': float(best_face.det_score),
                                'quality_score': quality_metrics['quality_score'],
                                'face_area': face_area
                            })

                            face_info['models_used'].append(model_name)
                            face_info['detection_results'][model_name] = {
                                'det_score': float(best_face.det_score),
                                'face_area': face_area,
                                'bbox': best_face.bbox.tolist()
                            }

                            # Store best face data for overall quality assessment
                            if best_face_data is None or best_face.det_score > best_face_data['det_score']:
                                best_face_data = {
                                    'det_score': best_face.det_score,
                                    'bbox': best_face.bbox,
                                    'quality_metrics': quality_metrics
                                }

                        detailed_metadata['model_results'][model_name].append({
                            'image': image_path.name,
                            'success': True,
                            'det_score': float(best_face.det_score),
                            'quality_score': quality_metrics['quality_score']
                        })

                    else:
                        logger.warning(f" No face detected in {image_path.name} with {model_name}")
                        detailed_metadata['model_results'][model_name].append({
                            'image': image_path.name,
                            'success': False,
                            'reason': 'no_face_detected'
                        })

                except Exception as e:
                    logger.error(f" Error with {model_name} on {image_path.name}: {e}")
                    detailed_metadata['model_results'][model_name].append({
                        'image': image_path.name,
                        'success': False,
                        'reason': f'error: {str(e)}'
                    })

            # Create ensemble embedding if we have results from multiple models
            if model_embeddings:
                ensemble_embedding = self._create_ensemble_embedding(model_embeddings)

                if ensemble_embedding is not None:
                    all_embeddings.append(ensemble_embedding)
                    detailed_metadata['valid_faces'] += 1

                    # Store detailed information
                    face_info['final_embedding_dim'] = len(ensemble_embedding)
                    face_info['quality_metrics'] = best_face_data['quality_metrics'] if best_face_data else {}
                    face_info['ensemble_models_count'] = len(model_embeddings)

                    detailed_metadata['face_details'].append(face_info)
                    detailed_metadata['quality_scores'].append(
                        best_face_data['quality_metrics']['quality_score'] if best_face_data else 0.0
                    )

                    logger.info(f" Ensemble embedding created for {image_path.name} "
                                f"using {len(model_embeddings)} models")
                else:
                    logger.warning(f" Failed to create ensemble embedding for {image_path.name}")
            else:
                logger.warning(f" No valid embeddings from any model for {image_path.name}")

            detailed_metadata['processed_images'] += 1

        # Calculate overall statistics
        detailed_metadata['success_rate'] = (
            detailed_metadata['valid_faces'] / detailed_metadata['total_images']
            if detailed_metadata['total_images'] > 0 else 0.0
        )

        detailed_metadata['average_quality'] = (
            sum(detailed_metadata['quality_scores']) / len(detailed_metadata['quality_scores'])
            if detailed_metadata['quality_scores'] else 0.0
        )

        logger.info(f" Ensemble extraction completed: {detailed_metadata['valid_faces']}/{detailed_metadata['total_images']} "
                    f"faces extracted ({detailed_metadata['success_rate']:.1%} success rate)")

        return all_embeddings, detailed_metadata

    def _create_ensemble_embedding(self, model_embeddings: List[Dict]) -> Optional[np.ndarray]:
        """
        Create ensemble embedding from multiple model results
        """
        if not model_embeddings:
            return None

        method = self.config['ensemble_method']

        if method == 'mean':
            # Simple average
            embeddings = np.array([item['embedding'] for item in model_embeddings])
            ensemble = np.mean(embeddings, axis=0)

        elif method == 'weighted_average':
            # Weighted by model weights
            embeddings = np.array([item['embedding'] for item in model_embeddings])
            weights = np.array([item['weight'] for item in model_embeddings])
            weights = weights / weights.sum()  # Normalize weights

            ensemble = np.average(embeddings, axis=0, weights=weights)

        elif method == 'quality_weighted':
            # Weighted by detection score and quality
            embeddings = np.array([item['embedding'] for item in model_embeddings])

            # Combined weight: model_weight * detection_score * quality_score
            weights = np.array([
                item['weight'] * item['detection_score'] * item['quality_score']
                for item in model_embeddings
            ])
            weights = weights / weights.sum()  # Normalize

            ensemble = np.average(embeddings, axis=0, weights=weights)

        else:
            # Fallback to mean
            embeddings = np.array([item['embedding'] for item in model_embeddings])
            ensemble = np.mean(embeddings, axis=0)

        # L2 normalize the final embedding
        ensemble_normalized = normalize([ensemble], norm='l2')[0]

        return ensemble_normalized

    def _calculate_face_area(self, bbox) -> float:
        """Calculate face area from bounding box"""
        return (bbox[2] - bbox[0]) * (bbox[3] - bbox[1])

    def validate_embeddings_advanced(self, embeddings: List[np.ndarray]) -> Dict:
        """
        Advanced embedding validation with clustering analysis
        """
        if len(embeddings) < 2:
            return {
                'is_valid': len(embeddings) >= 1,
                'num_embeddings': len(embeddings),
                'validation_score': 0.5 if len(embeddings) >= 1 else 0.0,
                'quality_level': 'acceptable' if len(embeddings) >= 1 else 'poor',
                'identity_confidence': 0.5 if len(embeddings) >= 1 else 0.0,
                'consistency_score': 0.5 if len(embeddings) >= 1 else 0.0,
                'validation_method': 'single_embedding_fallback',
                'recommendation': 'Chỉ có 1 embedding - nên thêm ảnh để validation tốt hơn',
                'statistics': {
                    'mean_similarity': None,
                    'median_similarity': None,
                    'std_similarity': None,
                    'min_similarity': None,
                    'max_similarity': None,
                    'q25_similarity': None,
                    'q75_similarity': None
                }
            }

        # Calculate pairwise similarities
        similarities = []
        embedding_matrix = np.array(embeddings)

        for i in range(len(embeddings)):
            for j in range(i + 1, len(embeddings)):
                similarity = cosine_similarity([embeddings[i]], [embeddings[j]])[0][0]
                similarities.append(similarity)

        similarities = np.array(similarities)

        # Statistical analysis
        stats = {
            'mean_similarity': float(np.mean(similarities)),
            'median_similarity': float(np.median(similarities)),
            'std_similarity': float(np.std(similarities)),
            'min_similarity': float(np.min(similarities)),
            'max_similarity': float(np.max(similarities)),
            'q25_similarity': float(np.percentile(similarities, 25)),
            'q75_similarity': float(np.percentile(similarities, 75))
        }

        # Quality assessment
        mean_sim = stats['mean_similarity']
        std_sim = stats['std_similarity']

        # Consistency check (low std is good)
        consistency_score = max(0, 1 - (std_sim / 0.3))  # Normalize by expected max std

        # Identity confidence (high mean similarity is good)
        identity_confidence = max(0, (mean_sim - 0.3) / 0.5)  # Normalize to 0-1

        # Overall validation score
        validation_score = (identity_confidence * 0.7 + consistency_score * 0.3)

        # Classification
        if validation_score > 0.8 and mean_sim > 0.7:
            quality_level = "excellent"
            recommendation = "Chất lượng tuyệt vời - embeddings rất nhất quán"
        elif validation_score > 0.6 and mean_sim > 0.6:
            quality_level = "good"
            recommendation = "Chất lượng tốt - embeddings đáng tin cậy"
        elif validation_score > 0.4 and mean_sim > 0.4:
            quality_level = "acceptable"
            recommendation = "Chất lượng chấp nhận được - nên thêm ảnh chất lượng cao"
        else:
            quality_level = "poor"
            recommendation = "Chất lượng kém - cần chụp lại ảnh với điều kiện tốt hơn"

        return {
            'is_valid': validation_score > 0.3,
            'num_embeddings': len(embeddings),
            'validation_score': float(validation_score),
            'quality_level': quality_level,
            'identity_confidence': float(identity_confidence),
            'consistency_score': float(consistency_score),
            'statistics': stats,
            'recommendation': recommendation,
            'validation_method': 'advanced_statistical_analysis'
        }

    def create_composite_embedding_advanced(self, embeddings: List[np.ndarray],
                                            quality_scores: List[float] = None) -> Optional[np.ndarray]:
        """
        Create advanced composite embedding with quality weighting
        """
        if not embeddings:
            return None

        embeddings_array = np.array(embeddings)

        if quality_scores is None:
            # Simple mean if no quality scores
            composite = np.mean(embeddings_array, axis=0)
        else:
            # Quality-weighted average
            quality_scores = np.array(quality_scores)

            # Normalize quality scores to weights
            weights = quality_scores / np.sum(quality_scores)

            # Weighted average
            composite = np.average(embeddings_array, axis=0, weights=weights)

        # Advanced normalization: L2 norm + optional temperature scaling
        composite_normalized = normalize([composite], norm='l2')[0]

        return composite_normalized

    async def get_student_info(self, ma_sv: str) -> Optional[Dict]:
        """Enhanced student info retrieval with multiple fallback methods"""
        # Method 1: Direct API call
        try:
            timeout = aiohttp.ClientTimeout(total=10)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                url = f"{self.backend_api_url}/sinhvien/by-masv/{ma_sv}"
                async with session.get(url, headers=self.headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        logger.info(f" [API] Student {ma_sv} found: {data.get('hoTen', 'N/A')}")
                        return data
        except Exception as e:
            logger.debug(f"Direct API failed for {ma_sv}: {e}")

        # Method 2: Authenticated API call
        if self.credentials:
            if not self.session_cookies:
                await self.login_session()

            if self.session_cookies:
                try:
                    timeout = aiohttp.ClientTimeout(total=10)
                    async with aiohttp.ClientSession(cookies=self.session_cookies, timeout=timeout) as session:
                        url = f"{self.backend_api_url}/sinhvien/by-masv/{ma_sv}"
                        async with session.get(url, headers=self.headers) as response:
                            if response.status == 200:
                                data = await response.json()
                                logger.info(f" [Auth API] Student {ma_sv} found: {data.get('hoTen', 'N/A')}")
                                return data
                except Exception as e:
                    logger.debug(f"Auth API failed for {ma_sv}: {e}")

        # Method 3: Directory existence fallback
        student_dir = self.student_base_dir / ma_sv
        if student_dir.exists():
            logger.warning(f" API unavailable for {ma_sv}, but directory exists")
            return {
                'maSv': ma_sv,
                'hoTen': f'Student_{ma_sv}',
                'note': 'Directory-based detection, API unavailable'
            }

        logger.error(f" Student {ma_sv} not found via any method")
        return None

    async def save_embedding_to_backend(self, ma_sv: str, embedding: np.ndarray, metadata: Dict = None) -> bool:
        """Enhanced embedding save with metadata and multiple endpoints"""
        # Prepare embedding data
        embedding_bytes = embedding.astype(np.float32).tobytes()
        embedding_b64 = base64.b64encode(embedding_bytes).decode('utf-8')

        payload = {
            'embedding': embedding_b64,
            'metadata': {
                'extraction_method': 'advanced_ensemble',
                'embedding_dimension': len(embedding),
                'extraction_timestamp': time.time(),
                'quality_info': metadata.get('quality_info', {}) if metadata else {},
                'model_info': {
                    'models_used': list(self.face_models.keys()),
                    'ensemble_method': self.config['ensemble_method']
                }
            }
        }

        # Method 1: Python API endpoint
        try:
            timeout = aiohttp.ClientTimeout(total=30)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                url = f"{self.backend_api_url}/python/students/{ma_sv}/embedding"
                async with session.post(url, json=payload, headers=self.headers) as response:
                    if response.status == 200:
                        logger.info(f" [Python API] Embedding saved for {ma_sv}")
                        return True
                    else:
                        logger.debug(f"Python API save failed for {ma_sv}: {response.status}")
        except Exception as e:
            logger.debug(f"Python API save failed for {ma_sv}: {e}")

        # Method 2: Authenticated API
        if self.credentials and self.session_cookies:
            try:
                timeout = aiohttp.ClientTimeout(total=30)
                async with aiohttp.ClientSession(cookies=self.session_cookies, timeout=timeout) as session:
                    url = f"{self.backend_api_url}/sinhvien/students/{ma_sv}/embedding"
                    async with session.post(url, json=payload, headers=self.headers) as response:
                        if response.status == 200:
                            logger.info(f" [Auth API] Embedding saved for {ma_sv}")
                            return True
                        else:
                            logger.debug(f"Auth API save failed for {ma_sv}: {response.status}")
            except Exception as e:
                logger.debug(f"Auth API save failed for {ma_sv}: {e}")

        # Method 3: Local file backup
        try:
            embeddings_dir = self.project_root / "data" / "embeddings"
            embeddings_dir.mkdir(parents=True, exist_ok=True)

            # Save embedding
            embedding_file = embeddings_dir / f"{ma_sv}_embedding.npy"
            np.save(embedding_file, embedding)

            # Save metadata
            metadata_file = embeddings_dir / f"{ma_sv}_metadata.json"
            full_metadata = {
                'student_id': ma_sv,
                'embedding_shape': embedding.shape,
                'embedding_norm': float(np.linalg.norm(embedding)),
                'timestamp': time.time(),
                'extraction_info': metadata if metadata else {},
                'backup_reason': 'API_unavailable'
            }

            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(full_metadata, f, ensure_ascii=False, indent=2, default=str)

            logger.warning(f" Embedding saved locally for {ma_sv}: {embedding_file}")
            return True

        except Exception as e:
            logger.error(f" Failed to save embedding for {ma_sv}: {e}")
            return False

    async def trigger_feature_extraction(self, ma_sv: str) -> bool:
        """Enhanced trigger with retry mechanism"""
        for attempt in range(3):
            try:
                timeout = aiohttp.ClientTimeout(total=15)
                async with aiohttp.ClientSession(timeout=timeout) as session:
                    url = f"{self.face_api_url}/api/v1/features/extract/{ma_sv}"
                    async with session.post(url, headers=self.headers) as response:
                        if response.status == 200:
                            data = await response.json()
                            logger.info(f" Feature extraction triggered for {ma_sv}")
                            return True
                        else:
                            logger.debug(f"Trigger attempt {attempt + 1} failed for {ma_sv}: {response.status}")

            except Exception as e:
                logger.debug(f"Trigger attempt {attempt + 1} error for {ma_sv}: {e}")

            if attempt < 2:
                await asyncio.sleep(1)

        logger.warning(f"️ Could not trigger feature extraction for {ma_sv}")
        return False

    async def process_student_advanced(self, ma_sv: str) -> Dict:
        """
        Advanced student processing with comprehensive analysis
        """
        start_time = time.time()
        logger.info(f" Starting advanced processing for student: {ma_sv}")

        result = {
            'student_id': ma_sv,
            'status': 'failed',
            'message': '',
            'processing_time': 0.0,
            'metadata': {
                'extraction_method': 'advanced_ensemble',
                'models_used': list(self.face_models.keys()),
                'config_used': self.config.copy()
            }
        }

        try:
            # Step 1: Verify student exists
            student_info = await self.get_student_info(ma_sv)
            if not student_info:
                result['message'] = f"Student {ma_sv} not found in database"
                return result

            # Step 2: Get image paths with validation
            image_paths = self.get_student_image_paths(ma_sv)
            if not image_paths['exists']:
                result['message'] = f"Student directory not found: {ma_sv}"
                return result

            all_images = image_paths['valid_images']
            if not all_images:
                result['message'] = f"No valid images found for student {ma_sv}"
                result['metadata']['image_info'] = {
                    'total_files': image_paths['total_files'],
                    'valid_images': 0,
                    'profile_available': False,
                    'face_images_count': 0
                }
                return result

            logger.info(f" Found {len(all_images)} valid images for {ma_sv}")

            # Step 3: Advanced ensemble feature extraction
            embeddings, extraction_metadata = self.extract_face_features_ensemble(all_images)

            if not embeddings:
                result['message'] = f"No face embeddings extracted for {ma_sv}"
                result['metadata']['extraction_details'] = extraction_metadata
                return result

            logger.info(f" Extracted {len(embeddings)} embeddings for {ma_sv}")

            # Step 4: Advanced validation
            validation_result = self.validate_embeddings_advanced(embeddings)

            if not validation_result['is_valid']:
                result['message'] = f"Embeddings validation failed for {ma_sv}: {validation_result['recommendation']}"
                result['metadata']['validation_details'] = validation_result
                result['metadata']['extraction_details'] = extraction_metadata
                return result

            # Step 5: Create advanced composite embedding
            quality_scores = extraction_metadata.get('quality_scores', None)
            composite_embedding = self.create_composite_embedding_advanced(embeddings, quality_scores)

            if composite_embedding is None:
                result['message'] = f"Failed to create composite embedding for {ma_sv}"
                return result

            # Step 6: Save to backend with full metadata
            save_metadata = {
                'quality_info': validation_result,
                'extraction_details': extraction_metadata,
                'image_info': {
                    'total_images': len(all_images),
                    'profile_available': image_paths['profile_image'] is not None,
                    'face_images_count': len(image_paths['face_images']),
                    'valid_images_count': len(all_images)
                }
            }

            save_success = await self.save_embedding_to_backend(ma_sv, composite_embedding, save_metadata)

            # Step 7: Trigger feature extraction service
            if save_success:
                await self.trigger_feature_extraction(ma_sv)

            # Step 8: Compile final result
            processing_time = time.time() - start_time

            if save_success:
                result.update({
                    'status': 'success',
                    'message': f" Advanced processing completed for {ma_sv} ({validation_result.get('quality_level', 'unknown')} quality)",
                    'processing_time': processing_time,
                    'metadata': {
                        'extraction_method': 'advanced_ensemble',
                        'models_used': list(self.face_models.keys()),
                        'student_info': {
                            'name': student_info.get('hoTen', 'N/A'),
                            'class': student_info.get('maLop', 'N/A')
                        },
                        'image_analysis': {
                            'total_images_found': len(all_images),
                            'profile_available': image_paths['profile_image'] is not None,
                            'face_images_count': len(image_paths['face_images']),
                            'extraction_success_rate': extraction_metadata['success_rate'],
                            'average_quality': extraction_metadata['average_quality']
                        },
                        'embedding_analysis': {
                            'embeddings_count': len(embeddings),
                            'validation_score': validation_result.get('validation_score', 0.0),
                            'quality_level': validation_result.get('quality_level', 'unknown'),
                            'identity_confidence': validation_result.get('identity_confidence', 0.0),
                            'consistency_score': validation_result.get('consistency_score', 0.0),
                            'final_embedding_dim': len(composite_embedding),
                            'embedding_norm': float(np.linalg.norm(composite_embedding))
                        },
                        'model_performance': extraction_metadata['model_results'],
                        'processing_stats': {
                            'processing_time_seconds': processing_time,
                            'images_per_second': len(all_images) / processing_time if processing_time > 0 else 0
                        },
                        'recommendations': validation_result.get('recommendation', 'No recommendation available')
                    }
                })
            else:
                result.update({
                    'message': f" Embedding extraction successful but save failed for {ma_sv}",
                    'processing_time': processing_time,
                    'metadata': {
                        **result['metadata'],
                        'validation_details': validation_result,
                        'extraction_details': extraction_metadata
                    }
                })

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f" Critical error processing {ma_sv}: {str(e)}", exc_info=True)
            result.update({
                'status': 'error',
                'message': f"Critical error: {str(e)}",
                'processing_time': processing_time
            })

        return result

    async def process_all_students_advanced(self) -> Dict:
        """
        Advanced batch processing with comprehensive analytics
        """
        start_time = time.time()
        logger.info(f" Starting advanced batch processing in: {self.student_base_dir}")

        if not self.student_base_dir.exists():
            return {
                'success': False,
                'error': f'Student directory not found: {self.student_base_dir}',
                'processing_time': 0,
                'results': {}
            }

        # Discover all student directories
        student_folders = [
            folder.name for folder in self.student_base_dir.iterdir()
            if folder.is_dir() and not folder.name.startswith('.')
        ]

        if not student_folders:
            return {
                'success': True,
                'total_students': 0,
                'processing_time': time.time() - start_time,
                'message': 'No student directories found',
                'results': {}
            }

        logger.info(f" Found {len(student_folders)} student directories")

        # Process students with concurrent execution (limited to avoid overload)
        results = {}
        success_count = 0
        error_count = 0

        # Process in batches to control memory usage
        batch_size = 3  # Process 3 students concurrently
        for i in range(0, len(student_folders), batch_size):
            batch = student_folders[i:i + batch_size]

            # Process batch concurrently
            batch_tasks = [self.process_student_advanced(ma_sv) for ma_sv in batch]
            batch_results = await asyncio.gather(*batch_tasks, return_exceptions=True)

            # Collect results
            for ma_sv, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f" Exception processing {ma_sv}: {result}")
                    results[ma_sv] = {
                        'student_id': ma_sv,
                        'status': 'error',
                        'message': f'Exception: {str(result)}',
                        'processing_time': 0
                    }
                    error_count += 1
                else:
                    results[ma_sv] = result
                    if result['status'] == 'success':
                        success_count += 1
                    else:
                        error_count += 1

            # Small delay between batches
            if i + batch_size < len(student_folders):
                await asyncio.sleep(0.5)

        # Compile comprehensive summary
        total_time = time.time() - start_time

        # Calculate detailed statistics
        processing_times = [r.get('processing_time', 0) for r in results.values() if isinstance(r.get('processing_time'), (int, float))]
        quality_levels = []
        model_performance = {model: {'success': 0, 'total': 0} for model in self.face_models.keys()}

        for result in results.values():
            if result['status'] == 'success' and 'metadata' in result:
                embedding_analysis = result['metadata'].get('embedding_analysis', {})
                quality_level = embedding_analysis.get('quality_level', 'unknown')
                quality_levels.append(quality_level)

                # Aggregate model performance
                model_perf = result['metadata'].get('model_performance', {})
                for model_name, model_results in model_perf.items():
                    if model_name in model_performance:
                        for model_result in model_results:
                            model_performance[model_name]['total'] += 1
                            if model_result.get('success', False):
                                model_performance[model_name]['success'] += 1

        # Calculate model success rates
        for model_name in model_performance:
            total = model_performance[model_name]['total']
            if total > 0:
                model_performance[model_name]['success_rate'] = model_performance[model_name]['success'] / total
            else:
                model_performance[model_name]['success_rate'] = 0.0

        summary = {
            'success': True,
            'processing_method': 'advanced_ensemble_batch',
            'total_students': len(student_folders),
            'success_count': success_count,
            'error_count': error_count,
            'success_rate': success_count / len(student_folders) if student_folders else 0,
            'processing_time': total_time,
            'performance_stats': {
                'total_processing_time': total_time,
                'average_time_per_student': sum(processing_times) / len(processing_times) if processing_times else 0,
                'students_per_second': len(student_folders) / total_time if total_time > 0 else 0,
                'fastest_student_time': min(processing_times) if processing_times else 0,
                'slowest_student_time': max(processing_times) if processing_times else 0
            },
            'quality_distribution': {
                'excellent': quality_levels.count('excellent'),
                'good': quality_levels.count('good'),
                'acceptable': quality_levels.count('acceptable'),
                'poor': quality_levels.count('poor')
            },
            'model_performance': model_performance,
            'system_info': {
                'models_loaded': len(self.face_models),
                'batch_size': batch_size,
                'config': self.config
            },
            'results': results
        }

        logger.info(f"🏁 Advanced batch processing completed: {success_count}/{len(student_folders)} successful "
                    f"({summary['success_rate']:.1%}) in {total_time:.1f}s")

        return summary


def print_advanced_results(results: Dict):
    """Print comprehensive results with advanced analytics"""
    print("\n" + "=" * 120)
    print(" ADVANCED FACE FEATURE EXTRACTION REPORT")
    print("=" * 120)

    # Overview
    print(f" EXECUTIVE SUMMARY:")
    print(f"   • Processing Method: {results.get('processing_method', 'N/A')}")
    print(f"   • Total Students: {results['total_students']}")
    print(f"   • Successful: {results['success_count']} ")
    print(f"   • Failed: {results['error_count']} ")
    print(f"   • Success Rate: {results['success_rate']:.1%}")
    print(f"   • Total Time: {results['processing_time']:.1f}s")

    # Performance Statistics
    perf_stats = results.get('performance_stats', {})
    if perf_stats:
        print(f"\n PERFORMANCE ANALYTICS:")
        print(f"   • Average Time/Student: {perf_stats.get('average_time_per_student', 0):.2f}s")
        print(f"   • Processing Speed: {perf_stats.get('students_per_second', 0):.2f} students/sec")
        print(f"   • Fastest Student: {perf_stats.get('fastest_student_time', 0):.2f}s")
        print(f"   • Slowest Student: {perf_stats.get('slowest_student_time', 0):.2f}s")

    # Quality Distribution
    quality_dist = results.get('quality_distribution', {})
    if quality_dist:
        total_quality = sum(quality_dist.values())
        print(f"\n QUALITY DISTRIBUTION:")
        print(f"   • Excellent: {quality_dist.get('excellent', 0)} ({quality_dist.get('excellent', 0)/total_quality*100:.1f}%)" if total_quality > 0 else "   • Excellent: 0")
        print(f"   • Good: {quality_dist.get('good', 0)} ({quality_dist.get('good', 0)/total_quality*100:.1f}%)" if total_quality > 0 else "   • Good: 0")
        print(f"   • Acceptable: {quality_dist.get('acceptable', 0)} ({quality_dist.get('acceptable', 0)/total_quality*100:.1f}%)" if total_quality > 0 else "   • Acceptable: 0")
        print(f"   • Poor: {quality_dist.get('poor', 0)} ({quality_dist.get('poor', 0)/total_quality*100:.1f}%)" if total_quality > 0 else "   • Poor: 0")

    # Model Performance
    model_perf = results.get('model_performance', {})
    if model_perf:
        print(f"\n MODEL PERFORMANCE:")
        for model_name, stats in model_perf.items():
            success_rate = stats.get('success_rate', 0) * 100
            print(f"   • {model_name}: {stats.get('success', 0)}/{stats.get('total', 0)} ({success_rate:.1f}%)")

    # Detailed Results by Category
    successful_students = []
    failed_students = []
    error_students = []

    for ma_sv, result in results['results'].items():
        if result['status'] == 'success':
            successful_students.append((ma_sv, result))
        elif result['status'] == 'failed':
            failed_students.append((ma_sv, result))
        else:
            error_students.append((ma_sv, result))

    # Success Details
    if successful_students:
        print(f"\n✅ SUCCESSFUL EXTRACTIONS ({len(successful_students)}):")
        for ma_sv, result in successful_students[:10]:  # Show top 10
            metadata = result.get('metadata', {})
            embedding_analysis = metadata.get('embedding_analysis', {})
            image_analysis = metadata.get('image_analysis', {})

            quality_level = embedding_analysis.get('quality_level', 'unknown')
            confidence = embedding_analysis.get('identity_confidence', 0)
            images_count = image_analysis.get('total_images_found', 0)
            processing_time = result.get('processing_time', 0)

            print(f"    {ma_sv}: {quality_level.upper()} quality "
                  f"(confidence: {confidence:.3f}, images: {images_count}, time: {processing_time:.1f}s)")

        if len(successful_students) > 10:
            print(f"   ... and {len(successful_students) - 10} more successful extractions")

    # Failure Analysis
    if failed_students:
        print(f"\n FAILED EXTRACTIONS ({len(failed_students)}):")
        failure_reasons = {}
        for ma_sv, result in failed_students:
            reason = result['message']
            if reason not in failure_reasons:
                failure_reasons[reason] = []
            failure_reasons[reason].append(ma_sv)

        for reason, students in failure_reasons.items():
            print(f"    {reason}: {len(students)} students")
            if len(students) <= 5:
                print(f"      Students: {', '.join(students)}")

    # Error Analysis
    if error_students:
        print(f"\n CRITICAL ERRORS ({len(error_students)}):")
        for ma_sv, result in error_students[:5]:  # Show first 5 errors
            print(f"    {ma_sv}: {result['message']}")

    print("\n" + "=" * 120)


async def main():
    """
    Advanced main function with comprehensive setup
    """
    # System Configuration
    PROJECT_ROOT = str(Path(__file__).parent.parent.parent)
    BACKEND_API_URL = "http://localhost:8080/api"
    FACE_API_URL = "http://localhost:8001"

    # Authentication (optional)
    CREDENTIALS = {
        'username': 'admin',
        'password': 'admin123'
    }

    print("ADVANCED FACE FEATURE EXTRACTION SYSTEM")
    print("=" * 80)
    print(f"Project Root: {PROJECT_ROOT}")
    print(f"Backend API: {BACKEND_API_URL}")
    print(f"Face API: {FACE_API_URL}")
    print(f"Authentication: {'Enabled' if CREDENTIALS else 'Disabled'}")
    print("=" * 80)

    try:
        # Initialize advanced extractor
        extractor = AdvancedFaceFeatureExtractor(BACKEND_API_URL, FACE_API_URL, PROJECT_ROOT, CREDENTIALS)

        # Verify student directory exists
        if not extractor.student_base_dir.exists():
            print(f"Student directory not found: {extractor.student_base_dir}")
            print("Please check PROJECT_ROOT configuration")
            return

        print(f"Student directory verified: {extractor.student_base_dir}")
        print(f"Models loaded: {len(extractor.face_models)}")

        # Test API connection
        if CREDENTIALS:
            print("Testing API connection...")
            login_success = await extractor.login_session()
            if login_success:
                print("API connection successful")
            else:
                print("API login failed, using fallback methods")

        # Start advanced processing
        print("\nStarting advanced batch extraction...")
        results = await extractor.process_all_students_advanced()

        # Display comprehensive results
        print_advanced_results(results)

        # Save detailed report
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        report_file = f"advanced_face_extraction_report_{timestamp}.json"

        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, ensure_ascii=False, indent=2, default=str)
            print(f"Detailed report saved: {report_file}")
        except Exception as e:
            print(f"⚠️ Could not save report: {e}")

        # Summary statistics
        if results['success']:
            print(f"\nPROCESSING COMPLETED SUCCESSFULLY!")
            print(f"Final Stats: {results['success_count']}/{results['total_students']} "
                  f"({results['success_rate']:.1%} success rate)")
        else:
            print(f"\nPROCESSING COMPLETED WITH ISSUES")

    except Exception as e:
        logger.error(f"Critical system error: {str(e)}", exc_info=True)
        print(f"Critical error occurred: {str(e)}")
        print("Please check the logs for detailed error information")


if __name__ == "__main__":
    # Run the advanced extraction system
    asyncio.run(main())