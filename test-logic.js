// Tiny dependency-free test runner for logic.js.
// Open test.html in a browser to run these assertions — no build step,
// consistent with the rest of this project.
let passed = 0;
let failed = 0;
const results = [];

function record(ok, message, extra) {
  if (ok) passed++; else failed++;
  results.push(`${ok ? 'PASS' : 'FAIL'} - ${message}${ok ? '' : ` — ${extra}`}`);
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  record(ok, message, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function assertTrue(actual, message) {
  record(actual === true, message, `expected true, got ${JSON.stringify(actual)}`);
}

function assertFalse(actual, message) {
  record(actual === false, message, `expected false, got ${JSON.stringify(actual)}`);
}

// --- createEmptyGrid ---
assertEqual(
  createEmptyGrid(),
  [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]],
  'createEmptyGrid returns a 4x4 grid of zeros'
);

// --- getEmptyPositions ---
assertEqual(
  getEmptyPositions([
    [0, 2, 0, 4],
    [8, 0, 0, 0],
    [2, 2, 2, 2],
    [4, 4, 4, 4],
  ]),
  [[0, 0], [0, 2], [1, 1], [1, 2], [1, 3]],
  'getEmptyPositions finds every zero cell'
);
assertEqual(
  getEmptyPositions([
    [2, 2, 2, 2],
    [2, 2, 2, 2],
    [2, 2, 2, 2],
    [2, 2, 2, 2],
  ]),
  [],
  'getEmptyPositions returns [] for a full board'
);

// --- canMerge ---
assertTrue(canMerge(2, 2), 'canMerge: equal numbers can merge');
assertFalse(canMerge(2, 4), 'canMerge: different numbers cannot merge');
assertFalse(canMerge(0, 2), 'canMerge: an empty cell cannot merge');
assertTrue(canMerge('B', 2), 'canMerge: a bomb can merge with any number');
assertTrue(canMerge('B', 'B'), 'canMerge: a bomb can merge with a bomb');

// --- mergeValues ---
assertEqual(
  mergeValues(2, 2),
  { value: 4, bomb: false, scoreGain: 4 },
  'mergeValues: two equal numbers double and score'
);
assertEqual(
  mergeValues('B', 4),
  { value: 8, bomb: true, scoreGain: 0 },
  'mergeValues: bomb + number doubles the number, flags a bomb merge, scores nothing'
);
assertEqual(
  mergeValues(4, 'B'),
  { value: 8, bomb: true, scoreGain: 0 },
  'mergeValues: number + bomb doubles the number, flags a bomb merge, scores nothing'
);
assertEqual(
  mergeValues('B', 'B'),
  { value: 4, bomb: false, scoreGain: 4 },
  'mergeValues: bomb + bomb becomes a plain 4 tile (not a bomb merge)'
);

// --- mergeLineLeft ---
assertEqual(
  mergeLineLeft([2, 2, 0, 0]).result,
  [4, 0, 0, 0],
  'mergeLineLeft: merges adjacent equal tiles to the left'
);
assertEqual(
  mergeLineLeft([2, 2, 0, 0]).scoreGain,
  4,
  'mergeLineLeft: reports the score gained from a merge'
);
assertEqual(
  mergeLineLeft([2, 0, 2, 2]).result,
  [4, 2, 0, 0],
  'mergeLineLeft: compresses gaps, then merges only the first eligible pair'
);
assertEqual(
  mergeLineLeft([2, 4, 8, 16]).result,
  [2, 4, 8, 16],
  'mergeLineLeft: leaves a line with no possible merges unchanged'
);
{
  const r = mergeLineLeft([0, 'B', 4, 0]);
  assertEqual(r.result, [8, 0, 0, 0], 'mergeLineLeft: a bomb merges with an adjacent number and doubles it');
  assertEqual(r.bombIndices, [0], 'mergeLineLeft: reports the output index where a bomb merge landed');
}

// --- linesEqual ---
assertTrue(linesEqual([1, 2, 3], [1, 2, 3]), 'linesEqual: identical arrays are equal');
assertFalse(linesEqual([1, 2, 3], [1, 2, 4]), 'linesEqual: arrays differing in one value are not equal');
assertFalse(linesEqual([1, 2], [1, 2, 3]), 'linesEqual: arrays of different lengths are not equal');

// --- hasMovesLeft ---
assertTrue(hasMovesLeft(createEmptyGrid()), 'hasMovesLeft: an empty board always has a move');
assertTrue(
  hasMovesLeft([
    [2, 4, 8, 16],
    [4, 8, 16, 32],
    [8, 16, 32, 64],
    [16, 32, 64, 64],
  ]),
  'hasMovesLeft: a full board with one adjacent equal pair has a move'
);
assertFalse(
  hasMovesLeft([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ]),
  'hasMovesLeft: a full board with no adjacent equal tiles has no moves'
);
assertTrue(
  hasMovesLeft([
    [2, 'B', 4, 8],
    [4, 8, 16, 32],
    [8, 16, 32, 64],
    [16, 32, 64, 128],
  ]),
  'hasMovesLeft: a bomb tile next to any number always counts as a move'
);

const summary = `${passed} passed, ${failed} failed`;
document.getElementById('output').textContent = `${results.join('\n')}\n\n${summary}`;
console.log(results.join('\n'));
console.log(summary);
if (failed > 0) {
  console.error(`${failed} test(s) failed`);
}
