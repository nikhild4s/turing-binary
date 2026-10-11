/**
 * app.js  v2 — User-Friendly Update
 * ─────────────────────────────────────────────────
 * UI controller connecting TM engine to DOM.
 * New in v2:
 *   - Plain-English narration bar
 *   - Friendly state descriptions
 *   - Human-readable transition log
 *   - Technical Details panel toggle
 *   - Larger controls, speed descriptions
 */

'use strict';

// ─── EXAMPLE INPUTS ──────────────────────────────────────────────
const EXAMPLES = [
  { input: '1011',     op: 'increment', note: '+1 → 1100 (carry)' },
  { input: '1111',     op: 'increment', note: '+1 → 10000 (overflow!)' },
  { input: '0111',     op: 'increment', note: '+1 → 1000' },
  { input: '1',        op: 'increment', note: '+1 → 10' },
  { input: '10110101', op: 'increment', note: '+1 multi-bit' },
  { input: '1011',     op: 'decrement', note: '−1 → 1010' },
  { input: '1000',     op: 'decrement', note: '−1 → 0111 (borrow)' },
  { input: '10000',    op: 'decrement', note: '−1 → 01111' },
  { input: '0001',     op: 'decrement', note: '−1 → 0000' },
];

// ─── SPEED MAP (ms per step) ─────────────────────────────────────
const SPEED_MAP  = { 1: 1200, 2: 700, 3: 380, 4: 160, 5: 60 };
const SPEED_DESC = {
  1: 'Very slow: great for following each step carefully',
  2: 'Slow: easy to track the head movement',
  3: 'Medium speed: good for learning',
  4: 'Fast: good for watching the pattern',
  5: 'Maximum speed: see the result instantly',
};

// ─── PLAIN-ENGLISH STATE DESCRIPTIONS ────────────────────────────
const STATE_FRIENDLY = {
  q_seek_end: 'Scanning right',
  q_carry:    'Propagating carry (left)',
  q_borrow:   'Propagating borrow (left)',
  q_done:     'Halted: accepted',
  q_reject:   'Halted: rejected',
};

// ─── NARRATION GENERATOR ─────────────────────────────────────────
function getNarration(state, rule, operation) {
  if (!rule) {
    return `Enter a binary number on the left, choose an operation, then press <strong>Run</strong> to watch the Turing Machine work step by step.`;
  }

  // Scanning phase
  if (rule.from === 'q_seek_end' && rule.read !== '_') {
    return `<strong>Scanning right.</strong> The machine is moving right to find the end of the binary string. It read <strong>'${rule.read}'</strong> and kept going.`;
  }
  if (rule.from === 'q_seek_end' && rule.read === '_') {
    return `<strong>End of tape found.</strong> The machine hit a blank cell, meaning it has passed the last bit. It now steps back left to begin the <strong>${operation === 'increment' ? 'carry' : 'borrow'}</strong> phase.`;
  }

  // Increment carry phase
  if (rule.from === 'q_carry') {
    if (rule.read === '1') {
      return `<strong>Carry propagating.</strong> Found a <strong>1</strong>. Flipped it to <strong>0</strong> and moved left. (In binary addition: 1 + 1 = 0 with a carry to the left.)`;
    }
    if (rule.read === '0') {
      return `<strong>Carry absorbed.</strong> Found a <strong>0</strong>. Set it to <strong>1</strong> and stopped. The carry has been resolved. Increment is <strong>complete</strong>.`;
    }
    if (rule.read === '_') {
      return `<strong>Overflow.</strong> All bits were 1s. A new leading <strong>1</strong> was written, making the number one bit longer. For example: 1111 becomes 10000.`;
    }
  }

  // Decrement borrow phase
  if (rule.from === 'q_borrow') {
    if (rule.read === '0') {
      return `<strong>Borrow propagating.</strong> Found a <strong>0</strong>. Flipped it to <strong>1</strong> and moved left. (In binary subtraction: 0 - 1 = 1 with a borrow from the left.)`;
    }
    if (rule.read === '1') {
      return `<strong>Borrow absorbed.</strong> Found a <strong>1</strong>. Set it to <strong>0</strong> and stopped. The borrow has been resolved. Decrement is <strong>complete</strong>.`;
    }
    if (rule.read === '_') {
      return `<strong>Cannot decrement.</strong> The machine reached blank before finding any 1-bit. The input is zero and cannot be decremented further. Machine <strong>rejected</strong>.`;
    }
  }

  if (state === 'q_done') {
    return `<strong>Finished.</strong> The machine halted successfully. The tape now holds the ${operation === 'increment' ? 'incremented' : 'decremented'} binary value.`;
  }
  if (state === 'q_reject') {
    return `<strong>Rejected.</strong> The machine halted in a reject state. The input could not be processed.`;
  }

  return `State: <strong>${state}</strong>. Read '${rule.read}', wrote '${rule.write}', moved ${rule.move}.`;
}

