# TURING — Binary Incrementer / Decrementer
### Theory of Computation · Interactive Turing Machine Simulator

---

## Overview

A browser-based Turing Machine simulator that computes the **binary successor (increment)** and **binary predecessor (decrement)** of any binary string using genuine Turing Machine transition rules — not JavaScript arithmetic.

This project is an academic submission for the Theory of Computation course, Topic 12: Binary Incrementer/Decrementer.

---

## Quick Start

No build step. No server. No dependencies to install.

```
Double-click  index.html  to open it in your browser.
```

That's it. Works offline. Tested in Chrome, Firefox, and Edge.

---

## Project Structure

```
binary-tm/
├── index.html     — application shell, layout, markup
├── style.css      — design system, colors, tape, animations
├── tm-engine.js   — pure Turing Machine engine (no DOM)
├── app.js         — UI controller, rendering, event handling
└── README.md      — this file
```

---

## Turing Machine Model

### Formal Definition

The machine is defined as M = (Q, Σ, Γ, δ, q₀, Q_H):

| Component | Value |
|-----------|-------|
| Q (states) | { q_seek_end, q_carry / q_borrow, q_done, q_reject } |
| Σ (input alphabet) | { 0, 1 } |
| Γ (tape alphabet) | { 0, 1, ␣ } where ␣ is the blank symbol |
| δ (transition function) | See transition tables below |
| q₀ (initial state) | q_seek_end |
| Q_H (halting states) | { q_done, q_reject } |

---

## Increment Transition Table

The machine starts at position 0 (MSB), scans right to find the first blank, then propagates carry leftward.

| State | Read | Write | Move | Next State |
|-------|------|-------|------|------------|
| q_seek_end | 0 | 0 | R | q_seek_end |
| q_seek_end | 1 | 1 | R | q_seek_end |
| q_seek_end | ␣ | ␣ | L | q_carry |
| q_carry | 1 | 0 | L | q_carry |
| q_carry | 0 | 1 | S | q_done |
| q_carry | ␣ | 1 | S | q_done |

**Carry propagation:** When scanning a `1` in `q_carry`, it's flipped to `0` (carry absorbed locally, carry continues). When a `0` or blank is encountered, it's set to `1` and the machine halts. A blank means all bits were `1` (overflow), so a new MSB `1` is written.

### Examples

| Input | Expected Output | Transitions |
|-------|-----------------|-------------|
| 1011 | 1100 | 6 |
| 1111 | 10000 | 7 |
| 0111 | 1000 | 6 |
| 1 | 10 | 4 |
| 0 | 1 | 4 |

---

## Decrement Transition Table

The machine scans right to the LSB, then propagates borrow leftward.

| State | Read | Write | Move | Next State |
|-------|------|-------|------|------------|
| q_seek_end | 0 | 0 | R | q_seek_end |
| q_seek_end | 1 | 1 | R | q_seek_end |
| q_seek_end | ␣ | ␣ | L | q_borrow |
| q_borrow | 0 | 1 | L | q_borrow |
| q_borrow | 1 | 0 | S | q_done |
| q_borrow | ␣ | ␣ | S | q_reject |

**Borrow propagation:** When scanning a `0` in `q_borrow`, it becomes `1` (borrow propagated). When a `1` is found, it becomes `0` and the machine halts. If blank is encountered (all bits were `0`), the machine rejects — decrement of zero is undefined.

### Examples

| Input | Expected Output | Transitions |
|-------|-----------------|-------------|
| 1011 | 1010 | 5 |
| 1000 | 0111 | 7 |
| 10000 | 01111 | 8 |
| 0001 | 0000 | 6 |
| 0 | REJECTED | 4 |

---

## Input Conventions

- **Alphabet:** Only `0` and `1` are accepted.
- **Width:** Fixed-width; leading zeros are preserved. `1000` decremented gives `0111`, not `111`.
- **Overflow:** Increment of all-1s (`1111`) expands the tape, producing `10000`.
- **Zero decrement:** Explicitly rejected with a clear error. The machine halts in `q_reject`.
- **Maximum length:** 32 bits (practical limit for demonstration).

---

## Complexity

| Operation | Best Case | Worst Case |
|-----------|-----------|------------|
| Increment | O(1) | O(n+2) — input all `1`s |
| Decrement | O(1) | O(n+2) — input all `0`s except MSB |

Where n = length of the binary string. The first n/2 transitions are always the rightward scan; the carry/borrow phase depends on the bit pattern.

---

## Design

The interface uses a dark charcoal/graphite palette with burnt terracotta accents and sage-green success states. Typography combines Inter (sans-serif) for UI chrome and JetBrains Mono for tape symbols, state identifiers, and the transition log.

The tape is the primary visual focus. The read/write head position is shown with a live indicator arrow synchronized with the actual simulation state.

---

## Academic Note

This simulator executes genuine Turing Machine transitions. The result is computed by the machine's transition function applied one step at a time — **not** by calling JavaScript's arithmetic operators. You can verify this by stepping through the execution one transition at a time and observing that the tape changes exactly as the transition table specifies.
