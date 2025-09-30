// apps/game/src/features/friends/components/FriendRequests.tsx
import React from 'react';
import { FriendRequest } from '@/shared/api/friends';
import { useFriendsStore } from '../store/friends.store';
import { useAuthStore } from '../../auth/store/auth.store';
import { useUiStore } from '../../../shared/store/ui.store';

interface FriendRequestsProps {
  requests: FriendRequest[];
}

export default function FriendRequests({ requests }: FriendRequestsProps) {
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const showBanner = useUiStore((s) => s.showBanner);
  const { acceptFriendRequest, rejectFriendRequest } = useFriendsStore();

  // Helper function to get requester info (the user who sent the request)
  const getRequesterInfo = (request: FriendRequest) => {
    const requesterId = request.requested_by;
    const isRequesterUser1 = request.user1 === requesterId;
    return {
      userId: requesterId,
      username: isRequesterUser1 ? request.user1_username : request.user2_username,
      displayname: isRequesterUser1 ? request.user1_displayname : request.user2_displayname,
      avatar: isRequesterUser1 ? request.user1_avatar : request.user2_avatar,
    };
  };

  const handleAccept = async (friendId: string) => {
    if (!token || !userId) return;
    
    try {
      await acceptFriendRequest(token, friendId, userId);
      showBanner('Friend request accepted!', 'success');
    } catch (error) {
      showBanner('Failed to accept friend request', 'error');
    }
  };

  const handleReject = async (friendId: string) => {
    if (!token) return;
    
    try {
      await rejectFriendRequest(token, friendId);
      showBanner('Friend request rejected', 'success');
    } catch (error) {
      showBanner('Failed to reject friend request', 'error');
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v1M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
        <p className="text-gray-500">You don't have any friend requests at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const requesterInfo = getRequesterInfo(request);
        const displayName = requesterInfo.displayname || requesterInfo.username || `User ${requesterInfo.userId?.slice(0, 8)}`;
        const avatarInitials = requesterInfo.username ? requesterInfo.username.slice(0, 2).toUpperCase() : 'U?';
        
        return (
          <div key={request.friendid} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-300 rounded-full flex items-center justify-center">
                {requesterInfo.avatar ? (
                  <img 
                    src={requesterInfo.avatar} 
                    alt={displayName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-blue-700">
                    {avatarInitials}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-500">
                  {requesterInfo.username ? `@${requesterInfo.username} wants to be your friend` : 'Wants to be your friend'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleAccept(request.friendid)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-green-700"
              >
                Accept
              </button>
              <button
                onClick={() => handleReject(request.friendid)}
                className="bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-gray-700"
              >
                Decline
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