// ─── LOG ENTRY DESCRIPTION ────────────────────────────────────────
function getLogDesc(step, fromState, rule) {
  if (!rule) return '';

  const r = rule.read  === '_' ? '<span class="read-sym">blank</span>' : `<span class="read-sym">'${rule.read}'</span>`;
  const w = rule.write === '_' ? '<span class="write-sym">blank</span>' : `<span class="write-sym">'${rule.write}'</span>`;
  const dir = rule.move === 'R' ? 'moved right' : rule.move === 'L' ? 'moved left' : 'stayed';
  const next = `<span class="state-name">${rule.to}</span>`;

  if (rule.from === 'q_seek_end' && rule.read !== '_') {
    return `Scanning: read ${r}, no change, ${dir}.`;
  }
  if (rule.from === 'q_seek_end' && rule.read === '_') {
    return `Reached blank (end of tape). Stepped left to begin ${rule.to === 'q_carry' ? 'carry' : 'borrow'} phase. Now in ${next}.`;
  }
  if (rule.from === 'q_carry') {
    if (rule.read === '1') return `Carry: read ${r}, wrote ${w} (1 becomes 0). Moved left, carry continues.`;
    if (rule.read === '0') return `Carry absorbed: read ${r}, wrote ${w} (0 becomes 1). Halted. Increment done. Now in ${next}.`;
    if (rule.read === '_') return `Overflow: all bits were 1. Wrote new leading ${w}. Halted. Now in ${next}.`;
  }
  if (rule.from === 'q_borrow') {
    if (rule.read === '0') return `Borrow: read ${r}, wrote ${w} (0 becomes 1). Moved left, borrow continues.`;
    if (rule.read === '1') return `Borrow absorbed: read ${r}, wrote ${w} (1 becomes 0). Halted. Decrement done. Now in ${next}.`;
    if (rule.read === '_') return `Reached blank before finding a 1. Input is zero. Rejected. Now in ${next}.`;
  }
  return `Read ${r}, wrote ${w}, ${dir}. Now in ${next}.`;
}


// ─── APP STATE ────────────────────────────────────────────────────
let tm          = null;
let operation   = 'increment';
let runInterval = null;
let isRunning   = false;
let speed       = 3;

// ─── DOM REFS ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);

const binaryInput         = $('binaryInput');
const inputValidation     = $('inputValidation');
const opIncrement         = $('opIncrement');
const opDecrement         = $('opDecrement');
const speedSlider         = $('speedSlider');
const speedDesc           = $('speedDesc');
const btnRun              = $('btnRun');
const btnStep             = $('btnStep');
const btnPause            = $('btnPause');
const btnReset            = $('btnReset');
const clearInputBtn       = $('clearInput');
const exampleList         = $('exampleList');
const machineStatusBadge  = $('machineStatusBadge');
const dispState           = $('dispState');
const dispStateFriendly   = $('dispStateFriendly');
const dispHead            = $('dispHead');
const dispRead            = $('dispRead');
const dispWrite           = $('dispWrite');
const dispMove            = $('dispMove');
const dispMoveFriendly    = $('dispMoveFriendly');
const dispSteps           = $('dispSteps');
const tapeTrack           = $('tapeTrack');
const tapeContainer       = $('tapeContainer');
const headIndicator       = $('headIndicator');
const headLabelTop        = $('headLabelTop');
const resultBanner        = $('resultBanner');
const resultLabel         = $('resultLabel');
const resultValue         = $('resultValue');
const resultMeta          = $('resultMeta');
const logBody             = $('logBody');
const clearLogBtn         = $('clearLog');
const transitionTableBody = $('transitionTableBody');
const infoStates          = $('infoStates');
const infoStart           = $('infoStart');
const infoHalt            = $('infoHalt');
const infoOp              = $('infoOp');
const infoToggle          = $('infoToggle');
const theoryDrawer        = $('theoryDrawer');
const techToggle          = $('techToggle');
const workspace           = document.querySelector('.workspace');
const narrationText       = $('narrationText');

