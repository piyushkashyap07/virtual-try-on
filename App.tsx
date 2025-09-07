
import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { ResultDisplay } from './components/ResultDisplay';
import { MultiAngleResults } from './components/MultiAngleResults';
import { AuthModal } from './components/AuthModal';
import { UserProfile } from './components/UserProfile';
import { ReferenceImageUploader } from './components/ReferenceImageUploader';
import { tryOn } from './services/geminiService';
import { ImageState } from './types';

const App: React.FC = () => {
  // Get API URL from environment variables
  const API_URL = 'https://carefree-solace-production.up.railway.app';
  
  const [personImage, setPersonImage] = useState<ImageState | null>(null);
  const [garmentImage, setGarmentImage] = useState<ImageState | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [multiAngleResults, setMultiAngleResults] = useState<{
    front?: string;
    back?: string;
    side?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Authentication state
  const [user, setUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showReferenceUploader, setShowReferenceUploader] = useState(false);

  // Check for existing authentication on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Fetch full user data including reference images from server
        fetchUserProfile(token);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Fetch complete user profile from server
  const fetchUserProfile = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setUser(result.user);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  // Authentication handlers
  const handleAuthSuccess = useCallback((token: string, userData: any) => {
    setUser(userData);
    setIsAuthModalOpen(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setShowProfile(false);
  }, []);

  const handleUpdateProfile = useCallback(async (data: { username?: string; email?: string }) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const response = await fetch('http://localhost:5000/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      const result = await response.json();
      const updatedUser = { ...user, ...result.user };
      setUser(updatedUser);
      
      // Store only essential data in localStorage
      const userForStorage = {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        tryOnHistory: updatedUser.tryOnHistory,
        favorites: updatedUser.favorites,
        referenceImages: updatedUser.referenceImages ? { uploadedAt: updatedUser.referenceImages.uploadedAt } : null
      };
      localStorage.setItem('user', JSON.stringify(userForStorage));
    } else {
      throw new Error('Failed to update profile');
    }
  }, [user]);

  const handleReferenceImagesUpload = useCallback(async (fullLengthImage: string, passportImage: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('Please login to upload reference images');
    }

    try {
      console.log('Uploading reference images...');
      const response = await fetch(`${API_URL}/api/auth/reference-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fullLengthImage, passportImage })
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        
        // Update user state without storing large images in localStorage
        const updatedUser = { ...user, referenceImages: result.user.referenceImages };
        setUser(updatedUser);
        
        // Store only essential user data in localStorage (without large images)
        const userForStorage = {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          tryOnHistory: updatedUser.tryOnHistory,
          favorites: updatedUser.favorites,
          // Don't store reference images in localStorage due to size
          referenceImages: { uploadedAt: result.user.referenceImages.uploadedAt }
        };
        localStorage.setItem('user', JSON.stringify(userForStorage));
        
        setShowReferenceUploader(false);
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        throw new Error(errorData.message || 'Failed to upload reference images');
      }
    } catch (error) {
      console.error('Reference images upload error:', error);
      throw error;
    }
  }, [user]);

  const handleTryOn = useCallback(async () => {
    if (!garmentImage) {
      setError('Please upload a garment image.');
      return;
    }

    // For authenticated users, check if they have reference images
    if (user && !user.referenceImages?.fullLengthImage && !personImage) {
      setError('Please upload your photo or set up reference images in your profile.');
      return;
    }

    // For non-authenticated users, require person image
    if (!user && !personImage) {
      setError('Please upload both a person and a garment image.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResultImage(null);
    setMultiAngleResults(null);

    try {
      let generatedImage: string;
      let multiAngleData: any = null;
      
      if (user) {
        // Use backend API for authenticated users
        const token = localStorage.getItem('token');
        const useReferenceImages = user.referenceImages?.fullLengthImage && !personImage;
        
        const response = await fetch(`${API_URL}/api/tryon/create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            personImage: personImage?.base64 || null,
            garmentImage: garmentImage.base64,
            garmentDescription: 'Multi-angle virtual try-on',
            useReferenceImages
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create try-on');
        }

        const data = await response.json();
        generatedImage = data.tryOn.resultImage;
        multiAngleData = data.tryOn.multiAngleResults;
        
        // Update user data to reflect new try-on
        setUser({ ...user, tryOnHistory: [...user.tryOnHistory, data.tryOn] });
      } else {
        // Use direct Gemini API for non-authenticated users (single image only)
        generatedImage = await tryOn(
          personImage!.base64,
          personImage!.file.type,
          garmentImage.base64,
          garmentImage.file.type
        );
      }
      
      setResultImage(generatedImage);
      setMultiAngleResults(multiAngleData);
    } catch (e) {
      console.error(e);
      setError('Failed to generate the try-on image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [personImage, garmentImage, user]);

  const isButtonDisabled = !garmentImage || isLoading || 
    (!user && !personImage) || 
    (user && !user.referenceImages?.fullLengthImage && !personImage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 font-sans">
      <Header 
        user={user}
        onLoginClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      
      <main className="container mx-auto px-4 py-8">
        {showProfile && user ? (
          <div className="max-w-2xl mx-auto">
            <UserProfile 
              user={user}
              onLogout={handleLogout}
              onUpdateProfile={handleUpdateProfile}
              onUploadReferenceImages={() => setShowReferenceUploader(true)}
            />
            <div className="mt-6 text-center">
              <button
                onClick={() => setShowProfile(false)}
                className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Back to Try-On
              </button>
            </div>
          </div>
        ) : (
          <>
            {user && (
              <div className="text-center mb-6">
                <button
                  onClick={() => setShowProfile(true)}
                  className="bg-indigo-500 text-white px-6 py-2 rounded-lg hover:bg-indigo-600 transition-colors mr-4"
                >
                  View Profile ({user.tryOnHistory.length} try-ons)
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {user && user.referenceImages?.fullLengthImage ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center text-center">
                  <h3 className="text-2xl font-bold mb-2 text-gray-800 dark:text-gray-100">Using Your Reference Image</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    We'll use your saved reference image for this try-on
                  </p>
                  <div className="w-full h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <img 
                      src={`data:image/jpeg;base64,${user.referenceImages.fullLengthImage}`} 
                      alt="Reference Image" 
                      className="w-full h-full object-cover rounded-lg" 
                    />
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => setShowReferenceUploader(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      Update Reference Images
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      onClick={() => setPersonImage(null)}
                      className="text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      Upload Different Photo
                    </button>
                  </div>
                </div>
              ) : (
                <ImageUploader
                  id="person-uploader"
                  title={user ? "Your Image (Optional)" : "Your Image"}
                  description={user ? "Upload a photo or set up reference images in your profile" : "Upload a clear, full-body photo."}
                  onImageSelect={setPersonImage}
                />
              )}
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
            
            {multiAngleResults ? (
              <MultiAngleResults 
                multiAngleResults={multiAngleResults}
                garmentImage={garmentImage.base64}
                isLoading={isLoading}
              />
            ) : (
              <ResultDisplay 
                isLoading={isLoading} 
                resultImage={resultImage} 
              />
            )}
          </>
        )}
      </main>
      
      <footer className="text-center py-6 text-sm text-gray-500">
        <p>Powered by Gemini API {user && '• Your try-ons are saved!'}</p>
      </footer>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        apiUrl={API_URL}
      />

      {/* Reference Image Uploader Modal */}
      {showReferenceUploader && (
        <ReferenceImageUploader
          onImagesUploaded={handleReferenceImagesUpload}
          onSkip={() => setShowReferenceUploader(false)}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default App;
