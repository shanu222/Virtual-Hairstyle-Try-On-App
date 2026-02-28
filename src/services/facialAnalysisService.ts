import * as faceapi from 'face-api.js';

// Model URLs in priority order - try CDN first (known working), then local
const MODEL_URLS = [
  'https://justadudewhohacks.github.io/face-api.js/models/', // Official CDN (most reliable)
  '/models/', // Local models in public folder
];

/**
 * Verify a model URL is accessible by testing one file fetch
 */
async function verifyModelUrl(modelUrl: string, timeout = 10000): Promise<boolean> {
  try {
    const testFile = `${modelUrl}tiny_face_detector_model-weights_manifest.json`;
    console.log(`🔍 Testing model URL: ${testFile}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(testFile, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ Model URL verified: ${modelUrl}`);
      return true;
    } else {
      console.warn(`❌ Model URL returned ${response.status}: ${testFile}`);
      return false;
    }
  } catch (error) {
    console.warn(`❌ Failed to verify model URL ${modelUrl}:`, error instanceof Error ? error.message : error);
    return false;
  }
}

export interface FacialAnalysis {
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'long' | 'diamond';
  jawlineStrength: number; // 0-100
  foreheadWidth: number; // 0-100
  hairlinePosition: 'high' | 'normal' | 'low';
  facialProportions: {
    faceLength: number;
    faceWidth: number;
    jawlineWidth: number;
    foreheadArea: number;
  };
  landmarks: faceapi.WithFaceLandmarks<any> | null;
  confidence: number; // 0-100
}

export interface RecommendedStyle {
  styleId: string;
  name: string;
  category: string;
  matchScore: number; // 0-100
  reasonsForMatch: string[];
  suggestedColor?: string;
}

let modelsLoaded = false;
let modelLoadError: string | null = null;

/**
 * Load face-api.js models with robust error handling
 */
export async function initializeFaceAPI(): Promise<void> {
  if (modelsLoaded) {
    console.log('✅ Models already loaded');
    return;
  }
  if (modelLoadError) throw new Error(modelLoadError);

  console.log('🚀 Starting Face API initialization...');
  let lastError: Error | null = null;

  for (const modelUrl of MODEL_URLS) {
    try {
      console.log(`\n📍 Attempting to load models from: ${modelUrl}`);

      // First verify the URL is accessible
      const isAccessible = await verifyModelUrl(modelUrl, 10000);
      if (!isAccessible) {
        console.log(`⏭️ Skipping inaccessible URL: ${modelUrl}`);
        continue;
      }

      // Now attempt to load the actual models
      console.log(`⏳ Loading models from ${modelUrl}...`);
      
      const loadTinyFace = faceapi.nets.tinyFaceDetector.loadFromUri(modelUrl);
      const loadLandmarks = faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);

      // Create timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Model loading timeout (30s)')), 30000)
      );

      // Load both models in parallel with timeout
      await Promise.race([
        Promise.all([loadTinyFace, loadLandmarks]),
        timeoutPromise
      ]);

      modelsLoaded = true;
      modelLoadError = null;
      console.log('\n✅✅✅ SUCCESS! Face API models loaded and ready!');
      console.log(`📦 Models loaded from: ${modelUrl}`);
      return;
      
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`❌ Failed to load from ${modelUrl}`);
      console.error(`   Error: ${lastError.message}`);
      continue;
    }
  }

  // All sources failed
  const errorMsg = lastError?.message || 'Unknown error';
  modelLoadError = `Failed to load facial analysis models from all sources.\n\nDetails: ${errorMsg}\n\nPlease:\n1. Check your internet connection\n2. Try refreshing the page\n3. Check browser console (F12) for details`;
  
  console.error('\n❌❌❌ CRITICAL: All model loading attempts failed!');
  console.error(`Last error: ${lastError?.message}`);
  console.error(`Stack: ${lastError?.stack}`);
  
  throw new Error(modelLoadError);
}

/**
 * Analyze facial features in an image
 */
export async function analyzeFace(imageElement: HTMLImageElement): Promise<FacialAnalysis> {
  if (!modelsLoaded) {
    await initializeFaceAPI();
  }

  try {
    // Detect face with smaller detection input size for faster processing
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }))
      .withFaceLandmarks();

    if (detections.length === 0) {
      throw new Error(
        'No face detected. Please ensure:\n' +
        '- Your face is clearly visible\n' +
        '- You are looking at the camera\n' +
        '- Good lighting conditions\n' +
        '- Face is not obscured by hair/accessories'
      );
    }

    if (detections.length > 1) {
      console.warn('Multiple faces detected. Using the first one.');
    }

    const detection = detections[0]; // Use first detected face
    
    // Validate detection score
    if ((detection.detection.score || 0) < 0.5) {
      throw new Error('Face detection confidence too low. Please try a clearer photo.');
    }

    const landmarks = detection.landmarks.positions;

    // Calculate facial proportions
    const proportions = calculateFacialProportions(landmarks);

    // Determine face shape
    const faceShape = determineFaceShape(proportions);

    // Analyze jawline
    const jawlineStrength = analyzeJawline(proportions);

    // Analyze forehead
    const foreheadWidth = analyzeForeheadWidth(proportions);

    // Determine hairline position
    const hairlinePosition = determineHairlinePosition(proportions);

    return {
      faceShape,
      jawlineStrength,
      foreheadWidth,
      hairlinePosition,
      facialProportions: proportions,
      landmarks: detection,
      confidence: Math.round((detection.detection.score || 0) * 100),
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during analysis';
    console.error('Error analyzing face:', error);
    throw new Error(errorMessage || 'Failed to analyze facial features');
  }
}

