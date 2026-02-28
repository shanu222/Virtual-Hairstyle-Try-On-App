import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { AlertCircle, Zap, Brain } from 'lucide-react';
import { FacialAnalysis, RecommendedStyle } from '../../services/facialAnalysisService';
import { getDetailedStylingAdvice } from '../../services/hairstyleRecommendationEngine';

interface FacialAnalysisPanelProps {
  analysis: FacialAnalysis | null;
  recommendations: RecommendedStyle[];
  suggestedColor: string;
  isAnalyzing: boolean;
  error: string | null;
}

export function FacialAnalysisPanel({
  analysis,
  recommendations,
  suggestedColor,
  isAnalyzing,
  error,
}: FacialAnalysisPanelProps) {
  const [showDetailedAdvice, setShowDetailedAdvice] = useState(false);

  if (error) {
    return (
      <Card className="w-full p-4 border-red-200 bg-red-50">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900">Analysis Failed</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
            <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-800 space-y-1">
              <p className="font-semibold">✓ Tips to fix this:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Ensure your face is clearly visible (no glasses/hats)</li>
                <li>Face should be centered in the photo</li>
                <li>Good lighting condition (not too dark or bright)</li>
                <li>Face looking directly at camera</li>
                <li>Entire face visible (chin to forehead)</li>
                <li>Check your internet connection (models load from CDN)</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  if (isAnalyzing) {
    return (
      <Card className="w-full p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900">Analyzing Your Face</p>
            <p className="text-sm text-gray-600">Detecting facial landmarks and comparing face shape...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!analysis) {
    return (
      <Card className="w-full p-4 border-dashed border-gray-300">
        <div className="text-center py-4">
          <Brain className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm">Upload a photo to enable AI facial analysis</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Analysis Card */}
      <Card className="w-full p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900">AI Facial Analysis</h3>
            </div>
            <Badge variant="outline" className="bg-white">
              {Math.round(analysis.confidence)}% Confidence
            </Badge>
          </div>

          {/* Face Shape */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Face Shape</p>
              <Badge className="bg-blue-600">{analysis.faceShape.toUpperCase()}</Badge>
            </div>
            <p className="text-xs text-gray-600">
              Your face shape is ideal for styles that complement angular and balanced features.
            </p>
          </div>

          {/* Facial Proportions */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Facial Metrics</p>

            {/* Jawline Strength */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Jawline Strength</span>
                <span className="font-semibold text-gray-900">{Math.round(analysis.jawlineStrength)}/100</span>
              </div>
              <Progress value={analysis.jawlineStrength} className="h-1.5" />
            </div>

            {/* Forehead Width */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Forehead Width</span>
                <span className="font-semibold text-gray-900">{Math.round(analysis.foreheadWidth)}/100</span>
              </div>
              <Progress value={analysis.foreheadWidth} className="h-1.5" />
            </div>

            {/* Hairline Position */}
            <div className="flex items-center justify-between text-xs p-2 bg-white/60 rounded">
              <span className="text-gray-600">Hairline Position</span>
              <Badge variant="secondary">{analysis.hairlinePosition.toUpperCase()}</Badge>
            </div>
          </div>

          {/* Suggested Color */}
          <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg">
            <div
              className="w-6 h-6 rounded-full border-2 border-gray-300"
              style={{ backgroundColor: suggestedColor }}
            />
            <div>
              <p className="text-xs text-gray-600">AI Suggested Hair Color</p>
              <p className="text-sm font-semibold text-gray-900">{suggestedColor}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Top Recommendations */}
      {recommendations.length > 0 && (
        <Card className="w-full p-4">
          <div className="space-y-3">
            <p className="font-semibold text-gray-900">Top Hairstyle Recommendations</p>

            {recommendations.slice(0, 3).map((rec, index) => (
              <div
                key={rec.styleId}
                className="p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{rec.name}</p>
                      <p className="text-xs text-gray-600">{rec.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-blue-600">{rec.matchScore}%</p>
                    <p className="text-xs text-gray-500">Match</p>
                  </div>
                </div>

                {/* Match Reasons */}
                {rec.reasonsForMatch.length > 0 && (
                  <ul className="text-xs text-gray-700 space-y-1 ml-8">
                    {rec.reasonsForMatch.map((reason, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Match Bar */}
                <div className="mt-2">
                  <Progress value={rec.matchScore} className="h-1" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Styling Advice */}
      {showDetailedAdvice && analysis && (
        <Card className="w-full p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-green-900">💡 Personalized Styling Guide</p>
            <div className="text-green-800 whitespace-pre-wrap text-xs">
              {getDetailedStylingAdvice(analysis)}
            </div>
          </div>
        </Card>
      )}

      {/* Toggle Advice Button */}
      {analysis && (
        <button
          onClick={() => setShowDetailedAdvice(!showDetailedAdvice)}
          className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
        >
          {showDetailedAdvice ? 'Hide' : 'Show'} Detailed Styling Advice
        </button>
      )}

      {/* AI Information */}
      <Card className="w-full p-3 bg-gray-50 border-gray-200">
        <p className="text-xs text-gray-600">
          {analysis && 'analysisType' in analysis && (analysis as any).analysisType === 'simplified' ? (
            <>
              ⚠️ <strong>Simplified Analysis:</strong> Using basic detection (full AI models unavailable). Try reloading or use a different browser.
            </>
          ) : (
            <>
              🤖 <strong>Advanced AI:</strong> This analysis uses facial landmark detection to map 468+ key points on your face,
              analyze proportions, and recommend styles tailored to your unique facial structure.
            </>
          )}
        </p>
      </Card>
    </div>
  );
}
