// apps/game/src/shared/api/types.ts

// Auth
export type LoginResponse =
  | {
      token: string;
      userId: string;
      requireTwoFactor?: false;
      tempToken?: undefined;
    }
  | {
      requireTwoFactor: true;
      tempToken: string;
      token?: undefined;
      userId?: undefined;
    };

export type Verify2FAResponse = { token: string; userId: string };

// Games
export type Game = {
  game_id: string;
  player1: string;
  player2: string;
  score: string;
  status: string;
};

// Tournaments
export type TournamentListItem = {
  id: string;
  name: string;
  status: "pending" | "ongoing" | "completed";
};
