// movement.js
// Pseudo-legal move generation for all pieces in Shield Maiden Chess

import { inBounds, getPiece } from "./board.js";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------

function isEmpty(board, r, c) {
  return inBounds(r, c) && board[r][c] === null;
}

function isEnemy(board, r, c, color) {
  return inBounds(r, c) && board[r][c] && board[r][c][0] !== color;
}

function isFriendly(board, r, c, color) {
  return inBounds(r, c) && board[r][c] && board[r][c][0] === color;
}

// ------------------------------------------------------------
// Sliding movement (rook, bishop, queen)
// ------------------------------------------------------------

function slide(board, r, c, color, directions) {
  const moves = [];

  for (const [dr, dc] of directions) {
    let nr = r + dr;
    let nc = c + dc;

    while (inBounds(nr, nc)) {
      if (isEmpty(board, nr, nc)) {
        moves.push({ r: nr, c: nc });
      } else {
        if (isEnemy(board, nr, nc, color)) {
          moves.push({ r: nr, c: nc });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }

  return moves;
}

// ------------------------------------------------------------
// Piece movement generators
// ------------------------------------------------------------

// KING — 1 square any direction
export function kingMoves(board, r, c, color) {
  const moves = [];
  const deltas = [
    [1,0], [-1,0], [0,1], [0,-1],
    [1,1], [1,-1], [-1,1], [-1,-1]
  ];

  for (const [dr, dc] of deltas) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    if (!isFriendly(board, nr, nc, color)) {
      moves.push({ r: nr, c: nc });
    }
  }

  return moves;
}

// QUEEN — rook + bishop
export function queenMoves(board, r, c, color) {
  return [
    ...rookMoves(board, r, c, color),
    ...bishopMoves(board, r, c, color)
  ];
}

// ROOK — sliding orthogonal
export function rookMoves(board, r, c, color) {
  return slide(board, r, c, color, [
    [1,0], [-1,0], [0,1], [0,-1]
  ]);
}

// BISHOP — sliding diagonal
export function bishopMoves(board, r, c, color) {
  return slide(board, r, c, color, [
    [1,1], [1,-1], [-1,1], [-1,-1]
  ]);
}

// KNIGHT — L-jumps
export function knightMoves(board, r, c, color) {
  const moves = [];
  const deltas = [
    [2,1], [2,-1], [-2,1], [-2,-1],
    [1,2], [1,-2], [-1,2], [-1,-2]
  ];

  for (const [dr, dc] of deltas) {
    const nr = r + dr, nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    if (!isFriendly(board, nr, nc, color)) {
      moves.push({ r: nr, c: nc });
    }
  }

  return moves;
}

// SHIELD MAIDEN — 1 or 2 orthogonal, no jumping
export function shieldMaidenMoves(board, r, c, color) {
  const moves = [];
  const deltas = [
    [1,0], [-1,0], [0,1], [0,-1]
  ];

  for (const [dr, dc] of deltas) {
    // 1-step
    const nr1 = r + dr, nc1 = c + dc;
    if (inBounds(nr1, nc1) && !isFriendly(board, nr1, nc1, color)) {
      moves.push({ r: nr1, c: nc1 });
    }

    // 2-step (only if 1-step is empty)
    const nr2 = r + 2*dr, nc2 = c + 2*dc;
    if (
      inBounds(nr2, nc2) &&
      isEmpty(board, nr1, nc1) &&
      !isFriendly(board, nr2, nc2, color)
    ) {
      moves.push({ r: nr2, c: nc2 });
    }
  }

  return moves;
}

// PAWN — forward, double, capture, en passant (pseudo-legal)
export function pawnMoves(board, r, c, color, enPassantSquare) {
  const moves = [];
  const dir = color === "w" ? -1 : 1;
  const startRank = color === "w" ? 6 : 1;

  // Forward 1
  if (isEmpty(board, r + dir, c)) {
    moves.push({ r: r + dir, c });

    // Forward 2
    if (r === startRank && isEmpty(board, r + 2*dir, c)) {
      moves.push({ r: r + 2*dir, c });
    }
  }

  // Captures
  for (const dc of [-1, 1]) {
    const nr = r + dir, nc = c + dc;

    // Normal capture
    if (isEnemy(board, nr, nc, color)) {
      moves.push({ r: nr, c: nc });
    }

    // En passant (pseudo-legal)
    if (enPassantSquare && nr === enPassantSquare.r && nc === enPassantSquare.c) {
      moves.push({ r: nr, c: nc, enPassant: true });
    }
  }

  return moves;
}

// ------------------------------------------------------------
// Dispatcher
// ------------------------------------------------------------

export function generatePseudoLegalMoves(board, r, c, enPassantSquare) {
  const piece = getPiece(board, r, c);
  if (!piece) return [];

  const color = piece[0];
  const type = piece[1]; // K,Q,R,B,N,P,S

  switch (type) {
    case "K": return kingMoves(board, r, c, color);
    case "Q": return queenMoves(board, r, c, color);
    case "R": return rookMoves(board, r, c, color);
    case "B": return bishopMoves(board, r, c, color);
    case "N": return knightMoves(board, r, c, color);
    case "P": return pawnMoves(board, r, c, color, enPassantSquare);
    case "S": return shieldMaidenMoves(board, r, c, color);
    default: return [];
  }
}