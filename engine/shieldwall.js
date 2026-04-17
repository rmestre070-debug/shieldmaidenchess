// shieldwall.js
// Implements the Shield Wall legality filter for Shield Maiden Chess

import { inBounds, getPiece } from "./board.js";
import { generatePseudoLegalMoves } from "./movement.js";

// ------------------------------------------------------------
// Detect orthogonal adjacency
// ------------------------------------------------------------

function isOrthogonallyAdjacent(r1, c1, r2, c2) {
  return (
    (r1 === r2 && Math.abs(c1 - c2) === 1) ||
    (c1 === c2 && Math.abs(r1 - r2) === 1)
  );
}

// ------------------------------------------------------------
// Find all Shield Maidens protecting a given square
// ------------------------------------------------------------

export function getProtectingShieldMaidens(board, r, c, color) {
  const protectors = [];

  const deltas = [
    [1,0], [-1,0], [0,1], [0,-1]
  ];

  for (const [dr, dc] of deltas) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;

    const piece = getPiece(board, nr, nc);
    if (piece === color + "S") {
      protectors.push({ r: nr, c: nc });
    }
  }

  return protectors;
}

// ------------------------------------------------------------
// Determine if a move attacks a given square AFTER the move
// ------------------------------------------------------------

function moveAttacksSquare(board, move, targetR, targetC, enPassantSquare) {
  const { from, to } = move;

  // Clone board manually (lightweight)
  const newBoard = board.map(row => row.slice());

  // Apply move
  newBoard[to.r][to.c] = newBoard[from.r][from.c];
  newBoard[from.r][from.c] = null;

  // Generate pseudo-legal moves from the moved piece's new square
  const pseudo = generatePseudoLegalMoves(
    newBoard,
    to.r,
    to.c,
    enPassantSquare
  );

  return pseudo.some(m => m.r === targetR && m.c === targetC);
}

// ------------------------------------------------------------
// Main Shield Wall legality check
// ------------------------------------------------------------

export function isShieldWallCaptureLegal(board, move, enPassantSquare) {
  const { from, to } = move;
  const attacker = getPiece(board, from.r, from.c);
  const target = getPiece(board, to.r, to.c);

  // If no capture, Shield Wall does not apply
  if (!target) return true;

  const attackerColor = attacker[0];
  const targetColor = target[0];

  // Only applies when capturing an enemy piece
  if (attackerColor === targetColor) return true;

  // Find Shield Maidens protecting the target square
  const protectors = getProtectingShieldMaidens(board, to.r, to.c, targetColor);

  // If no Shield Maiden protects the target, capture is legal
  if (protectors.length === 0) return true;

  // For each protecting Shield Maiden, check if the move attacks her AFTER the capture
  for (const sm of protectors) {
    const threatensMaiden = moveAttacksSquare(
      board,
      move,
      sm.r,
      sm.c,
      enPassantSquare
    );

    if (threatensMaiden) {
      // This is a valid double-attack capture
      return true;
    }
  }

  // If none of the protecting Shield Maidens are attacked after the capture,
  // the capture is illegal under the Shield Wall rule.
  return false;
}