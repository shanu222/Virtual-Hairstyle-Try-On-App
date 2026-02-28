import * as faceapi from 'face-api.js';

// Load face-api.js models
const MODEL_URL = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';

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

/**
 * Load face-api.js models from CDN
 */
export async function initializeFaceAPI(): Promise<void> {
  if (modelsLoaded) return;

  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
    console.log('Face API models loaded successfully');
  } catch (error) {
    console.error('Failed to load Face API models:', error);
    throw new Error('Failed to initialize facial analysis system');
  }
}

/**
 * Analyze facial features in an image
 */
export async function analyzeFace(imageElement: HTMLImageElement): Promise<FacialAnalysis> {
  if (!modelsLoaded) {
    await initializeFaceAPI();
  }

  try {
    // Detect face
    const detections = await faceapi
      .detectAllFaces(imageElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length === 0) {
      throw new Error('No face detected in image');
    }

    const detection = detections[0]; // Use first detected face
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
    console.error('Error analyzing face:', error);
    throw error;
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
  landmarks.forEach((point, index) => {
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
  outline.forEach((point, index) => {
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
  jawline.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}
