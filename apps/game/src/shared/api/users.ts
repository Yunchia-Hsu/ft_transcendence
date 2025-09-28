// apps/game/src/shared/api/users.ts
import { request, withJson } from "./request";

export type OnlineUser = {
  userid: string;
  username: string;
  displayname: string | null;
  avatar: string | null;
  status: "online" | "offline";
};

export const UsersApi = {
  getOnline() {
    return request<OnlineUser[]>("/api/users/onlineusers", { method: "GET" });
  },

  setMyStatus(token: string, status: "online" | "offline") {
    return request<{ userId: string; status: "online" | "offline" }>(
      "/api/users/me/status",
      withJson(
        { status },
        { method: "PUT", headers: { Authorization: `Bearer ${token}` } }
      )
    );
  },
};
