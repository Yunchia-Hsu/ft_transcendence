import React from "react";
import { useNavigate } from "react-router-dom";
import { Friend } from "@/shared/api/friends";
import { GamesApi } from "@/shared/api/games";
import { useFriendsStore } from "../store/friends.store";
import { useAuthStore } from "../../auth/store/auth.store";
import { useUiStore } from "../../../shared/store/ui.store";
import { useLang } from "../../../localization";

interface FriendsListProps {
  friends: Friend[];
}

export default function FriendsList({ friends }: FriendsListProps) {
  const { t } = useLang();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const userId = useAuthStore((s) => s.userId);
  const showBanner = useUiStore((s) => s.showBanner);
  const { deleteFriend } = useFriendsStore();

  // Helper to identify which user is the friend (not current user)
  const getFriendInfo = (friend: Friend) => {
    const isUser1 = friend.user1 === userId;
    return {
      userId: isUser1 ? friend.user2 : friend.user1,
      username: isUser1 ? friend.user2_username : friend.user1_username,
      displayname: isUser1
        ? friend.user2_displayname
        : friend.user1_displayname,
      avatar: isUser1 ? friend.user2_avatar : friend.user1_avatar,
    };
  };

  // 🗑️ Remove friend
  const handleDeleteFriend = async (friendId: string) => {
    if (!token) return;
    if (confirm(t.friends.confirmations.removeFriend)) {
      try {
        await deleteFriend(token, friendId);
        showBanner(t.friends.messages.friendRemoved, "success");
      } catch (error) {
        showBanner(t.friends.messages.removeFriendFailed, "error");
      }
    }
  };

  // 🎮 Start game with friend
  const startGameWithFriend = async (friendUserId: string) => {
    if (!userId || !token) return;
    try {
      const game = await GamesApi.start({
        player1: userId,
        player2: friendUserId,
      });
      navigate(`/game/${game.game_id}`);
    } catch (error) {
      console.error("Failed to start game:", error);
      showBanner(
        t.friends.messages.startGameFailed ?? "Failed to start game",
        "error"
      );
    }
  };

  if (friends.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM9 9a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t.friends.empty.noFriends.title}
        </h3>
        <p className="text-gray-500">{t.friends.empty.noFriends.description}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {friends.map((friend) => {
        const friendInfo = getFriendInfo(friend);
        const displayName =
          friendInfo.displayname ||
          friendInfo.username ||
          `User ${friendInfo.userId?.slice(0, 8)}`;
        const avatarInitials = friendInfo.username
          ? friendInfo.username.slice(0, 2).toUpperCase()
          : "U?";

        return (
          <div
            key={friend.friendid}
            className="bg-white rounded-lg shadow p-4 flex items-center justify-between"
          >
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
                  {friendInfo.username
                    ? `@${friendInfo.username}`
                    : t.friends.status.friendSinceToday}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => startGameWithFriend(friendInfo.userId)}
                className="bg-sky-600 text-white px-3 py-1 rounded text-sm font-medium hover:bg-sky-700"
              >
                {t.friends.actions.play ?? "Play"}
              </button>
              <button
                onClick={() => handleDeleteFriend(friend.friendid)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                {t.friends.actions.remove}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
