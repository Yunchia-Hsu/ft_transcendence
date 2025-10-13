// Если у тебя другие строки в БД — просто поменяй значения справа.

export enum TournamentTypeEnum {
  SINGLE_ELIM = 'single_elim',
  DOUBLE_ELIM = 'double_elim',
}

export enum TournamentStatusEnum {
  PENDING = 'pending',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
}

// Минимальный DTO, который ты возвращаешь из контроллера createTournament
export type TournamentDTO = {
  id: string;
  name: string;
  type: TournamentTypeEnum;
  size: number;
  status: TournamentStatusEnum;
  createdAt: string; // ISO
};
