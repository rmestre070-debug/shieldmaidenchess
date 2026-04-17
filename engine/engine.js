// engine.js
// High-level API for Shield Maiden Chess engine
// Orchestrates movement, legality, Shield Wall, and game state evaluation

import { getStartingPosition, cloneBoard } from "./board.js";
import {
  generateLegalMoves,
  applyMove as applyLegalMove,
  kingInCheck,
  isCheckmate,
  isStalemate
} from "./legality.js";

// ------------------------------------------------------------
// Engine State
// ------------------------------------------------------------

export class GameState {
  constructor() {
    this.board = getStartingPosition();
    this.turn = "w"; // white starts
    this.enPassantSquare = null; // {r, c} or null
    this.moveHistory = [];
  }

  clone() {
    const gs = new GameState();
    gs.board = cloneBoard(this.board);
    gs.turn = this.turn;
    gs.enPassantSquare = this.enPassantSquare
      ? { ...this.enPassantSquare }
      : null;
    gs.moveHistory = this.moveHistory.map(m => ({ ...m }));
    return gs;
  }
}

// ------------------------------------------------------------
// Generate legal moves for current player
// ------------------------------------------------------------

export function getLegalMoves(gameState) {
  return generateLegalMoves(
    gameState.board,
    gameState.turn,
    gameState.enPassantSquare
  );
}

// ------------------------------------------------------------
// Apply a move to the game state
// ------------------------------------------------------------

export function makeMove(gameState, move) {
  const piece = gameState.board[move.from.r][move.from.c];

  // Track en passant availability
  let newEnPassant = null;

  // Pawn double-step sets en passant square
  if (piece[1] === "P") {
    const dir = piece[0] === "w" ? -1 : 1;
    if (Math.abs(move.to.r - move.from.r) === 2) {
      newEnPassant = {
        r: move.from.r + dir,
        c: move.from.c
      };
    }
  }

  // Apply move
  gameState.board = applyLegalMove(gameState.board, move);

  // Handle promotion
  if (move.promotion) {
    gameState.board[move.to.r][move.to.c] = piece[0] + move.promotion;
  }

  // Update en passant square
  gameState.enPassantSquare = newEnPassant;

  // Record move
  gameState.moveHistory.push(move);

  // Switch turn
  gameState.turn = gameState.turn === "w" ? "b" : "w";
}

// ------------------------------------------------------------
// Game state evaluation helpers
// ------------------------------------------------------------

export function isCheck(gameState) {
  return kingInCheck(gameState.board, gameState.turn);
}

export function isCheckmateState(gameState) {
  return isCheckmate(
    gameState.board,
    gameState.turn,
    gameState.enPassantSquare
  );
}

export function isStalemateState(gameState) {
  return isStalemate(
    gameState.board,
    gameState.turn,
    gameState.enPassantSquare
  );
}

// ------------------------------------------------------------
// Draw detection (basic version)
// ------------------------------------------------------------

export function detectDraw(gameState) {
  // Stalemate
  if (isStalemateState(gameState)) return "stalemate";

  // TODO: Add 50-move rule, repetition, insufficient material
  return null;
}

// ------------------------------------------------------------
// Public API: create a new game
// ------------------------------------------------------------

export function newGame() {
  return new GameState();
}