// ─── INIT ─────────────────────────────────────────────────────────
function init() {
  buildExamples();
  setOperation('increment');
  renderTransitionTable('increment');
  updateMachineInfo('increment');
  updateBadge('idle');
  renderEmptyTape();

  binaryInput.addEventListener('input', onInputChange);
  binaryInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') startOrStep();
  });
  clearInputBtn.addEventListener('click', () => {
    binaryInput.value = '';
    onInputChange();
    binaryInput.focus();
  });
  opIncrement.addEventListener('click', () => setOperation('increment'));
  opDecrement.addEventListener('click', () => setOperation('decrement'));

  speedSlider.addEventListener('input', () => {
    speed = parseInt(speedSlider.value);
    speedDesc.textContent = SPEED_DESC[speed];
    document.documentElement.style.setProperty(
      '--step-duration',
      `${Math.min(SPEED_MAP[speed], 400)}ms`
    );
    if (isRunning) { pauseMachine(); runMachine(); }
  });

  btnRun.addEventListener('click',   startOrStep);
  btnStep.addEventListener('click',  stepOnce);
  btnPause.addEventListener('click', pauseMachine);
  btnReset.addEventListener('click', resetMachine);
  clearLogBtn.addEventListener('click', clearLog);

  infoToggle.addEventListener('click', toggleTheory);
  techToggle.addEventListener('click', toggleTechPanel);
}

// ─── THEORY DRAWER ────────────────────────────────────────────────
function toggleTheory() {
  const open = theoryDrawer.classList.toggle('open');
  theoryDrawer.setAttribute('aria-hidden', String(!open));
  infoToggle.setAttribute('aria-expanded', String(open));
  infoToggle.classList.toggle('active', open);
}

// ─── TECH PANEL TOGGLE ────────────────────────────────────────────
let techPanelOpen = false;
function toggleTechPanel() {
  techPanelOpen = !techPanelOpen;
  workspace.classList.toggle('tech-open', techPanelOpen);
  techToggle.classList.toggle('active', techPanelOpen);
  const panel = $('techPanel');
  panel.setAttribute('aria-hidden', String(!techPanelOpen));
}

// ─── OPERATION SELECTION ─────────────────────────────────────────
function setOperation(op) {
  operation = op;
  opIncrement.classList.toggle('active', op === 'increment');
  opDecrement.classList.toggle('active', op === 'decrement');
  renderTransitionTable(op);
  updateMachineInfo(op);
  onInputChange();
  if (tm) resetMachine();
}

// ─── EXAMPLES ────────────────────────────────────────────────────
function buildExamples() {
  EXAMPLES.forEach(ex => {
    const item = document.createElement('button');
    item.className = 'example-item';
    item.innerHTML = `
      <span class="ex-input">${ex.input}</span>
      <span class="ex-meta">${ex.note}</span>
      <span class="ex-load mono">load →</span>
    `;
    item.addEventListener('click', () => {
      binaryInput.value = ex.input;
      setOperation(ex.op);
      onInputChange();
      resetMachine();
    });
    exampleList.appendChild(item);
  });
}

