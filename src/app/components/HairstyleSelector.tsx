import { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';

export interface Hairstyle {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
}

interface HairstyleSelectorProps {
  onSelectStyle: (style: Hairstyle) => void;
  selectedStyle: Hairstyle | null;
}

// Mock hairstyle data - in production, this would come from a database
export const hairstyles: Hairstyle[] = [
  // Short Styles
  { id: '1', name: 'Buzz Cut', category: 'short', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=300&fit=crop', description: 'Clean and minimal' },
  { id: '2', name: 'Crew Cut', category: 'short', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&h=300&fit=crop', description: 'Classic military style' },
  { id: '3', name: 'Short Textured', category: 'short', imageUrl: 'https://images.unsplash.com/photo-1605462863863-10d9e47e15ee?w=300&h=300&fit=crop', description: 'Modern and stylish' },
  { id: '4', name: 'Ivy League', category: 'short', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&h=300&fit=crop', description: 'Professional look' },
  
  // Medium Styles
  { id: '5', name: 'Side Part', category: 'medium', imageUrl: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=300&h=300&fit=crop', description: 'Classic gentleman' },
  { id: '6', name: 'Quiff', category: 'medium', imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=300&h=300&fit=crop', description: 'Volume on top' },
  { id: '7', name: 'Pompadour', category: 'medium', imageUrl: 'https://images.unsplash.com/photo-1617922001439-4a2e6562f328?w=300&h=300&fit=crop', description: 'Retro elegance' },
  { id: '8', name: 'Slick Back', category: 'medium', imageUrl: 'https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=300&h=300&fit=crop', description: 'Sleek and sharp' },
  
  // Long Styles
  { id: '9', name: 'Long Layered', category: 'long', imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop', description: 'Flowing layers' },
  { id: '10', name: 'Man Bun', category: 'long', imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=300&h=300&fit=crop', description: 'Modern bohemian' },
  { id: '11', name: 'Shoulder Length', category: 'long', imageUrl: 'https://images.unsplash.com/photo-1492288991661-058aa541ff43?w=300&h=300&fit=crop', description: 'Versatile style' },
  
  // Fade Styles
  { id: '12', name: 'Low Fade', category: 'fade', imageUrl: 'https://images.unsplash.com/photo-1605462863863-10d9e47e15ee?w=300&h=300&fit=crop', description: 'Subtle transition' },
  { id: '13', name: 'High Fade', category: 'fade', imageUrl: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=300&h=300&fit=crop', description: 'Bold contrast' },
  { id: '14', name: 'Skin Fade', category: 'fade', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=300&h=300&fit=crop', description: 'Ultra clean' },
  { id: '15', name: 'Taper Fade', category: 'fade', imageUrl: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=300&h=300&fit=crop', description: 'Gradual blend' },
  
  // Curly Styles
  { id: '16', name: 'Natural Curls', category: 'curly', imageUrl: 'https://images.unsplash.com/photo-1531891437562-4301cf35b7e4?w=300&h=300&fit=crop', description: 'Embrace texture' },
  { id: '17', name: 'Curly Fade', category: 'curly', imageUrl: 'https://images.unsplash.com/photo-1610216705422-caa3fcb6d158?w=300&h=300&fit=crop', description: 'Curls with fade' },
  { id: '18', name: 'Curly Undercut', category: 'curly', imageUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=300&h=300&fit=crop', description: 'Volume on top' },
  { id: '19', name: 'Defined Curls', category: 'curly', imageUrl: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300&h=300&fit=crop', description: 'Well-groomed curls' },
];

export function HairstyleSelector({ onSelectStyle, selectedStyle }: HairstyleSelectorProps) {
  const [activeCategory, setActiveCategory] = useState('short');

  const categories = [
    { value: 'short', label: 'Short', icon: '✂️' },
    { value: 'medium', label: 'Medium', icon: '💈' },
    { value: 'long', label: 'Long', icon: '🎯' },
    { value: 'fade', label: 'Fade', icon: '⚡' },
    { value: 'curly', label: 'Curly', icon: '🌀' },
  ];

  const filteredStyles = hairstyles.filter(style => style.category === activeCategory);

  return (
    <Card className="w-full p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Choose Hairstyle</h3>
          {selectedStyle && (
            <Badge variant="secondary">{selectedStyle.name}</Badge>
          )}
        </div>

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            {categories.map((cat) => (
              <TabsTrigger
                key={cat.value}
                value={cat.value}
                className="flex flex-col gap-1 py-2 text-xs"
              >
                <span className="text-lg">{cat.icon}</span>
                <span>{cat.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="h-[300px] mt-4">
            <div className="grid grid-cols-2 gap-3">
              {filteredStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => onSelectStyle(style)}
                  className={`relative rounded-lg overflow-hidden transition-all ${
                    selectedStyle?.id === style.id
                      ? 'ring-4 ring-blue-500 ring-offset-2 scale-95'
                      : 'hover:scale-105'
                  }`}
                >
                  <div className="aspect-square bg-gray-200">
                    <img
                      src={style.imageUrl}
                      alt={style.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="text-white text-sm font-medium">{style.name}</p>
                    <p className="text-white/80 text-xs">{style.description}</p>
                  </div>
                  {selectedStyle?.id === style.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </div>
    </Card>
  );
}
