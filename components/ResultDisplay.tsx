
import React from 'react';
import { SpinnerIcon } from './icons/SpinnerIcon';

interface ResultDisplayProps {
  isLoading: boolean;
  resultImage: string | null;
}

const loadingMessages = [
  "Warming up the AI stylist...",
  "Tailoring the fit...",
  "Matching the pixels...",
  "Generating your new look...",
  "Almost ready to reveal...",
];

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ isLoading, resultImage }) => {
  const [message, setMessage] = React.useState(loadingMessages[0]);

  React.useEffect(() => {
    if (isLoading) {
      const intervalId = setInterval(() => {
        setMessage(prev => {
          const currentIndex = loadingMessages.indexOf(prev);
          const nextIndex = (currentIndex + 1) % loadingMessages.length;
          return loadingMessages[nextIndex];
        });
      }, 2500);
      return () => clearInterval(intervalId);
    }
  }, [isLoading]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-2xl mx-auto min-h-[400px] flex flex-col items-center justify-center">
      <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Your Virtual Try-On</h3>
      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        {isLoading ? (
          <div className="text-center">
            <SpinnerIcon className="w-16 h-16 text-indigo-500 mx-auto" />
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">{message}</p>
          </div>
        ) : resultImage ? (
          <img src={`data:image/jpeg;base64,${resultImage}`} alt="Virtual Try-On Result" className="w-full h-full object-contain rounded-lg" />
        ) : (
          <p className="text-gray-500 dark:text-gray-400">Your generated image will appear here.</p>
        )}
      </div>
    </div>
  );
};
