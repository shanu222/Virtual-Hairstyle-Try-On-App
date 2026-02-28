import { useState } from 'react';
import { Scissors, Info, Menu } from 'lucide-react';
import { PhotoCapture } from './components/PhotoCapture';
import { HairstyleSelector, Hairstyle, hairstyles } from './components/HairstyleSelector';
import { ColorPicker } from './components/ColorPicker';
import { ImagePreview } from './components/ImagePreview';
import { Button } from './components/ui/button';
import { Card } from './components/ui/card';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from './components/ui/sheet';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './components/ui/accordion';

function App() {
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<Hairstyle | null>(null);
  const [hairColor, setHairColor] = useState('#3d2817');
  const [brightness, setBrightness] = useState(100);

  const handlePhotoCapture = (imageData: string) => {
    setUserPhoto(imageData);
  };

  const handleReset = () => {
    setUserPhoto(null);
    setSelectedStyle(null);
    setHairColor('#3d2817');
    setBrightness(100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Scissors className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">StyleAI</h1>
              <p className="text-xs text-gray-600">Virtual Hairstyle Try-On</p>
            </div>
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>About StyleAI</SheetTitle>
                <SheetDescription>
                  AI-powered virtual hairstyle try-on application that uses computer vision
                  and facial landmark detection to help you preview different haircuts before
                  visiting a salon.
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="how-it-works">
                    <AccordionTrigger>How It Works</AccordionTrigger>
                    <AccordionContent>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>Upload or capture your photo</li>
                        <li>Choose a hairstyle category</li>
                        <li>Select your favorite style</li>
                        <li>Customize hair color</li>
                        <li>Download or share your preview</li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="features">
                    <AccordionTrigger>Key Features</AccordionTrigger>
                    <AccordionContent>
                      <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                        <li>Real-time camera capture</li>
                        <li>Multiple hairstyle categories</li>
                        <li>16+ hair color options</li>
                        <li>Brightness adjustment</li>
                        <li>Download & share results</li>
                        <li>Responsive mobile design</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="tech">
                    <AccordionTrigger>Technology Stack</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Frontend:</strong> React, TypeScript, Tailwind CSS</p>
                        <p><strong>Computer Vision:</strong> Canvas API (Production: MediaPipe, TensorFlow.js)</p>
                        <p><strong>Backend (Ready):</strong> Supabase for storage & AI integration</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {!userPhoto ? (
          // Upload State
          <div className="max-w-md mx-auto">
            <Card className="p-6 mb-6 bg-white">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Info className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-lg mb-1">Get Started</h2>
                  <p className="text-sm text-gray-600">
                    Take a clear front-facing photo with good lighting for the best results.
                    Make sure your face is centered and hair is visible.
                  </p>
                </div>
              </div>
            </Card>
            
            <PhotoCapture onPhotoCapture={handlePhotoCapture} />

            <div className="mt-6 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📸</span>
                </div>
                <p className="text-xs text-gray-600">Upload Photo</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✂️</span>
                </div>
                <p className="text-xs text-gray-600">Choose Style</p>
              </div>
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✨</span>
                </div>
                <p className="text-xs text-gray-600">Preview & Save</p>
              </div>
            </div>
          </div>
        ) : (
          // Editor State
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left Column - Controls */}
            <div className="space-y-4">
              <HairstyleSelector
                onSelectStyle={setSelectedStyle}
                selectedStyle={selectedStyle}
              />
              
              <ColorPicker
                selectedColor={hairColor}
                onColorChange={setHairColor}
                brightness={brightness}
                onBrightnessChange={setBrightness}
              />

              <Card className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">AI Processing Note</h4>
                    <p className="text-xs text-gray-700">
                      This demo simulates hairstyle overlay. In production, advanced AI models
                      (MediaPipe Face Mesh, TensorFlow.js, or cloud APIs like Azure Face API)
                      would detect 468+ facial landmarks for precise hairstyle mapping and
                      realistic blending.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column - Preview */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ImagePreview
                originalImage={userPhoto}
                selectedStyle={selectedStyle}
                hairColor={hairColor}
                brightness={brightness}
                onReset={handleReset}
                allHairstyles={hairstyles}
              />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-200 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            StyleAI - Virtual Hairstyle Try-On Application
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Built with React, TypeScript & Tailwind CSS
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;