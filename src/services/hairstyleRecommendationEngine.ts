import { Hairstyle } from '../app/components/HairstyleSelector';
import { FacialAnalysis, RecommendedStyle } from './facialAnalysisService';

export interface HairstyleRecommendation {
  topRecommendations: RecommendedStyle[];
  explanation: string;
  suggestedColor: string;
}

// Hairstyle compatibility matrix
const hairstyleData: Record<string, any> = {
  // Short Styles
  '1': {
    name: 'Buzz Cut',
    category: 'short',
    compatibleShapes: ['oval', 'square', 'diamond'],
    jawlineRequired: 50,
    foreheadTolerance: 'all',
    notes: 'Best for strong jawlines. Minimizes forehead visibility.',
  },
  '2': {
    name: 'Crew Cut',
    category: 'short',
    compatibleShapes: ['oval', 'square', 'diamond'],
    jawlineRequired: 45,
    foreheadTolerance: 'all',
    notes: 'Classic style that works for most face shapes.',
  },
  '3': {
    name: 'Short Textured',
    category: 'short',
    compatibleShapes: ['oval', 'round', 'heart'],
    jawlineRequired: 30,
    foreheadTolerance: 'wide',
    notes: 'Good for round faces and high hairlines.',
  },
  '4': {
    name: 'Ivy League',
    category: 'short',
    compatibleShapes: ['oval', 'square'],
    jawlineRequired: 40,
    foreheadTolerance: 'normal',
    notes: 'Professional and balanced styling.',
  },

  // Medium Styles
  '5': {
    name: 'Side Part',
    category: 'medium',
    compatibleShapes: ['oval', 'heart', 'diamond'],
    jawlineRequired: 35,
    foreheadTolerance: 'wide',
    notes: 'Great for high foreheads and heart-shaped faces.',
  },
  '6': {
    name: 'Quiff',
    category: 'medium',
    compatibleShapes: ['round', 'heart'],
    jawlineRequired: 25,
    foreheadTolerance: 'wide',
    notes: 'Adds height and balance to round faces.',
  },
  '7': {
    name: 'Pompadour',
    category: 'medium',
    compatibleShapes: ['oval', 'round', 'heart'],
    jawlineRequired: 40,
    foreheadTolerance: 'wide',
    notes: 'Elegant style that flatters wide foreheads.',
  },
  '8': {
    name: 'Slick Back',
    category: 'medium',
    compatibleShapes: ['oval', 'square', 'diamond'],
    jawlineRequired: 45,
    foreheadTolerance: 'normal',
    notes: 'Showcases facial features; great for strong jaws.',
  },

  // Long Styles
  '9': {
    name: 'Long Layered',
    category: 'long',
    compatibleShapes: ['heart', 'diamond', 'long'],
    jawlineRequired: 20,
    foreheadTolerance: 'all',
    notes: 'Softens angular features and narrows the face.',
  },
  '10': {
    name: 'Man Bun',
    category: 'long',
    compatibleShapes: ['square', 'round', 'oval'],
    jawlineRequired: 30,
    foreheadTolerance: 'all',
    notes: 'Works well for most shapes when styled properly.',
  },
  '11': {
    name: 'Shoulder Length',
    category: 'long',
    compatibleShapes: ['round', 'heart', 'long'],
    jawlineRequired: 25,
    foreheadTolerance: 'wide',
    notes: 'Versatile and balancing for various proportions.',
  },

  // Fade Styles
  '12': {
    name: 'Low Fade',
    category: 'fade',
    compatibleShapes: ['oval', 'square', 'diamond'],
    jawlineRequired: 45,
    foreheadTolerance: 'all',
    notes: 'Subtle and professional, emphasizes jawline.',
  },
  '13': {
    name: 'High Fade',
    category: 'fade',
    compatibleShapes: ['round', 'heart'],
    jawlineRequired: 35,
    foreheadTolerance: 'all',
    notes: 'Bold contrast adds dimension to round faces.',
  },
  '14': {
    name: 'Skin Fade',
    category: 'fade',
    compatibleShapes: ['diamond', 'square'],
    jawlineRequired: 50,
    foreheadTolerance: 'normal',
    notes: 'Ultra-clean look for strong features.',
  },
  '15': {
    name: 'Taper Fade',
    category: 'fade',
    compatibleShapes: ['oval', 'round'],
    jawlineRequired: 30,
    foreheadTolerance: 'all',
    notes: 'Gradual and elegant, works for most shapes.',
  },

  // Curly Styles
  '16': {
    name: 'Natural Curls',
    category: 'curly',
    compatibleShapes: ['oval', 'diamond'],
    jawlineRequired: 20,
    foreheadTolerance: 'all',
    notes: 'Adds volume and texture.',
  },
  '17': {
    name: 'Curly Fade',
    category: 'curly',
    compatibleShapes: ['round', 'heart'],
    jawlineRequired: 35,
    foreheadTolerance: 'wide',
    notes: 'Combines texture with clean lines.',
  },
  '18': {
    name: 'Curly Undercut',
    category: 'curly',
    compatibleShapes: ['heart', 'diamond', 'long'],
    jawlineRequired: 30,
    foreheadTolerance: 'all',
    notes: 'Bold contrast with textured top.',
  },
  '19': {
    name: 'Defined Curls',
    category: 'curly',
    compatibleShapes: ['round', 'oval'],
    jawlineRequired: 25,
    foreheadTolerance: 'wide',
    notes: 'Well-groomed and professional.',
  },
};

