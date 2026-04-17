// engine/engine.js
// Minimal but complete engine for Shield Maiden Chess (10x8)
// Includes: game state, move generation, Shield Maiden, promotion, cloneGame

const FILES = 10;
const RANKS = 8;

export function newGame() {
  const board = Array.from({ length: RANKS }, () => Array(FILES).fill(null));

  // Helper to place back rank
  function placeBackRank(r, color) {
    const pref = color === "w" ? "w" : "b";
    board[r][0] = pref + "R";
    board[r][1] = pref + "S"; // Shield Maiden
    board[r][2] = pref + "N";
    board[r][3] = pref + "B";
    board[r][4] = pref + "Q";
    board[r][5] = pref + "K";
    board[r][6] = pref + "B";
    board[r][7] = pref + "N";
    board[r][8] = pref + "S"; // Shield Maiden
    board[r][9] = pref + "R";
  }

  // White pieces
  placeBackRank(7, "w");
  for (let c = 0; c < FILES; c++) {
    board[6][c] = "wP";
  }

  // Black pieces
  placeBackRank(0, "b");
  for (let c = 0; c < FILES; c++) {
    board[1][c] = "bP";
  }

  return {
    board,
    turn: "w",
    moveHistory: []
  };
}

export function cloneGame(game) {
  return {
    board: game.board.map(row => row.slice()),
    turn: game.turn,
    moveHistory: game.moveHistory.slice()
  };
}

// ---------------- Move generation ----------------

export function getLegalMoves(game) {
  const moves = [];
  const board = game.board;
  const turn = game.turn;

  for (let r = 0; r < RANKS; r++) {
    for (let c = 0; c < FILES; c++) {
      const piece = board[r][c];
      if (!piece) continue;
      if (piece[0] !== turn) continue;

      const type = piece[1];
      switch (type) {
        case "P":
          addPawnMoves(game, r, c, moves);
          break;
        case "N":
          addKnightMoves(game, r, c, moves);
          break;
        case "B":
          addSlidingMoves(game, r, c, moves, [[1,1],[1,-1],[-1,1],[-1,-1]]);
          break;
        case "R":
          addSlidingMoves(game, r, c, moves, [[1,0],[-1,0],[0,1],[0,-1]]);
          break;
        case "Q":
          addSlidingMoves(game, r, c, moves, [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]);
          break;
        case "K":
          addKingMoves(game, r, c, moves);
          break;
        case "S":
          addShieldMaidenMoves(game, r, c, moves);
          break;
      }
    }
  }

  return moves;
}

function inBounds(r, c) {
  return r >= 0 && r < RANKS && c >= 0 && c < FILES;
}

function addMoveIfValid(game, r, c, nr, nc, moves) {
  if (!inBounds(nr, nc)) return;
  const board = game.board;
  const piece = board[r][c];
  const target = board[nr][nc];
  if (!target || target[0] !== piece[0]) {
    moves.push({
      from: { r, c },
      to: { r: nr, c: nc }
    });
  }
}

function addSlidingMoves(game, r, c, moves, dirs) {
  const board = game.board;
  const color = board[r][c][0];

  for (const [dr, dc] of dirs) {
    let nr = r + dr;
    let nc = c + dc;
    while (inBounds(nr, nc)) {
      const target = board[nr][nc];
      if (!target) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
      } else {
        if (target[0] !== color) {
          moves.push({ from: { r, c }, to: { r: nr, c: nc } });
        }
        break;
      }
      nr += dr;
      nc += dc;
    }
  }
}

function addKnightMoves(game, r, c, moves) {
  const deltas = [
    [2,1],[2,-1],[-2,1],[-2,-1],
    [1,2],[1,-2],[-1,2],[-1,-2]
  ];
  for (const [dr, dc] of deltas) {
    addMoveIfValid(game, r, c, r + dr, c + dc, moves);
  }
}

function addKingMoves(game, r, c, moves) {
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      addMoveIfValid(game, r, c, r + dr, c + dc, moves);
    }
  }
}

function addShieldMaidenMoves(game, r, c, moves) {
  // Shield Maiden: 1–2 squares orthogonally, no jumping
  const board = game.board;
  const color = board[r][c][0];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

  for (const [dr, dc] of dirs) {
    let nr = r + dr;
    let nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    let target = board[nr][nc];
    if (!target) {
      moves.push({ from: { r, c }, to: { r: nr, c: nc } });
    } else {
      if (target[0] !== color) {
        moves.push({ from: { r, c }, to: { r: nr, c: nc } });
      }
      continue;
    }

    // second step
    nr += dr;
    nc += dc;
    if (!inBounds(nr, nc)) continue;
    target = board[nr][nc];
    if (!target) {
      moves.push({ from: { r, c }, to: { r: nr, c: nc } });
    } else if (target[0] !== color) {
      moves.push({ from: { r, c }, to: { r: nr, c: nc } });
    }
  }
}

function addPawnMoves(game, r, c, moves) {
  const board = game.board;
  const piece = board[r][c];
  const color = piece[0];
  const dir = color === "w" ? -1 : 1;
  const startRank = color === "w" ? 6 : 1;
  const lastRank = color === "w" ? 0 : 7;

  const oneR = r + dir;
  if (inBounds(oneR, c) && !board[oneR][c]) {
    const move = { from: { r, c }, to: { r: oneR, c } };
    if (oneR === lastRank) move.promotion = "Q";
    moves.push(move);

    const twoR = r + 2 * dir;
    if (r === startRank && inBounds(twoR, c) && !board[twoR][c]) {
      moves.push({ from: { r, c }, to: { r: twoR, c } });
    }
  }

  for (const dc of [-1, 1]) {
    const nr = r + dir;
    const nc = c + dc;
    if (!inBounds(nr, nc)) continue;
    const target = board[nr][nc];
    if (target && target[0] !== color) {
      const move = { from: { r, c }, to: { r: nr, c: nc } };
      if (nr === lastRank) move.promotion = "Q";
      moves.push(move);
    }
  }
}

// ---------------- Move application ----------------

export function makeMove(game, move) {
  const board = game.board;
  const fromPiece = board[move.from.r][move.from.c];

  board[move.from.r][move.from.c] = null;

  let pieceToPlace = fromPiece;
  if (move.promotion) {
    pieceToPlace = fromPiece[0] + move.promotion;
  }

  board[move.to.r][move.to.c] = pieceToPlace;

  game.moveHistory.push(move);
  game.turn = game.turn === "w" ? "b" : "w";
}