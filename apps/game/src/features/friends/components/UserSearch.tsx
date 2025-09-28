// apps/game/src/features/friends/components/UserSearch.tsx
import React, { useState } from 'react';
import { useFriendsStore } from '../store/friends.store';
import { useAuthStore } from '../../auth/store/auth.store';
import { useUiStore } from '../../../shared/store/ui.store';

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const showBanner = useUiStore((s) => s.showBanner);
  
  const {
    searchResults,
    searchLoading,
    sendFriendRequest,
    searchUsers
  } = useFriendsStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    await searchUsers(searchQuery, userId || undefined);
  };

  const handleSendRequest = async (userId: string) => {
    if (!token) return;
    
    try {
      await sendFriendRequest(token, userId);
      showBanner('Friend request sent!', 'success');
    } catch (error) {
      showBanner('Failed to send friend request', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="flex space-x-4">
        <div className="flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for users by username..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={searchLoading || !searchQuery.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {searchLoading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Search Results */}
      {searchLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {!searchLoading && searchResults.length === 0 && searchQuery && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
          <p className="text-gray-500">Try searching with a different username.</p>
        </div>
      )}

      {!searchLoading && searchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Search Results</h3>
          {searchResults.map((user) => (
            <div key={user.userid} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} className="w-10 h-10 rounded-full" />
                  ) : (
                    <span className="text-sm font-medium text-gray-700">
                      {user.username.slice(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{user.username}</p>
                  {user.displayname && (
                    <p className="text-sm text-gray-500">{user.displayname}</p>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => handleSendRequest(user.userid)}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
              >
                Add Friend
              </button>
            </div>
          ))}
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Search for friends</h3>
          <p className="text-gray-500">Enter a username to find and add new friends.</p>
        </div>
      )}
    </div>
  );
}
