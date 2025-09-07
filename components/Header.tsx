
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md">
      <div className="container mx-auto px-4 py-6 text-center">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
          AI Virtual Try-On
        </h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          See how it looks before you buy.
        </p>
      </div>
    </header>
  );
};
