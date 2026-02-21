// ==================== GLOBAL GAME STATE ====================
let gamePaused = false;

// ==================== SOUND EFFECTS (Web Audio API) ====================
const SFX = (() => {
    let ctx;
    function getCtx() {
        if (!ctx) try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) { return null; }
        if (ctx && ctx.state === 'suspended') ctx.resume();
        return ctx;
    }
    function tone(freq, type, dur, vol, endFreq) {
        const c = getCtx(); if (!c) return;
        try {
            const o = c.createOscillator(), g = c.createGain();
            o.type = type;
            o.frequency.setValueAtTime(freq, c.currentTime);
            if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, c.currentTime + dur);
            g.gain.setValueAtTime(vol, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
            o.connect(g); g.connect(c.destination);
            o.start(c.currentTime); o.stop(c.currentTime + dur);
        } catch(e) {}
    }
    function arp(notes, type, dur, vol) {
        notes.forEach((f, i) => setTimeout(() => tone(f, type, dur, vol), i * 90));
    }
    return {
        eat:       () => tone(880, 'sine', 0.12, 0.12, 1200),
        snakeDie:  () => tone(300, 'sine', 0.35, 0.1, 80),
        chomp:     () => tone(580, 'sine', 0.05, 0.06, 400),
        powerUp:   () => arp([523, 659, 784], 'sine', 0.12, 0.1),
        ghostEat:  () => tone(1000, 'triangle', 0.14, 0.1, 1500),
        pacDie:    () => tone(400, 'sine', 0.4, 0.1, 100),
        win:       () => arp([523, 659, 784, 1047], 'sine', 0.15, 0.1),
        click:     () => tone(700, 'sine', 0.035, 0.04, 500),
        flag:      () => tone(1000, 'triangle', 0.07, 0.05, 800),
        explode:   () => tone(100, 'sine', 0.45, 0.12, 40),
        rotate:    () => tone(500, 'triangle', 0.05, 0.05, 700),
        lineClear: () => arp([523, 659, 784], 'sine', 0.1, 0.1),
        move:      () => tone(300, 'sine', 0.03, 0.03, 250),
        drop:      () => tone(220, 'triangle', 0.06, 0.04, 120),
        tetrisDie: () => tone(300, 'sine', 0.4, 0.1, 80),
        jump:      () => tone(420, 'sine', 0.13, 0.08, 800),
        coin:      () => tone(988, 'sine', 0.08, 0.09, 1319),
        stomp:     () => tone(260, 'sine', 0.1, 0.08, 520),
        platDie:   () => tone(350, 'sine', 0.35, 0.1, 90),
        goal:      () => arp([523, 659, 784, 988, 1047], 'sine', 0.14, 0.1),
    };
})();

function stopAllGames() {
    // Cancel all animation frame loops
    if (snakeGame) {
        cancelAnimationFrame(snakeGame);
        snakeGame = null;
    }
    if (pacmanGame) {
        cancelAnimationFrame(pacmanGame);
        pacmanGame = null;
    }
    if (pacmanResetTimeout) {
        clearTimeout(pacmanResetTimeout);
        pacmanResetTimeout = null;
    }
    if (tetrisGame) {
        cancelAnimationFrame(tetrisGame);
        tetrisGame = null;
    }
    if (platformerGame) {
        cancelAnimationFrame(platformerGame);
        platformerGame = null;
    }
    if (minesweeperTimerInterval) {
        clearInterval(minesweeperTimerInterval);
        minesweeperTimerInterval = null;
    }
    
    // Remove all game key listeners
    if (snakeKeyHandler) {
        document.removeEventListener('keydown', snakeKeyHandler);
        snakeKeyHandler = null;
    }
    if (pacmanKeyHandler) {
        document.removeEventListener('keydown', pacmanKeyHandler);
        pacmanKeyHandler = null;
    }
    if (tetrisKeyHandler) {
        document.removeEventListener('keydown', tetrisKeyHandler);
        tetrisKeyHandler = null;
    }
    if (platformerKeyHandler) {
        document.removeEventListener('keydown', platformerKeyHandler);
        platformerKeyHandler = null;
    }
    if (platformerKeyUpHandler) {
        document.removeEventListener('keyup', platformerKeyUpHandler);
        platformerKeyUpHandler = null;
    }
    
    // Reset pause state and hide modal
    gamePaused = false;
    const modal = document.getElementById('game-over-modal');
    if (modal) modal.classList.add('hidden');
}

// ==================== HIGH SCORE SYSTEM ====================
function getHighScore(gameName) {
    const highScore = localStorage.getItem(`highScore_${gameName}`);
    return highScore ? parseInt(highScore) : 0;
}

function setHighScore(gameName, score) {
    const currentHigh = getHighScore(gameName);
    if (score > currentHigh) {
        localStorage.setItem(`highScore_${gameName}`, score.toString());
        return true; // New high score!
    }
    return false;
}

let lastGameOverName = '';

function showGameOver(gameName, score) {
    const modal = document.getElementById('game-over-modal');
    const modalScore = document.getElementById('modal-score');
    const modalHighScore = document.getElementById('modal-high-score');
    const modalTitle = document.getElementById('modal-title');
    
    if (!modal || !modalScore || !modalHighScore || !modalTitle) {
        console.error('Game over modal elements not found');
        return;
    }
    
    lastGameOverName = gameName;
    const isNewHigh = setHighScore(gameName, score);
    const highScore = getHighScore(gameName);
    
    modalScore.textContent = score;
    
    if (isNewHigh) {
        modalTitle.textContent = '🎉 New High Score! 🎉';
        modalHighScore.textContent = score;
    } else {
        modalTitle.textContent = 'Game Over!';
        modalHighScore.textContent = highScore;
    }
    
    gamePaused = true;
    modal.classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('game-over-modal');

    const modalCloseBtn = document.getElementById('modal-close-btn');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            gamePaused = false;
        });
    }

    const modalRestartBtn = document.getElementById('modal-restart-btn');
    if (modalRestartBtn) {
        modalRestartBtn.addEventListener('click', () => {
            modal.classList.add('hidden');
            gamePaused = false;
            stopAllGames();
            const restartMap = {
                snake: initSnake,
                pacman: initPacman,
                minesweeper: initMinesweeper,
                tetris: initTetris,
                platformer: initPlatformer,
            };
            if (restartMap[lastGameOverName]) {
                showDpad(lastGameOverName);
                restartMap[lastGameOverName]();
            }
        });
    }
});

document.querySelectorAll('.game-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        stopAllGames();
        hideDpad();
        
        const gameName = btn.dataset.game;
        document.querySelectorAll('.game-container').forEach(container => {
            container.classList.add('hidden');
        });
        const gameContainer = document.getElementById(`${gameName}-game`);
        gameContainer.classList.remove('hidden');
        
        // Show start screen, hide game elements
        const startScreen = document.getElementById(`${gameName}-start-screen`);
        const canvas = gameContainer.querySelector('canvas');
        const msWrapper = document.getElementById('minesweeper-wrapper');
        const controls = gameContainer.querySelector('.controls');
        
        if (startScreen) startScreen.classList.remove('hidden');
        if (canvas) canvas.classList.add('hidden');
        if (msWrapper) msWrapper.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
    });
});

// Start Game Buttons - Initialize when DOM is ready
function initializeStartButtons() {
    const snakeStartBtn = document.getElementById('snake-start-btn');
    if (snakeStartBtn) {
        snakeStartBtn.addEventListener('click', () => {
            stopAllGames(); // Clean up any running game first
            document.getElementById('snake-start-screen').classList.add('hidden');
            document.getElementById('snake-canvas').classList.remove('hidden');
            document.getElementById('snake-controls').classList.remove('hidden');
            showDpad('snake');
            initSnake();
        });
    }

    const pacmanStartBtn = document.getElementById('pacman-start-btn');
    if (pacmanStartBtn) {
        pacmanStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('pacman-start-screen').classList.add('hidden');
            document.getElementById('pacman-canvas').classList.remove('hidden');
            document.getElementById('pacman-controls').classList.remove('hidden');
            showDpad('pacman');
            initPacman();
        });
    }

    const minesweeperStartBtn = document.getElementById('minesweeper-start-btn');
    if (minesweeperStartBtn) {
        minesweeperStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('minesweeper-start-screen').classList.add('hidden');
            document.getElementById('minesweeper-wrapper').classList.remove('hidden');
            document.getElementById('minesweeper-controls').classList.remove('hidden');
            showDpad('minesweeper');
            initMinesweeper();
        });
    }

    const tetrisStartBtn = document.getElementById('tetris-start-btn');
    if (tetrisStartBtn) {
        tetrisStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('tetris-start-screen').classList.add('hidden');
            document.getElementById('tetris-canvas').classList.remove('hidden');
            document.getElementById('tetris-controls').classList.remove('hidden');
            showDpad('tetris');
            initTetris();
        });
    }

    const platformerStartBtn = document.getElementById('platformer-start-btn');
    if (platformerStartBtn) {
        platformerStartBtn.addEventListener('click', () => {
            stopAllGames();
            document.getElementById('platformer-start-screen').classList.add('hidden');
            document.getElementById('platformer-canvas').classList.remove('hidden');
            document.getElementById('platformer-controls').classList.remove('hidden');
            showDpad('platformer');
            initPlatformer();
        });
    }
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initializeStartButtons();
    });
} else {
    initializeStartButtons();
}

document.querySelectorAll('.back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        stopAllGames();
        hideDpad();
        document.querySelectorAll('.game-container').forEach(container => {
            container.classList.add('hidden');
        });
    });
});

// ==================== MOBILE CONTROLS ====================
let dpadRepeatTimers = {};
let joystickActiveKeys = {};

function fireKey(type, key) {
    document.dispatchEvent(new KeyboardEvent(type, { key, bubbles: true }));
}

function showDpad(gameName) {
    const dpad = document.getElementById('dpad-container');
    const joystick = document.getElementById('joystick-container');

    if (dpad) dpad.classList.remove('active');
    if (joystick) joystick.classList.remove('active');

    const hasDpad = gameName === 'snake' || gameName === 'pacman' || gameName === 'tetris' || gameName === 'platformer';
    const hasJoystick = gameName === 'platformer';

    if (hasDpad && dpad) dpad.classList.add('active');
    if (hasJoystick && joystick) joystick.classList.add('active');
}

function hideDpad() {
    const dpad = document.getElementById('dpad-container');
    const joystick = document.getElementById('joystick-container');
    if (dpad) dpad.classList.remove('active');
    if (joystick) joystick.classList.remove('active');

    Object.keys(dpadRepeatTimers).forEach(key => {
        clearTimeout(dpadRepeatTimers[key].timeout);
        clearInterval(dpadRepeatTimers[key].interval);
    });
    dpadRepeatTimers = {};

    Object.keys(joystickActiveKeys).forEach(key => fireKey('keyup', key));
    joystickActiveKeys = {};
}

