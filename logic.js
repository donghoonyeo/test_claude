// Pure game-logic functions, kept free of DOM access so they can be
// loaded standalone by test.html and exercised without a running game.
const SIZE = 4;

function createEmptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

function getEmptyPositions(g) {
  const out = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (g[r][c] === 0) out.push([r, c]);
    }
  }
  return out;
}

function canMerge(a, b) {
  if (a === 0 || b === 0) return false;
  if (a === 'B' || b === 'B') return true;
  return a === b;
}

function mergeValues(a, b) {
  if (a === 'B' && b === 'B') return { value: 4, bomb: false, scoreGain: 4 };
  if (a === 'B') return { value: b * 2, bomb: true, scoreGain: 0 };
  if (b === 'B') return { value: a * 2, bomb: true, scoreGain: 0 };
  return { value: a * 2, bomb: false, scoreGain: a * 2 };
}

// Merge a line of 4 cells, compressing toward index 0.
// Returns { line, scoreGain, bombIndices } where bombIndices are positions
// in the OUTPUT line where a bomb-merge produced a tile.
function mergeLineLeft(line) {
  const arr = line.filter(v => v !== 0);
  const result = [];
  const bombIndices = [];
  let scoreGain = 0;
  let i = 0;
  while (i < arr.length) {
    if (i + 1 < arr.length && canMerge(arr[i], arr[i + 1])) {
      const merged = mergeValues(arr[i], arr[i + 1]);
      if (merged.bomb) bombIndices.push(result.length);
      scoreGain += merged.scoreGain;
      result.push(merged.value);
      i += 2;
    } else {
      result.push(arr[i]);
      i += 1;
    }
  }
  while (result.length < SIZE) result.push(0);
  return { line, result, scoreGain, bombIndices };
}

function linesEqual(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function hasMovesLeft(g) {
  if (getEmptyPositions(g).length > 0) return true;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c];
      if (c + 1 < SIZE && canMerge(v, g[r][c + 1])) return true;
      if (r + 1 < SIZE && canMerge(v, g[r + 1][c])) return true;
    }
  }
  return false;
}
