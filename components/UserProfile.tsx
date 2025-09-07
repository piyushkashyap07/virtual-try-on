import React, { useState } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  tryOnHistory: any[];
  favorites: any[];
}

interface UserProfileProps {
  user: User;
  onLogout: () => void;
  onUpdateProfile: (data: { username?: string; email?: string }) => Promise<void>;
  onUploadReferenceImages: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onLogout, onUpdateProfile, onUploadReferenceImages }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    username: user.username,
    email: user.email
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdateProfile(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      username: user.username,
      email: user.email
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Profile</h3>
        <button
          onClick={onLogout}
          className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
        >
          Logout
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Username
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            />
          ) : (
            <p className="text-gray-800 dark:text-gray-200">{user.username}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          {isEditing ? (
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-100"
            />
          ) : (
            <p className="text-gray-800 dark:text-gray-200">{user.email}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {user.tryOnHistory.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Try-Ons</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {user.favorites.length}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Favorites</p>
          </div>
        </div>

        {/* Reference Images Section */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">Reference Images</h4>
          {user.referenceImages?.fullLengthImage ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={`data:image/jpeg;base64,${user.referenceImages.fullLengthImage}`} 
                    alt="Full Length" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Full Length Image</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Uploaded {user.referenceImages.uploadedAt ? new Date(user.referenceImages.uploadedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                  <img 
                    src={`data:image/jpeg;base64,${user.referenceImages.passportImage}`} 
                    alt="Passport" 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Passport Image</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Uploaded {user.referenceImages.uploadedAt ? new Date(user.referenceImages.uploadedAt).toLocaleDateString() : 'Recently'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">No reference images uploaded</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Upload reference images to skip uploading your photo for each try-on
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-4">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-gray-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-all duration-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50 transition-all duration-300"
              >
                Edit Profile
              </button>
              <button
                onClick={onUploadReferenceImages}
                className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-all duration-300"
              >
                {user.referenceImages?.fullLengthImage ? 'Update' : 'Upload'} Reference Images
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