function initMobileControls() {
    // --- D-Pad ---
    const dpad = document.getElementById('dpad-container');
    if (dpad) {
        dpad.querySelectorAll('[data-key]').forEach(btn => {
            const isAction = btn.classList.contains('dpad-action');

            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                btn.classList.add('pressed');
                const key = btn.dataset.key;
                fireKey('keydown', key);
                if (!isAction) {
                    dpadRepeatTimers[key] = {
                        timeout: setTimeout(() => {
                            dpadRepeatTimers[key].interval = setInterval(() => fireKey('keydown', key), 85);
                        }, 220)
                    };
                }
            }, { passive: false });

            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                btn.classList.remove('pressed');
                const key = btn.dataset.key;
                fireKey('keyup', key);
                if (dpadRepeatTimers[key]) {
                    clearTimeout(dpadRepeatTimers[key].timeout);
                    clearInterval(dpadRepeatTimers[key].interval);
                    delete dpadRepeatTimers[key];
                }
            }, { passive: false });

            btn.addEventListener('touchcancel', () => {
                btn.classList.remove('pressed');
                const key = btn.dataset.key;
                fireKey('keyup', key);
                if (dpadRepeatTimers[key]) {
                    clearTimeout(dpadRepeatTimers[key].timeout);
                    clearInterval(dpadRepeatTimers[key].interval);
                    delete dpadRepeatTimers[key];
                }
            });

            btn.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }

    // --- Joystick ---
    const base = document.getElementById('joystick-base');
    const knob = document.getElementById('joystick-knob');
    if (!base || !knob) return;

    const DEADZONE = 0.3;

    function updateJoystickKeys(dx, dy) {
        const abx = Math.abs(dx), aby = Math.abs(dy);
        const newKeys = {};

        if (abx > DEADZONE || aby > DEADZONE) {
            if (abx > aby) {
                newKeys[dx < 0 ? 'ArrowLeft' : 'ArrowRight'] = true;
            } else {
                newKeys[dy < 0 ? 'ArrowUp' : 'ArrowDown'] = true;
            }
        }

        for (const k in joystickActiveKeys) {
            if (!newKeys[k]) fireKey('keyup', k);
        }
        for (const k in newKeys) {
            if (!joystickActiveKeys[k]) fireKey('keydown', k);
        }
        joystickActiveKeys = newKeys;
    }

    function handleJoystickTouch(e) {
        e.preventDefault();
        knob.classList.add('active');
        const rect = base.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const maxR = rect.width / 2;
        const touch = e.touches[0];
        let dx = (touch.clientX - cx) / maxR;
        let dy = (touch.clientY - cy) / maxR;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) { dx /= dist; dy /= dist; }
        knob.style.transform = `translate(${dx * maxR * 0.55}px, ${dy * maxR * 0.55}px)`;
        updateJoystickKeys(dx, dy);
    }

    function handleJoystickEnd(e) {
        e.preventDefault();
        knob.classList.remove('active');
        knob.style.transform = 'translate(0,0)';
        updateJoystickKeys(0, 0);
    }

    base.addEventListener('touchstart', handleJoystickTouch, { passive: false });
    base.addEventListener('touchmove', handleJoystickTouch, { passive: false });
    base.addEventListener('touchend', handleJoystickEnd, { passive: false });
    base.addEventListener('touchcancel', handleJoystickEnd, { passive: false });
    base.addEventListener('contextmenu', (e) => e.preventDefault());
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileControls);
} else {
    initMobileControls();
}

// ==================== SNAKE GAME (Google Doodle Style) ====================
let snakeGame = null;
let snakeKeyHandler = null;

