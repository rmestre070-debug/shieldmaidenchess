// ui.js
import { newGame, getLegalMoves, makeMove, cloneGame } from "./engine/engine.js";
import { getBestMove } from "./engine/ai.js";

const FILES = 10;
const RANKS = 8;
const filesLabels = ["a","b","c","d","e","f","g","h","i","j"];

const boardEl = document.getElementById("board");
const moveHistoryEl = document.getElementById("move-history");
const statusEl = document.getElementById("status");
const aiSelectEl = document.getElementById("ai-side");
const aiLevelEl = document.getElementById("ai-level");
const newGameBtn = document.getElementById("new-game");

let game = newGame();
let selected = null;
let legalMoves = [];
let lastMove = null;
let dragging = null;
let dragImg = null;

let aiSide = null;
let aiThinking = false;
let aiDepth = 2;

// ---------------- SOUND SYSTEM ----------------

let sounds = {
  move: loadSound("assets/sounds/move.mp3"),
  capture: loadSound("assets/sounds/capture.mp3"),
  promote: loadSound("assets/sounds/promote.mp3")
};

function loadSound(path) {
  const audio = new Audio();
  audio.src = path;
  audio.preload = "auto";
  audio.onerror = () => console.warn("Sound failed to load:", path);
  return audio;
}

function playMoveSound(fromPiece, targetPiece, promoted) {
  try {
    if (promoted && sounds.promote) {
      sounds.promote.play();
    } else if (targetPiece && sounds.capture) {
      sounds.capture.play();
    } else if (sounds.move) {
      sounds.move.play();
    }
  } catch (e) {
    console.warn("Sound playback error:", e);
  }
}

// ---------------- PROMOTION ----------------

function needsPromotion(move) {
  const piece = game.board[move.from.r][move.from.c];
  if (!piece || piece[1] !== "P") return false;
  const lastRank = piece[0] === "w" ? 0 : 7;
  return move.to.r === lastRank;
}

function showPromotionPopup(move, onSelect) {
  const popup = document.createElement("div");
  popup.classList.add("promotion-popup");

  const color = game.board[move.from.r][move.from.c][0];
  const promoPieces = ["Q","R","B","N","S"];

  promoPieces.forEach(p => {
    const img = document.createElement("img");
    img.src = `assets/pieces/${color}${p}.svg`;
    img.addEventListener("click", () => {
      popup.remove();
      onSelect(p);
    });
    popup.appendChild(img);
  });

  document.body.appendChild(popup);
  const rect = boardEl.getBoundingClientRect();
  popup.style.left = `${rect.left + rect.width / 2 - popup.offsetWidth / 2}px`;
  popup.style.top = `${rect.top + rect.height / 2 - popup.offsetHeight / 2}px`;
}

// ---------------- RENDERING ----------------

function renderBoard() {
  boardEl.innerHTML = "";

  for (let r = 0; r < RANKS; r++) {
    for (let c = 0; c < FILES; c++) {
      const square = document.createElement("div");
      square.classList.add("square");
      if ((r + c) % 2 === 0) square.classList.add("light");
      else square.classList.add("dark");

      square.dataset.r = r;
      square.dataset.c = c;

      if (lastMove) {
        if (
          (lastMove.from.r === r && lastMove.from.c === c) ||
          (lastMove.to.r === r && lastMove.to.c === c)
        ) {
          square.classList.add("last-move");
        }
      }

      if (selected && selected.r === r && selected.c === c) {
        square.classList.add("selected");
      }

      if (selected) {
        const isLegal = legalMoves.some(m => m.to.r === r && m.to.c === c);
        if (isLegal) square.classList.add("highlight");
      }

      const piece = game.board[r][c];
      if (piece && !(dragging && dragging.r === r && dragging.c === c)) {
        const img = document.createElement("img");
        img.src = pieceToImage(piece);
        square.appendChild(img);
      }

      square.addEventListener("mousedown", onSquareMouseDown);
      square.addEventListener("mouseup", onSquareMouseUp);
      square.addEventListener("click", onSquareClick);

      if (r === RANKS - 1) {
        const label = document.createElement("div");
        label.classList.add("label", "file-label");
        label.textContent = filesLabels[c];
        square.appendChild(label);
      }
      if (c === 0) {
        const label = document.createElement("div");
        label.classList.add("label", "rank-label");
        label.textContent = (RANKS - r).toString();
        square.appendChild(label);
      }

      boardEl.appendChild(square);
    }
  }

  renderMoveHistory();
  renderStatus();
}

function pieceToImage(piece) {
  if (!piece) return "";
  const color = piece[0] === "w" ? "white" : "black";
  const type = piece[1];
  return `assets/pieces/${color}${type}.svg`;
}

function renderMoveHistory() {
  moveHistoryEl.innerHTML = "";
  game.moveHistory.forEach((m, idx) => {
    const item = document.createElement("div");
    item.textContent = `${idx + 1}. ${coordToAlgebraic(m.from)}-${coordToAlgebraic(m.to)}${m.promotion ? "="+m.promotion : ""}`;
    moveHistoryEl.appendChild(item);
  });
}

