// apps/game/src/features/friends/pages/FriendsPage.tsx
import React, { useEffect, useState } from 'react';
import { useFriendsStore } from '../store/friends.store';
import { useAuthStore } from '../../auth/store/auth.store';
import { useLang } from '../../../localization';
import { useUiStore } from '../../../shared/store/ui.store';
import FriendsList from '../components/FriendsList';
import FriendRequests from '../components/FriendRequests';
import SentRequests from '../components/SentRequests';
import UserSearch from '../components/UserSearch';

type TabType = 'friends' | 'requests' | 'sent' | 'search';

export default function FriendsPage() {
  const { t } = useLang();
  const showBanner = useUiStore((s) => s.showBanner);
  const [activeTab, setActiveTab] = useState<TabType>('friends');
  
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    error,
    fetchFriends,
    fetchPendingRequests,
    fetchSentRequests,
    refreshAllData,
    clearError
  } = useFriendsStore();

  useEffect(() => {
    if (!token || !userId) return;
    
    // Use the new refresh function for better coordination
    refreshAllData(token, userId);
  }, [token, userId, refreshAllData]);

  useEffect(() => {
    if (error) {
      showBanner(error, 'error');
      clearError();
    }
  }, [error, showBanner, clearError]);

  const tabs = [
    { id: 'friends' as const, label: t.friendsPage.tabs.friends, count: friends.length },
    { id: 'requests' as const, label: t.friendsPage.tabs.requests, count: pendingRequests.length },
    { id: 'sent' as const, label: t.friendsPage.tabs.sent, count: sentRequests.length },
    { id: 'search' as const, label: t.friendsPage.tabs.addFriends, count: 0 },
  ];

  const handleRefresh = () => {
    if (token && userId) {
      refreshAllData(token, userId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t.friendsPage.title}</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>{loading ? t.friendsPage.refreshing : t.friendsPage.refresh}</span>
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Tab Content */}
      {!loading && (
        <div className="mt-6">
          {activeTab === 'friends' && <FriendsList friends={friends} />}
          {activeTab === 'requests' && <FriendRequests requests={pendingRequests} />}
          {activeTab === 'sent' && <SentRequests requests={sentRequests} />}
          {activeTab === 'search' && <UserSearch />}
        </div>
      )}
    </div>
  );
}
