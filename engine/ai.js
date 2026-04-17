// engine/ai.js
import { getLegalMoves, makeMove, cloneGame } from "./engine.js";

// --- Evaluation ---

const PIECE_VALUES = {
  P: 100,
  N: 300,
  B: 320,
  R: 500,
  Q: 900,
  S: 350, // Shield Maiden
  K: 10000
};

export function evaluatePosition(game) {
  let score = 0;
  const board = game.board;

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[r].length; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      const color = piece[0];
      const type = piece[1];
      const value = PIECE_VALUES[type] || 0;
      score += (color === "w" ? value : -value);
    }
  }

  // Simple bonus for side to move (initiative)
  score += game.turn === "w" ? 10 : -10;

  return score;
}

// --- Minimax with alpha-beta ---

function minimax(game, depth, alpha, beta, maximizing) {
  if (depth === 0) {
    return evaluatePosition(game);
  }

  const moves = getLegalMoves(game);
  if (moves.length === 0) {
    // No legal moves: checkmate or stalemate
    // Rough handling: treat as very bad for side to move
    return maximizing ? -999999 : 999999;
  }

  if (maximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      const next = cloneGame(game);
      makeMove(next, move);
      const evalScore = minimax(next, depth - 1, alpha, beta, false);
      if (evalScore > maxEval) maxEval = evalScore;
      if (evalScore > alpha) alpha = evalScore;
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      const next = cloneGame(game);
      makeMove(next, move);
      const evalScore = minimax(next, depth - 1, alpha, beta, true);
      if (evalScore < minEval) minEval = evalScore;
      if (evalScore < beta) beta = evalScore;
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getBestMove(game, depth) {
  const moves = getLegalMoves(game);
  if (moves.length === 0) return null;

  const maximizing = game.turn === "w";
  let bestMove = null;
  let bestEval = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = cloneGame(game);
    makeMove(next, move);
    const evalScore = minimax(next, depth - 1, -Infinity, Infinity, !maximizing);

    if (maximizing) {
      if (evalScore > bestEval) {
        bestEval = evalScore;
        bestMove = move;
      }
    } else {
      if (evalScore < bestEval) {
        bestEval = evalScore;
        bestMove = move;
        }
    }
  }

  return bestMove;
}