function renderStatus() {
  let text = `Turn: ${game.turn === "w" ? "White" : "Black"}`;
  if (aiThinking) text += " (AI thinking...)";
  statusEl.textContent = text;
}

function coordToAlgebraic(pos) {
  return filesLabels[pos.c] + (RANKS - pos.r);
}

// ---------------- INPUT ----------------

function onSquareClick(e) {
  if (aiThinking) return;
  if (aiSide && game.turn === aiSide && aiSide !== "both") return;

  const r = parseInt(e.currentTarget.dataset.r);
  const c = parseInt(e.currentTarget.dataset.c);
  const piece = game.board[r][c];

  if (!selected) {
    if (piece && piece[0] === game.turn) {
      selected = { r, c };
      legalMoves = getLegalMoves(game).filter(
        m => m.from.r === r && m.from.c === c
      );
    }
    renderBoard();
    return;
  }

  const move = legalMoves.find(m => m.to.r === r && m.to.c === c);
  if (move) handleMove(move);

  selected = null;
  legalMoves = [];
  renderBoard();
}

function onSquareMouseDown(e) {
  if (aiThinking) return;
  if (aiSide && game.turn === aiSide && aiSide !== "both") return;

  const r = parseInt(e.currentTarget.dataset.r);
  const c = parseInt(e.currentTarget.dataset.c);
  const piece = game.board[r][c];
  if (!piece || piece[0] !== game.turn) return;

  selected = { r, c };
  legalMoves = getLegalMoves(game).filter(
    m => m.from.r === r && m.from.c === c
  );

  dragging = { r, c };
  dragImg = document.createElement("img");
  dragImg.src = pieceToImage(piece);
  dragImg.style.position = "fixed";
  dragImg.style.pointerEvents = "none";
  dragImg.style.width = "8vmin";
  dragImg.style.height = "8vmin";
  document.body.appendChild(dragImg);

  document.addEventListener("mousemove", onMouseMove);
  renderBoard();
}

function onMouseMove(e) {
  if (!dragImg) return;
  dragImg.style.left = e.clientX - dragImg.offsetWidth / 2 + "px";
  dragImg.style.top = e.clientY - dragImg.offsetHeight / 2 + "px";
}

function onSquareMouseUp(e) {
  if (!dragging) return;

  const r = parseInt(e.currentTarget.dataset.r);
  const c = parseInt(e.currentTarget.dataset.c);

  const move = legalMoves.find(m => m.to.r === r && m.to.c === c);
  if (move) handleMove(move);

  dragging = null;
  selected = null;
  legalMoves = [];
  if (dragImg) {
    dragImg.remove();
    dragImg = null;
  }
  document.removeEventListener("mousemove", onMouseMove);
  renderBoard();
}

// ---------------- MOVE EXECUTION ----------------

function handleMove(move) {
  const fromPiece = game.board[move.from.r][move.from.c];
  const targetPiece = game.board[move.to.r][move.to.c];

  if (needsPromotion(move)) {
    showPromotionPopup(move, promo => {
      move.promotion = promo;
      makeMove(game, move);
      lastMove = move;
      playMoveSound(fromPiece, targetPiece, true);
      renderBoard();
      maybeAIMove();
    });
  } else {
    makeMove(game, move);
    lastMove = move;
    playMoveSound(fromPiece, targetPiece, false);
    renderBoard();
    maybeAIMove();
  }
}

// ---------------- AI ----------------

function aiShouldMove() {
  if (!aiSide) return false;
  if (aiSide === "both") return true;
  return game.turn === aiSide;
}

function aiMakeMove() {
  if (!aiShouldMove()) return;

  aiThinking = true;
  renderStatus();

  setTimeout(() => {
    const move = getBestMove(game, aiDepth);
    if (move) {
      const fromPiece = game.board[move.from.r][move.from.c];
      const targetPiece = game.board[move.to.r][move.to.c];
      makeMove(game, move);
      lastMove = move;
      playMoveSound(fromPiece, targetPiece, !!move.promotion);
      renderBoard();
    }
    aiThinking = false;
    renderStatus();
    if (aiSide === "both") aiMakeMove();
  }, 200);
}

function maybeAIMove() {
  if (!aiSide) return;
  aiMakeMove();
}

// ---------------- CONTROLS ----------------

aiSelectEl.addEventListener("change", e => {
  const val = e.target.value;
  if (val === "none") aiSide = null;
  else if (val === "both") aiSide = "both";
  else aiSide = val;
  maybeAIMove();
});

aiLevelEl.addEventListener("change", e => {
  aiDepth = parseInt(e.target.value, 10) || 2;
});

newGameBtn.addEventListener("click", () => {
  game = newGame();
  selected = null;
  legalMoves = [];
  lastMove = null;
  dragging = null;
  if (dragImg) {
    dragImg.remove();
    dragImg = null;
  }
  renderBoard();
  maybeAIMove();
});

// ---------------- INIT ----------------

renderBoard();
maybeAIMove();