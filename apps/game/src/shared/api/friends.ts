// apps/game/src/shared/api/friends.ts
import { request, withJson } from "./request";

export type FriendStatus = "pending" | "accepted" | "declined";

export type Friend = {
  friendid: string;
  user1: string;
  user2: string;
  friendstatus: FriendStatus;
  requested_by: string;
  // User information for display
  user1_username?: string;
  user1_displayname?: string | null;
  user1_avatar?: string | null;
  user2_username?: string;
  user2_displayname?: string | null;
  user2_avatar?: string | null;
};

export type FriendRequest = {
  friendid: string;
  user1: string;
  user2: string;
  friendstatus: "pending";
  requested_by: string;
  // User information for display
  user1_username?: string;
  user1_displayname?: string | null;
  user1_avatar?: string | null;
  user2_username?: string;
  user2_displayname?: string | null;
  user2_avatar?: string | null;
};

export type User = {
  userid: string;
  username: string;
  displayname: string | null;
  avatar: string | null;
};

export const FriendsApi = {
  // Get friends list
  getFriends(token: string) {
    return request<Friend[]>("/api/friends", {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Send friend request
  sendFriendRequest(token: string, receiverId: string) {
    return request<Friend>(
      `/api/friends/request/${receiverId}/send`,
      withJson(
        { receiverId },
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      )
    );
  },

  // Accept friend request
  acceptFriendRequest(token: string, friendId: string) {
    return request<Friend>(`/api/friends/request/${friendId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Reject friend request
  rejectFriendRequest(token: string, friendId: string) {
    return request<Friend>(`/api/friends/request/${friendId}/reject`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Get pending friend requests (received)
  getPendingRequests(token: string, friendId: string) {
    return request<FriendRequest[]>(`/api/friends/request/${friendId}/retrieve`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Delete friend request (sent)
  deleteFriendRequest(token: string, friendId: string) {
    return request<{ success: boolean; message: string }>(
      `/api/friends/request/${friendId}/delete`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },

  // Delete friend
  deleteFriend(token: string, friendId: string) {
    return request<{ success: boolean; message: string }>(
      `/api/friends/${friendId}/delete`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
  },
};