// ─── INPUT VALIDATION ────────────────────────────────────────────
function onInputChange() {
  const val = binaryInput.value.trim();
  if (!val) {
    inputValidation.textContent = '';
    inputValidation.className   = 'input-validation';
    return;
  }
  const result = TM.validateInput(val, operation);
  if (result.valid) {
    inputValidation.textContent = `${val.length} bit${val.length !== 1 ? 's' : ''} · valid`;
    inputValidation.className   = 'input-validation ok';
  } else {
    inputValidation.textContent = result.error;
    inputValidation.className   = 'input-validation';
  }
}

// ─── MACHINE INIT ────────────────────────────────────────────────
function initMachine() {
  const val    = binaryInput.value.trim();
  const result = TM.validateInput(val, operation);
  if (!result.valid) {
    inputValidation.textContent = result.error;
    inputValidation.className   = 'input-validation';
    return false;
  }
  tm = new TM.TuringMachine(operation, result.canonical);
  hideResult();
  clearLog();
  renderTape();
  updateStateBar(null);
  updateBadge('idle');
  setNarration(null);
  return true;
}

// ─── CONTROLS ────────────────────────────────────────────────────
function startOrStep() {
  if (isRunning) return;
  if (!tm || tm.halted) {
    if (!initMachine()) return;
  }
  runMachine();
}

function runMachine() {
  if (isRunning) return;
  if (tm && tm.halted) return;
  isRunning = true;
  updateBadge('running');
  setControlState('running');
  runInterval = setInterval(() => {
    if (!tm || tm.halted) { finishRun(); return; }
    doStep();
  }, SPEED_MAP[speed]);
}

function pauseMachine() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(runInterval);
  runInterval = null;
  updateBadge('paused');
  setControlState('paused');
}

function stepOnce() {
  if (isRunning) pauseMachine();
  if (!tm) { if (!initMachine()) return; }
  if (tm.halted) return;
  doStep();
}

function resetMachine() {
  pauseMachine();
  tm        = null;
  isRunning = false;
  hideResult();
  clearLog();
  renderEmptyTape();
  updateStateBar(null);
  updateBadge('idle');
  setControlState('idle');
  setNarration(null);
  dispSteps.textContent = '0';
  dispState.textContent = '·';
  dispStateFriendly.textContent = 'Machine not started';
  dispHead.textContent  = '·';
  dispRead.textContent  = '·';
  dispWrite.textContent = '·';
  dispMove.textContent  = '·';
  dispMoveFriendly.textContent = 'Direction';
  clearActiveTransition();
}

function doStep() {
  if (!tm || tm.halted) { finishRun(); return; }

  const prevHead  = tm.config.head;
  const prevState = tm.config.state;

  tm.step();

  const rule = tm.lastTransition;
  updateStateBar(rule);
  renderTape(prevHead);
  appendLog(tm.steps, prevState, rule);
  dispSteps.textContent = tm.steps;
  setNarration(rule);

  if (rule) highlightActiveTransition(rule);
  if (tm.halted) finishRun();
}

function finishRun() {
  isRunning = false;
  clearInterval(runInterval);
  runInterval = null;
  if (!tm) return;

  if (tm.accepted) {
    showResult('accepted', tm.resultString, tm.steps);
    updateBadge('halted');
    narrationText.innerHTML = `<strong>Done.</strong> The machine halted successfully after <strong>${tm.steps}</strong> transitions. The binary number has been ${operation === 'increment' ? 'incremented' : 'decremented'}. The result is shown below.`;
  } else if (tm.limitReached) {
    showResult('rejected', 'LIMIT REACHED', tm.steps, `Stopped after ${tm.steps} steps.`);
    updateBadge('error');
    narrationText.innerHTML = `<strong>Step limit reached.</strong> The machine ran for ${tm.steps} steps without halting. Please reset and try again.`;
  } else {
    showResult('rejected', 'REJECTED', tm.steps,
      tm.lastTransition?.undefined ? 'Undefined transition.' : 'Cannot decrement zero.');
    updateBadge('error');
    narrationText.innerHTML = `<strong>Rejected.</strong> The machine halted in a reject state. ${operation === 'decrement' ? 'You cannot decrement zero. There is no smaller non-negative binary value.' : 'An undefined transition was encountered.'}`;
  }
  setControlState('halted');
}

