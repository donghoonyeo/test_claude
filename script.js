const BOMB_CHANCE = 0.08;
const BOMB_EXPLOSION_MULTIPLIER = 3;

const boardEl = document.getElementById('board');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlayEl = document.getElementById('overlay');
const overlayMsgEl = document.getElementById('overlay-msg');

let grid = [];
let score = 0;
let best = Number(localStorage.getItem('2048bomb-best') || 0);
let cells = []; // DOM cell references
let animId = 0;

// createEmptyGrid, getEmptyPositions, canMerge, mergeValues, mergeLineLeft,
// linesEqual, and hasMovesLeft are defined in logic.js.

function spawnTile(g) {
  const empties = getEmptyPositions(g);
  if (empties.length === 0) return null;
  const [r, c] = empties[Math.floor(Math.random() * empties.length)];
  const isBomb = Math.random() < BOMB_CHANCE;
  g[r][c] = isBomb ? 'B' : (Math.random() < 0.9 ? 2 : 4);
  return [r, c];
}

// direction: 'left' | 'right' | 'up' | 'down'
function move(direction) {
  const newGrid = createEmptyGrid();
  let moved = false;
  let scoreGain = 0;
  const bombMergePositions = []; // {r,c} of tiles created by a bomb merge this move

  const getLine = (idx) => {
    if (direction === 'left' || direction === 'right') {
      const row = grid[idx].slice();
      return direction === 'right' ? row.reverse() : row;
    } else {
      const col = grid.map(row => row[idx]);
      return direction === 'down' ? col.reverse() : col;
    }
  };

  const setLine = (idx, resultLine, bombIndices) => {
    const finalLine = (direction === 'right' || direction === 'down')
      ? resultLine.slice().reverse()
      : resultLine;

    const bombPosSet = new Set(
      bombIndices.map(bi => (direction === 'right' || direction === 'down') ? (SIZE - 1 - bi) : bi)
    );

    for (let k = 0; k < SIZE; k++) {
      if (direction === 'left' || direction === 'right') {
        newGrid[idx][k] = finalLine[k];
        if (bombPosSet.has(k)) bombMergePositions.push([idx, k]);
      } else {
        newGrid[k][idx] = finalLine[k];
        if (bombPosSet.has(k)) bombMergePositions.push([k, idx]);
      }
    }
  };

  for (let idx = 0; idx < SIZE; idx++) {
    const line = getLine(idx);
    const { result, scoreGain: gain, bombIndices } = mergeLineLeft(line);
    if (!linesEqual(line, result)) moved = true;
    scoreGain += gain;
    setLine(idx, result, bombIndices);
  }

  return { newGrid, moved, scoreGain, bombMergePositions };
}

function triggerExplosions(g, count, excludePositions) {
  const excluded = new Set(excludePositions.map(([r, c]) => `${r},${c}`));
  let bonus = 0;
  const exploded = [];

  for (let n = 0; n < count; n++) {
    let maxVal = -1;
    let candidates = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const key = `${r},${c}`;
        if (g[r][c] === 0 || g[r][c] === 'B' || excluded.has(key)) continue;
        if (g[r][c] > maxVal) {
          maxVal = g[r][c];
          candidates = [[r, c]];
        } else if (g[r][c] === maxVal) {
          candidates.push([r, c]);
        }
      }
    }
    if (candidates.length === 0) continue;
    const [er, ec] = candidates[Math.floor(Math.random() * candidates.length)];
    bonus += maxVal * BOMB_EXPLOSION_MULTIPLIER;
    exploded.push([er, ec, maxVal]);
    g[er][ec] = 0;
    excluded.add(`${er},${ec}`);
  }

  return { bonus, exploded };
}

function buildBoardDom() {
  boardEl.innerHTML = '';
  cells = [];
  for (let r = 0; r < SIZE; r++) {
    const rowCells = [];
    for (let c = 0; c < SIZE; c++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      boardEl.appendChild(cell);
      rowCells.push(cell);
    }
    cells.push(rowCells);
  }
}

function render(explodedTiles = []) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cells[r][c].innerHTML = '';
    }
  }
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = grid[r][c];
      if (v === 0) continue;
      const tile = document.createElement('div');
      tile.className = 'tile';
      if (v === 'B') {
        tile.classList.add('bomb');
        tile.textContent = '💣';
      } else {
        tile.dataset.v = v;
        tile.textContent = v;
      }
      cells[r][c].appendChild(tile);
    }
  }
  for (const [r, c, val] of explodedTiles) {
    const ghost = document.createElement('div');
    ghost.className = 'tile exploding';
    ghost.dataset.v = val;
    ghost.textContent = val;
    cells[r][c].appendChild(ghost);
  }
  scoreEl.textContent = score;
  bestEl.textContent = best;
}

function doMove(direction) {
  const { newGrid, moved, scoreGain, bombMergePositions } = move(direction);
  if (!moved) return;

  grid = newGrid;
  score += scoreGain;

  const { bonus, exploded } = triggerExplosions(grid, bombMergePositions.length, bombMergePositions);
  score += bonus;

  spawnTile(grid);

  if (score > best) {
    best = score;
    localStorage.setItem('2048bomb-best', String(best));
  }

  render(exploded);

  if (!hasMovesLeft(grid)) {
    showOverlay(`게임 오버! 점수 ${score}`);
  }
}

function showOverlay(msg) {
  overlayMsgEl.textContent = msg;
  overlayEl.classList.remove('hidden');
}

function hideOverlay() {
  overlayEl.classList.add('hidden');
}

function newGame() {
  grid = createEmptyGrid();
  score = 0;
  spawnTile(grid);
  spawnTile(grid);
  hideOverlay();
  render();
}

const KEY_MAP = {
  ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
  a: 'left', d: 'right', w: 'up', s: 'down',
};

window.addEventListener('keydown', (e) => {
  const dir = KEY_MAP[e.key];
  if (!dir) return;
  e.preventDefault();
  doMove(dir);
});

// touch swipe support
let touchStartX = null;
let touchStartY = null;
boardEl.addEventListener('touchstart', (e) => {
  const t = e.changedTouches[0];
  touchStartX = t.clientX;
  touchStartY = t.clientY;
}, { passive: true });

boardEl.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const t = e.changedTouches[0];
  const dx = t.clientX - touchStartX;
  const dy = t.clientY - touchStartY;
  const absX = Math.abs(dx), absY = Math.abs(dy);
  if (Math.max(absX, absY) < 20) return;
  if (absX > absY) {
    doMove(dx > 0 ? 'right' : 'left');
  } else {
    doMove(dy > 0 ? 'down' : 'up');
  }
  touchStartX = null;
  touchStartY = null;
}, { passive: true });

document.getElementById('restart').addEventListener('click', newGame);
document.getElementById('overlay-restart').addEventListener('click', newGame);

buildBoardDom();
newGame();
