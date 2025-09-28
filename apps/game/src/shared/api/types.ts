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
  winner_id: string | null;
};

// Tournaments
export type TournamentStatus = "pending" | "ongoing" | "completed";
export type TournamentType = "single_elim";

export type TournamentListItem = {
  id: string;
  name: string;
  status: TournamentStatus;
};

export type TournamentDetail = {
  id: string;
  name: string;
  status: TournamentStatus;
  size: number;
  rounds: number;
  participants: Array<{ userId: string; nickname: string }>;
};

export type BracketPlayer = { userId: string | null; nickname: string | null };
export type BracketMatch = {
  round: number;
  matchIndex: number;
  gameId: string | null;
  p1: BracketPlayer;
  p2: BracketPlayer;
  winnerUserId: string | null;
};
export type BracketResponse = {
  ok: true;
  rounds: number;
  matches: BracketMatch[];
};
