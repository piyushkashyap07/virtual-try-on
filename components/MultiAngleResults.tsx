import React, { useState } from 'react';

interface MultiAngleResultsProps {
  multiAngleResults: {
    front?: string;
    back?: string;
    side?: string;
  };
  garmentImage: string;
  isLoading?: boolean;
}

export const MultiAngleResults: React.FC<MultiAngleResultsProps> = ({ 
  multiAngleResults, 
  garmentImage, 
  isLoading = false 
}) => {
  const [selectedAngle, setSelectedAngle] = useState<'front' | 'back' | 'side'>('front');

  const angles = [
    { key: 'front', label: 'Front View', icon: '👤' },
    { key: 'back', label: 'Back View', icon: '👥' },
    { key: 'side', label: 'Side View', icon: '👤' }
  ];

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-4xl mx-auto">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">
          Generating Multi-Angle Try-On
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {angles.map((angle) => (
            <div key={angle.key} className="text-center">
              <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center mb-4">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-2"></div>
                  <p className="text-gray-600 dark:text-gray-300">Generating {angle.label}...</p>
                </div>
              </div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200">
                {angle.icon} {angle.label}
              </h4>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-6xl mx-auto">
      <h3 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100 text-center">
        Multi-Angle Virtual Try-On Results
      </h3>
      
      {/* Angle Selection Tabs */}
      <div className="flex justify-center mb-6">
        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-1 flex">
          {angles.map((angle) => (
            <button
              key={angle.key}
              onClick={() => setSelectedAngle(angle.key as 'front' | 'back' | 'side')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                selectedAngle === angle.key
                  ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {angle.icon} {angle.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Selected Angle Result */}
        <div className="text-center">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            {angles.find(a => a.key === selectedAngle)?.icon} {angles.find(a => a.key === selectedAngle)?.label}
          </h4>
          <div className="w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            {multiAngleResults[selectedAngle] ? (
              <img 
                src={`data:image/jpeg;base64,${multiAngleResults[selectedAngle]}`} 
                alt={`${selectedAngle} view`}
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p className="text-lg mb-2">⚠️</p>
                <p>{selectedAngle.charAt(0).toUpperCase() + selectedAngle.slice(1)} view not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Garment Reference */}
        <div className="text-center">
          <h4 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
            👕 Garment Reference
          </h4>
          <div className="w-full h-96 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={`data:image/jpeg;base64,${garmentImage}`} 
              alt="Garment"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      </div>

      {/* Thumbnail Gallery */}
      <div className="grid grid-cols-3 gap-4">
        {angles.map((angle) => (
          <div key={angle.key} className="text-center">
            <button
              onClick={() => setSelectedAngle(angle.key as 'front' | 'back' | 'side')}
              className={`w-full p-2 rounded-lg transition-all duration-200 ${
                selectedAngle === angle.key
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-500'
                  : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              <div className="w-full h-24 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                {multiAngleResults[angle.key] ? (
                  <img 
                    src={`data:image/jpeg;base64,${multiAngleResults[angle.key]}`} 
                    alt={`${angle.key} view`}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="text-gray-400 text-xs">
                    <p>⚠️</p>
                    <p>Not available</p>
                  </div>
                )}
              </div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {angle.icon} {angle.label}
              </p>
            </button>
          </div>
        ))}
      </div>

      {/* Download Actions */}
      <div className="mt-6 text-center">
        <div className="flex justify-center gap-4">
          {angles.map((angle) => (
            multiAngleResults[angle.key] && (
              <button
                key={angle.key}
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = `data:image/jpeg;base64,${multiAngleResults[angle.key]}`;
                  link.download = `try-on-${angle.key}-view.jpg`;
                  link.click();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                Download {angle.label}
              </button>
            )
          ))}
        </div>
      </div>
    </div>
  );
};
