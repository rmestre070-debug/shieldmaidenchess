// legality.js
// Converts pseudo-legal moves into fully legal moves
// Applies:
// - King safety
// - Shield Wall legality
// - En passant legality
// - Promotion rules
// - No castling
// - No illegal captures

import { cloneBoard, getPiece, setPiece, findKing } from "./board.js";
import { generatePseudoLegalMoves } from "./movement.js";
import { isShieldWallCaptureLegal } from "./shieldwall.js";
import { isSquareAttacked } from "./attackmap.js";

// ------------------------------------------------------------
// Apply a move to a board (lightweight, used for testing legality)
// ------------------------------------------------------------

export function applyMove(board, move) {
  const newBoard = cloneBoard(board);
  const { from, to } = move;

  const piece = getPiece(newBoard, from.r, from.c);

  // Handle en passant
  if (move.enPassant) {
    const dir = piece[0] === "w" ? -1 : 1;
    newBoard[to.r - dir][to.c] = null;
  }

  // Move piece
  newBoard[to.r][to.c] = piece;
  newBoard[from.r][from.c] = null;

  return newBoard;
}

// ------------------------------------------------------------
// Check if king of given color is in check
// ------------------------------------------------------------

export function kingInCheck(board, color) {
  const kingPos = findKing(board, color);
  if (!kingPos) return false;

  const enemyColor = color === "w" ? "b" : "w";
  return isSquareAttacked(board, kingPos.r, kingPos.c, enemyColor);
}

// ------------------------------------------------------------
// Filter moves that leave king in check
// ------------------------------------------------------------

function filterKingSafety(board, moves, color, enPassantSquare) {
  return moves.filter(move => {
    const newBoard = applyMove(board, move);
    return !kingInCheck(newBoard, color);
  });
}

// ------------------------------------------------------------
// Filter moves that violate Shield Wall legality
// ------------------------------------------------------------

function filterShieldWall(board, moves, enPassantSquare) {
  return moves.filter(move =>
    isShieldWallCaptureLegal(board, move, enPassantSquare)
  );
}

// ------------------------------------------------------------
// Add promotion options for pawn moves reaching last rank
// ------------------------------------------------------------

function expandPromotions(board, moves, color) {
  const lastRank = color === "w" ? 0 : 7;
  const promoPieces = ["Q", "R", "B", "N", "S"];

  const expanded = [];

  for (const move of moves) {
    const piece = getPiece(board, move.from.r, move.from.c);
    if (piece[1] !== "P") {
      expanded.push(move);
      continue;
    }

    if (move.to.r === lastRank) {
      // Add promotion variants
      for (const p of promoPieces) {
        expanded.push({
          ...move,
          promotion: p
        });
      }
    } else {
      expanded.push(move);
    }
  }

  return expanded;
}

// ------------------------------------------------------------
// Generate all legal moves for a given color
// ------------------------------------------------------------

export function generateLegalMoves(board, color, enPassantSquare) {
  let moves = [];

  // 1. Generate all pseudo-legal moves
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const piece = getPiece(board, r, c);
      if (!piece) continue;
      if (piece[0] !== color) continue;

      const pseudo = generatePseudoLegalMoves(board, r, c, enPassantSquare);

      for (const m of pseudo) {
        moves.push({
          from: { r, c },
          to: { r: m.r, c: m.c },
          enPassant: m.enPassant || false
        });
      }
    }
  }

  // 2. Apply Shield Wall legality filter
  moves = filterShieldWall(board, moves, enPassantSquare);

  // 3. Apply king safety filter
  moves = filterKingSafety(board, moves, color, enPassantSquare);

  // 4. Expand promotions
  moves = expandPromotions(board, moves, color);

  return moves;
}

// ------------------------------------------------------------
// Checkmate / Stalemate detection
// ------------------------------------------------------------

export function isCheckmate(board, color, enPassantSquare) {
  if (!kingInCheck(board, color)) return false;
  const moves = generateLegalMoves(board, color, enPassantSquare);
  return moves.length === 0;
}

export function isStalemate(board, color, enPassantSquare) {
  if (kingInCheck(board, color)) return false;
  const moves = generateLegalMoves(board, color, enPassantSquare);
  return moves.length === 0;
}