/**
 * tm-engine.js
 * ─────────────────────────────────────────────────
 * Pure Turing Machine engine — no DOM, no UI.
 * Independently testable.
 *
 * Model: (Q, Σ, Γ, δ, q0, q_halt)
 *   Tape: sparse array (Map<int, symbol>), head at position 0..n
 *   Transitions: Map<"state,symbol" → {write, move, next}>
 *   Move: 'L' | 'R' | 'S'
 *   Blank symbol: '_'
 *
 * Two machines are defined:
 *   INCREMENT  — computes binary successor
 *   DECREMENT  — computes binary predecessor
 *
 * Both machines:
 *   1. Scan right to find the rightmost cell (first blank after string)
 *   2. Move left one step (to LSB)
 *   3. Propagate carry/borrow leftward
 *   4. Halt in ACCEPT state when done, REJECT if input is invalid/zero
 */

'use strict';

// ─── SYMBOL CONSTANTS ───────────────────────────────────────────
const SYM = Object.freeze({ ZERO: '0', ONE: '1', BLANK: '_' });
const MOVE = Object.freeze({ LEFT: 'L', RIGHT: 'R', STAY: 'S' });

// ─── TAPE CLASS ──────────────────────────────────────────────────
class Tape {
  constructor(symbols = []) {
    this._cells = new Map();
    symbols.forEach((s, i) => {
      if (s !== SYM.BLANK) this._cells.set(i, s);
    });
    this._leftmost = 0;
    this._rightmost = symbols.length > 0 ? symbols.length - 1 : 0;
  }

  read(pos) {
    return this._cells.get(pos) ?? SYM.BLANK;
  }

  write(pos, sym) {
    if (sym === SYM.BLANK) {
      this._cells.delete(pos);
    } else {
      this._cells.set(pos, sym);
      this._leftmost = Math.min(this._leftmost, pos);
      this._rightmost = Math.max(this._rightmost, pos);
    }
  }

  /** Return visible tape as array [{pos, sym}, ...] with 2-cell padding on each side */
  toArray() {
    const left  = this._leftmost - 2;
    const right = this._rightmost + 2;
    const arr = [];
    for (let i = left; i <= right; i++) {
      arr.push({ pos: i, sym: this.read(i) });
    }
    return arr;
  }

  /** Return the meaningful binary string (trim blanks) */
  toBinaryString() {
    const arr = [];
    for (let i = this._leftmost; i <= this._rightmost; i++) {
      arr.push(this.read(i));
    }
    // Trim trailing blanks (shouldn't exist but defensive)
    while (arr.length > 1 && arr[arr.length - 1] === SYM.BLANK) arr.pop();
    // Convert blanks that remain to '0' (blank in middle shouldn't happen in valid runs)
    return arr.map(s => s === SYM.BLANK ? '0' : s).join('');
  }

  clone() {
    const t = new Tape();
    t._cells = new Map(this._cells);
    t._leftmost = this._leftmost;
    t._rightmost = this._rightmost;
    return t;
  }
}

// ─── TRANSITION TABLE DEFINITIONS ────────────────────────────────
/**
 * INCREMENT MACHINE
 * States:
 *   q_seek_end : scan rightward to find first blank (past LSB)
 *   q_carry    : moving leftward, propagating carry
 *   q_done     : halted accept
 *   q_reject   : halted reject (empty input)
 *
 * Tape convention: binary string at positions 0..n-1, head starts at 0.
 * MSB is leftmost (position 0). LSB is rightmost (position n-1).
 *
 * Algorithm:
 *   q_seek_end: scan right until blank
 *   [blank reached] → move left, enter q_carry
 *   q_carry reading '1' → write '0', move left, stay q_carry  (carry continues)
 *   q_carry reading '0' → write '1', move right, enter q_done  (carry absorbed)
 *   q_carry reading '_' → write '1', move right, enter q_done  (overflow: new MSB)
 */
const INCREMENT_TRANSITIONS = [
  // { from, read, write, move, to }
  { from: 'q_seek_end', read: '0', write: '0', move: 'R', to: 'q_seek_end' },
  { from: 'q_seek_end', read: '1', write: '1', move: 'R', to: 'q_seek_end' },
  { from: 'q_seek_end', read: '_', write: '_', move: 'L', to: 'q_carry'    },

  { from: 'q_carry',    read: '1', write: '0', move: 'L', to: 'q_carry'    },
  { from: 'q_carry',    read: '0', write: '1', move: 'S', to: 'q_done'     },
  { from: 'q_carry',    read: '_', write: '1', move: 'S', to: 'q_done'     },  // overflow
];

/**
 * DECREMENT MACHINE
 * States:
 *   q_seek_end : scan rightward to find first blank
 *   q_borrow   : moving leftward, propagating borrow
 *   q_done     : halted accept
 *   q_reject   : halted reject (input is zero)
 *
 * Algorithm:
 *   q_seek_end: scan right until blank
 *   [blank reached] → move left, enter q_borrow
 *   q_borrow reading '0' → write '1', move left, stay q_borrow  (borrow continues)
 *   q_borrow reading '1' → write '0', move S, enter q_done       (borrow absorbed)
 *   q_borrow reading '_' → reject (was all-zeros, i.e. input = "0")
 */
const DECREMENT_TRANSITIONS = [
  { from: 'q_seek_end', read: '0', write: '0', move: 'R', to: 'q_seek_end' },
  { from: 'q_seek_end', read: '1', write: '1', move: 'R', to: 'q_seek_end' },
  { from: 'q_seek_end', read: '_', write: '_', move: 'L', to: 'q_borrow'   },

  { from: 'q_borrow',   read: '0', write: '1', move: 'L', to: 'q_borrow'   },
  { from: 'q_borrow',   read: '1', write: '0', move: 'S', to: 'q_done'     },
  { from: 'q_borrow',   read: '_', write: '_', move: 'S', to: 'q_reject'   },  // input was zero
];

