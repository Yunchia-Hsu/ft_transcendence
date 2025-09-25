import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../auth/store/auth.store';
import { useLang } from '../../../localization';
import { useUiStore } from '../../../shared/store/ui.store';

export default function Profile() {
  const { t } = useLang();
  const showBanner = useUiStore((s) => s.showBanner);
  
  const {
    userProfile,
    loading,
    error,
    fetchUserProfile,
    updateUserProfile,
  } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    displayname: '',
    avatarUrl: '',
  });

  // Fetch profile on component mount
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Update form data when profile loads
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username,
        displayname: userProfile.displayname || '',
        avatarUrl: userProfile.avatar || '',
      });
    }
  }, [userProfile]);

  const handleSave = async () => {
    try {
      await updateUserProfile({
        username: formData.username,
        displayname: formData.displayname || null,
        avatar: formData.avatarUrl || null,
      });
      setIsEditing(false);
      showBanner(t.profile.messages.saveSuccess, 'success');
    } catch (e: any) {
      showBanner(e?.message || t.profile.messages.saveError, 'error');
    }
  };

  const handleCancel = () => {
    if (userProfile) {
      setFormData({
        username: userProfile.username,
        displayname: userProfile.displayname || '',
        avatarUrl: userProfile.avatar || '',
      });
    }
    setIsEditing(false);
  };

  if (!userProfile && loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load profile</p>
          <button 
            onClick={fetchUserProfile}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{t.profile.title}</h1>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {t.profile.actions.edit}
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="text-gray-500 text-2xl font-bold">
                    {formData.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.profile.labels.avatarUrl}
                </label>
                {isEditing ? (
                  <input
                    type="url"
                    value={formData.avatarUrl}
                    onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t.profile.placeholders.avatarUrlInput}
                  />
                ) : (
                  <p className="text-gray-600">{formData.avatarUrl || t.profile.placeholders.noAvatarUrl}</p>
                )}
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.profile.labels.username}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={3}
                />
              ) : (
                <p className="text-gray-900 font-medium">{formData.username}</p>
              )}
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.profile.labels.displayName}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.displayname}
                  onChange={(e) => setFormData({ ...formData, displayname: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t.profile.placeholders.displayNameInput}
                />
                ) : (
                <p className="text-gray-900">{formData.displayname || t.profile.placeholders.notSet}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.profile.labels.email}
              </label>
              <p className="text-gray-600">{userProfile.email}</p>
            </div>

            {/* Action buttons for editing */}
            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? t.profile.actions.saving : t.profile.actions.save}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t.profile.actions.cancel}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
