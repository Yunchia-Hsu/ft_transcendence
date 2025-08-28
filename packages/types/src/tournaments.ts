// Option A: string literal unions (TS-only)
export type TournamentType = "single_elim";
export type TournamentStatus = "pending" | "ongoing" | "completed";

// Option B: runtime enums (iterate at runtime)
export enum TournamentTypeEnum {
  SINGLE_ELIM = "single_elim",
}
export enum TournamentStatusEnum {
  PENDING = "pending",
  ONGOING = "ongoing",
  COMPLETED = "completed",
}

export interface TournamentDTO {
  id: string;
  name: string;
  type: TournamentType | TournamentTypeEnum;
  size: number;
  status: TournamentStatus | TournamentStatusEnum;
  createdAt: string;
}