// ─── MACHINE FACTORY ─────────────────────────────────────────────
function buildTransitionMap(rules) {
  const map = new Map();
  for (const r of rules) {
    map.set(`${r.from},${r.read}`, r);
  }
  return map;
}

const MACHINES = {
  increment: {
    name: 'Binary Incrementer',
    transitions: INCREMENT_TRANSITIONS,
    transitionMap: buildTransitionMap(INCREMENT_TRANSITIONS),
    initialState: 'q_seek_end',
    haltStates: new Set(['q_done', 'q_reject']),
    acceptState: 'q_done',
    rejectState: 'q_reject',
    states: ['q_seek_end', 'q_carry', 'q_done', 'q_reject'],
  },
  decrement: {
    name: 'Binary Decrementer',
    transitions: DECREMENT_TRANSITIONS,
    transitionMap: buildTransitionMap(DECREMENT_TRANSITIONS),
    initialState: 'q_seek_end',
    haltStates: new Set(['q_done', 'q_reject']),
    acceptState: 'q_done',
    rejectState: 'q_reject',
    states: ['q_seek_end', 'q_borrow', 'q_done', 'q_reject'],
  },
};

// ─── TM CONFIGURATION (one snapshot) ────────────────────────────
class TMConfig {
  constructor(tape, head, state) {
    this.tape  = tape;       // Tape instance
    this.head  = head;       // integer position
    this.state = state;      // string
  }
  clone() {
    return new TMConfig(this.tape.clone(), this.head, this.state);
  }
}

// ─── TM SIMULATOR ────────────────────────────────────────────────
class TuringMachine {
  /**
   * @param {string} operation - 'increment' | 'decrement'
   * @param {string} input     - binary string e.g. "1011"
   */
  constructor(operation, input) {
    this.operation = operation;
    this.machine   = MACHINES[operation];
    this.input     = input;

    // Build initial tape
    const syms = input.split('');
    const tape  = new Tape(syms);

    this.config  = new TMConfig(tape, 0, this.machine.initialState);
    this.history = [this.config.clone()];  // history[0] = initial
    this.steps   = 0;
    this.halted  = false;
    this.accepted = false;
    this.lastTransition = null;   // the rule applied in last step
    this.MAX_STEPS = 2000;
    this.limitReached = false;
  }

  /** Apply one transition. Returns false if already halted. */
  step() {
    if (this.halted) return false;

    const { tape, head, state } = this.config;
    const sym = tape.read(head);
    const key = `${state},${sym}`;
    const rule = this.machine.transitionMap.get(key);

    if (!rule) {
      // Undefined transition — treat as reject
      this.halted = true;
      this.accepted = false;
      this.lastTransition = { from: state, read: sym, write: sym, move: 'S', to: 'q_reject', undefined: true };
      return false;
    }

    // Apply transition
    tape.write(head, rule.write);
    let newHead = head;
    if      (rule.move === 'L') newHead = head - 1;
    else if (rule.move === 'R') newHead = head + 1;
    // 'S' = stay

    this.config.head  = newHead;
    this.config.state = rule.to;
    this.steps++;
    this.lastTransition = rule;

    // Snapshot for history
    this.history.push(this.config.clone());

    // Check halt
    if (this.machine.haltStates.has(rule.to)) {
      this.halted = true;
      this.accepted = (rule.to === this.machine.acceptState);
    }

    if (this.steps >= this.MAX_STEPS) {
      this.halted = true;
      this.accepted = false;
      this.limitReached = true;
    }

    return true;
  }

  /** Run to completion. Returns this. */
  runAll() {
    while (!this.halted) this.step();
    return this;
  }

  /** Get the result binary string (meaningful tape content after halting) */
  get resultString() {
    if (!this.halted || !this.accepted) return null;
    return this.config.tape.toBinaryString();
  }

  /** Restore to a previous config snapshot */
  seekHistory(idx) {
    if (idx < 0 || idx >= this.history.length) return;
    this.config = this.history[idx].clone();
    this.steps  = idx;
    if (idx < this.history.length - 1) {
      this.halted = false;
      this.accepted = false;
      this.limitReached = false;
    } else {
      const finalState = this.history[idx].state;
      this.halted = this.machine.haltStates.has(finalState);
      this.accepted = (finalState === this.machine.acceptState);
    }
  }
}

// ─── INPUT VALIDATION ─────────────────────────────────────────────
/**
 * Returns { valid: bool, error: string|null, canonical: string }
 * Conventions:
 *   - Only 0s and 1s allowed
 *   - Empty string not allowed
 *   - Decrement of "0" (or all-zeros) explicitly rejected here and in machine
 *   - Leading zeros preserved (fixed-width convention)
 */
function validateInput(input, operation) {
  if (!input || input.trim() === '') {
    return { valid: false, error: 'Input is empty.' };
  }
  const clean = input.trim();
  if (!/^[01]+$/.test(clean)) {
    return { valid: false, error: 'Invalid characters. Only 0 and 1 allowed.' };
  }
  if (clean.length > 32) {
    return { valid: false, error: 'Maximum 32 bits supported.' };
  }
  if (operation === 'decrement' && /^0+$/.test(clean)) {
    return { valid: false, error: 'Cannot decrement zero.' };
  }
  return { valid: true, error: null, canonical: clean };
}

// ─── EXPORTS (module-free, attach to window) ──────────────────────
window.TM = {
  SYM,
  MOVE,
  Tape,
  TMConfig,
  TuringMachine,
  MACHINES,
  validateInput,
  INCREMENT_TRANSITIONS,
  DECREMENT_TRANSITIONS,
};
