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

// ==================== OPTION SYSTEM ====================
function getOption(name, defaultVal) {
    const el = document.querySelector(`.pill.active[data-option="${name}"]`);
    return el ? el.dataset.value : defaultVal;
}

document.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    const group = pill.closest('.option-pills');
    if (!group) return;
    group.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
});

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
            if (lastGameOverName === 'snake') gamePaused = false;
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

    const speedMap = { chill: 160, normal: 100, fast: 65, insane: 40 };
    const moveInterval = speedMap[getOption('snake-speed', 'normal')] || 100;

    const styleOpt = getOption('snake-style', 'classic');
    const hatOpt = getOption('snake-hat', 'none');
    const snakeColors = {
        classic: { hue: 145, sat: 72, glow: '#4ade80', headLight: '#86efac', headDark: '#22c55e', tail: '#22c55e' },
        neon:    { hue: 195, sat: 90, glow: '#38bdf8', headLight: '#7dd3fc', headDark: '#0284c7', tail: '#0284c7' },
        fire:    { hue: 20,  sat: 85, glow: '#fb923c', headLight: '#fdba74', headDark: '#ea580c', tail: '#ea580c' },
        rainbow: { hue: 0,   sat: 80, glow: '#f472b6', headLight: '#fda4af', headDark: '#e11d48', tail: '#e11d48' },
    };
    const sc = snakeColors[styleOpt] || snakeColors.classic;
    
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
        snake.forEach(s => spawnBurst(s.x, s.y, sc.glow, 4));
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
            const hue = styleOpt === 'rainbow' ? (gameTime * 2 + i * 25) % 360 : sc.hue;
            ctx.strokeStyle = `hsl(${hue}, ${sc.sat}%, ${lightness}%)`;
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
            const tailHue = styleOpt === 'rainbow' ? (gameTime * 2 + len * 25) % 360 : sc.hue;
            ctx.fillStyle = `hsl(${tailHue}, ${sc.sat}%, 42%)`;
            ctx.beginPath();
            ctx.arc((tail.x + 0.5) * gs, (tail.y + 0.5) * gs, tailR, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Head
        const hx = (snakeRender[0].x + 0.5) * gs;
        const hy = (snakeRender[0].y + 0.5) * gs;
        const hr = gs * 0.47;
        
        ctx.shadowColor = sc.glow;
        ctx.shadowBlur = 14;
        const hGrad = ctx.createRadialGradient(hx - 2, hy - 2, 0, hx, hy, hr);
        hGrad.addColorStop(0, sc.headLight);
        hGrad.addColorStop(1, sc.headDark);
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
        
        // Hat / accessory
        if (hatOpt !== 'none') {
            const hatY = hy - hr - 2;
            if (hatOpt === 'crown') {
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath();
                ctx.moveTo(hx - 6, hatY + 2);
                ctx.lineTo(hx - 7, hatY - 6);
                ctx.lineTo(hx - 3, hatY - 2);
                ctx.lineTo(hx, hatY - 8);
                ctx.lineTo(hx + 3, hatY - 2);
                ctx.lineTo(hx + 7, hatY - 6);
                ctx.lineTo(hx + 6, hatY + 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#ef4444';
                ctx.beginPath(); ctx.arc(hx, hatY - 5, 1.2, 0, Math.PI * 2); ctx.fill();
            } else if (hatOpt === 'tophat') {
                ctx.fillStyle = '#1e1e2e';
                ctx.fillRect(hx - 7, hatY - 1, 14, 3);
                ctx.fillRect(hx - 5, hatY - 10, 10, 10);
                ctx.strokeStyle = '#6366f1';
                ctx.lineWidth = 1;
                ctx.strokeRect(hx - 5, hatY - 5, 10, 2);
            } else if (hatOpt === 'party') {
                ctx.fillStyle = '#f472b6';
                ctx.beginPath();
                ctx.moveTo(hx, hatY - 10);
                ctx.lineTo(hx - 6, hatY + 2);
                ctx.lineTo(hx + 6, hatY + 2);
                ctx.closePath();
                ctx.fill();
                ctx.fillStyle = '#fbbf24';
                ctx.beginPath(); ctx.arc(hx, hatY - 10, 2, 0, Math.PI * 2); ctx.fill();
            } else if (hatOpt === 'shades') {
                const sy = hy - 1;
                ctx.fillStyle = '#111';
                ctx.fillRect(hx - 7, sy - 2.5, 6, 5);
                ctx.fillRect(hx + 1, sy - 2.5, 6, 5);
                ctx.fillRect(hx - 1, sy - 0.5, 2, 1);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(hx - 7, sy - 2.5, 6, 5);
                ctx.strokeRect(hx + 1, sy - 2.5, 6, 5);
            }
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

    const pacDiff = getOption('pacman-diff', 'normal');
    const pacSettings = {
        easy:   { interval: 180, frightenDur: 60, ghostSmart: 0.08 },
        normal: { interval: 150, frightenDur: 40, ghostSmart: 0.15 },
        hard:   { interval: 115, frightenDur: 22, ghostSmart: 0.25 },
    };
    const ps = pacSettings[pacDiff] || pacSettings.normal;
    const moveInterval = ps.interval;
    
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
                frightenedTimer = ps.frightenDur;
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
            
            if (Math.random() < ps.ghostSmart) {
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
    const mineDiff = getOption('mine-diff', 'intermediate');
    const mineSettings = {
        beginner:     { size: 9,  mines: 10 },
        intermediate: { size: 16, mines: 40 },
        expert:       { size: 20, mines: 70 },
    };
    const ms = mineSettings[mineDiff] || mineSettings.intermediate;
    const size = ms.size;
    const mineCount = ms.mines;
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
        const cellSize = size <= 9 ? 32 : size <= 16 ? 28 : 24;
        board.style.gridTemplateColumns = `repeat(${size}, ${cellSize}px)`;
        board.style.setProperty('--cell-size', cellSize + 'px');
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
                cell.style.width = cellSize + 'px';
                cell.style.height = cellSize + 'px';
                cell.style.fontSize = (cellSize <= 24 ? 10 : 13) + 'px';
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

    const tetrisSpeed = getOption('tetris-speed', 'normal');
    const tetrisBoard = getOption('tetris-board', 'standard');

    const boardConfigs = {
        standard: { cols: 10, rows: 20, block: 30 },
        wide:     { cols: 14, rows: 20, block: 30 },
        tall:     { cols: 10, rows: 24, block: 25 },
    };
    const bc = boardConfigs[tetrisBoard] || boardConfigs.standard;
    const blockSize = bc.block;
    const cols = bc.cols;
    const rows = bc.rows;
    canvas.width = cols * blockSize;
    canvas.height = rows * blockSize;

    const baseInterval = { slow: 1200, normal: 1000, fast: 600 }[tetrisSpeed] || 1000;

    let board = Array(rows).fill().map(() => Array(cols).fill(0));
    let currentPiece = null;
    let currentColor = '#2196F3';
    let pieceX = 0;
    let pieceY = 0;
    let score = 0;
    let lines = 0;
    let level = 1;
    let dropCounter = 0;
    let dropInterval = baseInterval;
    let lastTime = 0;
    let nextPieceType = Math.floor(Math.random() * tetrisPieces.length);
    let lineClearFlash = 0;
    let flashingRows = [];
    
    function getDropInterval() {
        return Math.max(100, baseInterval - (level - 1) * 80);
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
    
    const GROUND_Y = 370;
    const TILE = 30;
    let WORLD_WIDTH = 9000;
    
    const avatarOpt = getOption('plat-color', 'blue');
    const themeOpt = getOption('plat-theme', 'forest');
    const startLevel = parseInt(getOption('plat-level', '1'), 10) || 1;

    const avatarColors = {
        classic: { body: '#E53935', hat: '#1565C0', legs: '#1565C0' },
        blue:    { body: '#1976D2', hat: '#0D47A1', legs: '#0D47A1' },
        red:     { body: '#C62828', hat: '#B71C1C', legs: '#8E0000' },
        green:   { body: '#2E7D32', hat: '#1B5E20', legs: '#1B5E20' },
        purple:  { body: '#7B1FA2', hat: '#6A1B9A', legs: '#4A148C' },
        gold:    { body: '#F9A825', hat: '#F57F17', legs: '#E65100' },
    };
    const ac = avatarColors[avatarOpt] || avatarColors.classic;

    const themes = {
        forest: {
            sky: ['#4A90D9', '#87CEEB', '#B8E6B8'],
            mountain1: '#8BB8A8', mountain2: '#9FC8B8',
            trunk: '#5D4037', leaf1: '#4CAF50', leaf2: '#388E3C',
            dirt: '#8B6914', grass1: '#6ABF4B', grass2: '#4CAF50',
            platform: '#795548', platformTop: '#8D6E63',
        },
        desert: {
            sky: ['#F4A460', '#FFDEAD', '#FFE4B5'],
            mountain1: '#C19A6B', mountain2: '#D2B48C',
            trunk: '#8B4513', leaf1: '#9ACD32', leaf2: '#6B8E23',
            dirt: '#C2A64E', grass1: '#DAA520', grass2: '#B8860B',
            platform: '#A0522D', platformTop: '#CD853F',
        },
        ice: {
            sky: ['#1a1a3e', '#3A5F8A', '#87CEEB'],
            mountain1: '#B0C4DE', mountain2: '#DCEEF8',
            trunk: '#708090', leaf1: '#ADD8E6', leaf2: '#87CEEB',
            dirt: '#708090', grass1: '#B0E0E6', grass2: '#87CEEB',
            platform: '#5F9EA0', platformTop: '#B0E0E6',
        },
        night: {
            sky: ['#0B0E17', '#141B2D', '#1C2541'],
            mountain1: '#1F2937', mountain2: '#374151',
            trunk: '#4B5563', leaf1: '#065F46', leaf2: '#064E3B',
            dirt: '#292524', grass1: '#365314', grass2: '#1a2e05',
            platform: '#44403C', platformTop: '#57534E',
        },
    };
    const th = themes[themeOpt] || themes.forest;

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
    
    // ---- Multi-Level System ----
    let currentLevel = 1;
    const MAX_LEVELS = 3;
    let levelTransition = 0;

    let groundSegments, platforms, movingPlatformsInit, movingPlatforms;
    let enemiesInit, enemies, coinsInit, coins;
    let springsInit, springs;
    let crumblingInit, crumblingPlatforms;
    let fallingInit, fallingPlatforms;
    let fireballSources, fireballs;
    let goal;
    let clouds, bgMountains, bgTrees;

    function makeCoins(xPositions, plats) {
        const c = [];
        xPositions.forEach(cx => c.push({x: cx, y: GROUND_Y - 40, collected: false, animFrame: Math.random() * 60 | 0}));
        plats.forEach((p, i) => { if (i % 3 === 0) c.push({x: p.x + p.w / 2 - 10, y: p.y - 30, collected: false, animFrame: Math.random() * 60 | 0}); });
        return c;
    }
    function w(x, dx, mn, mx) { return {x, y: GROUND_Y - 25, w: 25, h: 25, dx, minX: mn, maxX: mx, type: 'walker'}; }
    function sp(x) { return {x, y: GROUND_Y - 15, w: 30, h: 15, dx: 0, minX: x, maxX: x, type: 'spike'}; }

    function generateBackground() {
        clouds = [];
        for (let i = 0; i < 30; i++) clouds.push({x: Math.random() * WORLD_WIDTH, y: 30 + Math.random() * 100, size: 25 + Math.random() * 35});
        bgMountains = [];
        for (let i = 0; i < Math.ceil(WORLD_WIDTH / 420); i++) bgMountains.push({x: i * 420, w: 300 + Math.random() * 200, h: 80 + Math.random() * 100});
        bgTrees = [];
        for (let i = 0; i < Math.ceil(WORLD_WIDTH / 150); i++) bgTrees.push({x: 80 + Math.random() * (WORLD_WIDTH - 160), h: 40 + Math.random() * 40});
    }

    function loadLevel(num) {
        if (num === 1) {
            // --- LEVEL 1: Classic ---
            WORLD_WIDTH = 9000;
            groundSegments = [
                {x:0,w:1100},{x:1200,w:900},{x:2200,w:800},{x:3100,w:900},
                {x:4100,w:1000},{x:5200,w:800},{x:6100,w:900},{x:7100,w:900},{x:8100,w:900}
            ];
            platforms = [
                {x:250,y:310,w:100},{x:550,y:270,w:80},{x:850,y:300,w:100},
                {x:1120,y:320,w:60},
                {x:1350,y:300,w:100},{x:1600,y:260,w:80},{x:1850,y:300,w:100},
                {x:2120,y:320,w:60},
                {x:2350,y:310,w:80},{x:2500,y:270,w:80},{x:2650,y:240,w:80},{x:2850,y:290,w:80},
                {x:3020,y:320,w:60},
                {x:3250,y:290,w:100},{x:3500,y:260,w:80},{x:3750,y:290,w:100},
                {x:4020,y:320,w:60},
                {x:4250,y:300,w:120},{x:4550,y:260,w:80},{x:4850,y:300,w:100},
                {x:5120,y:320,w:60},
                {x:5350,y:290,w:100},{x:5600,y:250,w:80},{x:5850,y:300,w:100},
                {x:6020,y:320,w:60},
                {x:6250,y:280,w:100},{x:6500,y:250,w:80},{x:6750,y:280,w:100},
                {x:7020,y:320,w:60},
                {x:7250,y:290,w:100},{x:7500,y:260,w:80},{x:7800,y:300,w:100},
                {x:8020,y:320,w:60},
                {x:8250,y:280,w:100},{x:8500,y:250,w:80},{x:8700,y:280,w:120}
            ];
            movingPlatformsInit = [
                {x:500,y:280,w:70,dx:1,dy:0,minX:400,maxX:600},
                {x:2400,y:260,w:70,dx:0,dy:1,minY:250,maxY:330},
                {x:4300,y:270,w:80,dx:1,dy:0,minX:4200,maxX:4500},
                {x:6300,y:260,w:70,dx:0,dy:1,minY:250,maxY:330},
                {x:7400,y:280,w:80,dx:1,dy:0,minX:7300,maxX:7500},
                {x:8500,y:270,w:70,dx:0,dy:-1,minY:230,maxY:330}
            ];
            enemiesInit = [
                w(350,1,200,650),w(850,-1,700,1000),w(1450,-1,1300,1650),w(1900,1,1750,2050),
                w(2500,1,2300,2700),w(3400,-1,3200,3600),w(3800,1,3650,3950),
                w(4400,1,4200,4600),w(4900,-1,4700,5050),w(5500,1,5300,5700),
                w(6400,-1,6200,6600),w(6850,1,6650,6950),w(7500,-1,7200,7700),
                w(8400,1,8200,8600),w(8750,-1,8550,8850),
                sp(600),sp(1700),sp(2800),sp(3600),sp(4600),sp(5800),sp(6600),sp(7700),sp(8600)
            ];
            coinsInit = makeCoins([150,450,750,1000,1300,1600,1900,2300,2600,2900,
                3200,3500,3800,4200,4500,4800,5300,5600,5900,
                6200,6500,6800,7200,7500,7800,8200,8500,8800], platforms);
            springsInit = [];
            crumblingInit = [];
            fallingInit = [];
            fireballSources = [];
        }

        else if (num === 2) {
            // --- LEVEL 2: Springs & Crumbling Platforms ---
            WORLD_WIDTH = 7000;
            groundSegments = [
                {x:0,w:950},{x:1070,w:830},{x:2020,w:780},{x:2920,w:780},
                {x:3820,w:780},{x:4720,w:780},{x:5620,w:1380}
            ];
            platforms = [
                {x:200,y:310,w:100},{x:500,y:280,w:80},{x:750,y:300,w:100},
                {x:1150,y:290,w:100},{x:1400,y:200,w:90},{x:1650,y:280,w:90},
                {x:2100,y:300,w:100},{x:2400,y:210,w:90},{x:2650,y:290,w:80},
                {x:3000,y:280,w:100},{x:3250,y:240,w:80},{x:3500,y:300,w:100},
                {x:3900,y:290,w:100},{x:4150,y:200,w:90},{x:4400,y:280,w:80},
                {x:4800,y:300,w:100},{x:5100,y:210,w:90},{x:5350,y:290,w:80},
                {x:5700,y:280,w:100},{x:5950,y:250,w:80},{x:6200,y:280,w:100},
                {x:6500,y:260,w:80},{x:6750,y:290,w:100}
            ];
            movingPlatformsInit = [
                {x:600,y:260,w:70,dx:1,dy:0,minX:500,maxX:700},
                {x:3300,y:260,w:70,dx:0,dy:1,minY:240,maxY:330},
                {x:5000,y:270,w:80,dx:1,dy:0,minX:4900,maxX:5100},
                {x:6400,y:260,w:70,dx:0,dy:1,minY:240,maxY:330}
            ];
            enemiesInit = [
                w(300,1,100,600),w(800,-1,650,920),
                w(1250,1,1100,1500),w(1750,-1,1550,1870),
                w(2300,1,2050,2500),w(2700,-1,2500,2770),
                w(3100,-1,2950,3300),w(3550,1,3400,3670),
                w(4000,1,3850,4200),w(4500,-1,4350,4570),
                w(4900,1,4750,5100),w(5400,-1,5250,5470),
                w(5800,1,5650,6000),w(6300,-1,6100,6500),w(6800,1,6600,6970),
                sp(450),sp(1600),sp(2550),sp(3400),sp(4350),sp(5250),sp(6650)
            ];
            // Springs on ground near tall platforms (power = super jump velocity)
            springsInit = [
                {x:1380,y:GROUND_Y-15,w:22,h:15,power:-20},
                {x:2380,y:GROUND_Y-15,w:22,h:15,power:-20},
                {x:4130,y:GROUND_Y-15,w:22,h:15,power:-20},
                {x:5080,y:GROUND_Y-15,w:22,h:15,power:-20}
            ];
            // Crumbling bridges — only way across some pits
            crumblingInit = [
                {x:960,y:325,w:90,h:12},
                {x:2830,y:325,w:90,h:12},
                {x:4630,y:325,w:90,h:12}
            ];
            fallingInit = [];
            fireballSources = [];
            coinsInit = makeCoins([150,400,700,1150,1450,1750,2100,2400,2700,
                3050,3350,3600,3900,4200,4500,4800,5100,5400,
                5700,6000,6300,6600,6850], platforms);
            // Bonus coins on high spring-only platforms
            [1400,2400,4150,5100].forEach(sx => coinsInit.push({x:sx,y:170,collected:false,animFrame:Math.random()*60|0}));
        }

        else if (num === 3) {
            // --- LEVEL 3: Falling Platforms & Fireballs ---
            WORLD_WIDTH = 8000;
            groundSegments = [
                {x:0,w:850},{x:1000,w:700},{x:1850,w:650},{x:2650,w:700},
                {x:3500,w:700},{x:4350,w:700},{x:5200,w:650},{x:6000,w:2000}
            ];
            platforms = [
                {x:200,y:310,w:80},{x:450,y:260,w:70},{x:700,y:300,w:80},
                {x:1080,y:290,w:90},{x:1300,y:240,w:70},{x:1500,y:280,w:80},
                {x:1930,y:300,w:80},{x:2150,y:250,w:70},{x:2350,y:280,w:80},
                {x:2730,y:290,w:80},{x:2950,y:240,w:70},{x:3150,y:280,w:80},
                {x:3580,y:300,w:80},{x:3800,y:250,w:70},{x:4000,y:280,w:80},
                {x:4430,y:290,w:80},{x:4650,y:240,w:70},{x:4850,y:280,w:80},
                {x:5280,y:300,w:80},{x:5500,y:250,w:70},{x:5700,y:280,w:80},
                {x:6100,y:280,w:100},{x:6400,y:250,w:80},{x:6700,y:220,w:80},
                {x:7000,y:260,w:100},{x:7300,y:240,w:80},{x:7600,y:280,w:100}
            ];
            movingPlatformsInit = [
                {x:1350,y:260,w:70,dx:1,dy:0,minX:1250,maxX:1450},
                {x:3000,y:260,w:70,dx:0,dy:1,minY:230,maxY:320},
                {x:4700,y:250,w:80,dx:1,dy:0,minX:4600,maxX:4800},
                {x:6500,y:260,w:70,dx:0,dy:1,minY:230,maxY:320},
                {x:7400,y:270,w:80,dx:1,dy:0,minX:7300,maxX:7500}
            ];
            enemiesInit = [
                w(300,1,100,550),w(700,-1,550,820),
                w(1150,1,1030,1350),w(1550,-1,1400,1670),
                w(2050,1,1880,2250),w(2400,-1,2250,2470),
                w(2800,1,2680,3000),w(3200,-1,3050,3320),
                w(3650,1,3530,3850),w(4050,-1,3900,4170),
                w(4500,1,4380,4700),w(4900,-1,4750,5020),
                w(5350,1,5230,5550),w(6200,-1,6030,6400),
                w(6600,1,6400,6800),w(7100,-1,6900,7300),w(7500,1,7300,7700),
                sp(500),sp(1250),sp(2200),sp(3100),sp(3900),sp(4600),sp(5500),
                sp(6500),sp(7200),sp(7650)
            ];
            springsInit = [];
            crumblingInit = [];
            // Falling bridges — they drop when you step on them
            fallingInit = [
                {x:870,y:320,w:100,h:12},
                {x:1770,y:320,w:80,h:12},
                {x:2570,y:320,w:80,h:12},
                {x:3420,y:320,w:80,h:12},
                {x:4270,y:320,w:80,h:12},
                {x:5120,y:320,w:80,h:12},
                {x:5920,y:320,w:80,h:12}
            ];
            // Fireball launchers {x, y, dir, interval in frames}
            fireballSources = [
                {x:1100,y:310,dir:1,interval:110,timer:0},
                {x:2650,y:300,dir:-1,interval:100,timer:50},
                {x:3500,y:310,dir:1,interval:90,timer:0},
                {x:5200,y:300,dir:-1,interval:95,timer:30},
                {x:6700,y:310,dir:1,interval:85,timer:0}
            ];
            coinsInit = makeCoins([150,400,650,1050,1350,1600,1900,2200,2450,
                2700,3000,3250,3550,3850,4100,4400,4700,4950,
                5250,5550,5800,6100,6400,6700,7000,7300,7600,7850], platforms);
        }

        goal = {x: WORLD_WIDTH - 150, y: GROUND_Y - 60, w: 30, h: 60, reached: false};
        generateBackground();
    }
    
    function resetLevel() {
        loadLevel(currentLevel);
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
        springs = (springsInit || []).map(s => ({...s}));
        crumblingPlatforms = (crumblingInit || []).map(c => ({...c, timer: 0, visible: true, respawnTimer: 0}));
        fallingPlatforms = (fallingInit || []).map(f => ({...f, falling: false, vy: 0, origY: f.y, respawnTimer: 0, gone: false}));
        fireballs = [];
        fireballSources = (fireballSources || []).map(s => ({...s}));
        goal.reached = false;
        levelTransition = 0;
    }
    
    function die() {
        if (player.dead || goal.reached) return;
        player.dead = true;
        SFX.platDie();
        const finalScore = score;
        
        deathTimeout = setTimeout(() => {
            deathTimeout = null;
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
            
            // Springs — bounce player high
            springs.forEach(s => {
                if (player.x + player.width > s.x && player.x < s.x + s.w &&
                    player.y + player.height >= s.y && player.y + player.height < s.y + s.h + 8 && player.vy >= 0) {
                    player.vy = s.power;
                    player.onGround = false;
                    SFX.jump();
                }
            });

            // Crumbling platforms
            crumblingPlatforms.forEach(cp => {
                if (!cp.visible) {
                    cp.respawnTimer++;
                    if (cp.respawnTimer > 200) { cp.visible = true; cp.timer = 0; cp.respawnTimer = 0; }
                    return;
                }
                const onIt = player.x + player.width > cp.x && player.x < cp.x + cp.w &&
                    player.y + player.height >= cp.y && player.y + player.height < cp.y + cp.h + 8 && player.vy >= 0;
                if (onIt) {
                    player.y = cp.y - player.height;
                    player.vy = 0;
                    player.onGround = true;
                    cp.timer++;
                    if (cp.timer > 70) { cp.visible = false; }
                } else if (cp.timer > 0 && cp.timer < 70) {
                    cp.timer += 0.5;
                }
            });

            // Falling platforms
            fallingPlatforms.forEach(fp => {
                if (fp.gone) {
                    fp.respawnTimer++;
                    if (fp.respawnTimer > 200) { fp.y = fp.origY; fp.falling = false; fp.vy = 0; fp.gone = false; fp.respawnTimer = 0; }
                    return;
                }
                if (fp.falling) {
                    fp.vy += 0.3;
                    fp.y += fp.vy;
                    if (fp.y > canvas.height + 50) { fp.gone = true; }
                }
                if (!fp.falling) {
                    const onIt = player.x + player.width > fp.x && player.x < fp.x + fp.w &&
                        player.y + player.height >= fp.y && player.y + player.height < fp.y + fp.h + 8 && player.vy >= 0;
                    if (onIt) {
                        player.y = fp.y - player.height;
                        player.vy = 0;
                        player.onGround = true;
                        fp.falling = true; fp.vy = 0;
                    }
                } else if (!fp.gone) {
                    if (player.x + player.width > fp.x && player.x < fp.x + fp.w &&
                        player.y + player.height >= fp.y && player.y + player.height < fp.y + fp.h + 14 && player.vy >= 0) {
                        player.y = fp.y - player.height;
                        player.vy = fp.vy;
                        player.onGround = true;
                    }
                }
            });

            // Fireballs
            fireballSources.forEach(src => {
                src.timer++;
                if (src.timer >= src.interval) {
                    src.timer = 0;
                    fireballs.push({x: src.x, y: src.y, vx: src.dir * 3.5, size: 7, life: 0});
                }
            });
            for (let i = fireballs.length - 1; i >= 0; i--) {
                const fb = fireballs[i];
                fb.x += fb.vx;
                fb.life++;
                if (fb.life > 300 || fb.x < camera.x - 50 || fb.x > camera.x + canvas.width + 50) {
                    fireballs.splice(i, 1); continue;
                }
                if (player.x + player.width > fb.x - fb.size && player.x < fb.x + fb.size &&
                    player.y + player.height > fb.y - fb.size && player.y < fb.y + fb.size) {
                    die();
                }
            }

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
                if (currentLevel < MAX_LEVELS) {
                    score += 25;
                    const el = document.getElementById('platformer-score');
                    if (el) el.textContent = score;
                    levelTransition = 120;
                    deathTimeout = setTimeout(() => {
                        deathTimeout = null;
                        currentLevel++;
                        resetLevel();
                    }, 2000);
                } else {
                    score += 50;
                    const finalScore = score;
                    deathTimeout = setTimeout(() => {
                        deathTimeout = null;
                        showGameOver('platformer', finalScore);
                    }, 1500);
                }
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
        skyGrad.addColorStop(0, th.sky[0]);
        skyGrad.addColorStop(0.5, th.sky[1]);
        skyGrad.addColorStop(1, th.sky[2]);
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Background mountains (parallax)
        ctx.fillStyle = th.mountain1;
        bgMountains.forEach(m => {
            const mx = m.x - cx * 0.2;
            ctx.beginPath();
            ctx.moveTo(mx, GROUND_Y);
            ctx.lineTo(mx + m.w / 2, GROUND_Y - m.h);
            ctx.lineTo(mx + m.w, GROUND_Y);
            ctx.fill();
        });
        ctx.fillStyle = th.mountain2;
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
                ctx.fillStyle = th.trunk;
                ctx.fillRect(tx - 3, GROUND_Y - t.h, 6, t.h);
                ctx.fillStyle = th.leaf1;
                ctx.beginPath();
                ctx.arc(tx, GROUND_Y - t.h - 8, 14, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = th.leaf2;
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
                ctx.fillStyle = th.dirt;
                ctx.fillRect(sx, GROUND_Y, seg.w, canvas.height - GROUND_Y);
                const grassGrad = ctx.createLinearGradient(0, GROUND_Y, 0, GROUND_Y + 8);
                grassGrad.addColorStop(0, th.grass1);
                grassGrad.addColorStop(1, th.grass2);
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
                pGrad.addColorStop(0, th.platformTop);
                pGrad.addColorStop(1, th.platform);
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
        
        // Springs
        springs.forEach(s => {
            const sx = s.x - cx;
            if (sx > -30 && sx < canvas.width + 30) {
                ctx.fillStyle = '#4CAF50';
                ctx.fillRect(sx + 2, s.y + 8, s.w - 4, 7);
                ctx.fillStyle = '#66BB6A';
                ctx.beginPath();
                ctx.arc(sx + s.w / 2, s.y + 6, s.w / 2 + 2, Math.PI, 0);
                ctx.fill();
                ctx.strokeStyle = '#2E7D32';
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    const coilY = s.y + 10 + i * 2;
                    ctx.beginPath();
                    ctx.moveTo(sx + 4, coilY);
                    ctx.lineTo(sx + s.w - 4, coilY);
                    ctx.stroke();
                }
            }
        });

        // Crumbling platforms
        crumblingPlatforms.forEach(cp => {
            if (!cp.visible) return;
            const px = cp.x - cx;
            if (px + cp.w > -10 && px < canvas.width + 10) {
                const shake = cp.timer > 30 ? (Math.random() - 0.5) * (cp.timer / 15) : 0;
                const alpha = cp.timer > 50 ? Math.max(0.2, 1 - (cp.timer - 50) / 20) : 1;
                ctx.globalAlpha = alpha;
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px + 2 + shake, cp.y + 2, cp.w, cp.h);
                ctx.fillStyle = '#A1887F';
                ctx.fillRect(px + shake, cp.y, cp.w, cp.h);
                ctx.fillStyle = '#8D6E63';
                for (let i = 0; i < cp.w; i += 18) {
                    ctx.fillRect(px + i + shake, cp.y, 1, cp.h);
                }
                ctx.strokeStyle = '#6D4C41';
                ctx.lineWidth = 1;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(px + shake, cp.y, cp.w, cp.h);
                ctx.setLineDash([]);
                ctx.globalAlpha = 1;
            }
        });

        // Falling platforms
        fallingPlatforms.forEach(fp => {
            if (fp.gone) return;
            const px = fp.x - cx;
            if (px + fp.w > -10 && px < canvas.width + 10) {
                ctx.fillStyle = 'rgba(0,0,0,0.1)';
                ctx.fillRect(px + 2, fp.y + 2, fp.w, fp.h);
                const warn = fp.falling ? '#EF5350' : '#FFAB91';
                ctx.fillStyle = warn;
                ctx.fillRect(px, fp.y, fp.w, fp.h);
                ctx.fillStyle = '#FF7043';
                ctx.fillRect(px, fp.y, fp.w, 3);
                if (!fp.falling) {
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.font = '8px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('!', px + fp.w / 2, fp.y + fp.h - 1);
                }
            }
        });

        // Fireballs
        fireballs.forEach(fb => {
            const fx = fb.x - cx;
            if (fx > -20 && fx < canvas.width + 20) {
                const flicker = Math.sin(fb.life * 0.5) * 2;
                ctx.fillStyle = '#FF5722';
                ctx.beginPath();
                ctx.arc(fx, fb.y, fb.size + flicker, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFAB40';
                ctx.beginPath();
                ctx.arc(fx, fb.y, fb.size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#FFF9C4';
                ctx.beginPath();
                ctx.arc(fx, fb.y, fb.size * 0.25, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // Fireball launchers
        (fireballSources || []).forEach(src => {
            const lx = src.x - cx;
            if (lx > -20 && lx < canvas.width + 20) {
                ctx.fillStyle = '#555';
                ctx.fillRect(lx - 6, src.y - 8, 12, 16);
                ctx.fillStyle = '#FF5722';
                ctx.beginPath();
                ctx.arc(lx, src.y, 4, 0, Math.PI * 2);
                ctx.fill();
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
            
            ctx.fillStyle = ac.body;
            ctx.fillRect(px + 4, py + 12, player.width - 8, player.height - 12);
            
            // Head
            ctx.fillStyle = '#FFCC80';
            ctx.beginPath();
            ctx.arc(px + player.width / 2, py + 10, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = ac.hat;
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
            
            ctx.fillStyle = ac.legs;
            const legAnim = player.onGround ? Math.sin(player.animFrame) * 3 : 0;
            ctx.fillRect(px + 6, py + player.height - 4, 6, 6 + legAnim);
            ctx.fillRect(px + player.width - 12, py + player.height - 4, 6, 6 - legAnim);
        }
        
        // HUD: progress bar
        const progress = player.x / WORLD_WIDTH;
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fillRect(10, 10, 150, 8);
        ctx.fillStyle = th.grass1;
        ctx.fillRect(10, 10, 150 * progress, 8);
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(10, 10, 150, 8);
        // Player dot on progress bar
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(10 + 150 * progress, 14, 4, 0, Math.PI * 2);
        ctx.fill();

        // Level indicator
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Level ' + currentLevel + '/' + MAX_LEVELS, canvas.width - 12, 20);

        // Level transition overlay
        if (levelTransition > 0) {
            levelTransition--;
            const alpha = levelTransition > 60 ? 1 : levelTransition / 60;
            ctx.fillStyle = 'rgba(0,0,0,' + (alpha * 0.6) + ')';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'rgba(255,255,255,' + alpha + ')';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Level ' + currentLevel + ' Complete!', canvas.width / 2, canvas.height / 2 - 20);
            ctx.font = '16px Arial';
            ctx.fillText('+25 bonus points', canvas.width / 2, canvas.height / 2 + 15);
            ctx.textBaseline = 'alphabetic';
        }
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
    
    currentLevel = Math.min(Math.max(startLevel, 1), MAX_LEVELS);
    score = 0;
    const el = document.getElementById('platformer-score');
    if (el) el.textContent = score;
    resetLevel();
    draw();
    platformerGame = requestAnimationFrame(update);
}

