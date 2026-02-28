import { FacialAnalysis } from './facialAnalysisService';
import { Hairstyle } from '../app/components/HairstyleSelector';

export interface BlendingOptions {
  hairColor: string;
  brightness: number;
  blendingIntensity: number; // 0-100
  landmark: any; // Face landmarks for reference
}

/**
 * Advanced hairstyle blending with facial landmark detection
 */
export async function blendHairstyleWithFace(
  ctx: CanvasRenderingContext2D,
  hairImage: HTMLImageElement | null,
  faceAnalysis: FacialAnalysis,
  hairColor: string,
  brightness: number,
  width: number,
  height: number
): Promise<void> {
  if (!faceAnalysis.landmarks) return;

  const landmarks = faceAnalysis.landmarks.landmarks.positions;

  // Get key facial points for hairstyle area
  const foreheadTop = landmarks[19]; // Between eyebrows
  const chin = landmarks[8]; // Chin
  const leftEye = landmarks[36]; // Left eye
  const rightEye = landmarks[45]; // Right eye
  const leftCheek = landmarks[2];
  const rightCheek = landmarks[14];

  // Create hairstyle region mask
  createHairstyleMask(ctx, landmarks, width, height, faceAnalysis);

  // Apply intelligent color blending
  applyIntelligentColorBlending(ctx, faceAnalysis, hairColor, brightness, landmarks, width, height);

  // Apply texture and shading
  applyHairstyleShading(ctx, faceAnalysis, landmarks, width, height);

  // Blend edges smoothly
  smoothEdgeBlending(ctx, landmarks, width, height);
}

/**
 * Create mask for hairstyle region using facial landmarks
 */
function createHairstyleMask(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number,
  faceAnalysis: FacialAnalysis
): void {
  ctx.save();

  // Extract relevant landmarks
  const foreheadTop = landmarks[19];
  const leftTemple = landmarks[23];
  const rightTemple = landmarks[24];
  const leftHair = landmarks[21];
  const rightHair = landmarks[22];
  const leftCheek = landmarks[2];
  const rightCheek = landmarks[14];

  // Create clipping region for hair
  ctx.beginPath();

  // Top of head (extrapolate from forehead landmarks)
  const topHeight = foreheadTop.y - (foreheadTop.y - landmarks[27].y) * 0.6;
  ctx.moveTo(leftTemple.x, topHeight);

  // Left side arc
  ctx.quadraticCurveTo(
    leftTemple.x - 30,
    topHeight + 50,
    leftTemple.x - 20,
    leftCheek.y
  );

  // Bottom left (jawline)
  ctx.lineTo(leftCheek.x, leftCheek.y);

  // Chin area
  const chin = landmarks[8];
  ctx.lineTo(chin.x, chin.y);

  // Bottom right (jaw)
  ctx.lineTo(rightCheek.x, rightCheek.y);

  // Right side arc
  ctx.quadraticCurveTo(
    rightTemple.x + 20,
    leftCheek.y,
    rightTemple.x + 30,
    topHeight + 50
  );

  // Top right
  ctx.lineTo(rightTemple.x, topHeight);

  // Back to top center with hair volume
  ctx.quadraticCurveTo(
    (leftTemple.x + rightTemple.x) / 2,
    topHeight - 60,
    leftTemple.x,
    topHeight
  );

  ctx.closePath();

  // Apply gradient for natural hair appearance
  const gradient = ctx.createLinearGradient(0, topHeight, 0, landmarks[8].y);
  gradient.addColorStop(0, `${adjustColorBrightness(hairColor, 1.2)}`);
  gradient.addColorStop(0.5, hairColor);
  gradient.addColorStop(1, `${adjustColorBrightness(hairColor, 0.8)}`);

  ctx.fillStyle = gradient;
  ctx.globalAlpha = 0.7;
  ctx.fill();

  ctx.restore();
}

/**
 * Apply intelligent color blending based on face shape and jaw
 */
