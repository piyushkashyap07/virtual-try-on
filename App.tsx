
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { tryOn } from './services/geminiService';
import { ImageState } from './types';

const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<ImageState | null>(null);
  const [garmentImage, setGarmentImage] = useState<ImageState | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleTryOn = useCallback(async () => {
    if (!personImage || !garmentImage) {
      setError('Please upload both a person and a garment image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);

    try {
      const generatedImage = await tryOn(
        personImage.base64,
        personImage.file.type,
        garmentImage.base64,
        garmentImage.file.type
      );
      setResultImage(generatedImage);
    } catch (e) {
      console.error(e);
      setError('Failed to generate the try-on image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [personImage, garmentImage]);

  const isButtonDisabled = !personImage || !garmentImage || isLoading;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <ImageUploader
            id="person-uploader"
            title="Your Image"
            description="Upload a clear, full-body photo."
            onImageSelect={setPersonImage}
          />
          <ImageUploader
            id="garment-uploader"
            title="Garment Image"
            description="Upload a photo of the clothing item."
            onImageSelect={setGarmentImage}
          />
        </div>

        <div className="text-center mb-8">
          <button
            onClick={handleTryOn}
            disabled={isButtonDisabled}
            className="bg-indigo-600 text-white font-bold py-3 px-12 rounded-lg shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isLoading ? 'Generating...' : 'Virtual Try-On'}
          </button>
        </div>
        
        {error && <p className="text-center text-red-500 mb-4">{error}</p>}
        
        <ResultDisplay 
          isLoading={isLoading} 
          resultImage={resultImage} 
        />
      </main>
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>Powered by Gemini API</p>
      </footer>
    </div>
  );
};

export default App;
