import { useState, useRef } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface PhotoCaptureProps {
  onPhotoCapture: (imageData: string) => void;
}

export function PhotoCapture({ onPhotoCapture }: PhotoCaptureProps) {
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        onPhotoCapture(imageData);
        stopCamera();
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        onPhotoCapture(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  if (showCamera) {
    return (
      <Card className="relative w-full aspect-[3/4] bg-black overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={stopCamera}
              className="rounded-full w-14 h-14 bg-white/20 border-white/40 hover:bg-white/30"
            >
              <X className="w-6 h-6 text-white" />
            </Button>
            <Button
              onClick={capturePhoto}
              size="icon"
              className="rounded-full w-20 h-20 bg-white hover:bg-white/90"
            >
              <div className="w-16 h-16 rounded-full border-4 border-black" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full aspect-[3/4] bg-gradient-to-br from-purple-50 to-blue-50 flex flex-col items-center justify-center gap-6 p-8">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Upload Your Photo</h3>
        <p className="text-sm text-gray-600">
          Take a selfie or upload a photo to try on hairstyles
        </p>
      </div>
      
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button
          onClick={startCamera}
          className="w-full h-14 text-base gap-3"
          variant="default"
        >
          <Camera className="w-5 h-5" />
          Take a Selfie
        </Button>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-14 text-base gap-3"
          variant="outline"
        >
          <Upload className="w-5 h-5" />
          Upload Photo
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </Card>
  );
}