function initSnake() {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    const gs = 20;
    const tileCount = canvas.width / gs;
    
    let snake = [{x: 10, y: 10}];
    let food = {x: 15, y: 15};
    let dx = 0, dy = 0, prevDx = 0, prevDy = 0;
    let directionChanged = false;
    let score = 0;
    let lastMoveTime = 0;
    const moveInterval = 100;
    
    let snakeRender = [{x: 10, y: 10}];
    let animationProgress = 0;
    let gameTime = 0;
    let particles = [];
    let scorePopups = [];
    let screenFlash = 0;
    let ateFood = false;
    
    // ---- VFX helpers ----
    function spawnBurst(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const v = 1 + Math.random() * 3;
            particles.push({
                x: (x + 0.5) * gs, y: (y + 0.5) * gs,
                vx: Math.cos(a) * v, vy: Math.sin(a) * v,
                life: 18 + Math.random() * 14, maxLife: 32,
                color, size: 2 + Math.random() * 2.5
            });
        }
    }
    function addPopup(x, y, text) {
        scorePopups.push({x: (x + 0.5) * gs, y: (y + 0.5) * gs, text, life: 35, maxLife: 35});
    }
    
    // ---- Game loop ----
    function drawGame(currentTime) {
        if (!snakeGame) return;
        gameTime++;
        
        if (currentTime - lastMoveTime < moveInterval) {
            animationProgress = (currentTime - lastMoveTime) / moveInterval;
        } else {
            animationProgress = 1;
        }
        
        if (currentTime - lastMoveTime >= moveInterval) {
            ateFood = false;
            moveSnake();
            lastMoveTime = currentTime;
            animationProgress = 0;
            prevDx = dx; prevDy = dy;
            directionChanged = false;
        }
        
        if (snake.length > 0 && (dx !== 0 || dy !== 0)) {
            snakeRender = snake.map((seg, i) => {
                if (i === 0) {
                    const id = directionChanged ? prevDx : dx;
                    const idy = directionChanged ? prevDy : dy;
                    return {x: seg.x - id * (1 - animationProgress), y: seg.y - idy * (1 - animationProgress)};
                }
                return {x: seg.x, y: seg.y};
            });
        } else {
            snakeRender = snake.map(s => ({x: s.x, y: s.y}));
        }
        
        // Trail particles behind head
        if ((dx !== 0 || dy !== 0) && snakeRender.length > 0 && Math.random() < 0.35) {
            const hx = (snakeRender[0].x + 0.5) * gs;
            const hy = (snakeRender[0].y + 0.5) * gs;
            particles.push({
                x: hx + (Math.random() - 0.5) * 6, y: hy + (Math.random() - 0.5) * 6,
                vx: -dx * 0.5 + (Math.random() - 0.5) * 0.5,
                vy: -dy * 0.5 + (Math.random() - 0.5) * 0.5,
                life: 8 + Math.random() * 6, maxLife: 14,
                color: '#4ade80', size: 1.5 + Math.random()
            });
        }
        
        drawBackground();
        drawApple();
        drawSnakeBody();
        drawParticles();
        drawPopups();
        drawScreenFlash();
    }
    
    // ---- Movement & logic ----
    function moveSnake() {
        if (dx === 0 && dy === 0) return;
        const head = {x: snake[0].x + dx, y: snake[0].y + dy};
        
        if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
            deathEffect(); resetSnake(); return;
        }
        if (snake.some(s => s.x === head.x && s.y === head.y)) {
            deathEffect(); resetSnake(); return;
        }
        
        snake.unshift(head);
        snakeRender.unshift({x: head.x, y: head.y});
        
        if (head.x === food.x && head.y === food.y) {
            score++;
            const el = document.getElementById('snake-score');
            if (el) el.textContent = score;
            spawnBurst(food.x, food.y, '#ef4444', 12);
            spawnBurst(food.x, food.y, '#fbbf24', 6);
            addPopup(food.x, food.y, '+1');
            screenFlash = 8;
            SFX.eat();
            ateFood = true;
            generateFood();
        } else {
            snake.pop();
            snakeRender.pop();
        }
    }
    
    function deathEffect() {
        snake.forEach(s => spawnBurst(s.x, s.y, '#4ade80', 4));
        screenFlash = 12;
        SFX.snakeDie();
    }
    
    function generateFood() {
        let attempts = 0;
        do {
            food = {x: Math.floor(Math.random() * tileCount), y: Math.floor(Math.random() * tileCount)};
            attempts++;
        } while (snake.some(s => s.x === food.x && s.y === food.y) && attempts < 200);
    }
    
    function resetSnake() {
        const finalScore = score;
        snake = [{x: 10, y: 10}];
        snakeRender = [{x: 10, y: 10}];
        dx = 0; dy = 0; prevDx = 0; prevDy = 0;
        directionChanged = false;
        score = 0;
        const el = document.getElementById('snake-score');
        if (el) el.textContent = score;
        generateFood();
        if (finalScore > 0) showGameOver('snake', finalScore);
    }
    
    // ---- Drawing ----
    function drawBackground() {
        ctx.fillStyle = '#111827';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Checkerboard
        for (let y = 0; y < tileCount; y++) {
            for (let x = 0; x < tileCount; x++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillStyle = 'rgba(255,255,255,0.018)';
                    ctx.fillRect(x * gs, y * gs, gs, gs);
                }
            }
        }
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gs, 0); ctx.lineTo(i * gs, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * gs); ctx.lineTo(canvas.width, i * gs);
            ctx.stroke();
        }
        
        // Border glow
        ctx.strokeStyle = 'rgba(99,102,241,0.3)';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    }
    
    function drawApple() {
        const cx = (food.x + 0.5) * gs;
        const cy = (food.y + 0.5) * gs;
        const r = gs * 0.38;
        const bob = Math.sin(gameTime * 0.07) * 2;
        const pulse = 1 + Math.sin(gameTime * 0.1) * 0.06;
        
        ctx.save();
        ctx.translate(cx, cy + bob);
        ctx.scale(pulse, pulse);
        
        // Glow
        ctx.shadowColor = '#ef4444';
        ctx.shadowBlur = 14;
        
        // Apple body
        const grad = ctx.createRadialGradient(-r * 0.3, -r * 0.3, 0, 0, 0, r);
        grad.addColorStop(0, '#ff8a8a');
        grad.addColorStop(0.6, '#ef4444');
        grad.addColorStop(1, '#b91c1c');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Shine
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.beginPath();
        ctx.ellipse(-r * 0.25, -r * 0.3, r * 0.22, r * 0.12, -0.4, 0, Math.PI * 2);
        ctx.fill();
        
        // Stem
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(0, -r + 2);
        ctx.quadraticCurveTo(2, -r - 3, 1, -r - 6);
        ctx.stroke();
        
        // Leaf
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(3, -r - 2, 4, 2, 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
        
        // Ambient sparkles
        if (gameTime % 8 === 0) {
            particles.push({
                x: cx + (Math.random() - 0.5) * gs, y: cy + bob + (Math.random() - 0.5) * gs,
                vx: (Math.random() - 0.5) * 0.5, vy: -0.3 - Math.random() * 0.4,
                life: 12 + Math.random() * 8, maxLife: 20,
                color: '#fbbf24', size: 1 + Math.random()
            });
        }
    }
    
    function drawSnakeBody() {
        if (snakeRender.length === 0) return;
        const len = snakeRender.length;
        
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Body segments (tail to head, so head draws on top)
        for (let i = len - 1; i >= 1; i--) {
            const t = 1 - i / Math.max(1, len - 1);
            const width = gs - 4 - t * 5;
            const lightness = 42 + (1 - t) * 22;
            
            ctx.strokeStyle = `hsl(145, 72%, ${lightness}%)`;
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo((snakeRender[i - 1].x + 0.5) * gs, (snakeRender[i - 1].y + 0.5) * gs);
            ctx.lineTo((snakeRender[i].x + 0.5) * gs, (snakeRender[i].y + 0.5) * gs);
            ctx.stroke();
        }
        
        // Tail tip (rounded end)
        if (len > 1) {
            const tail = snakeRender[len - 1];
            const tailR = (gs - 10) / 2;
            ctx.fillStyle = 'hsl(145, 72%, 42%)';
            ctx.beginPath();
            ctx.arc((tail.x + 0.5) * gs, (tail.y + 0.5) * gs, tailR, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Head
        const hx = (snakeRender[0].x + 0.5) * gs;
        const hy = (snakeRender[0].y + 0.5) * gs;
        const hr = gs * 0.47;
        
        ctx.shadowColor = '#4ade80';
        ctx.shadowBlur = 14;
        const hGrad = ctx.createRadialGradient(hx - 2, hy - 2, 0, hx, hy, hr);
        hGrad.addColorStop(0, '#86efac');
        hGrad.addColorStop(1, '#22c55e');
        ctx.fillStyle = hGrad;
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Scale pattern on body
        for (let i = 1; i < len; i++) {
            if (i % 2 === 0) {
                const sx = (snakeRender[i].x + 0.5) * gs;
                const sy = (snakeRender[i].y + 0.5) * gs;
                ctx.fillStyle = 'rgba(255,255,255,0.08)';
                ctx.beginPath();
                ctx.arc(sx, sy, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Eyes
        const eyeR = gs * 0.12;
        const eyeSpacing = gs * 0.18;
        let ex1, ey1, ex2, ey2, px, py;
        
        if (dx === 1) { ex1 = hx + 2; ey1 = hy - eyeSpacing; ex2 = hx + 2; ey2 = hy + eyeSpacing; px = eyeR * 0.35; py = 0; }
        else if (dx === -1) { ex1 = hx - 2; ey1 = hy - eyeSpacing; ex2 = hx - 2; ey2 = hy + eyeSpacing; px = -eyeR * 0.35; py = 0; }
        else if (dy === 1) { ex1 = hx - eyeSpacing; ey1 = hy + 2; ex2 = hx + eyeSpacing; ey2 = hy + 2; px = 0; py = eyeR * 0.35; }
        else if (dy === -1) { ex1 = hx - eyeSpacing; ey1 = hy - 2; ex2 = hx + eyeSpacing; ey2 = hy - 2; px = 0; py = -eyeR * 0.35; }
        else { ex1 = hx + 1; ey1 = hy - eyeSpacing; ex2 = hx + 1; ey2 = hy + eyeSpacing; px = eyeR * 0.2; py = 0; }
        
        // White sclera
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();
        // Pupil
        ctx.fillStyle = '#111';
        ctx.beginPath(); ctx.arc(ex1 + px, ey1 + py, eyeR * 0.6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2 + px, ey2 + py, eyeR * 0.6, 0, Math.PI * 2); ctx.fill();
        // Shine
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(ex1 + px * 0.3 + 0.5, ey1 + py * 0.3 - 0.5, eyeR * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(ex2 + px * 0.3 + 0.5, ey2 + py * 0.3 - 0.5, eyeR * 0.22, 0, Math.PI * 2); ctx.fill();
        
        // Tongue flick (periodically)
        if (Math.sin(gameTime * 0.15) > 0.5 && (dx !== 0 || dy !== 0)) {
            const tongueLen = 6 + Math.sin(gameTime * 0.3) * 2;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 1.5;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(hx + dx * hr, hy + dy * hr);
            ctx.lineTo(hx + dx * (hr + tongueLen), hy + dy * (hr + tongueLen));
            ctx.stroke();
            // Fork
            ctx.beginPath();
            ctx.moveTo(hx + dx * (hr + tongueLen), hy + dy * (hr + tongueLen));
            ctx.lineTo(hx + dx * (hr + tongueLen + 2) + (dy !== 0 ? 2 : 0), hy + dy * (hr + tongueLen + 2) + (dx !== 0 ? 2 : 0));
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(hx + dx * (hr + tongueLen), hy + dy * (hr + tongueLen));
            ctx.lineTo(hx + dx * (hr + tongueLen + 2) + (dy !== 0 ? -2 : 0), hy + dy * (hr + tongueLen + 2) + (dx !== 0 ? -2 : 0));
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.94; p.vy *= 0.94;
            p.life--;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 3;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function drawPopups() {
        for (let i = scorePopups.length - 1; i >= 0; i--) {
            const sp = scorePopups[i];
            sp.y -= 0.7; sp.life--;
            if (sp.life <= 0) { scorePopups.splice(i, 1); continue; }
            const alpha = sp.life / sp.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 6;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 13px Inter, Arial';
            ctx.textAlign = 'center';
            ctx.fillText(sp.text, sp.x, sp.y);
            ctx.restore();
        }
    }
    
    function drawScreenFlash() {
        if (screenFlash > 0) {
            ctx.save();
            ctx.globalAlpha = screenFlash * 0.025;
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.restore();
            screenFlash--;
        }
    }
    
    // ---- Input ----
    function handleKeyPress(e) {
        const gameKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        if (directionChanged) return;
        
        let newDx = dx, newDy = dy;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') { newDx = 0; newDy = -1; }
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') { newDx = 0; newDy = 1; }
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { newDx = -1; newDy = 0; }
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { newDx = 1; newDy = 0; }
        else return;
        
        if (newDx === -dx && newDy === -dy && (dx !== 0 || dy !== 0)) return;
        if (dx === 0 && dy === 0) { dx = newDx; dy = newDy; prevDx = dx; prevDy = dy; return; }
        if (newDx === dx && newDy === dy) return;
        
        const testX = snake[0].x + newDx, testY = snake[0].y + newDy;
        if (!snake.some(s => s.x === testX && s.y === testY)) {
            prevDx = dx; prevDy = dy;
            dx = newDx; dy = newDy;
            directionChanged = true;
        }
    }
    
    // ---- Init ----
    document.removeEventListener('keydown', snakeKeyHandler);
    snakeKeyHandler = handleKeyPress;
    document.addEventListener('keydown', snakeKeyHandler);
    
    if (snakeGame) cancelAnimationFrame(snakeGame);
    particles = []; scorePopups = []; screenFlash = 0;
    resetSnake();
    generateFood();
    lastMoveTime = performance.now();
    
    function gameLoop(currentTime) {
        if (!snakeGame) return;
        if (gamePaused) {
            lastMoveTime = currentTime;
            snakeGame = requestAnimationFrame(gameLoop);
            return;
        }
        drawGame(currentTime);
        snakeGame = requestAnimationFrame(gameLoop);
    }
    snakeGame = requestAnimationFrame(gameLoop);
}

// ==================== PAC-MAN GAME ====================
let pacmanGame = null;
let pacmanKeyHandler = null;
let pacmanResetTimeout = null;

function initPacman() {
    const canvas = document.getElementById('pacman-canvas');
    const ctx = canvas.getContext('2d');
    const gs = 20;
    const cols = 20;
    const rows = 21;
    
    // Fixed maze — rows 7 & 11 corners walled off (were unreachable islands)
    const maze = [
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,0,1],
        [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
        [1,1,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,1,1,0,0,1,1,0,1,0,1,1,1,1],
        [0,0,0,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0,0,0],
        [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,0,0,0,0,0,0,0,1,0,1,1,1,1],
        [1,1,1,1,0,1,0,1,1,1,1,1,1,0,1,0,1,1,1,1],
        [1,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,1],
        [1,0,1,1,0,1,1,1,0,1,1,0,1,1,1,0,1,1,0,1],
        [1,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,1],
        [1,1,0,1,0,1,0,1,1,1,1,1,1,0,1,0,1,0,1,1],
        [1,0,0,0,0,1,0,0,0,1,1,0,0,0,1,0,0,0,0,1],
        [1,0,1,1,1,1,1,1,0,1,1,0,1,1,1,1,1,1,0,1],
        [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ];
    
    const GHOST_HOME = [{x:9,y:9},{x:10,y:9},{x:11,y:9},{x:9,y:10}];
    const GHOST_COLORS = ['#FF0000','#FFB8FF','#00FFFF','#FFB851'];
    const powerPelletPos = [{x:1,y:3},{x:18,y:3},{x:1,y:15},{x:18,y:15}];
    
    let pacman, dots, powerPellets, ghosts;
    let particles = [];
    let scorePopups = [];
    let score = 0;
    let gameRunning = true;
    let frightenedTimer = 0;
    let ghostEatCombo = 0;
    let lastMoveTime = 0;
    let gameTime = 0;
    const moveInterval = 150;
    
    function isGhostHouse(x, y) {
        return (y === 9 && x >= 8 && x <= 11) || (y === 8 && (x === 9 || x === 10));
    }
    
    function canMove(x, y) {
        if (y === 9 || y === 10) {
            if (x < 0) return {x: cols - 1, y, wrapped: true};
            if (x >= cols) return {x: 0, y, wrapped: true};
        }
        if (x < 0 || x >= cols || y < 0 || y >= rows) return false;
        if (!maze[y] || maze[y][x] === 1) return false;
        return {x, y, wrapped: false};
    }
    
    function initState() {
        pacman = {x: 10, y: 15, direction: 0, nextDirection: 0, mouthAngle: 0, animFrame: 0};
        ghosts = GHOST_HOME.map((pos, i) => ({
            x: pos.x, y: pos.y, dx: i % 2 === 0 ? 1 : -1, dy: 0, color: GHOST_COLORS[i]
        }));
        frightenedTimer = 0;
        ghostEatCombo = 0;
        particles = [];
        scorePopups = [];
    }
    
    function resetPacman() {
        const finalScore = score;
        initState();
        score = 0;
        gameRunning = true;
        const el = document.getElementById('pacman-score');
        if (el) el.textContent = score;
        generateDots();
        if (finalScore > 0) showGameOver('pacman', finalScore);
    }
    
    function generateDots() {
        dots = [];
        powerPellets = powerPelletPos.map(p => ({x: p.x, y: p.y, eaten: false}));
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y] && maze[y][x] === 0 && !isGhostHouse(x, y) &&
                    !(x === 10 && y === 15) &&
                    !powerPelletPos.some(pp => pp.x === x && pp.y === y)) {
                    dots.push({x, y});
                }
            }
        }
    }
    
    function spawnParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            particles.push({
                x: (x + 0.5) * gs, y: (y + 0.5) * gs,
                vx: (Math.random() - 0.5) * 3, vy: (Math.random() - 0.5) * 3,
                life: 15 + Math.random() * 10, maxLife: 25,
                color, size: 1.5 + Math.random() * 2
            });
        }
    }
    
    function addPopup(x, y, text) {
        scorePopups.push({x: (x + 0.5) * gs, y: (y + 0.5) * gs, text, life: 30, maxLife: 30});
    }
    
    function checkWin() {
        if (dots.length === 0 && powerPellets.every(pp => pp.eaten)) {
            gameRunning = false;
            SFX.win();
            if (pacmanResetTimeout) clearTimeout(pacmanResetTimeout);
            pacmanResetTimeout = setTimeout(() => { pacmanResetTimeout = null; resetPacman(); }, 2000);
        }
    }
    
    // ---- Game Loop ----
    function drawGame(currentTime) {
        if (!pacmanGame) return;
        if (gamePaused) { lastMoveTime = currentTime; pacmanGame = requestAnimationFrame(drawGame); return; }
        
        gameTime++;
        
        if (currentTime - lastMoveTime >= moveInterval) {
            movePacman();
            moveGhosts();
            if (frightenedTimer > 0) frightenedTimer--;
            if (frightenedTimer === 0) ghostEatCombo = 0;
            lastMoveTime = currentTime;
        }
        
        drawMaze();
        drawDots();
        ghosts.forEach(g => drawGhost(g));
        drawPacmanSprite();
        updateAndDrawParticles();
        drawScorePopups();
        drawVignette();
        
        pacmanGame = requestAnimationFrame(drawGame);
    }
    
    // ---- Movement ----
    function movePacman() {
        if (!gameRunning) return;
        pacman.animFrame++;
        pacman.mouthAngle = Math.abs(Math.sin(pacman.animFrame * 0.3)) * Math.PI / 3;
        
        const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
        if (pacman.nextDirection !== pacman.direction) {
            const nd = dirs[pacman.nextDirection];
            const np = canMove(pacman.x + nd[0], pacman.y + nd[1]);
            if (np && np !== false) pacman.direction = pacman.nextDirection;
        }
        
        const dir = dirs[pacman.direction];
        const nextPos = canMove(pacman.x + dir[0], pacman.y + dir[1]);
        if (nextPos && nextPos !== false) {
            pacman.x = nextPos.wrapped ? nextPos.x : pacman.x + dir[0];
            pacman.y = nextPos.wrapped ? nextPos.y : pacman.y + dir[1];
            
            const di = dots.findIndex(d => d.x === pacman.x && d.y === pacman.y);
            if (di !== -1) {
                dots.splice(di, 1);
                score += 10;
                const el = document.getElementById('pacman-score');
                if (el) el.textContent = score;
                spawnParticles(pacman.x, pacman.y, '#ffff44', 5);
                addPopup(pacman.x, pacman.y, '+10');
                SFX.chomp();
                checkWin();
            }
            
            const pi = powerPellets.findIndex(pp => !pp.eaten && pp.x === pacman.x && pp.y === pacman.y);
            if (pi !== -1) {
                powerPellets[pi].eaten = true;
                score += 50;
                const el = document.getElementById('pacman-score');
                if (el) el.textContent = score;
                frightenedTimer = 40;
                ghostEatCombo = 0;
                spawnParticles(pacman.x, pacman.y, '#ffffff', 12);
                addPopup(pacman.x, pacman.y, '+50');
                SFX.powerUp();
                checkWin();
            }
        }
    }
    
    function moveGhosts() {
        if (!gameRunning) return;
        ghosts.forEach((ghost, gi) => {
            const isFrightened = frightenedTimer > 0;
            if (isFrightened && gameTime % 2 === 0) return;
            
            if (Math.random() < 0.15) {
                const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
                const valid = dirs.filter(d => {
                    const c = canMove(ghost.x + d[0], ghost.y + d[1]);
                    return c && c !== false && !c.wrapped;
                });
                if (valid.length > 0) {
                    const d = valid[Math.floor(Math.random() * valid.length)];
                    ghost.dx = d[0]; ghost.dy = d[1];
                }
            }
            
            const np = canMove(ghost.x + ghost.dx, ghost.y + ghost.dy);
            if (np && np !== false && !np.wrapped) {
                ghost.x += ghost.dx; ghost.y += ghost.dy;
            } else {
                const dirs = [[1,0],[0,1],[-1,0],[0,-1]];
                const valid = dirs.filter(d => {
                    const c = canMove(ghost.x + d[0], ghost.y + d[1]);
                    return c && c !== false && !c.wrapped;
                });
                if (valid.length > 0) {
                    const d = valid[Math.floor(Math.random() * valid.length)];
                    ghost.dx = d[0]; ghost.dy = d[1];
                }
            }
            
            if (ghost.x === pacman.x && ghost.y === pacman.y) {
                if (isFrightened) {
                    ghostEatCombo++;
                    const pts = 200 * ghostEatCombo;
                    score += pts;
                    const el = document.getElementById('pacman-score');
                    if (el) el.textContent = score;
                    spawnParticles(ghost.x, ghost.y, ghost.color, 10);
                    addPopup(ghost.x, ghost.y, '+' + pts);
                    SFX.ghostEat();
                    ghost.x = GHOST_HOME[gi].x;
                    ghost.y = GHOST_HOME[gi].y;
                } else if (gameRunning) {
                    gameRunning = false;
                    SFX.pacDie();
                    spawnParticles(pacman.x, pacman.y, '#FFD700', 20);
                    if (pacmanResetTimeout) clearTimeout(pacmanResetTimeout);
                    pacmanResetTimeout = setTimeout(() => { pacmanResetTimeout = null; resetPacman(); }, 1200);
                }
            }
        });
    }
    
    // ---- Drawing ----
    function drawMaze() {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y][x] === 1) {
                    ctx.fillStyle = '#080820';
                    ctx.fillRect(x * gs, y * gs, gs, gs);
                }
            }
        }
        
        ctx.save();
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 6;
        ctx.strokeStyle = '#2255cc';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y][x] !== 1) continue;
                const px = x * gs, py = y * gs;
                if (y === 0 || (maze[y - 1] && maze[y - 1][x] === 0)) { ctx.moveTo(px, py); ctx.lineTo(px + gs, py); }
                if (y === rows - 1 || (maze[y + 1] && maze[y + 1][x] === 0)) { ctx.moveTo(px, py + gs); ctx.lineTo(px + gs, py + gs); }
                if (x === 0 || maze[y][x - 1] === 0) { ctx.moveTo(px, py); ctx.lineTo(px, py + gs); }
                if (x === cols - 1 || maze[y][x + 1] === 0) { ctx.moveTo(px + gs, py); ctx.lineTo(px + gs, py + gs); }
            }
        }
        ctx.stroke();
        ctx.restore();
        
        ctx.save();
        ctx.strokeStyle = '#4488ff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (maze[y][x] !== 1) continue;
                const px = x * gs, py = y * gs;
                if (y === 0 || (maze[y - 1] && maze[y - 1][x] === 0)) { ctx.moveTo(px, py); ctx.lineTo(px + gs, py); }
                if (y === rows - 1 || (maze[y + 1] && maze[y + 1][x] === 0)) { ctx.moveTo(px, py + gs); ctx.lineTo(px + gs, py + gs); }
                if (x === 0 || maze[y][x - 1] === 0) { ctx.moveTo(px, py); ctx.lineTo(px, py + gs); }
                if (x === cols - 1 || maze[y][x + 1] === 0) { ctx.moveTo(px + gs, py); ctx.lineTo(px + gs, py + gs); }
            }
        }
        ctx.stroke();
        ctx.restore();
    }
    
    function drawDots() {
        const pulse = 0.7 + Math.sin(gameTime * 0.08) * 0.3;
        ctx.save();
        ctx.shadowColor = '#ffeeaa';
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#ffddaa';
        dots.forEach(d => {
            ctx.beginPath();
            ctx.arc((d.x + 0.5) * gs, (d.y + 0.5) * gs, 2.5 * pulse, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        const ppPulse = 0.6 + Math.sin(gameTime * 0.12) * 0.4;
        ctx.save();
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 12;
        ctx.fillStyle = '#ffffff';
        powerPellets.forEach(pp => {
            if (pp.eaten) return;
            ctx.beginPath();
            ctx.arc((pp.x + 0.5) * gs, (pp.y + 0.5) * gs, 5 * ppPulse, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }
    
    function drawPacmanSprite() {
        const cx = (pacman.x + 0.5) * gs;
        const cy = (pacman.y + 0.5) * gs;
        const r = gs * 0.43;
        
        ctx.save();
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 10;
        ctx.translate(cx, cy);
        const rotations = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
        ctx.rotate(rotations[pacman.direction]);
        
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        grad.addColorStop(0, '#FFEE44');
        grad.addColorStop(1, '#FFB800');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, r, pacman.mouthAngle, Math.PI * 2 - pacman.mouthAngle);
        ctx.lineTo(0, 0);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(r * 0.2, -r * 0.35, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(r * 0.15, -r * 0.4, r * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    function drawGhost(ghost) {
        const cx = (ghost.x + 0.5) * gs;
        const cy = (ghost.y + 0.5) * gs;
        const r = gs * 0.42;
        const isFrightened = frightenedTimer > 0;
        const flashing = isFrightened && frightenedTimer < 10 && gameTime % 4 < 2;
        const bodyColor = isFrightened ? (flashing ? '#ffffff' : '#2222dd') : ghost.color;
        
        ctx.save();
        ctx.shadowColor = bodyColor;
        ctx.shadowBlur = 8;
        
        ctx.fillStyle = bodyColor;
        ctx.beginPath();
        ctx.arc(cx, cy - r * 0.15, r, Math.PI, 0);
        ctx.lineTo(cx + r, cy + r * 0.75);
        const numWaves = 4;
        const waveW = (r * 2) / numWaves;
        for (let i = numWaves - 1; i >= 0; i--) {
            const wx = cx - r + i * waveW;
            const wobble = Math.sin(gameTime * 0.15 + i * 1.5) * 1.5;
            ctx.quadraticCurveTo(wx + waveW * 0.5, cy + r * 0.75 - 4 + wobble, wx, cy + r * 0.75 + wobble);
        }
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        if (isFrightened) {
            ctx.fillStyle = flashing ? '#333' : '#fff';
            ctx.beginPath();
            ctx.arc(cx - r * 0.25, cy - r * 0.15, 2, 0, Math.PI * 2);
            ctx.arc(cx + r * 0.25, cy - r * 0.15, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = flashing ? '#333' : '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - r * 0.4, cy + r * 0.2);
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(cx - r * 0.4 + i * r * 0.2, cy + r * (i % 2 === 0 ? 0.2 : 0.05));
            }
            ctx.stroke();
        } else {
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(cx - r * 0.25, cy - r * 0.15, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(cx + r * 0.25, cy - r * 0.15, r * 0.2, r * 0.25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            const dx = pacman.x - ghost.x;
            const dy = pacman.y - ghost.y;
            const a = Math.atan2(dy, dx);
            const pd = r * 0.08;
            ctx.fillStyle = '#2233aa';
            ctx.beginPath();
            ctx.arc(cx - r * 0.25 + Math.cos(a) * pd, cy - r * 0.15 + Math.sin(a) * pd, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx + r * 0.25 + Math.cos(a) * pd, cy - r * 0.15 + Math.sin(a) * pd, r * 0.12, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    function updateAndDrawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.vx *= 0.95;
            p.vy *= 0.95;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            const alpha = p.life / p.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 4;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
    
    function drawScorePopups() {
        for (let i = scorePopups.length - 1; i >= 0; i--) {
            const sp = scorePopups[i];
            sp.y -= 0.8;
            sp.life--;
            if (sp.life <= 0) { scorePopups.splice(i, 1); continue; }
            const alpha = sp.life / sp.maxLife;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 4;
            ctx.fillText(sp.text, sp.x, sp.y);
            ctx.restore();
        }
    }
    
    function drawVignette() {
        const grad = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, canvas.width * 0.3,
            canvas.width / 2, canvas.height / 2, canvas.width * 0.75
        );
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function handleKeyPress(e) {
        const gameKeys = ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','W','a','A','s','S','d','D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') pacman.nextDirection = 3;
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') pacman.nextDirection = 1;
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') pacman.nextDirection = 2;
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') pacman.nextDirection = 0;
    }
    
    document.removeEventListener('keydown', pacmanKeyHandler);
    pacmanKeyHandler = handleKeyPress;
    document.addEventListener('keydown', pacmanKeyHandler);
    
    if (pacmanGame) cancelAnimationFrame(pacmanGame);
    initState();
    score = 0;
    gameRunning = true;
    const el = document.getElementById('pacman-score');
    if (el) el.textContent = score;
    generateDots();
    lastMoveTime = performance.now();
    pacmanGame = requestAnimationFrame(drawGame);
}

// ==================== MINESWEEPER GAME ====================
let minesweeperTimerInterval = null;

function initMinesweeper() {
    const board = document.getElementById('minesweeper-board');
    const faceBtn = document.getElementById('minesweeper-face');
    const timerEl = document.getElementById('minesweeper-timer');
    const mineCountEl = document.getElementById('mines-count');
    const size = 16;
    const mineCount = 40;
    let grid = [];
    let revealed = [];
    let flagged = [];
    let gameOver = false;
    let gameWon = false;
    let firstClick = true;
    let timerSeconds = 0;
    
    function startTimer() {
        if (minesweeperTimerInterval) clearInterval(minesweeperTimerInterval);
        timerSeconds = 0;
        if (timerEl) timerEl.textContent = '000';
        minesweeperTimerInterval = setInterval(() => {
            timerSeconds++;
            if (timerEl) timerEl.textContent = String(timerSeconds).padStart(3, '0');
            if (timerSeconds >= 999) clearInterval(minesweeperTimerInterval);
        }, 1000);
    }
    
    function stopTimer() {
        if (minesweeperTimerInterval) {
            clearInterval(minesweeperTimerInterval);
            minesweeperTimerInterval = null;
        }
    }
    
    function setFace(emoji) {
        if (faceBtn) faceBtn.textContent = emoji;
    }
    
    function createBoard() {
        board.innerHTML = '';
        board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
        grid = [];
        revealed = [];
        flagged = [];
        gameOver = false;
        gameWon = false;
        firstClick = true;
        stopTimer();
        timerSeconds = 0;
        if (timerEl) timerEl.textContent = '000';
        setFace('😊');
        
        for (let y = 0; y < size; y++) {
            grid[y] = [];
            revealed[y] = [];
            flagged[y] = [];
            for (let x = 0; x < size; x++) {
                grid[y][x] = 0;
                revealed[y][x] = false;
                flagged[y][x] = false;
            }
        }
        
        // Create cells (mines placed on first click)
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = document.createElement('div');
                cell.className = 'minesweeper-cell';
                cell.dataset.x = x;
                cell.dataset.y = y;
                
                cell.addEventListener('click', () => handleClick(x, y));
                cell.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    flagCell(x, y);
                });
                // Chord click on middle button or double-click on numbers
                cell.addEventListener('dblclick', () => chordReveal(x, y));
                cell.addEventListener('mousedown', (e) => {
                    if (!gameOver && !gameWon) setFace('😮');
                });
                cell.addEventListener('mouseup', () => {
                    if (!gameOver && !gameWon) setFace('😊');
                });
                
                board.appendChild(cell);
            }
        }
        
        updateMineCount();
    }
    
    function placeMines(safeX, safeY) {
        // Place mines, avoiding safe zone (3x3 around first click)
        let minesPlaced = 0;
        while (minesPlaced < mineCount) {
            const x = Math.floor(Math.random() * size);
            const y = Math.floor(Math.random() * size);
            if (grid[y][x] !== -1 && (Math.abs(x - safeX) > 1 || Math.abs(y - safeY) > 1)) {
                grid[y][x] = -1;
                minesPlaced++;
            }
        }
        
        // Calculate numbers
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (grid[y][x] === -1) continue;
                let count = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny >= 0 && ny < size && nx >= 0 && nx < size && grid[ny][nx] === -1) {
                            count++;
                        }
                    }
                }
                grid[y][x] = count;
            }
        }
    }
    
    function handleClick(x, y) {
        if (gameOver || gameWon) return;
        
        if (firstClick) {
            firstClick = false;
            placeMines(x, y);
            startTimer();
        }
        
        SFX.click();
        revealCell(x, y);
    }
    
    function revealCell(x, y) {
        if (gameOver || gameWon || revealed[y][x] || flagged[y][x]) return;
        
        revealed[y][x] = true;
        const cell = board.children[y * size + x];
        cell.classList.add('revealed');
        
        if (grid[y][x] === -1) {
            // Hit a mine
            cell.classList.add('mine');
            cell.textContent = '💣';
            gameOver = true;
            SFX.explode();
            setFace('😵');
            stopTimer();
            
            // Reveal all mines
            revealAllMines(x, y);
            
            const revealedSafe = revealed.flat().filter(r => r).length - 1; // minus the mine
            setTimeout(() => {
                showGameOver('minesweeper', revealedSafe);
            }, 800);
            return;
        }
        
        if (grid[y][x] > 0) {
            cell.textContent = grid[y][x];
            cell.classList.add(`number-${grid[y][x]}`);
        } else {
            // Flood fill for empty cells
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < size && nx >= 0 && nx < size && !revealed[ny][nx]) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
        
        checkWin();
    }
    
    function chordReveal(x, y) {
        if (gameOver || gameWon || !revealed[y][x] || grid[y][x] <= 0) return;
        
        // Count adjacent flags
        let adjacentFlags = 0;
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const ny = y + dy;
                const nx = x + dx;
                if (ny >= 0 && ny < size && nx >= 0 && nx < size && flagged[ny][nx]) {
                    adjacentFlags++;
                }
            }
        }
        
        // If flags match the number, reveal all unflagged adjacent cells
        if (adjacentFlags === grid[y][x]) {
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const ny = y + dy;
                    const nx = x + dx;
                    if (ny >= 0 && ny < size && nx >= 0 && nx < size && !flagged[ny][nx] && !revealed[ny][nx]) {
                        revealCell(nx, ny);
                    }
                }
            }
        }
    }
    
    function revealAllMines(clickedX, clickedY) {
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                const cell = board.children[y * size + x];
                if (grid[y][x] === -1 && !flagged[y][x]) {
                    if (x !== clickedX || y !== clickedY) {
                        cell.classList.add('mine-revealed');
                        cell.textContent = '💣';
                    }
                } else if (grid[y][x] !== -1 && flagged[y][x]) {
                    // Wrong flag
                    cell.classList.add('wrong-flag');
                    cell.textContent = '❌';
                }
            }
        }
    }
    
    function flagCell(x, y) {
        if (gameOver || gameWon || revealed[y][x]) return;
        
        if (firstClick) return; // Can't flag before first click
        
        flagged[y][x] = !flagged[y][x];
        const cell = board.children[y * size + x];
        
        if (flagged[y][x]) {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            SFX.flag();
        } else {
            cell.classList.remove('flagged');
            cell.textContent = '';
        }
        
        updateMineCount();
    }
    
    function updateMineCount() {
        let flaggedCount = flagged.flat().filter(f => f).length;
        const remaining = mineCount - flaggedCount;
        if (mineCountEl) mineCountEl.textContent = String(Math.max(0, remaining)).padStart(3, '0');
    }
    
    function checkWin() {
        let revealedCount = revealed.flat().filter(r => r).length;
        if (revealedCount === size * size - mineCount) {
            gameWon = true;
            SFX.win();
            stopTimer();
            setFace('😎');
            
            // Auto-flag remaining mines
            for (let y = 0; y < size; y++) {
                for (let x = 0; x < size; x++) {
                    if (grid[y][x] === -1 && !flagged[y][x]) {
                        flagged[y][x] = true;
                        const cell = board.children[y * size + x];
                        cell.classList.add('flagged');
                        cell.textContent = '🚩';
                    }
                }
            }
            updateMineCount();
            
            // Score based on time (lower is better, so invert for high score)
            const timeScore = Math.max(1, 999 - timerSeconds);
            setTimeout(() => {
                showGameOver('minesweeper', timeScore);
            }, 500);
        }
    }
    
    // Face button resets game
    if (faceBtn) {
        faceBtn.onclick = () => createBoard();
    }
    
    createBoard();
}

