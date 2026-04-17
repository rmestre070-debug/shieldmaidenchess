// board.js
// Core board representation for Shield Maiden Chess (10×8)

export const FILES = 10;
export const RANKS = 8;

// Utility: check if square is on board
export function inBounds(r, c) {
  return r >= 0 && r < RANKS && c >= 0 && c < FILES;
}

// Utility: deep clone board
export function cloneBoard(board) {
  return board.map(row => row.slice());
}

// Starting position for Shield Maiden Chess
// Rank 1 (White): R S B N Q K N B S R
// Rank 8 (Black): mirror of White

export function getStartingPosition() {
  return [
    // Rank 8 (Black back rank)
    ["bR", "bS", "bB", "bN", "bQ", "bK", "bN", "bB", "bS", "bR"],

    // Rank 7 (Black pawns)
    ["bP","bP","bP","bP","bP","bP","bP","bP","bP","bP"],

    // Ranks 6–3 (empty)
    [null,null,null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null,null,null],
    [null,null,null,null,null,null,null,null,null,null],

    // Rank 2 (White pawns)
    ["wP","wP","wP","wP","wP","wP","wP","wP","wP","wP"],

    // Rank 1 (White back rank)
    ["wR", "wS", "wB", "wN", "wQ", "wK", "wN", "wB", "wS", "wR"]
  ];
}

// Utility: get piece at square
export function getPiece(board, r, c) {
  if (!inBounds(r, c)) return null;
  return board[r][c];
}

// Utility: set piece at square
export function setPiece(board, r, c, piece) {
  if (inBounds(r, c)) board[r][c] = piece;
}

// Utility: find king position for a given color
export function findKing(board, color) {
  for (let r = 0; r < RANKS; r++) {
    for (let c = 0; c < FILES; c++) {
      if (board[r][c] === color + "K") {
        return { r, c };
      }
    }
  }
  return null;
}