import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, RotateCcw, ZoomIn, ZoomOut, Share2, Eye, EyeOff, Brain, Wand2, X } from 'lucide-react';
import { Hairstyle } from './HairstyleSelector';
import { initializeFaceAPI, analyzeFace, drawFacialLandmarks, FacialAnalysis } from '../../services/facialAnalysisService';
import { generateRecommendations, RecommendedStyle } from '../../services/hairstyleRecommendationEngine';
import { blendHairstyleWithFace, adjustColorBrightness } from '../../services/advancedBlendingService';
import { generateRealisticPreview, downloadGeneratedPreview } from '../../services/realisticPreviewService';
import { FacialAnalysisPanel } from './FacialAnalysisPanel';

interface ImagePreviewProps {
  originalImage: string;
  selectedStyle: Hairstyle | null;
  hairColor: string;
  brightness: number;
  onReset: () => void;
  onTakeNewPhoto: () => void;
  onSelectStyle?: (style: Hairstyle) => void;
  allHairstyles?: Hairstyle[];
}

export function ImagePreview({
  originalImage,
  selectedStyle,
  hairColor,
  brightness,
  onReset,
  onTakeNewPhoto,
  onSelectStyle,
  allHairstyles = [],
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layerCanvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [facialAnalysis, setFacialAnalysis] = useState<FacialAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedStyle[]>([]);
  const [suggestedColor, setSuggestedColor] = useState('#3d2817');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [realisticPreviewUrl, setRealisticPreviewUrl] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Load image (without automatic analysis)
  useEffect(() => {
    if (!canvasRef.current || !originalImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Store image reference for analysis
      imageRef.current = img;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Apply hairstyle overlay if selected and analyzed
      if (selectedStyle) {
        if (facialAnalysis) {
          applyAdvancedHairstyleOverlay(ctx, img.width, img.height);
        } else {
          simulateHairstyleOverlay(ctx, img.width, img.height);
        }
      }

      setIsProcessing(false);
    };

    img.onerror = () => {
      console.error('Failed to load image');
      setAnalysisError('Failed to load image');
      setIsProcessing(false);
    };

    img.src = originalImage;
  }, [originalImage, selectedStyle, hairColor, brightness, facialAnalysis]);

  // Manually trigger facial analysis
  const handleAIAnalyze = async () => {
    if (!imageRef.current) {
      setAnalysisError('Please upload a photo first');
      return;
    }
    await performFacialAnalysis(imageRef.current);
  };

  // Perform facial analysis
  const performFacialAnalysis = async (img: HTMLImageElement) => {
    try {
      setIsAnalyzing(true);
      setAnalysisError(null);

      console.log('Starting facial analysis...');

      // Initialize Face API with better error handling
      try {
        await initializeFaceAPI();
        console.log('Face API initialized');
      } catch (initError) {
        const errorMsg = initError instanceof Error ? initError.message : 'Failed to load AI models';
        console.error('Initialization error:', errorMsg);
        throw new Error(`AI Model Loading: ${errorMsg}`);
      }

      // Analyze face
      const analysis = await analyzeFace(img);
      console.log('Face analysis complete:', analysis);
      setFacialAnalysis(analysis);

      // Generate recommendations
      if (allHairstyles.length > 0) {
        console.log('Generating recommendations...');
        const { topRecommendations, suggestedColor: color } = generateRecommendations(
          analysis,
          allHairstyles
        );
        setRecommendations(topRecommendations);
        setSuggestedColor(color);
        console.log('Recommendations generated:', topRecommendations);

        // Auto-select and apply top recommended hairstyle
        if (topRecommendations.length > 0 && onSelectStyle) {
          const topRecommendation = topRecommendations[0];
          const recommendedHairstyle = allHairstyles.find(h => h.id === topRecommendation.styleId);
          if (recommendedHairstyle) {
            console.log('🎨 Auto-selecting AI recommended hairstyle:', recommendedHairstyle.name, `(${topRecommendation.matchScore}% match)`);
            onSelectStyle(recommendedHairstyle);
          }
        }
      }

      setIsAnalyzing(false);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Facial analysis error:', error);
      setAnalysisError(errorMsg);
      setIsAnalyzing(false);
    }
  };

  // Apply advanced hairstyle overlay with AI blending
  const applyAdvancedHairstyleOverlay = async (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    if (facialAnalysis) {
      // Use AI-powered blending
      try {
        await blendHairstyleWithFace(
          ctx,
          null,
          facialAnalysis,
          hairColor,
          brightness,
          width,
          height
        );
      } catch (error) {
        console.error('Blending error:', error);
        // Fallback to basic overlay
        simulateHairstyleOverlay(ctx, width, height);
      }
    } else {
      // Fallback while analyzing
      simulateHairstyleOverlay(ctx, width, height);
    }

    // Draw landmarks if enabled
    if (showLandmarks && facialAnalysis) {
      drawFacialLandmarks(canvasRef.current!, facialAnalysis, width, height);
    }
  };

  // Fallback hairstyle simulation
  const simulateHairstyleOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    ctx.save();

    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    gradient.addColorStop(0, hairColor);
    gradient.addColorStop(1, `${hairColor}00`);

    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.ellipse(width / 2, height * 0.2, width * 0.4, height * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = (brightness - 100) / 200;
    ctx.fillStyle = brightness > 100 ? '#ffffff' : '#000000';
    ctx.fillRect(0, 0, width, height * 0.5);

    ctx.restore();
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hairstyle-preview-${Date.now()}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/jpeg', 0.95);
  };

  const handleShare = async () => {
    if (!canvasRef.current) return;

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'hairstyle.jpg', { type: 'image/jpeg' });
          
          if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
              files: [file],
              title: 'My Virtual Hairstyle',
              text: 'Check out this hairstyle I tried on!',
            });
          } else {
            alert('Sharing not supported on this device. Use download instead.');
          }
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Generate realistic preview using AI
  const handleGenerateRealisticPreview = async () => {
    if (!facialAnalysis || !selectedStyle || !originalImage) {
      setPreviewError('Please complete facial analysis and select a hairstyle first');
      return;
    }

    try {
      setIsGeneratingPreview(true);
      setPreviewError(null);

      console.log('🎨 Starting realistic preview generation...');
      const previewUrl = await generateRealisticPreview(
        originalImage,
        selectedStyle,
        facialAnalysis,
        hairColor
      );

      setRealisticPreviewUrl(previewUrl);
      console.log('✅ Realistic preview generated:', previewUrl);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to generate preview';
      console.error('Preview generation error:', errorMsg);
      setPreviewError(errorMsg);
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  // Download realistic preview
  const handleDownloadRealisticPreview = async () => {
    if (!realisticPreviewUrl || !selectedStyle) return;

    try {
      await downloadGeneratedPreview(realisticPreviewUrl, selectedStyle.name);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to download';
      setPreviewError(errorMsg);
    }
  };

  // Clear realistic preview
  const handleClearRealisticPreview = () => {
    setRealisticPreviewUrl(null);
    setPreviewError(null);
  };

  return (
    <div className="space-y-4">
      <Card className="w-full p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Preview</h3>
            {(isProcessing || isAnalyzing) && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                {isAnalyzing ? 'Analyzing...' : 'Processing...'}
              </div>
            )}
          </div>

          <div className="relative bg-gray-100 rounded-lg overflow-hidden">
            <div
              className="overflow-auto max-h-[60vh]"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
            >
              <canvas ref={canvasRef} className="w-full h-auto" />
              <canvas ref={layerCanvasRef} className="hidden" />
            </div>

            {!selectedStyle && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <p className="text-white text-center px-4">
                  Select a hairstyle to preview
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Button
              variant="default"
              size="sm"
              onClick={handleAIAnalyze}
              disabled={isAnalyzing || isProcessing}
              className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              title="Analyze face and get personalized recommendations"
            >
              <Brain className="w-4 h-4" />
              {isAnalyzing ? 'Analyzing...' : facialAnalysis ? 'Re-analyze Face' : 'AI Analyze Face'}
            </Button>

            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateRealisticPreview}
              disabled={isGeneratingPreview || !facialAnalysis || !selectedStyle}
              className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              title="Generate realistic AI preview with selected hairstyle"
            >
              <Wand2 className="w-4 h-4" />
              {isGeneratingPreview ? 'Generating (30s)...' : 'Generate Realistic Preview'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onTakeNewPhoto}
              title="Upload or capture a different photo"
            >
              Take New Photo
            </Button>

            <div className="flex-1" />

            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              title="Start over"
            >
              Back to Start
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              disabled={zoom <= 0.5}
              title="Zoom out"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setZoom(Math.min(2, zoom + 0.25))}
              disabled={zoom >= 2}
              title="Zoom in"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">{Math.round(zoom * 100)}%</span>

            {facialAnalysis && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLandmarks(!showLandmarks)}
                className="gap-2"
                title="Toggle facial landmarks"
              >
                {showLandmarks ? (
                  <>
                    <EyeOff className="w-4 h-4" />
                    Hide Landmarks
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4" />
                    Show Landmarks
                  </>
                )}
              </Button>
            )}

            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={handleShare} title="Share preview">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button size="sm" onClick={handleDownload} title="Download preview">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>

          {!facialAnalysis && !isAnalyzing && !analysisError && (
            <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-purple-900 mb-1">
                    🎯 Get Personalized Recommendations
                  </p>
                  <p className="text-xs text-purple-800">
                    Click <strong>"AI Analyze Face"</strong> to:
                  </p>
                  <ul className="text-xs text-purple-800 list-disc list-inside mt-1 space-y-0.5">
                    <li>Detect your face shape and proportions</li>
                    <li>Get AI-powered hairstyle suggestions</li>
                    <li>Receive personalized color recommendations</li>
                    <li>See realistic blending based on your features</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {facialAnalysis && selectedStyle && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-900">
                <strong>✨ AI-Enhanced:</strong> This preview uses advanced facial landmark detection for
                realistic blending based on your {facialAnalysis.faceShape} face shape.
              </p>
            </div>
          )}

          {/* Realistic Preview Section */}
          {realisticPreviewUrl && (
            <div className="space-y-3 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-lg">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-amber-900">✨ Realistic AI Preview</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearRealisticPreview}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="bg-white rounded-lg overflow-hidden border border-amber-200">
                <img
                  src={realisticPreviewUrl}
                  alt={`Realistic preview with ${selectedStyle.name}`}
                  className="w-full h-auto"
                />
              </div>
              <p className="text-xs text-amber-800">
                This is an AI-generated photorealistic preview of how you would look with the <strong>{selectedStyle.name}</strong> hairstyle.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleDownloadRealisticPreview}
                  className="gap-2 flex-1 bg-amber-600 hover:bg-amber-700"
                  title="Download this realistic preview"
                >
                  <Download className="w-4 h-4" />
                  Download Realistic Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateRealisticPreview}
                  disabled={isGeneratingPreview}
                  className="gap-2"
                  title="Try another hairstyle"
                >
                  <Wand2 className="w-4 h-4" />
                  Regenerate
                </Button>
              </div>
            </div>
          )}

          {/* Preview Error */}
          {previewError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-900">
                <strong>Error:</strong> {previewError}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Facial Analysis Panel */}
      <FacialAnalysisPanel
        analysis={facialAnalysis}
        recommendations={recommendations}
        suggestedColor={suggestedColor}
        isAnalyzing={isAnalyzing}
        error={analysisError}
      />
    </div>
  );
}
