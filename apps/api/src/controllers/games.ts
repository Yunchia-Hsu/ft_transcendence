export const startGame = async (data: any) => {
  const { player1, player2 } = data;
  const newGame = { gameId: "123", player1, player2 };
  return newGame;
};

export const getGameStatus = async (gameId: string) => {
  const gameStatus = { gameId, score: "2-1", status: "In Progress" };
  return gameStatus;
};

export const makeMove = async (gameId: string, data: any) => {
  const { playerId, move } = data;
  return { message: "Move processed", gameId, playerId, move };
};