// Color recommendations based on face shape
const colorRecommendations: Record<string, string> = {
  oval: '#6b4423', // Brown - works for balanced face
  round: '#3d2817', // Dark Brown - adds definition
  square: '#8b6f47', // Light Brown - softens angles
  heart: '#a0302f', // Red - complements narrow chin
  long: '#e6c294', // Blonde - adds balance
  diamond: '#3d2817', // Dark Brown - emphasizes cheekbones
};

/**
 * Generate hairstyle recommendations based on facial analysis
 */
export function generateRecommendations(
  analysis: FacialAnalysis,
  allHairstyles: Hairstyle[]
): HairstyleRecommendation {
  const scores: Map<string, number> = new Map();
  const reasons: Map<string, string[]> = new Map();

  // Score each hairstyle
  Object.entries(hairstyleData).forEach(([styleId, styleInfo]) => {
    let score = 50; // Base score
    const matchReasons: string[] = [];

    // Face shape compatibility (40 points max)
    if (styleInfo.compatibleShapes.includes(analysis.faceShape)) {
      score += 35;
      matchReasons.push(`Ideal for ${analysis.faceShape} face shape`);
    } else {
      score += 10;
      matchReasons.push(`Moderate for ${analysis.faceShape} face shape`);
    }

    // Jawline compatibility (30 points max)
    if (analysis.jawlineStrength >= styleInfo.jawlineRequired) {
      score += 25;
      matchReasons.push(`Complements your jawline strength`);
    } else if (analysis.jawlineStrength >= styleInfo.jawlineRequired - 15) {
      score += 15;
      matchReasons.push(`Somewhat compatible with your jawline`);
    }

    // Forehead compatibility (20 points max)
    if (styleInfo.foreheadTolerance === 'all') {
      score += 15;
      matchReasons.push(`Works for any forehead width`);
    } else if (styleInfo.foreheadTolerance === 'wide' && analysis.foreheadWidth > 50) {
      score += 15;
      matchReasons.push(`Excellent for your wide forehead`);
    } else if (styleInfo.foreheadTolerance === 'wide' && analysis.foreheadWidth <= 50) {
      score += 5;
    } else if (styleInfo.foreheadTolerance === 'normal' && analysis.foreheadWidth >= 40 && analysis.foreheadWidth <= 60) {
      score += 15;
      matchReasons.push(`Perfect for your forehead proportion`);
    }

    // Hairline position bonus (+10 points max)
    if (analysis.hairlinePosition === 'high' && ['side', 'quiff', 'pompadour'].some(style => styleInfo.name.toLowerCase().includes(style))) {
      score += 10;
      matchReasons.push(`Adds volume for high hairline`);
    }

    // Category diversity bonus
    if (styleInfo.category === 'short' && analysis.faceShape === 'square') {
      score += 5;
    } else if (styleInfo.category === 'long' && analysis.faceShape === 'heart') {
      score += 5;
    } else if (styleInfo.category === 'fade' && analysis.jawlineStrength > 60) {
      score += 5;
    }

    // Cap at 100
    score = Math.min(100, score);

    scores.set(styleId, score);
    reasons.set(styleId, matchReasons);
  });

  // Get top 5 recommendations
  const topRecommendations: RecommendedStyle[] = Array.from(scores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([styleId, score]) => {
      const style = hairstyleData[styleId];
      const hairstyle = allHairstyles.find(h => h.id === styleId);

      return {
        styleId,
        name: style.name,
        category: style.category,
        matchScore: Math.round(score),
        reasonsForMatch: reasons.get(styleId) || [],
      };
    });

  // Generate explanation
  const explanation = generateExplanation(analysis, topRecommendations[0]);

  // Suggest color
  const suggestedColor = colorRecommendations[analysis.faceShape];

  return {
    topRecommendations,
    explanation,
    suggestedColor,
  };
}

