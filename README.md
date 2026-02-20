# 🎮 Digital Arcade

A collection of classic arcade games built with vanilla HTML, CSS, and JavaScript — no frameworks, no dependencies.

## Games

- **Snake** — Google Doodle–inspired with smooth animations, grassy background, and colorful food
- **Pac-Man** — Maze navigation with ghost AI and chomping animations
- **Minesweeper** — 16×16 board with 40 mines, first-click safety, chord clicking, and timer
- **Tetris** — Classic gameplay with ghost piece, next piece preview, hard drop, and level progression
- **Platformer** — Side-scrolling level with moving platforms, enemies, coins, and a goal flag

## Features

- High scores saved locally via `localStorage`
- Game over screen with score and high score display
- Start screen for each game
- Keyboard controls with full arrow key and WASD support
- Clean dark UI

## Run Locally

```bash
cd digital-arcade
python3 -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000)

## Controls

| Game | Controls |
|------|----------|
| Snake | Arrow keys / WASD |
| Pac-Man | Arrow keys |
| Minesweeper | Left click to reveal, right click to flag |
| Tetris | ←→ move, ↑ rotate, ↓ soft drop, Space hard drop |
| Platformer | A/D or ←→ to move, W/Space to jump |

## Tech

HTML5 Canvas · CSS3 · Vanilla JavaScript · `requestAnimationFrame` for 60fps game loops
