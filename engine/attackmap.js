// attackmap.js
// Computes attack maps for Shield Maiden Chess (10×8)
// Used for king safety, check detection, and Shield Wall validation

import { inBounds, getPiece } from "./board.js";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function addIfValid(attacks, r, c) {
  if (inBounds(r, c)) attacks.push({ r, c });
}

function isEnemy(board, r, c, color) {
  return inBounds(r, c) && board[r][c] && board[r][c][0] !== color;
}

function isEmpty(board, r, c) {
  return inBounds(r, c) && board[r][c] === null;
}

// ------------------------------------------------------------
// Sliding attacks (rook, bishop, queen)
// ------------------------------------------------------------

function slideAttacks(board, r, c, color, directions) {
  const attacks = [];

  for (const [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;

    while (inBounds(nr, nc)) {
      attacks.push({ r: nr, c: nc });

      if (!isEmpty(board, nr, nc)) {
        // Stop at first piece (enemy or friendly)
        break;
      }

      nr += dr;
      nc += dc;
    }
  }

  return attacks;
}

// ------------------------------------------------------------
// Piece attack patterns (pseudo-attacks, not legal moves)
// ------------------------------------------------------------

// KING — 1 square any direction
function kingAttacks(board, r, c) {
  const attacks = [];
  const deltas = [
    [1,0], [-1,0], [0,1], [0,-1],
    [1,1], [1,-1], [-1,1], [-1,-1]
  ];

  for (const [dr, dc] of deltas) {
    addIfValid(attacks, r + dr, c + dc);
  }

  return attacks;
}

// KNIGHT — L jumps
function knightAttacks(board, r, c) {
  const attacks = [];
  const deltas = [
    [2,1], [2,-1], [-2,1], [-2,-1],
    [1,2], [1,-2], [-1,2], [-1,-2]
  ];

  for (const [dr, dc] of deltas) {
    addIfValid(attacks, r + dr, c + dc);
  }

  return attacks;
}

// SHIELD MAIDEN — 1 or 2 orthogonal (no jumping)
function shieldMaidenAttacks(board, r, c) {
  const attacks = [];
  const deltas = [
    [1,0], [-1,0], [0,1], [0,-1]
  ];

  for (const [dr, dc] of deltas) {
    const nr1 = r + dr, nc1 = c + dc;
    if (inBounds(nr1, nc1)) attacks.push({ r: nr1, c: nc1 });

    const nr2 = r + 2*dr, nc2 = c + 2*dc;
    if (inBounds(nr2, nc2) && isEmpty(board, nr1, nc1)) {
      attacks.push({ r: nr2, c: nc2 });
    }
  }

  return attacks;
}

// PAWN — diagonal attacks only
function pawnAttacks(board, r, c, color) {
  const attacks = [];
  const dir = color === "w" ? -1 : 1;

  addIfValid(attacks, r + dir, c - 1);
  addIfValid(attacks, r + dir, c + 1);

  return attacks;
}

// ROOK — sliding orthogonal
function rookAttacks(board, r, c, color) {
  return slideAttacks(board, r, c, color, [
    [1,0], [-1,0], [0,1], [0,-1]
  ]);
}

// BISHOP — sliding diagonal
function bishopAttacks(board, r, c, color) {
  return slideAttacks(board, r, c, color, [
    [1,1], [1,-1], [-1,1], [-1,-1]
  ]);
}

// QUEEN — rook + bishop
function queenAttacks(board, r, c, color) {
  return [
    ...rookAttacks(board, r, c, color),
    ...bishopAttacks(board, r, c, color)
  ];
}

// ------------------------------------------------------------
// Dispatcher: get attack squares for a piece
// ------------------------------------------------------------

export function getAttacksForPiece(board, r, c) {
  const piece = getPiece(board, r, c);
  if (!piece) return [];

  const color = piece[0];
  const type = piece[1];

  switch (type) {
    case "K": return kingAttacks(board, r, c);
    case "Q": return queenAttacks(board, r, c, color);
    case "R": return rookAttacks(board, r, c, color);
    case "B": return bishopAttacks(board, r, c, color);
    case "N": return knightAttacks(board, r, c);
    case "P": return pawnAttacks(board, r, c, color);
    case "S": return shieldMaidenAttacks(board, r, c);
    default: return [];
  }
}

// ------------------------------------------------------------
// Full attack map for a color
// ------------------------------------------------------------

export function getAttackMap(board, color) {
  const attacks = [];

  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const piece = getPiece(board, r, c);
      if (!piece) continue;
      if (piece[0] !== color) continue;

      const pieceAttacks = getAttacksForPiece(board, r, c);
      attacks.push(...pieceAttacks);
    }
  }

  return attacks;
}

// ------------------------------------------------------------
// Check detection
// ------------------------------------------------------------

export function isSquareAttacked(board, r, c, byColor) {
  const attacks = getAttackMap(board, byColor);
  return attacks.some(a => a.r === r && a.c === c);
}