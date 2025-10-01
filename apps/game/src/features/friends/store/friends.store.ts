// apps/game/src/features/friends/store/friends.store.ts
import { create } from "zustand";
import { FriendsApi, type Friend, type FriendRequest, type User } from "@/shared/api/friends";
import { request } from "@/shared/api/request";

type FriendsState = {
  friends: Friend[];
  pendingRequests: FriendRequest[];
  sentRequests: Friend[];
  loading: boolean;
  error: string | null;
  searchResults: User[];
  searchLoading: boolean;

  // Actions
  fetchFriends: (token: string) => Promise<void>;
  fetchPendingRequests: (token: string, userId: string) => Promise<void>;
  fetchSentRequests: (token: string, userId: string) => Promise<void>;
  sendFriendRequest: (token: string, receiverId: string) => Promise<void>;
  acceptFriendRequest: (token: string, friendId: string, userId: string) => Promise<void>;
  rejectFriendRequest: (token: string, friendId: string) => Promise<void>;
  deleteFriendRequest: (token: string, friendId: string) => Promise<void>;
  deleteFriend: (token: string, friendId: string) => Promise<void>;
  searchUsers: (query: string, currentUserId?: string) => Promise<void>;
  refreshAllData: (token: string, userId: string) => Promise<void>;
  clearError: () => void;
};

export const useFriendsStore = create<FriendsState>((set, get) => ({
  friends: [],
  pendingRequests: [],
  sentRequests: [],
  loading: false,
  error: null,
  searchResults: [],
  searchLoading: false,

  fetchFriends: async (token: string) => {
    set({ loading: true, error: null });
    try {
      const allFriends = await FriendsApi.getFriends(token);
      // Only include accepted friends in the friends list
      const friends = allFriends.filter(friend => friend.friendstatus === "accepted");
      set({ friends, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch friends", loading: false });
    }
  },

  fetchPendingRequests: async (token: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      const requests = await FriendsApi.getPendingRequests(token, userId);
      set({ pendingRequests: requests, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch pending requests", loading: false });
    }
  },

  fetchSentRequests: async (token: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      // Get all friend records and filter for pending requests sent by current user
      const allFriends = await FriendsApi.getFriends(token);
      const sentRequests = allFriends.filter(friend => 
        friend.friendstatus === "pending" && friend.requested_by === userId
      );
      set({ sentRequests, loading: false });
    } catch (error: any) {
      set({ error: error.message || "Failed to fetch sent requests", loading: false });
    }
  },

  sendFriendRequest: async (token: string, receiverId: string) => {
    set({ loading: true, error: null });
    try {
      const newRequest = await FriendsApi.sendFriendRequest(token, receiverId);
      const { sentRequests, searchResults } = get();
      
      // Update sent requests and remove user from search results
      set({ 
        sentRequests: [...sentRequests, newRequest], 
        searchResults: searchResults.filter(user => user.userid !== receiverId),
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to send friend request", loading: false });
    }
  },

  acceptFriendRequest: async (token: string, friendId: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      await FriendsApi.acceptFriendRequest(token, friendId);
      
      // Refresh all data to ensure consistency
      const [allFriends, pendingRequests] = await Promise.all([
        FriendsApi.getFriends(token),
        FriendsApi.getPendingRequests(token, userId)
      ]);
      
      // Filter friends by status
      const friends = allFriends.filter(friend => friend.friendstatus === "accepted");
      const sentRequests = allFriends.filter(friend => 
        friend.friendstatus === "pending" && friend.requested_by === userId
      );
      
      set({ 
        friends, 
        pendingRequests, 
        sentRequests, 
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to accept friend request", loading: false });
    }
  },

  rejectFriendRequest: async (token: string, friendId: string) => {
    set({ loading: true, error: null });
    try {
      await FriendsApi.rejectFriendRequest(token, friendId);
      const { pendingRequests } = get();
      
      set({
        pendingRequests: pendingRequests.filter(req => req.friendid !== friendId),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to reject friend request", loading: false });
    }
  },

  deleteFriendRequest: async (token: string, friendId: string) => {
    set({ loading: true, error: null });
    try {
      await FriendsApi.deleteFriendRequest(token, friendId);
      const { sentRequests } = get();
      
      set({
        sentRequests: sentRequests.filter(req => req.friendid !== friendId),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to delete friend request", loading: false });
    }
  },

  deleteFriend: async (token: string, friendId: string) => {
    set({ loading: true, error: null });
    try {
      await FriendsApi.deleteFriend(token, friendId);
      const { friends } = get();
      
      set({
        friends: friends.filter(friend => friend.friendid !== friendId),
        loading: false
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to delete friend", loading: false });
    }
  },

  searchUsers: async (query: string, currentUserId?: string) => {
    if (!query.trim()) {
      set({ searchResults: [] });
      return;
    }

    set({ searchLoading: true, error: null });
    try {
      // Use the backend search endpoint with proper request function
      const users = await request<any[]>(`/api/auth/users?search=${encodeURIComponent(query)}`);
      const { friends, sentRequests, pendingRequests } = get();
      
      // Get list of user IDs that are already friends or have pending requests
      const friendUserIds = new Set();
      // Add accepted friends
      friends.forEach(friend => {
        friendUserIds.add(friend.user1);
        friendUserIds.add(friend.user2);
      });
      // Add pending sent requests
      sentRequests.forEach(requestItem => {
        friendUserIds.add(requestItem.user1);
        friendUserIds.add(requestItem.user2);
      });
      // Add pending incoming requests
      pendingRequests.forEach(requestItem => {
        friendUserIds.add(requestItem.user1);
        friendUserIds.add(requestItem.user2);
      });
      
      // Filter out current user and existing friends/requests
      const filteredUsers = users.filter((user: any) => {
        return user.userid !== currentUserId && !friendUserIds.has(user.userid);
      });
      
      // Convert to expected User format
      const searchResults = filteredUsers.map((user: any) => ({
        userid: user.userid,
        username: user.username,
        displayname: user.displayname,
        avatar: user.avatar,
      }));
      
      set({ searchResults, searchLoading: false });
    } catch (error: any) {
      // Handle "No users found" as empty results, not an error
      if (error.message && error.message.includes('No users found')) {
        set({ searchResults: [], searchLoading: false });
        return;
      }
      
      console.error('Search error:', error);
      set({ error: error.message || "Failed to search users", searchLoading: false });
    }
  },

  refreshAllData: async (token: string, userId: string) => {
    set({ loading: true, error: null });
    try {
      // Fetch all data in parallel for better performance
      const [allFriends, pendingRequests] = await Promise.all([
        FriendsApi.getFriends(token),
        FriendsApi.getPendingRequests(token, userId)
      ]);
      
      // Filter friends by status
      const friends = allFriends.filter(friend => friend.friendstatus === "accepted");
      const sentRequests = allFriends.filter(friend => 
        friend.friendstatus === "pending" && friend.requested_by === userId
      );
      
      set({ 
        friends, 
        pendingRequests, 
        sentRequests, 
        loading: false 
      });
    } catch (error: any) {
      set({ error: error.message || "Failed to refresh data", loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
