// apps/game/src/features/friends/components/SentRequests.tsx
import React from 'react';
import { Friend } from '@/shared/api/friends';
import { useFriendsStore } from '../store/friends.store';
import { useAuthStore } from '../../auth/store/auth.store';
import { useUiStore } from '../../../shared/store/ui.store';
import { useLang } from '../../../localization';

interface SentRequestsProps {
  requests: Friend[];
}

export default function SentRequests({ requests }: SentRequestsProps) {
  const { t } = useLang();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const showBanner = useUiStore((s) => s.showBanner);
  const { deleteFriendRequest } = useFriendsStore();

  // Helper function to get friend info (the other user, not current user)
  const getFriendInfo = (request: Friend) => {
    const isUser1 = request.user1 === userId;
    return {
      userId: isUser1 ? request.user2 : request.user1,
      username: isUser1 ? request.user2_username : request.user1_username,
      displayname: isUser1 ? request.user2_displayname : request.user1_displayname,
      avatar: isUser1 ? request.user2_avatar : request.user1_avatar,
    };
  };

  const handleCancel = async (friendId: string) => {
    if (!token) return;
    
    if (confirm(t.friends.confirmations.cancelRequest)) {
      try {
        await deleteFriendRequest(token, friendId);
        showBanner(t.friends.messages.requestCancelled, 'success');
      } catch (error) {
        showBanner(t.friends.messages.cancelRequestFailed, 'error');
      }
    }
  };

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t.friends.empty.noSentRequests.title}</h3>
        <p className="text-gray-500">{t.friends.empty.noSentRequests.description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => {
        const friendInfo = getFriendInfo(request);
        const displayName = friendInfo.displayname || friendInfo.username || `User ${friendInfo.userId?.slice(0, 8)}`;
        const avatarInitials = friendInfo.username ? friendInfo.username.slice(0, 2).toUpperCase() : 'U?';
        
        return (
          <div key={request.friendid} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-300 rounded-full flex items-center justify-center">
                {friendInfo.avatar ? (
                  <img 
                    src={friendInfo.avatar} 
                    alt={displayName} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-medium text-yellow-700">
                    {avatarInitials}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{displayName}</p>
                <p className="text-sm text-gray-500">
                  {friendInfo.username ? `@${friendInfo.username}` : t.friends.status.requestSent}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
{t.friends.status.pending}
              </span>
              <button
                onClick={() => handleCancel(request.friendid)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
{t.friends.actions.cancel}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