function applyIntelligentColorBlending(
  ctx: CanvasRenderingContext2D,
  faceAnalysis: FacialAnalysis,
  hairColor: string,
  brightness: number,
  landmarks: any[],
  width: number,
  height: number
): void {
  ctx.save();

  const foreheadTop = landmarks[19];
  const chin = landmarks[8];
  const leftTemple = landmarks[23];
  const rightTemple = landmarks[24];

  // Create multi-layer gradient for realistic appearance
  const mainGradient = ctx.createLinearGradient(
    0,
    foreheadTop.y - 80,
    0,
    chin.y
  );

  mainGradient.addColorStop(0, adjustColorBrightness(hairColor, brightness / 100 + 0.2));
  mainGradient.addColorStop(0.4, adjustColorBrightness(hairColor, brightness / 100));
  mainGradient.addColorStop(0.7, adjustColorBrightness(hairColor, brightness / 100 - 0.1));
  mainGradient.addColorStop(1, adjustColorBrightness(hairColor, brightness / 100 - 0.2));

  ctx.fillStyle = mainGradient;

  // Draw hair region with side highlights
  ctx.beginPath();
  ctx.ellipse(
    (leftTemple.x + rightTemple.x) / 2,
    foreheadTop.y - 40,
    (rightTemple.x - leftTemple.x) / 2 + 40,
    Math.abs(foreheadTop.y - chin.y) / 2.5,
    0,
    0,
    Math.PI * 2
  );

  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.5;
  ctx.fill();

  // Add highlight on top
  const highlightGradient = ctx.createRadialGradient(
    (leftTemple.x + rightTemple.x) / 2,
    foreheadTop.y - 60,
    0,
    (leftTemple.x + rightTemple.x) / 2,
    foreheadTop.y - 60,
    100
  );

  highlightGradient.addColorStop(0, `rgba(255, 255, 255, 0.3)`);
  highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`);

  ctx.fillStyle = highlightGradient;
  ctx.globalCompositeOperation = 'lighten';
  ctx.globalAlpha = 0.4;
  ctx.fill();

  ctx.restore();
}

/**
 * Apply shading to create depth and texture
 */
function applyHairstyleShading(
  ctx: CanvasRenderingContext2D,
  faceAnalysis: FacialAnalysis,
  landmarks: any[],
  width: number,
  height: number
): void {
  ctx.save();

  const foreheadTop = landmarks[19];
  const leftCheek = landmarks[2];
  const rightCheek = landmarks[14];

  // Shadow on sides
  const leftShadow = ctx.createLinearGradient(
    leftCheek.x - 50,
    foreheadTop.y,
    leftCheek.x,
    leftCheek.y
  );

  leftShadow.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  leftShadow.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = leftShadow;
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.3;

  ctx.beginPath();
  ctx.rect(leftCheek.x - 50, foreheadTop.y, 50, Math.abs(foreheadTop.y - leftCheek.y));
  ctx.fill();

  // Right side shadow
  const rightShadow = ctx.createLinearGradient(
    rightCheek.x,
    foreheadTop.y,
    rightCheek.x + 50,
    rightCheek.y
  );

  rightShadow.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rightShadow.addColorStop(1, 'rgba(0, 0, 0, 0.3)');

  ctx.fillStyle = rightShadow;
  ctx.beginPath();
  ctx.rect(rightCheek.x, foreheadTop.y, 50, Math.abs(foreheadTop.y - rightCheek.y));
  ctx.fill();

  ctx.restore();
}

/**
 * Smooth edges for natural blending
 */
function smoothEdgeBlending(
  ctx: CanvasRenderingContext2D,
  landmarks: any[],
  width: number,
  height: number
): void {
  ctx.save();

  const foreheadTop = landmarks[19];
  const leftCheek = landmarks[2];
  const rightCheek = landmarks[14];
  const chin = landmarks[8];

  // Create edge feathering gradient
  const edgeBlend = ctx.createLinearGradient(
    leftCheek.x,
    leftCheek.y,
    leftCheek.x - 30,
    leftCheek.y
  );

  edgeBlend.addColorStop(0, 'rgba(0, 0, 0, 0)');
  edgeBlend.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

  ctx.fillStyle = edgeBlend;
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.4;

  // Draw feathering on sides
  ctx.beginPath();
  ctx.ellipse(leftCheek.x, (foreheadTop.y + leftCheek.y) / 2, 30, 80, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right side
  const rightEdgeBlend = ctx.createLinearGradient(
    rightCheek.x,
    rightCheek.y,
    rightCheek.x + 30,
    rightCheek.y
  );

  rightEdgeBlend.addColorStop(0, 'rgba(0, 0, 0, 0)');
  rightEdgeBlend.addColorStop(1, 'rgba(0, 0, 0, 0.2)');

  ctx.fillStyle = rightEdgeBlend;
  ctx.beginPath();
  ctx.ellipse(rightCheek.x, (foreheadTop.y + rightCheek.y) / 2, 30, 80, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * Utility: Adjust color brightness
 */
export function adjustColorBrightness(color: string, factor: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Apply brightness factor
  const newR = Math.min(255, Math.round(r * factor));
  const newG = Math.min(255, Math.round(g * factor));
  const newB = Math.min(255, Math.round(b * factor));

  // Convert back to hex
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

/**
 * Generate visualization data for UI
 */
export function generateAnalysisVisualization(faceAnalysis: FacialAnalysis): {
  metrics: Array<{ label: string; value: number; max: number }>;
  description: string;
} {
  return {
    metrics: [
      { label: 'Jawline Strength', value: faceAnalysis.jawlineStrength, max: 100 },
      { label: 'Forehead Width', value: faceAnalysis.foreheadWidth, max: 100 },
      { label: 'Detection Confidence', value: faceAnalysis.confidence, max: 100 },
    ],
    description: `Face Shape: ${faceAnalysis.faceShape.toUpperCase()} | Hairline: ${faceAnalysis.hairlinePosition} | Confidence: ${faceAnalysis.confidence}%`,
  };
}
