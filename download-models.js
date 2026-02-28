// Script to download face-api.js models to local public/models directory
// Run this once: node download-models.js

import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.12/model/';
const MODELS_DIR = path.join(__dirname, 'public', 'models');

const MODEL_FILES = [
  // Tiny Face Detector
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  
  // Face Landmarks 68
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  
  // Face Recognition
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
];

// Ensure models directory exists
if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  console.log(`✓ Created directory: ${MODELS_DIR}`);
}

// Download function
function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destination);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      } else if (response.statusCode === 302 || response.statusCode === 301) {
        // Handle redirects
        file.close();
        fs.unlinkSync(destination);
        downloadFile(response.headers.location, destination).then(resolve).catch(reject);
      } else {
        file.close();
        fs.unlinkSync(destination);
        reject(new Error(`Failed to download: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(destination);
      reject(err);
    });
  });
}

// Download all models
async function downloadModels() {
  console.log('🚀 Starting face-api.js model download...\n');
  
  for (const fileName of MODEL_FILES) {
    const url = MODEL_BASE_URL + fileName;
    const destination = path.join(MODELS_DIR, fileName);
    
    // Skip if already exists
    if (fs.existsSync(destination)) {
      console.log(`⏭️  Skipping ${fileName} (already exists)`);
      continue;
    }
    
    try {
      console.log(`⬇️  Downloading ${fileName}...`);
      await downloadFile(url, destination);
      console.log(`✅ Downloaded ${fileName}`);
    } catch (error) {
      console.error(`❌ Failed to download ${fileName}: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Model download complete!');
  console.log('Models saved to:', MODELS_DIR);
}

downloadModels().catch(console.error);