/**
 * Calculate facial proportions from landmarks
 */
function calculateFacialProportions(landmarks: any[]): FacialAnalysis['facialProportions'] {
  // Key landmark indices (68-point model)
  const foreheadTop = landmarks[19]; // Between eyebrows above
  const chin = landmarks[8]; // Bottom of chin
  const leftCheek = landmarks[2]; // Left face outline
  const rightCheek = landmarks[14]; // Right face outline
  const leftJaw = landmarks[3]; // Left jaw
  const rightJaw = landmarks[13]; // Right jaw
  const noseTip = landmarks[30]; // Nose tip

  const faceLength = Math.hypot(
    chin.x - foreheadTop.x,
    chin.y - foreheadTop.y
  );

  const faceWidth = Math.hypot(
    rightCheek.x - leftCheek.x,
    rightCheek.y - leftCheek.y
  );

  const jawlineWidth = Math.hypot(
    rightJaw.x - leftJaw.x,
    rightJaw.y - leftJaw.y
  );

  const foreheadArea = Math.hypot(
    rightCheek.x - leftCheek.x,
    noseTip.y - foreheadTop.y
  );

  return {
    faceLength,
    faceWidth,
    jawlineWidth,
    foreheadArea,
  };
}

/**
 * Determine face shape based on proportions
 */
function determineFaceShape(proportions: FacialAnalysis['facialProportions']): FacialAnalysis['faceShape'] {
  const { faceLength, faceWidth, jawlineWidth, foreheadArea } = proportions;

  const lengthWidthRatio = faceLength / faceWidth;
  const jawWidthRatio = jawlineWidth / faceWidth;
  const foreheadRatio = foreheadArea / faceLength;

  // Ratios that define different face shapes
  if (lengthWidthRatio > 1.3) {
    // Long face
    return 'long';
  } else if (lengthWidthRatio < 0.9) {
    // Round face
    return 'round';
  } else if (Math.abs(jawWidthRatio - 0.85) < 0.1) {
    // Square face
    return 'square';
  } else if (foreheadRatio > 0.35) {
    // Heart-shaped (wide forehead)
    return 'heart';
  } else if (jawWidthRatio < 0.8 && lengthWidthRatio > 1.1) {
    // Diamond (narrow jaw and forehead)
    return 'diamond';
  }

  // Default to oval
  return 'oval';
}

/**
 * Analyze jawline strength
 */
function analyzeJawline(proportions: FacialAnalysis['facialProportions']): number {
  const { jawlineWidth, faceWidth } = proportions;
  const jawlineRatio = (jawlineWidth / faceWidth) * 100;

  // Normalize to 0-100 scale (90% is strong, 70% is weak)
  return Math.min(100, Math.max(0, (jawlineRatio - 60) * 5));
}

/**
 * Analyze forehead width
 */
function analyzeForeheadWidth(proportions: FacialAnalysis['facialProportions']): number {
  const { foreheadArea, faceWidth, faceLength } = proportions;

  // Calculate forehead to face width ratio
  const foreheadWidthRatio = (foreheadArea / faceWidth) * 100;

  // Normalize to 0-100 scale
  return Math.min(100, Math.max(0, foreheadWidthRatio));
}

/**
 * Determine hairline position
 */
function determineHairlinePosition(proportions: FacialAnalysis['facialProportions']): FacialAnalysis['hairlinePosition'] {
  const { foreheadArea, faceLength } = proportions;

  const foreheadRatio = (foreheadArea / faceLength) * 100;

  if (foreheadRatio > 40) {
    return 'high';
  } else if (foreheadRatio < 25) {
    return 'low';
  }

  return 'normal';
}

/**
 * Visualize facial landmarks on canvas
 */
export function drawFacialLandmarks(
  canvas: HTMLCanvasElement,
  analysis: FacialAnalysis,
  imageWidth: number,
  imageHeight: number
): void {
  if (!analysis.landmarks) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const landmarks = analysis.landmarks.landmarks.positions;

  // Draw landmarks as small circles
  ctx.fillStyle = '#00ff00';
  landmarks.forEach((point: { x: number; y: number }, index: number) => {
    ctx.beginPath();
    ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw key landmark labels
    if ([8, 19, 2, 14, 3, 13, 30].includes(index)) {
      ctx.fillStyle = '#ff0000';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(String(index), point.x + 5, point.y - 5);
      ctx.fillStyle = '#00ff00';
    }
  });

  // Draw face outline
  ctx.strokeStyle = '#0099ff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const outline = landmarks.slice(0, 17); // Face outline points
  outline.forEach((point: { x: number; y: number }, index: number) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();

  // Draw jawline
  ctx.strokeStyle = '#ff6600';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const jawline = landmarks.slice(3, 13); // Jawline points
  jawline.forEach((point: { x: number; y: number }, index: number) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}
