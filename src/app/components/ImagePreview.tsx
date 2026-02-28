import { useEffect, useRef, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, RotateCcw, ZoomIn, ZoomOut, Share2 } from 'lucide-react';
import { Hairstyle } from './HairstyleSelector';

interface ImagePreviewProps {
  originalImage: string;
  selectedStyle: Hairstyle | null;
  hairColor: string;
  brightness: number;
  onReset: () => void;
}

export function ImagePreview({
  originalImage,
  selectedStyle,
  hairColor,
  brightness,
  onReset,
}: ImagePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !originalImage) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsProcessing(true);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Simulate hairstyle overlay
      if (selectedStyle) {
        // In production, this would use AI model to detect face landmarks
        // and overlay hairstyle accordingly
        // For now, we'll simulate by overlaying a semi-transparent colored region
        simulateHairstyleOverlay(ctx, img.width, img.height);
      }

      setIsProcessing(false);
    };
    img.onerror = () => {
      console.error('Failed to load image');
      setIsProcessing(false);
    };
    img.src = originalImage;
  }, [originalImage, selectedStyle, hairColor, brightness]);

  const simulateHairstyleOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    // Simulate hair region (top portion of image)
    // In production, this would be replaced with actual AI face detection
    // and precise hair boundary detection
    
    ctx.save();
    
    // Create a gradient to simulate natural hair blending
    const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    gradient.addColorStop(0, hairColor);
    gradient.addColorStop(1, `${hairColor}00`);
    
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = gradient;
    
    // Draw elliptical shape for hair region
    ctx.beginPath();
    ctx.ellipse(
      width / 2,
      height * 0.2,
      width * 0.4,
      height * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    
    // Apply brightness adjustment
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

  return (
    <Card className="w-full p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Preview</h3>
          {isProcessing && (
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Processing...
            </div>
          )}
        </div>

        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <div
            className="overflow-auto max-h-[60vh]"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
          >
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
            />
          </div>
          
          {!selectedStyle && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <p className="text-white text-center px-4">
                Select a hairstyle to preview
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom(Math.min(2, zoom + 0.25))}
            disabled={zoom >= 2}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-600 mx-2">{Math.round(zoom * 100)}%</span>
          
          <div className="flex-1" />
          
          <Button variant="outline" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>

        {selectedStyle && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>AI Note:</strong> This is a simulation. In production, facial landmarks
              would be detected using computer vision (MediaPipe, TensorFlow.js, or cloud APIs)
              to precisely overlay the hairstyle on your face.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
