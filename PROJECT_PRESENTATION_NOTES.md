# Binary Incrementer / Decrementer Turing Machine
## Comprehensive Project & Presentation Notes (Theory of Computation)

---

## 1. Project Overview & Quick Reference

- **Topic:** Topic 12 — Binary Incrementer / Decrementer
- **Subject:** Theory of Computation (TOC)
- **Problem Statement:**  
  *"Program a Turing Machine that steps through a binary string on a tape, computes its successor (+1) or predecessor (-1), and handles bit-carrying operations."*
- **Live Hosted Application:** [https://nikhild4s.github.io/turing-binary/](https://nikhild4s.github.io/turing-binary/)
- **GitHub Repository:** [https://github.com/nikhild4s/turing-binary](https://github.com/nikhild4s/turing-binary)

---

## 2. Core Concept in Simple Words

### What is a Turing Machine?
A Turing Machine (TM) is a mathematical model of computation invented by Alan Turing in 1936. It consists of:
1. **An Infinite Tape:** Divided into discrete cells, where each cell holds a symbol (`0`, `1`, or blank `_`).
2. **A Read/Write Head:** Points to one cell at a time. It can read the symbol, write a new symbol, and move one cell Left (`L`) or Right (`R`).
3. **A State Register:** Remembers the current "mode" or state of the machine (e.g., scanning, carrying, halting).
4. **A Transition Function (Rules):** The machine's brain. Given `(current state, current symbol)`, it decides:
   - What symbol to write
   - Which direction to move (`L`, `R`, or stay `S`)
   - What the next state should be

### The Most Important Academic Point to Tell Your Teacher
> **"We did NOT calculate the answer using standard JavaScript math (like `x + 1`)."**  
> The application is a genuine Turing Machine. It places the binary input onto an internal tape array, places the head at position 0, and runs transition rules one by one until it reaches a halt state. The output is whatever binary string remains on the tape when the machine stops.

---

## 3. How the Machine Works (Algorithm in Plain English)

Binary addition and subtraction work from right to left (from the least significant bit / LSB to the most significant bit / MSB). Because the Turing machine head starts at the very beginning (leftmost bit / MSB at cell 0), every operation has two clear phases:

### Phase 1: Seeking the End of the String (Common to both +1 and -1)
- The machine begins in state **`q_seek_end`** at cell 0.
- It moves **Right (`R`)** over all `0`s and `1`s without changing them.
- When it reads a blank cell (`_`), it knows it has reached the end of the number.
- It moves one step **Left (`L`)** to land on the rightmost bit (LSB) and switches to the calculation phase:
  - For Increment: switches to **`q_carry`**.
  - For Decrement: switches to **`q_borrow`**.

---

### Phase 2A: Binary Increment (+1) via Carry Propagation
When you add 1 to binary:
- `0 + 1 = 1` (no carry needed, finished!)
- `1 + 1 = 0` (write 0 and carry 1 to the next left column)

**The Machine's Logic in state `q_carry`:**
1. **Reading `1`:** Writes `0`, moves **Left (`L`)**, and stays in `q_carry`. The carry continues.
2. **Reading `0`:** Writes `1`, stays in place, and transitions to **`q_done`** (Halt & Accept). The carry is absorbed.
3. **Reading `_` (Blank cell):** If it reached the blank cell to the left, it means *all* bits were `1` (like `1111`). It writes a new `1` in that blank cell and transitions to **`q_done`**. This automatically expands the tape width (e.g., `1111` $\to$ `10000`).

---

### Phase 2B: Binary Decrement (-1) via Borrow Propagation
When you subtract 1 from binary:
- `1 - 1 = 0` (no borrow needed, finished!)
- `0 - 1 = 1` (write 1 and borrow 1 from the next left column)

**The Machine's Logic in state `q_borrow`:**
1. **Reading `0`:** Writes `1`, moves **Left (`L`)**, and stays in `q_borrow`. The borrow continues.
2. **Reading `1`:** Writes `0`, stays in place, and transitions to **`q_done`** (Halt & Accept). The borrow is absorbed.
3. **Reading `_` (Blank cell):** If it reaches the blank cell without ever finding a `1`, it means the input was zero (`0000` or `0`). Since negative numbers are not supported in standard unsigned binary, the machine transitions to **`q_reject`** and halts with an error.

---

## 4. Formal Theory of Computation Specification

For your teacher's theoretical evaluation, here is the formal 7-tuple:

$$M = (Q, \Sigma, \Gamma, \delta, q_0, B, F)$$

- **States ($Q$):**
  - Increment: $\{ q_{\text{seek\_end}}, q_{\text{carry}}, q_{\text{done}}, q_{\text{reject}} \}$
  - Decrement: $\{ q_{\text{seek\_end}}, q_{\text{borrow}}, q_{\text{done}}, q_{\text{reject}} \}$
- **Input Alphabet ($\Sigma$):** $\{ 0, 1 \}$
- **Tape Alphabet ($\Gamma$):** $\{ 0, 1, \_ \}$ where `_` represents the blank symbol.
- **Initial State ($q_0$):** $q_{\text{seek\_end}}$
- **Blank Symbol ($B$):** `_`
- **Halting / Final States ($F$):**
  - Accept: $\{ q_{\text{done}} \}$
  - Reject: $\{ q_{\text{reject}} \}$

### Transition Tables ($\delta$)

#### Increment Machine:
| Current State | Read Symbol | Write Symbol | Direction | Next State | Explanation |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `q_seek_end` | `0` | `0` | **R** | `q_seek_end` | Scan right through 0 |
| `q_seek_end` | `1` | `1` | **R** | `q_seek_end` | Scan right through 1 |
| `q_seek_end` | `_` | `_` | **L** | `q_carry` | Found end; step to LSB |
| `q_carry` | `1` | `0` | **L** | `q_carry` | $1+1=0$, propagate carry left |
| `q_carry` | `0` | `1` | **S** | `q_done` | $0+1=1$, carry absorbed, HALT |
| `q_carry` | `_` | `1` | **S** | `q_done` | Overflow: new leading bit, HALT |

#### Decrement Machine:
| Current State | Read Symbol | Write Symbol | Direction | Next State | Explanation |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `q_seek_end` | `0` | `0` | **R** | `q_seek_end` | Scan right through 0 |
| `q_seek_end` | `1` | `1` | **R** | `q_seek_end` | Scan right through 1 |
| `q_seek_end` | `_` | `_` | **L** | `q_borrow` | Found end; step to LSB |
| `q_borrow` | `0` | `1` | **L** | `q_borrow` | $0-1=1$, propagate borrow left |
| `q_borrow` | `1` | `0` | **S** | `q_done` | $1-1=0$, borrow absorbed, HALT |
| `q_borrow` | `_` | `_` | **S** | `q_reject` | All zeros (value is 0), REJECT |

### Time & Space Complexity
- **Time Complexity:** $O(n)$ where $n$ is the number of bits in the input.
  - Phase 1 takes exactly $n+1$ steps to reach the end.
  - Phase 2 takes between $1$ step (best case) and $n+1$ steps (worst case of all 1s or all 0s).
  - Total transitions $\le 2n + 2$.
- **Space Complexity:** $O(n)$ cells on the tape (at most $n+1$ cells used for overflow).

---

## 5. Project Architecture & File Breakdown

The project follows a clean separation of concerns:

```
binary-tm/
├── index.html       → User Interface markup & layout
├── style.css        → Visual design system, responsiveness & animations
├── tm-engine.js     → Pure Turing Machine logic (no browser UI code)
├── app.js           → Connects the engine to the UI & animation timer
└── README.md        → Repository documentation
```

### 1. `tm-engine.js` (The Simulation Core)
- Completely independent of the browser / HTML DOM.
- Contains the `Tape` class: a sparse map handling dynamic left/right expansion.
- Contains the formal transition tables and `TuringMachine` class.
- Contains `validateInput()`: ensures input contains only binary digits `0` and `1`, prevents empty submissions, and flags zero-decrement before running.

### 2. `app.js` (The UI Controller)
- Listens to user button clicks and input changes.
- Drives the timer loop (`setInterval`) according to the chosen simulation speed.
- Updates the **Narration Bar** with natural English explanations at every transition.
- Dynamically moves the `▼ HEAD` pointer to align with the active tape cell.
- Appends human-readable lines to the **Step-by-Step Log**.

### 3. `style.css` (Visual Design)
- Designed with an aesthetic inspired by technical developer instruments: deep charcoal background (`#0e0e0c`), burnt terracotta accent (`#c96b3d`), sage green for success (`#7aab6d`), and muted red for rejection (`#b5534a`).
- Large, high-visibility tape cells ($76 \times 84\text{ px}$) with 30px monospace font for classroom projector legibility.
- Subdued background grid that gives depth without visual distraction.

### 4. `index.html` (The Structure)
- Semantic HTML5 structure.
- Divided into: Left Controls Panel, Center Simulation Workspace, and Collapsible Technical Details Panel.

---

## 6. Interface Walkthrough (How to Explain What's on Screen)

When demonstrating the screen to your teacher, explain each section in this order:

1. **Top Header & Status Badge:**
   - Displays the app title and current machine status: `IDLE`, `RUNNING`, `PAUSED`, `ACCEPTED`, or `REJECTED`.
   - Has a **"Technical Details"** toggle button (opens/closes the right-side transition table) and an **"ⓘ"** button for the formal theory drawer.

2. **Left Panel (Controls):**
   - **Binary Input:** Where the user types any binary string (up to 32 bits).
   - **Operation Selection:** Switches between `+1 (Increment)` and `-1 (Decrement)`.
   - **Simulation Speed:** Adjusts the execution speed from Slow (1 step per 1.2s) to Fast.
   - **Execution Buttons:**
     - **Run:** Automatically steps through transitions until halting.
     - **Step:** Runs a single transition and pauses (ideal for explaining individual moves to the teacher).
     - **Pause / Reset:** Stops or clears the machine.
   - **Quick Examples:** One-click preloaded test cases (including carry overflow and borrow cases).

3. **Center Panel (The Main Stage):**
   - **Live Narration Bar (Orange Box):** Translates the current Turing Machine state into plain English sentences in real-time.
   - **State Bar:** Displays `Current State`, `Head Position`, `Symbol Read`, `Symbol Written`, `Move Direction`, and `Total Steps`.
   - **Color Legend:** Explains the active cell border, flash-on-write animation, and blank symbols.
   - **The Tape:** Shows the actual cells with position indices below each cell, and the `▼ HEAD` pointing to the currently scanned cell.
   - **Result Banner:** Appears when the machine halts, showing the final output and step count.
   - **Step-by-Step Log:** A scrollable history explaining every single move made so far.

---

## 7. Step-by-Step Presentation Script (What to Say & Do)

Follow this exact 3-minute script during your viva/presentation:

### Step 1: Introduction (30 seconds)
> *"Good morning/afternoon teacher. For Topic 12, I have built a fully functional Turing Machine simulator for Binary Increment and Decrement. Rather than using built-in computer arithmetic, this web app simulates an authentic Turing Machine with a dynamic tape, read/write head, and transition rules. It is deployed live on GitHub Pages."*

### Step 2: Demonstrate Normal Increment (45 seconds)
1. Click the **`1011`** example button on the left (or type `1011`).
2. Select **`+1 Increment`**.
3. Click **Step** 4 times:
   > *"Notice the head scanning right to find the blank cell at the end of the string. Once it sees the blank, it steps back onto the last bit (cell 3)."*
4. Click **Step** again:
   > *"The head reads a 1. Because 1 + 1 = 0 with a carry, it writes 0 and moves left into the carry state."*
5. Click **Run**:
   > *"The carry reaches cell 2 which is 0. 0 + 1 = 1, so it writes 1, absorbs the carry, and halts in `q_done`. The final result is 1100."*

### Step 3: Demonstrate Overflow / Tape Expansion (45 seconds)
1. Click the **`1111`** example.
2. Hit **Run**:
   > *"This tests carry overflow. Every bit is a 1, so the machine flips all four 1s to 0s as it moves left. When it reaches the blank cell to the left of the original input, it writes a new leading 1. The tape expands dynamically, giving 10000."*

### Step 4: Demonstrate Decrement & Borrowing (45 seconds)
1. Click **`1000`** and select **`-1 Decrement`**.
2. Click **Run**:
   > *"Here we demonstrate borrow propagation. To subtract 1 from 1000, the machine flips the three trailing 0s into 1s, borrows from the leading 1, flips it to 0, and halts. The result is 0111."*

### Step 5: Demonstrate Rejection of Zero (15 seconds)
1. Type `0` and select **`-1 Decrement`**.
2. Click **Run**:
   > *"Decremeting zero in unsigned binary is undefined. Our machine scans the tape, finds no 1 to borrow from, hits the blank, and correctly halts in `q_reject` with an explicit error message."*

---

## 8. Probable Viva Questions & Model Answers

**Q1: How do you prove this isn't just `parseInt(input, 2) + 1` in JavaScript?**  
> *"If you open `tm-engine.js`, the math engine has zero arithmetic operations. The `TuringMachine` class maintains an internal Map of cell positions, reads the symbol at the head position, looks up the rule in the transition table Map `(state, symbol)`, writes the new symbol, adjusts the head index by +1 or -1, and updates the state. The result string is extracted purely by reading the tape cells from leftmost to rightmost after halting."*

**Q2: Why does the machine have a `q_seek_end` state instead of starting at the right?**  
> *"In formal Theory of Computation, input strings on a Turing Machine tape always start at cell 0 (the leftmost symbol). Because binary addition and subtraction proceed from the Least Significant Bit (LSB) on the far right, the machine must first traverse the string to find the end before it can propagate carry or borrow leftward."*

**Q3: What is the significance of the blank symbol `_`?**  
> *"The blank symbol represents empty, unwritten tape cells. It acts as the boundary delimiter on both sides of the input string. It tells the machine where the number ends during scanning, and provides space for tape expansion during carry overflow."*

**Q4: What is the time complexity of the increment operation?**  
> *"The time complexity is $\Theta(n)$ transitions where $n$ is the number of bits. Phase 1 (scanning to the end) takes $n+1$ steps. Phase 2 takes $k+1$ steps where $k$ is the number of consecutive trailing 1s. Thus, minimum steps $= n + 2$, maximum steps $= 2n + 2$."*

**Q5: How does your implementation handle leading zeros?**  
> *"Our machine adopts a fixed-width convention where bit positions are preserved. For example, `0111 + 1 = 1000` and `0001 - 1 = 0000`. This mirrors real hardware register behavior."*