// ─── NARRATION ───────────────────────────────────────────────────
function setNarration(rule) {
  const state = tm ? tm.config.state : null;
  narrationText.innerHTML = getNarration(state, rule, operation);
}

// ─── TAPE RENDERING ───────────────────────────────────────────────
function renderEmptyTape() {
  tapeTrack.innerHTML = '';
  const cells = [
    { pos: -2, sym: '_' },
    { pos: -1, sym: '_' },
    { pos:  0, sym: '_' },
    { pos:  1, sym: '_' },
    { pos:  2, sym: '_' },
  ];
  cells.forEach(c => tapeTrack.appendChild(makeCellEl(c.pos, c.sym, false)));
  positionHead(0);
}

function renderTape(prevWritePos) {
  if (!tm) return;
  const cells   = tm.config.tape.toArray();
  const headPos = tm.config.head;

  tapeTrack.innerHTML = '';
  cells.forEach(c => {
    const isActive = c.pos === headPos;
    const el = makeCellEl(c.pos, c.sym, isActive);
    // Flash the cell that was just written (the old head position)
    if (c.pos === prevWritePos && tm.lastTransition && tm.lastTransition.write !== tm.lastTransition.read) {
      el.classList.add('just-written');
    }
    tapeTrack.appendChild(el);
  });
  positionHead(headPos);
}

function makeCellEl(pos, sym, active) {
  const el = document.createElement('div');
  el.className = 'tape-cell'
    + (active ? ' active' : '')
    + (sym === '_' ? ' blank' : '');
  el.textContent = sym === '_' ? '␣' : sym;
  el.dataset.pos = pos;

  const idx = document.createElement('span');
  idx.className = 'cell-index';
  idx.textContent = pos;
  el.appendChild(idx);
  return el;
}

function positionHead(headPos) {
  const trackCells = Array.from(tapeTrack.children);
  const headCell   = trackCells.find(c => parseInt(c.dataset.pos) === headPos);
  if (!headCell) return;

  const containerRect = tapeContainer.getBoundingClientRect();
  const cellRect      = headCell.getBoundingClientRect();
  const center        = cellRect.left - containerRect.left + cellRect.width / 2;

  headIndicator.style.left = `${center}px`;
  headLabelTop.style.left  = `${center}px`;
  headLabelTop.style.transform = 'translateX(-50%)';
}

// ─── STATE BAR ────────────────────────────────────────────────────
function updateStateBar(rule) {
  if (!tm) return;
  const s = tm.config.state;

  dispState.textContent = s;
  dispStateFriendly.textContent = STATE_FRIENDLY[s] || s;
  dispHead.textContent  = tm.config.head;

  if (rule) {
    dispRead.textContent  = rule.read  === '_' ? '␣' : rule.read;
    dispWrite.textContent = rule.write === '_' ? '␣' : rule.write;
    dispMove.textContent  = rule.move;
    dispMoveFriendly.textContent =
      rule.move === 'R' ? 'Right →' :
      rule.move === 'L' ? 'Left ←'  : 'Stay';
  }

  // Color coding
  dispState.className = 'state-val mono'
    + (s === 'q_done'   ? ' green' : '')
    + (s === 'q_reject' ? ' red'   : '');
  dispRead.className  = 'state-val mono accent';
  dispWrite.className = 'state-val mono green';
}

// ─── TRANSITION TABLE ─────────────────────────────────────────────
function renderTransitionTable(op) {
  const rules = op === 'increment'
    ? TM.INCREMENT_TRANSITIONS
    : TM.DECREMENT_TRANSITIONS;

  transitionTableBody.innerHTML = '';
  rules.forEach(r => {
    const tr = document.createElement('tr');
    tr.dataset.from = r.from;
    tr.dataset.read = r.read;
    const isHalt = r.to === 'q_done' || r.to === 'q_reject';
    if (isHalt) tr.classList.add('halt-row');
    tr.innerHTML = `
      <td>${r.from}</td>
      <td class="sym">${r.read  === '_' ? '␣' : r.read}</td>
      <td class="sym">${r.write === '_' ? '␣' : r.write}</td>
      <td>${r.move}</td>
      <td>${r.to}</td>
    `;
    transitionTableBody.appendChild(tr);
  });
}

