import { FacialAnalysis } from './facialAnalysisService';
import { Hairstyle } from '../app/components/HairstyleSelector';

/**
 * Generate realistic hairstyle preview using OpenAI DALL-E 3
 */
export async function generateRealisticPreview(
  originalImageData: string,
  selectedHairstyle: Hairstyle,
  faceAnalysis: FacialAnalysis,
  hairColor: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment.');
  }

  // Create detailed prompt based on facial analysis and hairstyle
  const prompt = createDetailedPrompt(selectedHairstyle, faceAnalysis, hairColor);

  console.log('🎨 Generating realistic preview with prompt:', prompt);

  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        style: 'natural',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      throw new Error(
        errorData.error?.message || `Failed to generate preview (${response.status})`
      );
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error('Invalid response from OpenAI API');
    }

    const imageUrl = data.data[0].url;
    console.log('✅ Realistic preview generated successfully');
    
    return imageUrl;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Realistic preview generation failed:', errorMsg);
    throw new Error(`Preview Generation Error: ${errorMsg}`);
  }
}

/**
 * Create a detailed prompt for DALL-E 3 based on facial analysis and selected hairstyle
 */
function createDetailedPrompt(
  hairstyle: Hairstyle,
  faceAnalysis: FacialAnalysis,
  hairColor: string
): string {
  // Convert hex color to color name
  const colorName = hexToColorName(hairColor);

  // Map face shape to description
  const faceShapeDesc = getFaceShapeDescription(faceAnalysis.faceShape);

  // Hairline position context
  const hairlineContext =
    faceAnalysis.hairlinePosition === 'high'
      ? 'with a higher hairline'
      : faceAnalysis.hairlinePosition === 'low'
      ? 'with a lower hairline'
      : 'with a balanced hairline';

  // Jawline context
  const jawlineContext =
    faceAnalysis.jawlineStrength > 70
      ? 'with a strong, defined jawline'
      : faceAnalysis.jawlineStrength > 40
      ? 'with a moderate jawline'
      : 'with a softer jawline';

  // Hair category to style description
  const styleDescription = getStyleDescription(hairstyle.category);

  // Build comprehensive prompt
  const prompt = `
Create a professional, realistic portrait photograph of a person with a ${faceShapeDesc} face shape, ${hairlineContext}, and ${jawlineContext}. 

The person should have a ${colorName} ${styleDescription} hairstyle styled as: ${hairstyle.name}.

Requirements:
- Photorealistic quality, like a professional headshot
- Natural lighting and soft shadows
- The hairstyle should be professionally styled and well-groomed
- Clear facial features, looking directly at camera with a neutral or subtle smile
- Professional studio photography style
- High quality, sharp focus on the face
- Realistic hair texture, volume, and movement
- 1024x1024 square composition, centered portrait
- No watermarks or text
- Modern, professional appearance
- Natural skin tones and realistic coloring

Style context: ${hairstyle.description || 'modern and stylish'}

Generate a single, photorealistic headshot image showing this person with the specified hairstyle.
`;

  return prompt.trim();
}

/**
 * Convert hex color code to readable color name
 */
function hexToColorName(hex: string): string {
  const colorMap: { [key: string]: string } = {
    '#000000': 'black',
    '#1a1a1a': 'very dark brown',
    '#2d1810': 'dark brown',
    '#3d2817': 'medium brown',
    '#5c4033': 'light brown',
    '#704214': 'chestnut brown',
    '#8b6f47': 'medium golden brown',
    '#d4a76a': 'light golden brown',
    '#ffd700': 'golden blonde',
    '#ffcc00': 'blonde',
    '#ff8c00': 'dark orange',
    '#ff6347': 'strawberry blonde',
    '#c63f5f': 'dark red',
    '#800020': 'burgundy',
    '#800080': 'purple',
    '#2f4f7f': 'slate blue',
    '#696969': 'dark gray',
    '#a9a9a9': 'light gray',
  };

  const lowerHex = hex.toLowerCase();
  return colorMap[lowerHex] || 'custom colored';
}

/**
 * Get face shape description for prompt
 */
function getFaceShapeDescription(faceShape: string): string {
  const descriptions: { [key: string]: string } = {
    oval: 'balanced and oval',
    round: 'round and full',
    square: 'square and angular',
    heart: 'heart-shaped',
    long: 'long and rectangular',
    diamond: 'diamond-shaped',
  };

  return descriptions[faceShape.toLowerCase()] || 'well-proportioned';
}

/**
 * Get hairstyle category description for prompt
 */
function getStyleDescription(category: string): string {
  const styles: { [key: string]: string } = {
    short: 'short, modern',
    medium: 'medium-length, versatile',
    long: 'long, flowing',
    wavy: 'wavy and textured',
    curly: 'curly and voluminous',
    straight: 'straight and sleek',
    textured: 'textured and dimensional',
    updo: 'elegant updo',
    bob: 'chic bob-style',
  };

  return styles[category.toLowerCase()] || 'trendy';
}

/**
 * Download image from URL
 */
export async function downloadGeneratedPreview(
  imageUrl: string,
  hairstyleName: string
): Promise<void> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hairstyle-preview-${hairstyleName.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    console.log('✅ Preview downloaded successfully');
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Failed to download preview image');
  }
}

/**
 * Convert image URL to base64 for storage/sharing
 */
export async function imageUrlToBase64(imageUrl: string): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    throw error;
  }
}