// ==================== TETRIS GAME ====================
let tetrisGame = null;
let tetrisKeyHandler = null;

// Tetris piece shapes and their classic colors
const tetrisPieces = [
    {shape: [[1,1,1,1]], color: '#00F0F0'},           // I - Cyan
    {shape: [[1,1],[1,1]], color: '#F0F000'},           // O - Yellow
    {shape: [[0,1,0],[1,1,1]], color: '#A000F0'},       // T - Purple
    {shape: [[0,1,1],[1,1,0]], color: '#00F000'},       // S - Green
    {shape: [[1,1,0],[0,1,1]], color: '#F00000'},       // Z - Red
    {shape: [[1,0,0],[1,1,1]], color: '#0000F0'},       // J - Blue
    {shape: [[0,0,1],[1,1,1]], color: '#F0A000'}        // L - Orange
];

function initTetris() {
    const canvas = document.getElementById('tetris-canvas');
    const ctx = canvas.getContext('2d');
    const blockSize = 30;
    const cols = canvas.width / blockSize;
    const rows = canvas.height / blockSize;
    
    // Board stores color strings instead of just 0/1
    let board = Array(rows).fill().map(() => Array(cols).fill(0));
    let currentPiece = null;
    let currentColor = '#2196F3';
    let pieceX = 0;
    let pieceY = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropCounter = 0;
    let dropInterval = 1000;
    let lastTime = 0;
    let nextPieceType = Math.floor(Math.random() * tetrisPieces.length);
    let lineClearFlash = 0; // For line-clear animation
    let flashingRows = [];
    
    function getDropInterval() {
        return Math.max(100, 1000 - (level - 1) * 80);
    }
    
    function spawnPiece() {
        const type = nextPieceType;
        nextPieceType = Math.floor(Math.random() * tetrisPieces.length);
        currentPiece = tetrisPieces[type].shape.map(row => [...row]);
        currentColor = tetrisPieces[type].color;
        pieceX = Math.floor(cols / 2) - Math.floor(currentPiece[0].length / 2);
        pieceY = 0;
        
        if (collision()) {
            const finalScore = score;
            board = Array(rows).fill().map(() => Array(cols).fill(0));
            score = 0;
            lines = 0;
            level = 1;
            dropInterval = getDropInterval();
            const tetrisScoreElement = document.getElementById('tetris-score');
            const tetrisLinesElement = document.getElementById('tetris-lines');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
            if (tetrisLinesElement) tetrisLinesElement.textContent = lines;
            if (finalScore > 0) {
                SFX.tetrisDie();
                showGameOver('tetris', finalScore);
            }
        }
    }
    
    function collision(testPiece, testX, testY) {
        const piece = testPiece || currentPiece;
        const px = testX !== undefined ? testX : pieceX;
        const py = testY !== undefined ? testY : pieceY;
        if (!piece) return false;
        for (let y = 0; y < piece.length; y++) {
            for (let x = 0; x < piece[y].length; x++) {
                if (piece[y][x]) {
                    const newX = px + x;
                    const newY = py + y;
                    if (newX < 0 || newX >= cols || newY >= rows || 
                        (newY >= 0 && board[newY][newX])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    function getGhostY() {
        if (!currentPiece) return pieceY;
        let ghostY = pieceY;
        while (!collision(currentPiece, pieceX, ghostY + 1)) {
            ghostY++;
        }
        return ghostY;
    }
    
    function mergePiece() {
        for (let y = 0; y < currentPiece.length; y++) {
            for (let x = 0; x < currentPiece[y].length; x++) {
                if (currentPiece[y][x]) {
                    board[pieceY + y][pieceX + x] = currentColor;
                }
            }
        }
    }
    
    function clearLines() {
        let linesCleared = 0;
        flashingRows = [];
        for (let y = rows - 1; y >= 0; y--) {
            if (board[y].every(cell => cell !== 0)) {
                flashingRows.push(y);
                board.splice(y, 1);
                board.unshift(Array(cols).fill(0));
                linesCleared++;
                y++;
            }
        }
        if (linesCleared > 0) {
            lines += linesCleared;
            // Classic scoring: 1=100, 2=300, 3=500, 4=800
            const scoreMultipliers = [0, 100, 300, 500, 800];
            score += (scoreMultipliers[linesCleared] || linesCleared * 200) * level;
            level = Math.floor(lines / 10) + 1;
            dropInterval = getDropInterval();
            lineClearFlash = 10;
            SFX.lineClear();
            const tetrisScoreElement = document.getElementById('tetris-score');
            const tetrisLinesElement = document.getElementById('tetris-lines');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
            if (tetrisLinesElement) tetrisLinesElement.textContent = `${lines} (Lv.${level})`;
        }
    }
    
    function rotatePiece() {
        const rotated = currentPiece[0].map((_, i) => 
            currentPiece.map(row => row[i]).reverse()
        );
        const oldPiece = currentPiece;
        currentPiece = rotated;
        // Wall kick - try shifting left/right if rotation fails
        if (collision()) {
            pieceX--;
            if (collision()) {
                pieceX += 2;
                if (collision()) {
                    pieceX--;
                    currentPiece = oldPiece;
                }
            }
        }
    }
    
    function drawBlock(x, y, color, alpha) {
        const bx = x * blockSize;
        const by = y * blockSize;
        const size = blockSize - 1;
        const a = alpha || 1;
        
        ctx.save();
        ctx.globalAlpha = a;
        
        // Main fill
        ctx.fillStyle = color;
        ctx.fillRect(bx, by, size, size);
        
        // Lighter top & left edge (3D highlight)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(bx, by, size, 3);
        ctx.fillRect(bx, by, 3, size);
        
        // Darker bottom & right edge (3D shadow)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(bx, by + size - 3, size, 3);
        ctx.fillRect(bx + size - 3, by, 3, size);
        
        // Inner shine
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(bx + 4, by + 4, size - 8, size - 8);
        
        ctx.restore();
    }
    
    function draw() {
        // Dark background with subtle gradient
        const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        bgGradient.addColorStop(0, '#0a0a1a');
        bgGradient.addColorStop(1, '#1a1a2e');
        ctx.fillStyle = bgGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let x = 0; x <= cols; x++) {
            ctx.beginPath();
            ctx.moveTo(x * blockSize, 0);
            ctx.lineTo(x * blockSize, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y <= rows; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * blockSize);
            ctx.lineTo(canvas.width, y * blockSize);
            ctx.stroke();
        }
        
        // Line clear flash effect
        if (lineClearFlash > 0) {
            lineClearFlash--;
            ctx.fillStyle = `rgba(255, 255, 255, ${lineClearFlash * 0.03})`;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        // Draw board blocks
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                if (board[y][x]) {
                    drawBlock(x, y, board[y][x]);
                }
            }
        }
        
        // Draw ghost piece (landing preview)
        if (currentPiece) {
            const ghostY = getGhostY();
            if (ghostY !== pieceY) {
                for (let y = 0; y < currentPiece.length; y++) {
                    for (let x = 0; x < currentPiece[y].length; x++) {
                        if (currentPiece[y][x]) {
                            const gx = (pieceX + x) * blockSize;
                            const gy = (ghostY + y) * blockSize;
                            ctx.strokeStyle = currentColor;
                            ctx.globalAlpha = 0.3;
                            ctx.lineWidth = 2;
                            ctx.strokeRect(gx + 1, gy + 1, blockSize - 3, blockSize - 3);
                            ctx.globalAlpha = 1;
                        }
                    }
                }
            }
        }
        
        // Draw current piece
        if (currentPiece) {
            for (let y = 0; y < currentPiece.length; y++) {
                for (let x = 0; x < currentPiece[y].length; x++) {
                    if (currentPiece[y][x]) {
                        drawBlock(pieceX + x, pieceY + y, currentColor);
                    }
                }
            }
        }
        
        // Draw next piece preview
        drawNextPiece();
    }
    
    function drawNextPiece() {
        const nextPiece = tetrisPieces[nextPieceType];
        const previewX = canvas.width - 5;
        const previewY = 10;
        const previewBlockSize = 14;
        
        // Preview background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(previewX - 70, previewY - 5, 68, 60);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(previewX - 70, previewY - 5, 68, 60);
        
        // "NEXT" label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('NEXT', previewX - 36, previewY + 7);
        
        // Draw the piece
        const shape = nextPiece.shape;
        const offsetX = previewX - 36 - (shape[0].length * previewBlockSize) / 2;
        const offsetY = previewY + 18 + (2 - shape.length) * previewBlockSize / 2;
        
        for (let y = 0; y < shape.length; y++) {
            for (let x = 0; x < shape[y].length; x++) {
                if (shape[y][x]) {
                    const bx = offsetX + x * previewBlockSize;
                    const by = offsetY + y * previewBlockSize;
                    const size = previewBlockSize - 1;
                    
                    ctx.fillStyle = nextPiece.color;
                    ctx.fillRect(bx, by, size, size);
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
                    ctx.fillRect(bx, by, size, 2);
                    ctx.fillRect(bx, by, 2, size);
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                    ctx.fillRect(bx, by + size - 2, size, 2);
                    ctx.fillRect(bx + size - 2, by, 2, size);
                }
            }
        }
    }
    
    function update(time = 0) {
        if (!tetrisGame) return;
        if (gamePaused) {
            lastTime = time;
            tetrisGame = requestAnimationFrame(update);
            return;
        }
        
        const deltaTime = time - lastTime;
        lastTime = time;
        dropCounter += deltaTime;
        
        if (dropCounter > dropInterval) {
            if (currentPiece) {
                pieceY++;
                if (collision()) {
                    pieceY--;
                    mergePiece();
                    SFX.drop();
                    clearLines();
                    spawnPiece();
                }
            } else {
                spawnPiece();
            }
            dropCounter = 0;
        }
        
        draw();
        tetrisGame = requestAnimationFrame(update);
    }
    
    function handleKeyPress(e) {
        const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        
        if (!currentPiece) return;
        
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            pieceX--;
            if (collision()) pieceX++; else SFX.move();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            pieceX++;
            if (collision()) pieceX--; else SFX.move();
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            pieceY++;
            if (collision()) {
                pieceY--;
                mergePiece();
                SFX.drop();
                clearLines();
                spawnPiece();
            }
            score += 1;
            const tetrisScoreElement = document.getElementById('tetris-score');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
        } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            rotatePiece(); SFX.rotate();
        } else if (e.key === ' ') {
            let dropDist = 0;
            while (!collision()) {
                pieceY++;
                dropDist++;
            }
            pieceY--;
            dropDist--;
            score += dropDist * 2; // Hard drop bonus
            const tetrisScoreElement = document.getElementById('tetris-score');
            if (tetrisScoreElement) tetrisScoreElement.textContent = score;
            mergePiece();
            SFX.drop();
            clearLines();
            spawnPiece();
        }
    }
    
    document.removeEventListener('keydown', tetrisKeyHandler);
    tetrisKeyHandler = handleKeyPress;
    document.addEventListener('keydown', tetrisKeyHandler);
    
    if (tetrisGame) cancelAnimationFrame(tetrisGame);
    lastTime = performance.now();
    draw();
    tetrisGame = requestAnimationFrame(update);
}

// ==================== PLATFORMER GAME (Side-Scroller) ====================
let platformerGame = null;
let platformerKeyHandler = null;
let platformerKeyUpHandler = null;

function initPlatformer() {
    const canvas = document.getElementById('platformer-canvas');
    const ctx = canvas.getContext('2d');
    
    // World constants
    const WORLD_WIDTH = 9000;
    const GROUND_Y = 370;
    const TILE = 30;
    
    const player = {
        x: 80, y: GROUND_Y - 32,
        width: 28, height: 32,
        vx: 0, vy: 0,
        speed: 4.5, jumpPower: 13.5,
        onGround: false, facingRight: true,
        animFrame: 0, dead: false
    };
    
    let camera = {x: 0};
    let score = 0;
    let gameTime = 0;
    let deathTimeout = null;
    let keys = {};
    
    // ---- Level Generation ----
    // Ground segments — pits are the 100px gaps between them
    // Seg0: 0-1100 | Pit1: 1100-1200 | Seg1: 1200-2100 | Pit2: 2100-2200
    // Seg2: 2200-3000 | Pit3: 3000-3100 | Seg3: 3100-4000 | Pit4: 4000-4100
    // Seg4: 4100-5100 | Pit5: 5100-5200 | Seg5: 5200-6000 | Pit6: 6000-6100
    // Seg6: 6100-7000 | Pit7: 7000-7100 | Seg7: 7100-8000 | Pit8: 8000-8100
    // Seg8: 8100-9000
    const groundSegments = [
        {x: 0, w: 1100},
        {x: 1200, w: 900},
        {x: 2200, w: 800},
        {x: 3100, w: 900},
        {x: 4100, w: 1000},
        {x: 5200, w: 800},
        {x: 6100, w: 900},
        {x: 7100, w: 900},
        {x: 8100, w: 900}
    ];
    
    const platforms = [
        // Section 1 (Seg0: 0-1100)
        {x: 250, y: 310, w: 100},
        {x: 550, y: 270, w: 80},
        {x: 850, y: 300, w: 100},
        // Bridge over pit 1 (1100-1200)
        {x: 1120, y: 320, w: 60},
        // Section 2 (Seg1: 1200-2100)
        {x: 1350, y: 300, w: 100},
        {x: 1600, y: 260, w: 80},
        {x: 1850, y: 300, w: 100},
        // Bridge over pit 2 (2100-2200)
        {x: 2120, y: 320, w: 60},
        // Section 3 — staircase (Seg2: 2200-3000)
        {x: 2350, y: 310, w: 80},
        {x: 2500, y: 270, w: 80},
        {x: 2650, y: 240, w: 80},
        {x: 2850, y: 290, w: 80},
        // Bridge over pit 3 (3000-3100)
        {x: 3020, y: 320, w: 60},
        // Section 4 (Seg3: 3100-4000)
        {x: 3250, y: 290, w: 100},
        {x: 3500, y: 260, w: 80},
        {x: 3750, y: 290, w: 100},
        // Bridge over pit 4 (4000-4100)
        {x: 4020, y: 320, w: 60},
        // Section 5 (Seg4: 4100-5100)
        {x: 4250, y: 300, w: 120},
        {x: 4550, y: 260, w: 80},
        {x: 4850, y: 300, w: 100},
        // Bridge over pit 5 (5100-5200)
        {x: 5120, y: 320, w: 60},
        // Section 6 (Seg5: 5200-6000)
        {x: 5350, y: 290, w: 100},
        {x: 5600, y: 250, w: 80},
        {x: 5850, y: 300, w: 100},
        // Bridge over pit 6 (6000-6100)
        {x: 6020, y: 320, w: 60},
        // Section 7 (Seg6: 6100-7000)
        {x: 6250, y: 280, w: 100},
        {x: 6500, y: 250, w: 80},
        {x: 6750, y: 280, w: 100},
        // Bridge over pit 7 (7000-7100)
        {x: 7020, y: 320, w: 60},
        // Section 8 (Seg7: 7100-8000)
        {x: 7250, y: 290, w: 100},
        {x: 7500, y: 260, w: 80},
        {x: 7800, y: 300, w: 100},
        // Bridge over pit 8 (8000-8100)
        {x: 8020, y: 320, w: 60},
        // Section 9 — final stretch (Seg8: 8100-9000)
        {x: 8250, y: 280, w: 100},
        {x: 8500, y: 250, w: 80},
        {x: 8700, y: 280, w: 120}
    ];
    
    const movingPlatformsInit = [
        {x: 500, y: 280, w: 70, dx: 1, dy: 0, minX: 400, maxX: 600},
        {x: 2400, y: 260, w: 70, dx: 0, dy: 1, minY: 250, maxY: 330},
        {x: 4300, y: 270, w: 80, dx: 1, dy: 0, minX: 4200, maxX: 4500},
        {x: 6300, y: 260, w: 70, dx: 0, dy: 1, minY: 250, maxY: 330},
        {x: 7400, y: 280, w: 80, dx: 1, dy: 0, minX: 7300, maxX: 7500},
        {x: 8500, y: 270, w: 70, dx: 0, dy: -1, minY: 230, maxY: 330}
    ];
    let movingPlatforms = [];
    
    const enemiesInit = [
        // Walkers — patrol bounds verified within ground segments (25px width buffer)
        {x: 350, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 200, maxX: 650, type: 'walker'},
        {x: 850, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 700, maxX: 1000, type: 'walker'},
        {x: 1450, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 1300, maxX: 1650, type: 'walker'},
        {x: 1900, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 1750, maxX: 2050, type: 'walker'},
        {x: 2500, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 2300, maxX: 2700, type: 'walker'},
        {x: 3400, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 3200, maxX: 3600, type: 'walker'},
        {x: 3800, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 3650, maxX: 3950, type: 'walker'},
        {x: 4400, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 4200, maxX: 4600, type: 'walker'},
        {x: 4900, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 4700, maxX: 5050, type: 'walker'},
        {x: 5500, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 5300, maxX: 5700, type: 'walker'},
        {x: 6400, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 6200, maxX: 6600, type: 'walker'},
        {x: 6850, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 6650, maxX: 6950, type: 'walker'},
        {x: 7500, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 7200, maxX: 7700, type: 'walker'},
        {x: 8400, y: GROUND_Y - 25, w: 25, h: 25, dx: 1, minX: 8200, maxX: 8600, type: 'walker'},
        {x: 8750, y: GROUND_Y - 25, w: 25, h: 25, dx: -1, minX: 8550, maxX: 8850, type: 'walker'},
        // Spikes — every x verified to be within a ground segment
        {x: 600, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 600, maxX: 600, type: 'spike'},
        {x: 1700, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 1700, maxX: 1700, type: 'spike'},
        {x: 2800, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 2800, maxX: 2800, type: 'spike'},
        {x: 3600, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 3600, maxX: 3600, type: 'spike'},
        {x: 4600, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 4600, maxX: 4600, type: 'spike'},
        {x: 5800, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 5800, maxX: 5800, type: 'spike'},
        {x: 6600, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 6600, maxX: 6600, type: 'spike'},
        {x: 7700, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 7700, maxX: 7700, type: 'spike'},
        {x: 8600, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: 8600, maxX: 8600, type: 'spike'}
    ];
    let enemies = [];
    
    // Coins — evenly spaced ~300px apart, all on solid ground
    const coinsInit = [];
    [150, 450, 750, 1000,
     1300, 1600, 1900,
     2300, 2600, 2900,
     3200, 3500, 3800,
     4200, 4500, 4800,
     5300, 5600, 5900,
     6200, 6500, 6800,
     7200, 7500, 7800,
     8200, 8500, 8800].forEach(cx => {
        coinsInit.push({x: cx, y: GROUND_Y - 40, collected: false, animFrame: Math.random() * 60 | 0});
    });
    // Platform coins — only on platforms the player can stand on
    platforms.forEach((p, i) => {
        if (i % 3 === 0) {
            coinsInit.push({x: p.x + p.w / 2 - 10, y: p.y - 30, collected: false, animFrame: Math.random() * 60 | 0});
        }
    });
    let coins = [];
    
    const goal = {x: WORLD_WIDTH - 150, y: GROUND_Y - 60, w: 30, h: 60, reached: false};
    
    const clouds = [];
    for (let i = 0; i < 30; i++) {
        clouds.push({x: Math.random() * WORLD_WIDTH, y: 30 + Math.random() * 100, size: 25 + Math.random() * 35});
    }
    const bgMountains = [];
    for (let i = 0; i < 22; i++) {
        bgMountains.push({x: i * 450, w: 300 + Math.random() * 200, h: 80 + Math.random() * 100});
    }
    const bgTrees = [];
    for (let i = 0; i < 60; i++) {
        bgTrees.push({x: 100 + Math.random() * (WORLD_WIDTH - 200), h: 40 + Math.random() * 40});
    }
    
    function resetLevel() {
        player.x = 80;
        player.y = GROUND_Y - 32;
        player.vx = 0;
        player.vy = 0;
        player.onGround = false;
        player.dead = false;
        camera.x = 0;
        
        movingPlatforms = movingPlatformsInit.map(p => ({...p}));
        enemies = enemiesInit.map(e => ({...e, startX: e.x}));
        coins = coinsInit.map(c => ({...c, collected: false}));
        goal.reached = false;
    }
    
    function die() {
        if (player.dead) return;
        player.dead = true;
        SFX.platDie();
        const finalScore = score;
        
        deathTimeout = setTimeout(() => {
            deathTimeout = null;
            score = 0;
            const el = document.getElementById('platformer-score');
            if (el) el.textContent = score;
            resetLevel();
            if (finalScore > 0) {
                showGameOver('platformer', finalScore);
            }
        }, 600);
    }
    
    function isOnGround(px, py, pw) {
        for (const seg of groundSegments) {
            if (px + pw > seg.x && px < seg.x + seg.w) {
                if (py + player.height >= GROUND_Y) {
                    return GROUND_Y;
                }
            }
        }
        return null;
    }
    
    function update() {
        if (!platformerGame) return;
        if (gamePaused) {
            platformerGame = requestAnimationFrame(update);
            return;
        }
        
        gameTime++;
        
        if (!player.dead) {
            // Input
            if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
                player.vx = -player.speed;
                player.facingRight = false;
            } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
                player.vx = player.speed;
                player.facingRight = true;
            } else {
                player.vx *= 0.75;
                if (Math.abs(player.vx) < 0.3) player.vx = 0;
            }
            
            // Gravity
            player.vy += 0.65;
            if (player.vy > 18) player.vy = 18;
            
            // Move X
            player.x += player.vx;
            if (player.x < 0) player.x = 0;
            if (player.x > WORLD_WIDTH - player.width) player.x = WORLD_WIDTH - player.width;
            
            // Move Y
            player.y += player.vy;
            
            // Ground collision
            player.onGround = false;
            const groundHit = isOnGround(player.x, player.y, player.width);
            if (groundHit !== null && player.vy >= 0) {
                player.y = groundHit - player.height;
                player.vy = 0;
                player.onGround = true;
            }
            
            // Static platform collision
            for (const p of platforms) {
                if (player.x + player.width > p.x && player.x < p.x + p.w &&
                    player.y + player.height > p.y && player.y + player.height < p.y + 20 && player.vy >= 0) {
                    player.y = p.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                }
            }
            
            // Moving platform update & collision
            movingPlatforms.forEach(mp => {
                const oldX = mp.x;
                const oldY = mp.y;
                if (mp.dx !== 0) {
                    mp.x += mp.dx;
                    if (mp.x <= mp.minX || mp.x >= mp.maxX) mp.dx *= -1;
                }
                if (mp.dy !== 0) {
                    mp.y += mp.dy;
                    if (mp.y <= mp.minY || mp.y >= mp.maxY) mp.dy *= -1;
                }
                
                if (player.x + player.width > mp.x && player.x < mp.x + mp.w &&
                    player.y + player.height > mp.y && player.y + player.height < mp.y + 18 && player.vy >= 0) {
                    player.y = mp.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                    player.x += (mp.x - oldX);
                    player.y += (mp.y - oldY);
                }
            });
            
            // Enemy update & collision
            enemies.forEach(e => {
                if (e.dx !== 0) {
                    e.x += e.dx;
                    if (e.x <= e.minX || e.x >= e.maxX) e.dx *= -1;
                }
                
                if (player.x + player.width > e.x + 3 && player.x + 3 < e.x + e.w &&
                    player.y + player.height > e.y + 3 && player.y + 3 < e.y + e.h) {
                    // Stomp enemy if landing on top (only walkers)
                    if (e.type === 'walker' && player.vy > 0 && player.y + player.height < e.y + e.h / 2) {
                        e.h = 0;
                        e.dx = 0;
                        player.vy = -8;
                        SFX.stomp();
                        score += 5;
                        const el = document.getElementById('platformer-score');
                        if (el) el.textContent = score;
                    } else if (e.h > 0) {
                        die();
                    }
                }
            });
            
            // Coin collection
            coins.forEach(coin => {
                if (!coin.collected) {
                    coin.animFrame++;
                    if (player.x + player.width > coin.x && player.x < coin.x + 20 &&
                        player.y + player.height > coin.y && player.y < coin.y + 20) {
                        coin.collected = true;
                        SFX.coin();
                        score++;
                        const el = document.getElementById('platformer-score');
                        if (el) el.textContent = score;
                    }
                }
            });
            
            // Goal
            if (!goal.reached && player.x + player.width > goal.x && player.x < goal.x + goal.w &&
                player.y + player.height > goal.y && player.y < goal.y + goal.h) {
                goal.reached = true;
                SFX.goal();
                const finalScore = score;
                deathTimeout = setTimeout(() => {
                    deathTimeout = null;
                    showGameOver('platformer', finalScore);
                    score = 0;
                    const el = document.getElementById('platformer-score');
                    if (el) el.textContent = score;
                    resetLevel();
                }, 1000);
            }
            
            // Fall off world
            if (player.y > canvas.height + 100) {
                die();
            }
            
            // Animation frame
            if (Math.abs(player.vx) > 0.5 && player.onGround) {
                player.animFrame += 0.2;
            }
        }
        
        // Camera follows player smoothly
        const targetCamX = player.x - canvas.width * 0.35;
        camera.x += (targetCamX - camera.x) * 0.08;
        if (camera.x < 0) camera.x = 0;
        if (camera.x > WORLD_WIDTH - canvas.width) camera.x = WORLD_WIDTH - canvas.width;
        
        draw();
        platformerGame = requestAnimationFrame(update);
    }
    
    function draw() {
        const cx = camera.x;
        
        // Sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
        skyGrad.addColorStop(0, '#4A90D9');
        skyGrad.addColorStop(0.5, '#87CEEB');
        skyGrad.addColorStop(1, '#B8E6B8');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Background mountains (parallax)
        ctx.fillStyle = '#8BB8A8';
        bgMountains.forEach(m => {
            const mx = m.x - cx * 0.2;
            ctx.beginPath();
            ctx.moveTo(mx, GROUND_Y);
            ctx.lineTo(mx + m.w / 2, GROUND_Y - m.h);
            ctx.lineTo(mx + m.w, GROUND_Y);
            ctx.fill();
        });
        ctx.fillStyle = '#9FC8B8';
        bgMountains.forEach(m => {
            const mx = m.x + 100 - cx * 0.3;
            ctx.beginPath();
            ctx.moveTo(mx, GROUND_Y);
            ctx.lineTo(mx + m.w * 0.6 / 2, GROUND_Y - m.h * 0.6);
            ctx.lineTo(mx + m.w * 0.6, GROUND_Y);
            ctx.fill();
        });
        
        // Background trees (parallax)
        bgTrees.forEach(t => {
            const tx = t.x - cx * 0.5;
            if (tx > -50 && tx < canvas.width + 50) {
                // Trunk
                ctx.fillStyle = '#5D4037';
                ctx.fillRect(tx - 3, GROUND_Y - t.h, 6, t.h);
                // Leaves
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(tx, GROUND_Y - t.h - 8, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#388E3C';
                ctx.beginPath();
                ctx.arc(tx + 5, GROUND_Y - t.h - 3, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Clouds (parallax)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        clouds.forEach(cloud => {
            const cloudX = cloud.x - cx * 0.1 + gameTime * 0.05;
            const wrappedX = ((cloudX % (WORLD_WIDTH + 200)) + WORLD_WIDTH + 200) % (WORLD_WIDTH + 200) - 100;
            const sx = wrappedX - cx * 0.1;
            if (sx > -100 && sx < canvas.width + 100) {
                ctx.beginPath();
                ctx.arc(sx, cloud.y, cloud.size, 0, Math.PI * 2);
                ctx.arc(sx + cloud.size * 0.7, cloud.y - cloud.size * 0.1, cloud.size * 0.8, 0, Math.PI * 2);
                ctx.arc(sx + cloud.size * 1.3, cloud.y, cloud.size * 0.65, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Ground segments
        groundSegments.forEach(seg => {
            const sx = seg.x - cx;
            if (sx + seg.w > 0 && sx < canvas.width) {
                // Dirt
                ctx.fillStyle = '#8B6914';
                ctx.fillRect(sx, GROUND_Y, seg.w, canvas.height - GROUND_Y);
                // Grass layer
                const grassGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 8);
                grassGrad.addColorStop(0, '#6ABF4B');
                grassGrad.addColorStop(1, '#4CAF50');
                ctx.fillStyle = grassGrad;
                ctx.fillRect(sx, GROUND_Y, seg.w, 8);
                // Dirt texture lines
                ctx.strokeStyle = 'rgba(100, 60, 10, 0.2)';
                ctx.lineWidth = 1;
                for (let i = 0; i < seg.w; i += 30) {
                    ctx.beginPath();
                    ctx.moveTo(sx + i, GROUND_Y + 15);
                    ctx.lineTo(sx + i + 15, GROUND_Y + 25);
                    ctx.stroke();
                }
            }
        });
        
        // Static platforms
        platforms.forEach(p => {
            const px = p.x - cx;
            if (px + p.w > -10 && px < canvas.width + 10) {
                // Shadow
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(px + 3, p.y + 3, p.w, 15);
                // Platform body
                const pGrad = ctx.createLinearGradient(0, p.y, 0, p.y + 15);
                pGrad.addColorStop(0, '#A0522D');
                pGrad.addColorStop(1, '#6B3410');
                ctx.fillStyle = pGrad;
                ctx.fillRect(px, p.y, p.w, 15);
                // Highlight
                ctx.fillStyle = 'rgba(255,255,255,0.2)';
                ctx.fillRect(px, p.y, p.w, 3);
                // Brick lines
                ctx.strokeStyle = 'rgba(0,0,0,0.15)';
                ctx.lineWidth = 1;
                for (let i = 0; i < p.w; i += 20) {
                    ctx.beginPath();
                    ctx.moveTo(px + i, p.y);
                    ctx.lineTo(px + i, p.y + 15);
                    ctx.stroke();
                }
            }
        });
        
        // Moving platforms
        movingPlatforms.forEach(mp => {
            const px = mp.x - cx;
            if (px + mp.w > -10 && px < canvas.width + 10) {
                ctx.fillStyle = 'rgba(0,0,0,0.15)';
                ctx.fillRect(px + 2, mp.y + 2, mp.w, 12);
                const mpGrad = ctx.createLinearGradient(0, mp.y, 0, mp.y + 12);
                mpGrad.addColorStop(0, '#FF9800');
                mpGrad.addColorStop(1, '#E65100');
                ctx.fillStyle = mpGrad;
                ctx.fillRect(px, mp.y, mp.w, 12);
                // Arrows
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(mp.dy !== 0 ? '↕' : '↔', px + mp.w / 2, mp.y + 10);
            }
        });
        
        // Enemies
        enemies.forEach(e => {
            if (e.h <= 0) return; // Squished
            const ex = e.x - cx;
            if (ex + e.w > -10 && ex < canvas.width + 10) {
                if (e.type === 'spike') {
                    // Spike hazard
                    ctx.fillStyle = '#777';
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(ex + i * 10, e.y + e.h);
                        ctx.lineTo(ex + i * 10 + 5, e.y);
                        ctx.lineTo(ex + i * 10 + 10, e.y + e.h);
                        ctx.fill();
                    }
                } else {
                    // Walker enemy (goomba-like)
                    ctx.fillStyle = '#C62828';
                    ctx.beginPath();
                    ctx.arc(ex + e.w / 2, e.y + e.h / 2, e.w / 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Feet
                    ctx.fillStyle = '#8B0000';
                    ctx.fillRect(ex + 2, e.y + e.h - 6, 8, 6);
                    ctx.fillRect(ex + e.w - 10, e.y + e.h - 6, 8, 6);
                    // Eyes
                    ctx.fillStyle = '#FFF';
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.35, e.y + e.h * 0.35, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.65, e.y + e.h * 0.35, 4, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#000';
                    const eyeOff = e.dx > 0 ? 1 : -1;
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.35 + eyeOff, e.y + e.h * 0.37, 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(ex + e.w * 0.65 + eyeOff, e.y + e.h * 0.37, 2, 0, Math.PI * 2);
                    ctx.fill();
                    // Angry brows
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(ex + e.w * 0.2, e.y + e.h * 0.25);
                    ctx.lineTo(ex + e.w * 0.45, e.y + e.h * 0.2);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(ex + e.w * 0.8, e.y + e.h * 0.25);
                    ctx.lineTo(ex + e.w * 0.55, e.y + e.h * 0.2);
                    ctx.stroke();
                }
            }
        });
        
        // Coins
        coins.forEach(coin => {
            if (coin.collected) return;
            const coinX = coin.x - cx;
            if (coinX > -20 && coinX < canvas.width + 20) {
                const bounce = Math.sin(coin.animFrame * 0.08) * 3;
                const squash = 0.6 + Math.abs(Math.cos(coin.animFrame * 0.06)) * 0.4;
                ctx.save();
                ctx.translate(coinX + 10, coin.y + 10 + bounce);
                ctx.scale(squash, 1);
                // Outer
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, Math.PI * 2);
                ctx.fill();
                // Inner
                ctx.fillStyle = '#FFC107';
                ctx.beginPath();
                ctx.arc(0, 0, 7, 0, Math.PI * 2);
                ctx.fill();
                // Shine
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.arc(-2, -3, 3, 0, Math.PI * 2);
                ctx.fill();
                // $ symbol
                ctx.fillStyle = '#B8860B';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('$', 0, 1);
                ctx.restore();
            }
        });
        
        // Goal flag
        if (!goal.reached) {
            const gx = goal.x - cx;
            if (gx > -40 && gx < canvas.width + 40) {
                // Pole
                ctx.fillStyle = '#555';
                ctx.fillRect(gx + 12, goal.y - 20, 5, goal.h + 20);
                // Ball on top
                ctx.fillStyle = '#FFD700';
                ctx.beginPath();
                ctx.arc(gx + 14, goal.y - 22, 5, 0, Math.PI * 2);
                ctx.fill();
                // Flag
                const wave = Math.sin(gameTime * 0.05) * 3;
                ctx.fillStyle = '#E53935';
                ctx.beginPath();
                ctx.moveTo(gx + 17, goal.y - 18);
                ctx.lineTo(gx + 40 + wave, goal.y - 12);
                ctx.lineTo(gx + 38 + wave, goal.y - 5);
                ctx.lineTo(gx + 17, goal.y);
                ctx.fill();
                // Star on flag
                ctx.fillStyle = '#FFD700';
                ctx.font = '12px Arial';
                ctx.fillText('★', gx + 24 + wave * 0.5, goal.y - 6);
                // "GOAL" text
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('GOAL', gx + 14, goal.y - 30);
            }
        }
        
        // Player
        if (!player.dead || gameTime % 6 < 3) { // Blink when dead
            const px = player.x - cx;
            const py = player.y;
            
            // Shadow
            if (player.onGround) {
                ctx.fillStyle = 'rgba(0,0,0,0.2)';
                ctx.beginPath();
                ctx.ellipse(px + player.width / 2, py + player.height + 2, 12, 4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Body
            ctx.fillStyle = '#E53935';
            ctx.fillRect(px + 4, py + 12, player.width - 8, player.height - 12);
            
            // Head
            ctx.fillStyle = '#FFCC80';
            ctx.beginPath();
            ctx.arc(px + player.width / 2, py + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            
            // Hat
            ctx.fillStyle = '#1565C0';
            ctx.beginPath();
            ctx.arc(px + player.width / 2, py + 6, 11, Math.PI, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px + 1, py + 5, player.width - 2, 4);
            
            // Eyes
            ctx.fillStyle = '#FFF';
            const eyeBaseX = player.facingRight ? 3 : -3;
            ctx.beginPath();
            ctx.arc(px + player.width / 2 - 4 + eyeBaseX * 0.3, py + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px + player.width / 2 + 4 + eyeBaseX * 0.3, py + 10, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000';
            const pupilOff = player.facingRight ? 1 : -1;
            ctx.beginPath();
            ctx.arc(px + player.width / 2 - 4 + eyeBaseX * 0.3 + pupilOff, py + 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(px + player.width / 2 + 4 + eyeBaseX * 0.3 + pupilOff, py + 10, 1.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Legs (animated)
            ctx.fillStyle = '#1565C0';
            const legAnim = player.onGround ? Math.sin(player.animFrame) * 3 : 0;
            ctx.fillRect(px + 6, py + player.height - 4, 6, 6 + legAnim);
            ctx.fillRect(px + player.width - 12, py + player.height - 4, 6, 6 - legAnim);
        }
        
        // HUD: progress bar
        const progress = player.x / WORLD_WIDTH;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(10, 10, 150, 8);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(10, 10, 150 * progress, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 150, 8);
        // Player dot on progress bar
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(10 + 150 * progress, 14, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    function handleKeyDown(e) {
        const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'w', 'W', 'a', 'A', 's', 'S', 'd', 'D'];
        if (gameKeys.includes(e.key)) e.preventDefault();
        
        keys[e.key] = true;
        if ((e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') && player.onGround && !player.dead) {
            player.vy = -player.jumpPower;
            player.onGround = false;
            SFX.jump();
        }
    }
    
    function handleKeyUp(e) {
        keys[e.key] = false;
    }
    
    // Cleanup & init
    document.removeEventListener('keydown', platformerKeyHandler);
    document.removeEventListener('keyup', platformerKeyUpHandler);
    platformerKeyHandler = handleKeyDown;
    platformerKeyUpHandler = handleKeyUp;
    document.addEventListener('keydown', platformerKeyHandler);
    document.addEventListener('keyup', platformerKeyUpHandler);
    
    if (deathTimeout) { clearTimeout(deathTimeout); deathTimeout = null; }
    if (platformerGame) cancelAnimationFrame(platformerGame);
    
    score = 0;
    const el = document.getElementById('platformer-score');
    if (el) el.textContent = score;
    resetLevel();
    draw();
    platformerGame = requestAnimationFrame(update);
}

