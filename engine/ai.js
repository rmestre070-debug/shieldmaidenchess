// engine/ai.js
import { getLegalMoves, makeMove } from "./engine.js";

export function getRandomAIMove(game) {
  const moves = getLegalMoves(game);
  if (moves.length === 0) return null;
  return moves[Math.floor(Math.random() * moves.length)];
}

export function aiShouldMove(game, aiSide) {
  return aiSide === game.turn;
}

export function aiMakeMove(game, aiSide) {
  if (!aiShouldMove(game, aiSide)) return null;

  const move = getRandomAIMove(game);
  if (!move) return null;

  makeMove(game, move);
  return move;
}