function highlightActiveTransition(rule) {
  clearActiveTransition();
  if (!rule || rule.undefined) return;
  transitionTableBody.querySelectorAll('tr').forEach(tr => {
    if (tr.dataset.from === rule.from && tr.dataset.read === rule.read) {
      tr.classList.add('active-transition');
      tr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });
}
function clearActiveTransition() {
  transitionTableBody.querySelectorAll('.active-transition')
    .forEach(r => r.classList.remove('active-transition'));
}

// ─── MACHINE INFO ─────────────────────────────────────────────────
function updateMachineInfo(op) {
  const m = TM.MACHINES[op];
  infoStates.textContent = m.states.join(', ');
  infoStart.textContent  = m.initialState;
  infoHalt.textContent   = [...m.haltStates].join(', ');
  infoOp.textContent     = m.name;
}

// ─── TRANSITION LOG (human-readable) ─────────────────────────────
function clearLog() {
  logBody.innerHTML = '';
  // Sticky column header
  const hdr = document.createElement('div');
  hdr.className = 'log-header-row';
  hdr.innerHTML = '<span>#</span><span>What happened</span>';
  logBody.appendChild(hdr);
}

function appendLog(step, fromState, rule) {
  if (!rule) return;

  // Remove initial empty-state message if present
  const empty = logBody.querySelector('.log-empty');
  if (empty) empty.remove();

  const prev = logBody.querySelector('.active-log');
  if (prev) prev.classList.remove('active-log');

  const entry = document.createElement('div');
  entry.className = 'log-entry active-log';
  entry.innerHTML = `
    <span class="log-step">${step}</span>
    <span class="log-desc">${getLogDesc(step, fromState, rule)}</span>
  `;
  logBody.appendChild(entry);
  entry.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

// ─── RESULT BANNER ────────────────────────────────────────────────
function showResult(type, value, steps, note) {
  resultBanner.className   = `result-banner ${type}`;
  resultLabel.textContent  = type === 'accepted' ? 'RESULT' : 'HALTED';
  resultValue.textContent  = value;
  const opName = operation === 'increment' ? 'Increment' : 'Decrement';
  resultMeta.textContent   = note
    ? note
    : `${opName} complete · ${steps} transition${steps !== 1 ? 's' : ''} executed`;
}
function hideResult() {
  resultBanner.className = 'result-banner hidden';
}

// ─── BADGE ───────────────────────────────────────────────────────
function updateBadge(state) {
  const labels = {
    idle: 'IDLE', running: 'RUNNING', halted: 'ACCEPTED',
    error: 'REJECTED', paused: 'PAUSED',
  };
  machineStatusBadge.textContent = labels[state] || 'IDLE';
  machineStatusBadge.className   = 'badge '
    + (state === 'running' ? 'running' :
       state === 'halted'  ? 'halted'  :
       state === 'error'   ? 'error'   :
       state === 'paused'  ? 'paused'  : '');
}

// ─── CONTROL STATE ────────────────────────────────────────────────
function setControlState(state) {
  btnRun.disabled   = state === 'running';
  btnPause.disabled = state !== 'running';
  btnStep.disabled  = state === 'running' || state === 'halted';

  if (state === 'paused') {
    btnRun.innerHTML = `<svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg> Resume`;
  } else {
    btnRun.innerHTML = `<svg width="15" height="15" viewBox="0 0 14 14" fill="none"><path d="M3 2l9 5-9 5V2z" fill="currentColor"/></svg> Run`;
  }
}

// ─── RESIZE: keep head centered ──────────────────────────────────
window.addEventListener('resize', () => {
  if (tm) positionHead(tm.config.head);
});

// ─── BOOT ─────────────────────────────────────────────────────────
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