/**
 * Generate human-readable explanation for recommendations
 */
function generateExplanation(analysis: FacialAnalysis, topStyle: RecommendedStyle): string {
  const faceShapeDesc = {
    oval: 'a balanced oval shape, which is considered the most versatile face shape',
    round: 'a round face shape, which benefits from styles that add height and definition',
    square: 'a square face shape, which benefits from styles that soften angular features',
    heart: 'a heart-shaped face with a wider forehead, which benefits from styles that add volume at the crown',
    long: 'a long face shape, which benefits from styles that add width and balance',
    diamond: 'a diamond face shape, which benefits from styles that balance the cheekbones',
  };

  const jawlineDesc = {
    strong: 'your strong jawline can support more angular and minimal styles',
    moderate: 'your moderate jawline works well with balanced styles',
    soft: 'your softer jawline benefits from styles that add definition and structure',
  };

  const jawlineLevel = analysis.jawlineStrength > 60 ? 'strong' : analysis.jawlineStrength > 40 ? 'moderate' : 'soft';
  const forehead = analysis.foreheadWidth > 60 ? 'wide' : analysis.foreheadWidth > 40 ? 'normal' : 'narrow';

  let explanation = `Based on deep facial analysis, you have ${faceShapeDesc[analysis.faceShape]}. ${jawlineDesc[jawlineLevel]}. `;
  explanation += `Your ${forehead} forehead and ${analysis.hairlinePosition} hairline position suggest styles that work with these proportions. `;
  explanation += `The top recommendation, "${topStyle.name}", scores ${topStyle.matchScore}% compatibility because it complements your specific facial features.`;

  return explanation;
}

/**
 * Get detailed styling advice
 */
export function getDetailedStylingAdvice(analysis: FacialAnalysis): string {
  let advice = '💡 **Personalized Styling Advice:**\n\n';

  advice += `**Face Shape: ${analysis.faceShape.toUpperCase()}**\n`;
  advice += `- This face shape pairs well with styles that emphasize your natural proportions.\n`;

  if (analysis.jawlineStrength > 60) {
    advice += `**Strong Jawline:** Consider styles that showcase this feature, like slicked-back or fades.\n`;
  } else {
    advice += `**Softer Jawline:** Styles with texture and volume add definition to your face.\n`;
  }

  if (analysis.foreheadWidth > 60) {
    advice += `**Wide Forehead:** Side parts, quiffs, and pompadours help balance proportions.\n`;
  }

  if (analysis.hairlinePosition === 'high') {
    advice += `**High Hairline:** Styles with volume on top or longer hair help balance the forehead.\n`;
  } else if (analysis.hairlinePosition === 'low') {
    advice += `**Low Hairline:** Shorter styles work great and keep the look clean.\n`;
  }

  return advice;
}
