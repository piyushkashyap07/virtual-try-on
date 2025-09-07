import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface ReferenceImageUploaderProps {
  onImagesUploaded: (fullLengthImage: string, passportImage: string) => void;
  onSkip: () => void;
  isLoading?: boolean;
}

export const ReferenceImageUploader: React.FC<ReferenceImageUploaderProps> = ({ 
  onImagesUploaded, 
  onSkip, 
  isLoading = false 
}) => {
  const [fullLengthImage, setFullLengthImage] = useState<string | null>(null);
  const [passportImage, setPassportImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove the data URI prefix
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFileChange = useCallback(async (file: File | null, type: 'fullLength' | 'passport') => {
    if (file && file.type.startsWith('image/')) {
      try {
        const base64 = await fileToBase64(file);
        if (type === 'fullLength') {
          setFullLengthImage(base64);
        } else {
          setPassportImage(base64);
        }
      } catch (error) {
        console.error("Error processing file:", error);
      }
    }
  }, []);

  const handleUpload = async () => {
    if (fullLengthImage && passportImage) {
      try {
        setError(null);
        await onImagesUploaded(fullLengthImage, passportImage);
      } catch (error: any) {
        console.error('Error uploading reference images:', error);
        setError(error.message || 'Failed to upload reference images');
      }
    }
  };

  const handleDragEnter = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(type);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: 'fullLength' | 'passport') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(null);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0], type);
    }
  };

  const ImageUploadArea = ({ 
    type, 
    title, 
    description, 
    image, 
    setImage 
  }: {
    type: 'fullLength' | 'passport';
    title: string;
    description: string;
    image: string | null;
    setImage: (image: string | null) => void;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4">
      <h4 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">{title}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      
      <input
        type="file"
        id={`${type}-upload`}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null, type)}
      />
      
      <label
        htmlFor={`${type}-upload`}
        onDragEnter={(e) => handleDragEnter(e, type)}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, type)}
        className={`w-full h-48 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragging === type 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-gray-700' 
            : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
        }`}
      >
        {image ? (
          <img 
            src={`data:image/jpeg;base64,${image}`} 
            alt={title} 
            className="w-full h-full object-cover rounded-lg" 
          />
        ) : (
          <div className="text-center">
            <UploadIcon className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <span className="text-sm font-medium text-indigo-600">Click to upload</span>
            <span className="text-xs text-gray-500 dark:text-gray-400"> or drag and drop</span>
          </div>
        )}
      </label>
      
      {image && (
        <button
          onClick={() => setImage(null)}
          className="mt-2 text-xs text-red-500 hover:text-red-700"
        >
          Remove image
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Upload Your Reference Images
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Upload these images once, and we'll use them for all your future virtual try-ons!
            </p>
          </div>

          {/* Image Upload Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <ImageUploadArea
              type="fullLength"
              title="Full Length Photo"
              description="Upload a clear, full-body photo showing your complete figure"
              image={fullLengthImage}
              setImage={setFullLengthImage}
            />
            
            <ImageUploadArea
              type="passport"
              title="Passport Size Photo"
              description="Upload a clear headshot photo (passport size recommended)"
              image={passportImage}
              setImage={setPassportImage}
            />
          </div>

          {/* Benefits */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 mb-6">
            <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-2">
              Why upload reference images?
            </h4>
            <ul className="text-sm text-indigo-700 dark:text-indigo-300 space-y-1">
              <li>• Faster try-on generation (no need to upload your photo each time)</li>
              <li>• Better AI accuracy with consistent reference images</li>
              <li>• Seamless experience for future virtual try-ons</li>
            </ul>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={onSkip}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Skip for Now
            </button>
            
            <button
              onClick={handleUpload}
              disabled={!fullLengthImage || !passportImage || isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Uploading...' : 'Save Reference Images'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
