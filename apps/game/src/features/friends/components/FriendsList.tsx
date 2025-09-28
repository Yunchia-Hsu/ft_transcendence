// apps/game/src/features/friends/components/FriendsList.tsx
import React from 'react';
import { Friend } from '@/shared/api/friends';
import { useFriendsStore } from '../store/friends.store';
import { useAuthStore } from '../../auth/store/auth.store';
import { useUiStore } from '../../../shared/store/ui.store';

interface FriendsListProps {
  friends: Friend[];
}

export default function FriendsList({ friends }: FriendsListProps) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const showBanner = useUiStore((s) => s.showBanner);
  const { deleteFriend } = useFriendsStore();

  // Helper function to get friend info (the other user, not current user)
  const getFriendInfo = (friend: Friend) => {
    const isUser1 = friend.user1 === userId;
    return {
      userId: isUser1 ? friend.user2 : friend.user1,
      username: isUser1 ? friend.user2_username : friend.user1_username,
      displayname: isUser1 ? friend.user2_displayname : friend.user1_displayname,
      avatar: isUser1 ? friend.user2_avatar : friend.user1_avatar,
    };
  };

  const handleDeleteFriend = async (friendId: string) => {
    if (!token) return;
    
    if (confirm('Are you sure you want to remove this friend?')) {
      try {
        await deleteFriend(token, friendId);
        showBanner('Friend removed successfully', 'success');
      } catch (error) {
        showBanner('Failed to remove friend', 'error');
      }
    }
  };

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No friends yet</h3>
        <p className="text-gray-500">Start by searching for users to add as friends!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => {
        const friendInfo = getFriendInfo(friend);
        const displayName = friendInfo.displayname || friendInfo.username || `User ${friendInfo.userId?.slice(0, 8)}`;
        const avatarInitials = friendInfo.username ? friendInfo.username.slice(0, 2).toUpperCase() : 'U?';
        
        return (
          <div key={friend.friendid} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                {friendInfo.avatar ? (
                  <img 
                    src={friendInfo.avatar} 
                    alt={displayName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-700">
                    {avatarInitials}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-500">
                  {friendInfo.username ? `@${friendInfo.username}` : 'Friend since today'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Friends
              </span>
              <button
                onClick={() => handleDeleteFriend(friend.friendid)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
