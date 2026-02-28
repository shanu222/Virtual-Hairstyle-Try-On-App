import { Card } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
}

const hairColors = [
  { name: 'Black', value: '#1a1a1a' },
  { name: 'Dark Brown', value: '#3d2817' },
  { name: 'Brown', value: '#6b4423' },
  { name: 'Light Brown', value: '#8b6f47' },
  { name: 'Blonde', value: '#e6c294' },
  { name: 'Platinum', value: '#f5f5dc' },
  { name: 'Red', value: '#a0302f' },
  { name: 'Auburn', value: '#a52a2a' },
  { name: 'Burgundy', value: '#800020' },
  { name: 'Pink', value: '#ff69b4' },
  { name: 'Purple', value: '#8b7ba8' },
  { name: 'Blue', value: '#4682b4' },
  { name: 'Green', value: '#556b2f' },
  { name: 'Gray', value: '#808080' },
  { name: 'Silver', value: '#c0c0c0' },
  { name: 'White', value: '#f0f0f0' },
];

export function ColorPicker({
  selectedColor,
  onColorChange,
  brightness,
  onBrightnessChange,
}: ColorPickerProps) {
  return (
    <Card className="w-full p-4">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold mb-3 block">Hair Color</Label>
          <div className="grid grid-cols-8 gap-2">
            {hairColors.map((color) => (
              <button
                key={color.value}
                onClick={() => onColorChange(color.value)}
                className={`aspect-square rounded-full transition-all ${
                  selectedColor === color.value
                    ? 'ring-4 ring-blue-500 ring-offset-2 scale-110'
                    : 'hover:scale-110 ring-2 ring-gray-200'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              >
                {selectedColor === color.value && (
                  <span className="text-white text-xs drop-shadow-lg">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="brightness" className="text-sm">
              Brightness
            </Label>
            <span className="text-sm text-gray-600">{brightness}%</span>
          </div>
          <Slider
            id="brightness"
            min={50}
            max={150}
            step={5}
            value={[brightness]}
            onValueChange={(values) => onBrightnessChange(values[0])}
            className="w-full"
          />
        </div>

        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <div
            className="w-8 h-8 rounded-full border-2 border-gray-300"
            style={{
              backgroundColor: selectedColor,
              filter: `brightness(${brightness}%)`,
            }}
          />
          <div className="flex-1">
            <p className="text-xs text-gray-600">Preview</p>
            <p className="text-sm font-medium">
              {hairColors.find((c) => c.value === selectedColor)?.name || 'Custom'}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}
